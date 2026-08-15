"""
Module 5 — RAG AI Event Assistant
Retrieval-Augmented Generation using TF-IDF vector search over
indexed events/knowledge, combined with the LLM provider.

NOTE: All SQL column names are camelCase (Prisma without @map convention).
"""

import os, json, re
import numpy as np
import pandas as pd
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from core.db import execute_query, get_db_connection
from core.llm_provider import generate_text

router = APIRouter()


# ── Indexing ───────────────────────────────────────────────────────────────────

def _build_index() -> tuple:
    """Build TF-IDF index from events and KnowledgeDocuments."""
    events = execute_query("""
        SELECT id, title, description, category, status,
               "eventDate"      AS event_date,
               venue,
               "targetAudience" AS target_audience
        FROM "Event"
        WHERE status IN ('PUBLISHED', 'COMPLETED')
    """)

    docs_db = execute_query("""
        SELECT id, document, "sourceType" AS source_type,
               "sourceId" AS source_id, metadata
        FROM "KnowledgeDocument"
        LIMIT 500
    """)

    corpus_docs = []

    for e in (events or []):
        text = (
            f"Event: {e.get('title', '')}. "
            f"Category: {e.get('category', '')}. "
            f"Description: {e.get('description', '')}. "
            f"Venue: {e.get('venue', '')}. "
            f"Audience: {e.get('target_audience', '')}."
        )
        corpus_docs.append({
            "id": e["id"],
            "source_type": "event",
            "title": e.get("title", ""),
            "text": text,
            "metadata": {
                "status": e.get("status"),
                "event_date": str(e.get("event_date", "")),
                "category": e.get("category", ""),
            },
        })

    for d in (docs_db or []):
        corpus_docs.append({
            "id": d["id"],
            "source_type": d.get("source_type", "document"),
            "title": d.get("source_type", "Document"),
            "text": d.get("document", ""),
            "metadata": d.get("metadata") or {},
        })

    if not corpus_docs:
        return None, None, []

    texts = [doc["text"] for doc in corpus_docs]
    vectorizer = TfidfVectorizer(stop_words="english", max_features=5000)
    tfidf_matrix = vectorizer.fit_transform(texts)

    return vectorizer, tfidf_matrix.toarray(), corpus_docs


def _retrieve(query: str, vectorizer, matrix, docs, top_k: int = 5):
    if vectorizer is None or matrix is None:
        return []
    q_vec = vectorizer.transform([query]).toarray()
    sims  = cosine_similarity(q_vec, matrix)[0]
    top_idx = np.argsort(sims)[::-1][:top_k]
    results = []
    for idx in top_idx:
        if sims[idx] < 0.01:
            continue
        results.append({**docs[idx], "similarity": round(float(sims[idx]), 4)})
    return results


# ── Index route ────────────────────────────────────────────────────────────────

@router.post("/index")
def index_events():
    """Index all events into KnowledgeDocument table."""
    events = execute_query("""
        SELECT id, title, description, category, venue,
               "targetAudience" AS target_audience,
               "eventDate"      AS event_date,
               status
        FROM "Event"
    """)
    if not events:
        return {"status": "no events to index"}

    conn = get_db_connection()
    indexed = 0
    try:
        with conn.cursor() as cur:
            # Remove old event-sourced documents first to avoid duplicates
            cur.execute('DELETE FROM "KnowledgeDocument" WHERE "sourceType" = %s', ("event",))
            for e in events:
                doc_text = (
                    f"Title: {e.get('title', '')}. "
                    f"Category: {e.get('category', '')}. "
                    f"Description: {e.get('description', '')}. "
                    f"Venue: {e.get('venue', '')}. "
                    f"Audience: {e.get('target_audience', '')}."
                )
                meta = json.dumps({
                    "event_id": e["id"],
                    "status": e.get("status"),
                    "event_date": str(e.get("event_date", "")),
                })
                cur.execute(
                    """
                    INSERT INTO "KnowledgeDocument"
                        (id, document, embedding, metadata, "sourceType", "sourceId", "createdAt")
                    VALUES (gen_random_uuid(), %s, %s::float[], %s, %s, %s, NOW())
                    """,
                    (doc_text, [], meta, "event", e["id"]),
                )
                indexed += 1
        conn.commit()
    except Exception as exc:
        print(f"[RAG] index error: {exc}")
        conn.rollback()
    finally:
        conn.close()

    return {"status": "indexed", "count": indexed}


# ── Retrieve route ─────────────────────────────────────────────────────────────

class RetrieveRequest(BaseModel):
    query: str
    top_k: int = 5


@router.post("/retrieve")
def retrieve_docs(req: RetrieveRequest):
    vectorizer, matrix, docs = _build_index()
    if vectorizer is None:
        return {"sources": []}
    results = _retrieve(req.query, vectorizer, matrix, docs, req.top_k)
    return {"query": req.query, "sources": results}


# ── Chat route ─────────────────────────────────────────────────────────────────

class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[Message]
    student_profile: Optional[dict] = None
    top_k: int = 4


@router.post("/chat")
def chat(req: ChatRequest):
    if not req.messages:
        raise HTTPException(status_code=400, detail="No messages provided")

    # Latest user message
    user_msg = next(
        (m.content for m in reversed(req.messages) if m.role == "user"),
        req.messages[-1].content,
    )

    # Retrieve relevant context
    vectorizer, matrix, docs = _build_index()
    sources = _retrieve(user_msg, vectorizer, matrix, docs, req.top_k) if vectorizer else []

    # Build context block
    context_parts = [f"[{s['title']}]: {s['text'][:400]}" for s in sources]
    context_block = "\n\n".join(context_parts)

    # Student profile context
    profile_text = ""
    if req.student_profile:
        profile_text = (
            f"Student interests: {', '.join(req.student_profile.get('interests', []))}. "
            f"Skills: {', '.join(req.student_profile.get('skills', []))}. "
            f"Department: {req.student_profile.get('department', '')}."
        )

    system_prompt = (
        "You are an intelligent College Event Assistant. "
        "Help students discover and learn about events. "
        "Be concise, friendly, and informative. "
        "Base your answers on the provided event information."
    )

    messages_history = "\n".join(
        f"{m.role.capitalize()}: {m.content}" for m in req.messages[-6:]
    )

    prompt = (
        f"{system_prompt}\n\n"
        f"{('Student profile: ' + profile_text) if profile_text else ''}\n\n"
        f"Relevant event information:\n"
        f"{context_block if context_block else 'General knowledge only — no specific events found.'}\n\n"
        f"Conversation:\n{messages_history}\n\nAssistant:"
    )

    answer = generate_text(prompt, max_tokens=400)

    # Suggestions based on retrieved events
    suggestions = []
    for s in sources[:3]:
        if s.get("source_type") == "event":
            suggestions.append(f"Tell me more about {s['title']}")
    if not suggestions:
        suggestions = ["What events are coming up?", "Show me Technology events", "How do I register?"]

    return {
        "role": "assistant",
        "text": answer,
        "sources": [{"id": s["id"], "title": s["title"]} for s in sources],
        "suggestions": suggestions[:3],
    }

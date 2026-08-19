"""
RAG Service Orchestrator
Coordinates question preprocessing, vector retrieval from PostgreSQL/pgvector,
metadata filtering, prompt construction, LLM generation, and source citation extraction.
"""

import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import logging
from typing import Dict, Any, List, Optional
from rag.retriever import retrieve_documents
from rag.generator import generate_answer

logger = logging.getLogger("ml_service.rag.service")

# In-memory store for multi-turn conversations
_CONVERSATION_SESSIONS: Dict[str, List[Dict[str, str]]] = {}


def answer_question(
    question: str,
    conversation_id: Optional[str] = None,
    filters: Optional[Dict[str, Any]] = None,
    top_k: int = 5
) -> Dict[str, Any]:
    """
    Executes the end-to-end RAG pipeline.
    
    1. Preprocess query and extract conversational history if conversation_id is provided.
    2. Retrieve top-k relevant event documents using pgvector and metadata filters.
    3. Construct grounded prompt with system instruction and context.
    4. Generate grounded response using LLM provider or local extractor.
    5. Assemble clickable sources and citations.
    """
    clean_question = (question or "").strip()
    if not clean_question:
        return {
            "question": "",
            "answer": "Please ask a question about college events, workshops, hackathons, or schedules.",
            "sources": []
        }

    # 1. Retrieve Conversation History
    history = []
    if conversation_id:
        history = _CONVERSATION_SESSIONS.get(conversation_id, [])

    # 2. Vector Retrieval with Metadata Filters
    retrieved_docs = retrieve_documents(query=clean_question, top_k=top_k, filters=filters)

    # 3. LLM Answer Generation
    answer = generate_answer(
        question=clean_question,
        documents=retrieved_docs,
        conversation_history=history
    )

    # 4. Format Sources / Citations
    sources = []
    seen_ids = set()
    for doc in retrieved_docs:
        eid = doc.get("event_id")
        if eid and eid not in seen_ids:
            seen_ids.add(eid)
            meta = doc.get("metadata", {})
            sources.append({
                "eventId": eid,
                "title": meta.get("title") or doc.get("title") or "Event",
                "similarity": doc.get("similarity", 0.0),
                "category": meta.get("category", "General"),
                "date": meta.get("date", "TBA"),
                "venue": meta.get("venue", "Campus")
            })

    # 5. Update Conversation Session
    if conversation_id:
        if conversation_id not in _CONVERSATION_SESSIONS:
            _CONVERSATION_SESSIONS[conversation_id] = []
        _CONVERSATION_SESSIONS[conversation_id].append({"role": "user", "content": clean_question})
        _CONVERSATION_SESSIONS[conversation_id].append({"role": "assistant", "content": answer})
        # Keep window size reasonable
        if len(_CONVERSATION_SESSIONS[conversation_id]) > 12:
            _CONVERSATION_SESSIONS[conversation_id] = _CONVERSATION_SESSIONS[conversation_id][-12:]

    return {
        "question": clean_question,
        "answer": answer,
        "sources": sources,
        "conversation_id": conversation_id
    }

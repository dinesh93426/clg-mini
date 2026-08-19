"""
RAG AI Event Assistant Router
FastAPI endpoints for querying the college event assistant, vector retrieval, and event reindexing.
"""

from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Query, Path
from pydantic import BaseModel, Field

import os
import sys

_SERVICE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _SERVICE_ROOT not in sys.path:
    sys.path.insert(0, _SERVICE_ROOT)

from rag.rag_service import answer_question
from rag.index_events import index_all_events, index_single_event

router = APIRouter(tags=["RAG AI Assistant"])


class AskRequest(BaseModel):
    question: str = Field(..., description="User question about events, schedules, or workshops.")
    conversation_id: Optional[str] = Field(None, alias="conversationId", description="Optional conversation session ID for multi-turn chat.")
    filters: Optional[Dict[str, Any]] = Field(None, description="Optional metadata filters (e.g. category, department).")
    top_k: Optional[int] = Field(5, description="Number of events to retrieve.")


class ChatMessage(BaseModel):
    role: str
    content: Optional[str] = None
    text: Optional[str] = None


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    student_profile: Optional[Dict[str, Any]] = None


@router.post("/ask")
@router.post("/rag/ask")
def ask_event_assistant(req: AskRequest):
    """
    RAG Endpoint: Answers questions about college events using PostgreSQL pgvector semantic search and LLM.
    """
    try:
        res = answer_question(
            question=req.question,
            conversation_id=req.conversation_id,
            filters=req.filters,
            top_k=req.top_k or 5
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG Assistant error: {str(e)}")


@router.post("/reindex")
@router.post("/rag/reindex")
def reindex_all_events_endpoint(force: bool = Query(False, description="Force re-embedding even if content hash unchanged.")):
    """
    Rebuilds vector index in KnowledgeDocument table for all events.
    """
    try:
        res = index_all_events(force=force)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reindex error: {str(e)}")


@router.post("/reindex/event/{eventId}")
@router.post("/rag/reindex/event/{eventId}")
def reindex_single_event_endpoint(event_id: str = Path(..., alias="eventId")):
    """
    Regenerates embedding and updates KnowledgeDocument index for a single event.
    """
    try:
        res = index_single_event(event_id=event_id)
        if not res.get("indexed"):
            raise HTTPException(status_code=404, detail=res.get("message"))
        return res
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reindex error: {str(e)}")


@router.post("/chat")
@router.post("/rag/chat")
def chat_compatibility_endpoint(req: ChatRequest):
    """
    Bridge endpoint for existing Node.js chat route.
    """
    if not req.messages:
        raise HTTPException(status_code=400, detail="Messages array cannot be empty.")

    last_user_msg = ""
    history = []
    for m in req.messages:
        text = m.content or m.text or ""
        if m.role in ("user", "human"):
            last_user_msg = text
        history.append({"role": m.role, "content": text})

    res = answer_question(question=last_user_msg or "What events are coming up?")

    return {
        "text": res["answer"],
        "answer": res["answer"],
        "sources": res.get("sources", []),
        "suggestions": [
            "What technical workshops are happening?",
            "Tell me about the hackathons",
            "Where is the Generative AI workshop?"
        ]
    }

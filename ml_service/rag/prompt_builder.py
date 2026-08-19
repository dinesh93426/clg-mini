"""
RAG Prompt Builder
Constructs strict, grounded system prompts containing retrieved context documents,
conversation history, and user questions.
"""

from typing import Dict, Any, List, Optional

SYSTEM_INSTRUCTION = """You are a college event assistant.

Answer questions using ONLY the provided event context.
Do not invent event names, dates, venues, organizers, capacities, or registration information.
If the provided context does not contain the answer, clearly say that the information is not available.
If multiple events match the question, list them clearly.
Always distinguish between known information and unavailable information."""


def format_context_documents(documents: List[Dict[str, Any]]) -> str:
    """Formats retrieved event documents into structured context text."""
    if not documents:
        return "No matching event documents found in the database."

    chunks = []
    for idx, doc in enumerate(documents, 1):
        meta = doc.get("metadata", {})
        title = meta.get("title") or doc.get("title") or "Event"
        category = meta.get("category") or "General"
        date = meta.get("date") or "TBA"
        venue = meta.get("venue") or "Campus"
        capacity = meta.get("capacity") or "N/A"
        target_audience = meta.get("target_audience") or "All Students"
        status = meta.get("status") or "PUBLISHED"
        content = doc.get("content") or ""

        chunk = (
            f"[Event {idx}]\n"
            f"Event ID: {doc.get('event_id')}\n"
            f"Title: {title}\n"
            f"Category: {category}\n"
            f"Date: {date}\n"
            f"Venue: {venue}\n"
            f"Capacity: {capacity}\n"
            f"Target Audience: {target_audience}\n"
            f"Status: {status}\n"
            f"Details: {content}\n"
        )
        chunks.append(chunk)

    return "\n---\n".join(chunks)


def build_rag_prompt(
    question: str,
    documents: List[Dict[str, Any]],
    conversation_history: Optional[List[Dict[str, str]]] = None
) -> str:
    """
    Assembles the complete RAG prompt sent to the LLM.
    """
    context_str = format_context_documents(documents)

    history_str = ""
    if conversation_history:
        history_lines = []
        for msg in conversation_history[-6:]:  # include up to last 6 turns
            role = msg.get("role", "user").capitalize()
            content = msg.get("content") or msg.get("text") or ""
            history_lines.append(f"{role}: {content}")
        if history_lines:
            history_str = "\nRecent Conversation History:\n" + "\n".join(history_lines) + "\n"

    prompt = (
        f"{SYSTEM_INSTRUCTION}\n\n"
        f"Retrieved Event Context:\n"
        f"----------------------------------------\n"
        f"{context_str}\n"
        f"----------------------------------------\n"
        f"{history_str}\n"
        f"User Question: {question}\n\n"
        f"Assistant Answer:"
    )
    return prompt

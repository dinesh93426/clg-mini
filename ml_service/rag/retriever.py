"""
RAG Vector Retriever
Performs dense semantic vector search with pgvector cosine distance in PostgreSQL,
augmented by structured metadata filtering (category, department, status, target audience).
"""

import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import json
import logging
from typing import Dict, Any, List, Optional
from core.db import execute_query
from rag.embedding_service import get_embedding_service

logger = logging.getLogger("ml_service.rag.retriever")


def retrieve_documents(
    query: str,
    top_k: int = 5,
    filters: Optional[Dict[str, Any]] = None
) -> List[Dict[str, Any]]:
    """
    Retrieves the most semantically relevant event documents from pgvector.
    
    Args:
        query: User question string.
        top_k: Number of documents to retrieve (default: 5).
        filters: Optional metadata filters (e.g. category, department, status).
        
    Returns:
        List of dicts:
        [
            {
                "event_id": "E101",
                "title": "Generative AI & LLM Workshop",
                "content": "...",
                "similarity": 0.89,
                "metadata": { ... }
            }
        ]
    """
    if not query or not query.strip():
        return []

    embedding_service = get_embedding_service()
    query_vector = embedding_service.generate_embedding(query)
    vector_str = f"[{','.join(str(x) for x in query_vector)}]"

    where_clauses = ["\"sourceType\" = 'event'"]
    params = []

    if filters:
        category = filters.get("category")
        if category:
            where_clauses.append("metadata->>'category' ILIKE %s")
            params.append(f"%{category}%")

        dept = filters.get("department")
        if dept:
            where_clauses.append("(metadata->>'department' ILIKE %s OR metadata->>'target_audience' ILIKE %s)")
            params.append(f"%{dept}%")
            params.append(f"%{dept}%")

        status = filters.get("status")
        if status:
            where_clauses.append("metadata->>'status' = %s")
            params.append(status)

    # Try pgvector if available, but since embedding_vec isn't there, we just fetch the records and do it in python
    sql = f"""
        SELECT
            "sourceId" AS event_id,
            document   AS content,
            metadata,
            embedding
        FROM "KnowledgeDocument"
        WHERE {' AND '.join(where_clauses)}
    """

    try:
        rows = execute_query(sql, tuple(params))
        if not rows:
            return []
            
        import numpy as np
        from sklearn.metrics.pairwise import cosine_similarity
        
        valid_rows = [d for d in rows if isinstance(d.get("embedding"), list) and len(d["embedding"]) == len(query_vector)]
        if not valid_rows:
            return []

        q_vec = np.array(query_vector).reshape(1, -1)
        doc_vecs = np.array([d["embedding"] for d in valid_rows])
        sims = cosine_similarity(q_vec, doc_vecs)[0]
        
        results = []
        for d, s in zip(valid_rows, sims):
            meta = d["metadata"] if isinstance(d["metadata"], dict) else json.loads(d.get("metadata") or "{}")
            results.append({
                "event_id": d["event_id"],
                "title": meta.get("title") or "Event",
                "content": d["content"],
                "similarity": round(float(s), 4),
                "metadata": meta
            })
        results.sort(key=lambda x: x["similarity"], reverse=True)
        return results[:top_k]

    except Exception as e:
        logger.warning(f"retriever query failed: {e}")
        return []

    results = []
    for r in (rows or []):
        meta = r.get("metadata")
        if isinstance(meta, str):
            try:
                meta = json.loads(meta)
            except Exception:
                meta = {}
        elif not isinstance(meta, dict):
            meta = {}

        similarity = float(r.get("similarity") or 0.0)
        results.append({
            "event_id": r["event_id"],
            "title": meta.get("title") or "Event",
            "content": r["content"],
            "similarity": similarity,
            "metadata": meta
        })

    return results

import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import json
import logging
from typing import Dict, Any, List, Optional
from core.db import get_db_connection, execute_query
from rag.data_loader import load_event_documents
from rag.embedding_service import get_embedding_service

logger = logging.getLogger("ml_service.rag.indexer")


def index_all_events(force: bool = False) -> Dict[str, Any]:
    """
    Indexes all events from PostgreSQL into KnowledgeDocument table.
    Avoids re-generating embeddings if the event content hash hasn't changed.
    """
    documents = load_event_documents()
    if not documents:
        return {"total": 0, "indexed": 0, "skipped": 0, "message": "No events found to index."}

    embedding_service = get_embedding_service()

    # Retrieve existing document hashes
    existing_docs = execute_query('SELECT "sourceId", metadata FROM "KnowledgeDocument" WHERE "sourceType" = \'event\';')
    existing_hashes = {}
    for row in (existing_docs or []):
        sid = row["sourceId"]
        meta = row.get("metadata")
        if isinstance(meta, str):
            try:
                meta = json.loads(meta)
            except Exception:
                meta = {}
        if meta and isinstance(meta, dict):
            existing_hashes[sid] = meta.get("content_hash")

    docs_to_embed = []
    docs_to_skip = 0

    for doc in documents:
        eid = doc["event_id"]
        curr_hash = doc["metadata"].get("content_hash")
        if not force and existing_hashes.get(eid) == curr_hash:
            docs_to_skip += 1
        else:
            docs_to_embed.append(doc)

    if not docs_to_embed:
        return {
            "total": len(documents),
            "indexed": 0,
            "skipped": docs_to_skip,
            "message": f"All {docs_to_skip} events are up to date. No re-indexing needed."
        }

    texts = [d["content"] for d in docs_to_embed]
    embeddings = embedding_service.generate_batch_embeddings(texts)

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            for doc, emb in zip(docs_to_embed, embeddings):
                doc_id = doc["document_id"]
                eid = doc["event_id"]
                content = doc["content"]
                metadata_json = json.dumps(doc["metadata"])
                vector_str = f"[{','.join(str(x) for x in emb)}]"

                cur.execute(
                    """
                    INSERT INTO "KnowledgeDocument" (id, document, "sourceType", "sourceId", metadata, embedding, "createdAt")
                    VALUES (%s, %s, 'event', %s, %s, %s, NOW())
                    ON CONFLICT (id) DO UPDATE SET
                        document = EXCLUDED.document,
                        metadata = EXCLUDED.metadata,
                        embedding = EXCLUDED.embedding,
                        "createdAt" = NOW();
                    """,
                    (doc_id, content, eid, metadata_json, emb)
                )
        conn.commit()
    finally:
        conn.close()

    return {
        "total": len(documents),
        "indexed": len(docs_to_embed),
        "skipped": docs_to_skip,
        "message": f"Successfully indexed {len(docs_to_embed)} events ({docs_to_skip} unchanged skipped)."
    }


def index_single_event(event_id: str) -> Dict[str, Any]:
    """
    Indexes or updates a single event in the KnowledgeDocument vector storage.
    """
    documents = load_event_documents(event_id=event_id)
    if not documents:
        return {"event_id": event_id, "indexed": False, "message": f"Event '{event_id}' not found."}

    doc = documents[0]
    embedding_service = get_embedding_service()
    emb = embedding_service.generate_embedding(doc["content"])
    vector_str = f"[{','.join(str(x) for x in emb)}]"

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            doc_id = doc["document_id"]
            eid = doc["event_id"]
            content = doc["content"]
            metadata_json = json.dumps(doc["metadata"])

            cur.execute(
                """
                INSERT INTO "KnowledgeDocument" (id, document, "sourceType", "sourceId", metadata, embedding, "createdAt")
                VALUES (%s, %s, 'event', %s, %s, %s, NOW())
                ON CONFLICT (id) DO UPDATE SET
                    document = EXCLUDED.document,
                    metadata = EXCLUDED.metadata,
                    embedding = EXCLUDED.embedding,
                    "createdAt" = NOW();
                """,
                (doc_id, content, eid, metadata_json, emb)
            )
        conn.commit()
    finally:
        conn.close()

    return {"event_id": event_id, "indexed": True, "title": doc["title"], "message": f"Event '{doc['title']}' successfully indexed."}


if __name__ == "__main__":
    res = index_all_events(force=True)
    print(res)

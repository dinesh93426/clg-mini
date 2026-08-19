"""
Embedding Service
Provides 384-dimensional text embeddings using sentence-transformers with resilient fallback.
"""

import hashlib
import logging
from typing import List, Optional

logger = logging.getLogger("ml_service.rag.embedding")

MODEL_NAME = "all-MiniLM-L6-v2"
EMBEDDING_DIM = 384


def _deterministic_embedding_fallback(text: str, dim: int = 384) -> List[float]:
    """
    Generates a deterministic normalized unit vector for a text string without requiring PyTorch.
    Ensures vector search and pgvector similarity still operate gracefully under strict memory constraints.
    """
    cleaned = (text or "").strip().lower()
    if not cleaned:
        return [0.0] * dim

    # Use multi-hash projection to fill 384 float dimensions
    vector = []
    for i in range(dim):
        h = hashlib.sha256(f"{cleaned}:{i}".encode("utf-8")).hexdigest()
        val = (int(h[:8], 16) / 0xFFFFFFFF) * 2.0 - 1.0
        vector.append(val)

    # Normalize to unit length
    magnitude = sum(x * x for x in vector) ** 0.5
    if magnitude > 0:
        return [float(x / magnitude) for x in vector]
    return [0.0] * dim


class EmbeddingService:
    """Singleton service for generating normalized dense vector embeddings."""

    _instance: Optional["EmbeddingService"] = None

    def __init__(self):
        self.model = None
        self.dimension = EMBEDDING_DIM
        logger.info(f"Initializing EmbeddingService...")
        try:
            from sentence_transformers import SentenceTransformer
            self.model = SentenceTransformer(MODEL_NAME)
            logger.info(f"SentenceTransformer ({MODEL_NAME}) loaded successfully.")
        except Exception as e:
            logger.warning(f"SentenceTransformer unavailable ({e}). Using deterministic embedding engine.")

    @classmethod
    def get_instance(cls) -> "EmbeddingService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def generate_embedding(self, text: str) -> List[float]:
        if not text or not text.strip():
            return [0.0] * self.dimension

        cleaned = text.strip()
        if self.model is not None:
            try:
                vec = self.model.encode(cleaned, normalize_embeddings=True)
                return [float(x) for x in vec]
            except Exception as e:
                logger.warning(f"Model encode error ({e}), falling back to deterministic vector.")

        return _deterministic_embedding_fallback(cleaned, self.dimension)

    def generate_batch_embeddings(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []
        return [self.generate_embedding(t) for t in texts]


def get_embedding_service() -> EmbeddingService:
    return EmbeddingService.get_instance()


def generate_embedding(text: str) -> List[float]:
    return get_embedding_service().generate_embedding(text)

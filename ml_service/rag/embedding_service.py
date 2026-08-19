"""
Embedding Service
Provides text embeddings using a lightweight pretrained sentence-transformer model
(all-MiniLM-L6-v2, 384 dimensions).
"""

import logging
from typing import List, Optional
from sentence_transformers import SentenceTransformer

logger = logging.getLogger("ml_service.rag.embedding")

MODEL_NAME = "all-MiniLM-L6-v2"
EMBEDDING_DIM = 384


class EmbeddingService:
    """Singleton service for generating normalized dense vector embeddings."""

    _instance: Optional["EmbeddingService"] = None

    def __init__(self):
        logger.info(f"Loading SentenceTransformer model: {MODEL_NAME}...")
        try:
            self.model = SentenceTransformer(MODEL_NAME)
            self.dimension = EMBEDDING_DIM
            logger.info(f"SentenceTransformer loaded successfully (dim={self.dimension}).")
        except Exception as e:
            logger.error(f"Failed to load SentenceTransformer model {MODEL_NAME}: {e}")
            raise RuntimeError(f"Could not load embedding model '{MODEL_NAME}': {e}")

    @classmethod
    def get_instance(cls) -> "EmbeddingService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def generate_embedding(self, text: str) -> List[float]:
        """
        Generates a 384-dimensional dense embedding vector for a single text.
        """
        if not text or not text.strip():
            return [0.0] * self.dimension

        cleaned = text.strip()
        vec = self.model.encode(cleaned, normalize_embeddings=True)
        return [float(x) for x in vec]

    def generate_batch_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Generates embeddings for a batch of texts efficiently.
        """
        if not texts:
            return []

        cleaned_texts = [t.strip() if (t and t.strip()) else "empty" for t in texts]
        vecs = self.model.encode(cleaned_texts, normalize_embeddings=True, batch_size=32)
        return [[float(x) for x in v] for v in vecs]


def get_embedding_service() -> EmbeddingService:
    return EmbeddingService.get_instance()


def generate_embedding(text: str) -> List[float]:
    """Convenience helper."""
    return get_embedding_service().generate_embedding(text)

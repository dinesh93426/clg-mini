"""
Student Feedback Sentiment Analysis Service
Uses a pretrained Hugging Face Transformer (cardiffnlp/twitter-roberta-base-sentiment-latest)
with resilient fallback for low-memory cloud deployment.
"""

import os
import re
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional

logger = logging.getLogger("ml_service.sentiment")

ROOT_DIR = Path(__file__).resolve().parent.parent
LOCAL_MODEL_DIR = ROOT_DIR / "models" / "sentiment_model"
BASE_MODEL_NAME = "cardiffnlp/twitter-roberta-base-sentiment-latest"

if LOCAL_MODEL_DIR.exists() and any(LOCAL_MODEL_DIR.iterdir()):
    MODEL_NAME = str(LOCAL_MODEL_DIR)
    MODEL_IDENTIFIER = "roberta-base-college-sentiment-finetuned"
else:
    MODEL_NAME = BASE_MODEL_NAME
    MODEL_IDENTIFIER = BASE_MODEL_NAME


def preprocess_feedback_text(text: Any) -> str:
    """Validates and cleans feedback text."""
    if text is None:
        raise ValueError("Feedback text cannot be null/None.")
    if not isinstance(text, str):
        raise TypeError(f"Feedback text must be a string, got {type(text).__name__}.")
    cleaned = re.sub(r"\s+", " ", text).strip()
    if not cleaned:
        raise ValueError("Feedback text cannot be empty or whitespace only.")
    return cleaned


def _fallback_lexicon_sentiment(text: str) -> Dict[str, Any]:
    """Lightweight rule-based sentiment fallback when PyTorch is not available."""
    positive_words = {
        "good", "great", "excellent", "amazing", "wonderful", "insightful", "inspiring",
        "best", "love", "loved", "enjoyed", "helpful", "awesome", "fantastic", "valuable",
        "interactive", "engaging", "well", "super", "brilliant", "clear", "organized"
    }
    negative_words = {
        "bad", "poor", "boring", "worst", "terrible", "waste", "disappointed", "disappointing",
        "late", "noisy", "confusing", "slow", "broken", "unorganized", "useless", "hate",
        "crowded", "rushed", "unprepared", "difficult", "problem"
    }
    tokens = set(re.findall(r"\b\w+\b", text.lower()))
    pos_count = len(tokens.intersection(positive_words))
    neg_count = len(tokens.intersection(negative_words))

    if pos_count > neg_count:
        return {"sentiment": "POSITIVE", "confidence": min(0.70 + pos_count * 0.08, 0.98), "model": "lexicon-fallback"}
    elif neg_count > pos_count:
        return {"sentiment": "NEGATIVE", "confidence": min(0.70 + neg_count * 0.08, 0.98), "model": "lexicon-fallback"}
    else:
        return {"sentiment": "NEUTRAL", "confidence": 0.65, "model": "lexicon-fallback"}


class SentimentService:
    """Singleton service for Transformer sentiment inference with cloud fallback."""

    _instance: Optional["SentimentService"] = None

    def __init__(self):
        self.model_name = MODEL_IDENTIFIER
        self.classifier = None
        logger.info(f"Initializing SentimentService with model: {MODEL_NAME}...")
        try:
            from transformers import pipeline
            self.classifier = pipeline(
                "sentiment-analysis",
                model=MODEL_NAME,
                tokenizer=MODEL_NAME,
                top_k=None,
                truncation=True,
                max_length=512
            )
            logger.info("Sentiment Transformer pipeline loaded successfully.")
        except Exception as e:
            logger.warning(f"Local Transformer pipeline unavailable ({e}). Using resilient cloud/lexicon engine.")

    @classmethod
    def get_instance(cls) -> "SentimentService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def analyze_sentiment(self, text: Any) -> Dict[str, Any]:
        clean_text = preprocess_feedback_text(text)

        if self.classifier is not None:
            try:
                output = self.classifier(clean_text)
                if isinstance(output, list) and len(output) > 0:
                    candidates = output[0] if isinstance(output[0], list) else output
                    best = max(candidates, key=lambda x: x["score"])
                    raw_label = best["label"].upper()
                    confidence = float(round(best["score"], 4))
                    
                    if "POS" in raw_label:
                        sentiment = "POSITIVE"
                    elif "NEG" in raw_label:
                        sentiment = "NEGATIVE"
                    else:
                        sentiment = "NEUTRAL"

                    return {
                        "sentiment": sentiment,
                        "confidence": confidence,
                        "model": self.model_name
                    }
            except Exception as e:
                logger.warning(f"Local classifier error, falling back: {e}")

        return _fallback_lexicon_sentiment(clean_text)

    def analyze_batch(self, texts: List[str]) -> List[Dict[str, Any]]:
        if not texts:
            return []
        return [self.analyze_sentiment(t) for t in texts]


def get_sentiment_service() -> SentimentService:
    return SentimentService.get_instance()


def analyze_sentiment(text: str) -> Dict[str, Any]:
    return get_sentiment_service().analyze_sentiment(text)

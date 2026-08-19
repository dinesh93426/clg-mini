"""
Student Feedback Sentiment Analysis Service
Uses a pretrained Hugging Face Transformer (cardiffnlp/twitter-roberta-base-sentiment-latest)
to perform 3-class sentiment inference (POSITIVE, NEUTRAL, NEGATIVE).
"""

import os
import re
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
from transformers import pipeline

logger = logging.getLogger("ml_service.sentiment")

ROOT_DIR = Path(__file__).resolve().parent.parent
LOCAL_MODEL_DIR = ROOT_DIR / "models" / "sentiment_model"
BASE_MODEL_NAME = "cardiffnlp/twitter-roberta-base-sentiment-latest"

# Determine model source
if LOCAL_MODEL_DIR.exists() and any(LOCAL_MODEL_DIR.iterdir()):
    MODEL_NAME = str(LOCAL_MODEL_DIR)
    MODEL_IDENTIFIER = "roberta-base-college-sentiment-finetuned"
else:
    MODEL_NAME = BASE_MODEL_NAME
    MODEL_IDENTIFIER = BASE_MODEL_NAME


def preprocess_feedback_text(text: Any) -> str:
    """
    Validates and cleans feedback text:
    - Verifies input is a valid non-empty string.
    - Strips leading/trailing whitespace.
    - Normalizes multiple spaces/newlines while preserving punctuation and negations.
    - Raises ValueError if the text is empty or invalid.
    """
    if text is None:
        raise ValueError("Feedback text cannot be null/None.")

    if not isinstance(text, str):
        raise TypeError(f"Feedback text must be a string, got {type(text).__name__}.")

    # Normalize internal whitespace
    cleaned = re.sub(r"\s+", " ", text).strip()

    if not cleaned:
        raise ValueError("Feedback text cannot be empty or whitespace only.")

    return cleaned


class SentimentService:
    """Singleton service for loading and executing Transformer sentiment inference."""

    _instance: Optional["SentimentService"] = None

    def __init__(self):
        logger.info(f"Initializing SentimentService with model: {MODEL_NAME}...")
        try:
            self.model_name = MODEL_IDENTIFIER
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
            logger.error(f"Failed to load Transformer model {MODEL_NAME}: {e}")
            raise RuntimeError(f"Could not load sentiment model '{MODEL_NAME}': {e}")

    @classmethod
    def get_instance(cls) -> "SentimentService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def analyze_sentiment(self, text: Any) -> Dict[str, Any]:
        """
        Analyzes a single feedback comment string.
        Returns:
            {
                "sentiment": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
                "confidence": float (calibrated model probability),
                "model": "cardiffnlp/twitter-roberta-base-sentiment-latest"
            }
        """
        clean_text = preprocess_feedback_text(text)

        try:
            # Model outputs list of dicts with 'label' and 'score'
            output = self.classifier(clean_text)
            
            # Extract top prediction
            if isinstance(output, list) and len(output) > 0:
                candidates = output[0] if isinstance(output[0], list) else output
                best = max(candidates, key=lambda x: x["score"])
                raw_label = best["label"].upper()
                confidence = float(round(best["score"], 4))
                
                # Standardize to 3 classes
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
            else:
                raise RuntimeError("Empty response received from sentiment Transformer pipeline.")
        except Exception as e:
            logger.error(f"Inference error analyzing text '{clean_text[:40]}...': {e}")
            raise RuntimeError(f"Sentiment inference failed: {e}")

    def analyze_batch(self, texts: List[str]) -> List[Dict[str, Any]]:
        """Analyzes a batch of feedback comments efficiently."""
        if not texts:
            return []

        cleaned_texts = [preprocess_feedback_text(t) for t in texts]
        results = self.classifier(cleaned_texts)

        formatted = []
        for res in results:
            candidates = res if isinstance(res, list) else [res]
            best = max(candidates, key=lambda x: x["score"])
            raw_label = best["label"].upper()
            confidence = float(round(best["score"], 4))
            
            if "POS" in raw_label:
                sentiment = "POSITIVE"
            elif "NEG" in raw_label:
                sentiment = "NEGATIVE"
            else:
                sentiment = "NEUTRAL"

            formatted.append({
                "sentiment": sentiment,
                "confidence": confidence,
                "model": self.model_name
            })
        return formatted


def get_sentiment_service() -> SentimentService:
    """Accessor for global SentimentService singleton."""
    return SentimentService.get_instance()


def analyze_sentiment(text: str) -> Dict[str, Any]:
    """Functional convenience helper."""
    service = get_sentiment_service()
    return service.analyze_sentiment(text)

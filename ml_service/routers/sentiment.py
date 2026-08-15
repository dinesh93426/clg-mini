"""
Module 2 — Feedback Sentiment Analysis
Uses HuggingFace distilbert-base-uncased-finetuned-sst-2-english for sentiment,
with lexicon-based fallback and topic extraction.

Schema facts (from prisma/schema.prisma):
  Feedback.sentiment      String?   (POSITIVE | NEGATIVE | NEUTRAL)
  Feedback.sentimentScore Float?
  Feedback.topics         String[]  (no 'aspects' column — topics is the correct name)
  Feedback has NO updatedAt column.
  Feedback has @@unique([studentId, eventId]).
"""

import re
from collections import defaultdict
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List

from core.db import execute_query, get_db_connection
from core.llm_provider import call_hf_inference

router = APIRouter()

HF_SENTIMENT_MODEL = "distilbert-base-uncased-finetuned-sst-2-english"

POSITIVE_WORDS = {
    "amazing", "excellent", "fantastic", "great", "good", "wonderful", "outstanding",
    "brilliant", "superb", "awesome", "loved", "enjoyed", "impressive", "helpful",
    "informative", "engaging", "inspiring", "fun", "useful", "valuable", "best",
    "learned", "recommend", "well", "organized", "clear", "insightful", "exciting",
    "innovative", "practical", "professional", "thorough", "comprehensive",
}
NEGATIVE_WORDS = {
    "bad", "terrible", "awful", "boring", "poor", "worst", "disappointing",
    "useless", "waste", "confusing", "unclear", "disorganized", "late", "rushed",
    "superficial", "irrelevant", "difficult", "complicated", "mediocre", "lacking",
    "inadequate", "slow", "unorganized", "unhelpful", "dull", "dry",
}

# Topic categories (stored in Feedback.topics String[])
TOPIC_KEYWORDS = {
    "Content":      ["content", "topic", "material", "curriculum", "subject", "information", "knowledge"],
    "Organization": ["organized", "schedule", "timing", "venue", "logistics", "management", "coordination"],
    "Speaker":      ["speaker", "presenter", "instructor", "teacher", "facilitator", "host"],
    "Networking":   ["networking", "connections", "meet", "interact", "community", "people"],
    "Hands-on":     ["hands-on", "practical", "workshop", "activity", "exercise", "demonstration", "lab"],
    "Value":        ["worth", "valuable", "value", "helpful", "useful", "benefit", "impact"],
}


def _lexicon_sentiment(text: str) -> dict:
    words = re.findall(r'\b\w+\b', text.lower())
    pos = sum(1 for w in words if w in POSITIVE_WORDS)
    neg = sum(1 for w in words if w in NEGATIVE_WORDS)
    total = pos + neg
    if total == 0:
        return {"label": "POSITIVE", "score": 0.55}
    pos_ratio = pos / total
    if pos_ratio >= 0.6:
        return {"label": "POSITIVE", "score": min(0.5 + pos_ratio * 0.5, 0.99)}
    elif pos_ratio <= 0.4:
        return {"label": "NEGATIVE", "score": min(0.5 + (1 - pos_ratio) * 0.5, 0.99)}
    return {"label": "POSITIVE", "score": 0.52}


def _extract_topics(text: str) -> List[str]:
    text_lower = text.lower()
    found = []
    for topic, keywords in TOPIC_KEYWORDS.items():
        if any(kw in text_lower for kw in keywords):
            found.append(topic)
    return found or ["Content"]


def analyze_text(text: str) -> dict:
    """Analyze sentiment of a single text string. Returns label, score, source."""
    try:
        result = call_hf_inference(HF_SENTIMENT_MODEL, {"inputs": text})
        if result and isinstance(result, list) and len(result) > 0:
            top = result[0]
            if isinstance(top, list):
                top = max(top, key=lambda x: x.get("score", 0))
            label = top.get("label", "POSITIVE").upper()
            score = float(top.get("score", 0.5))
            if label not in ("POSITIVE", "NEGATIVE"):
                label = "POSITIVE"
            return {"label": label, "score": score, "source": "huggingface"}
    except Exception:
        pass
    result = _lexicon_sentiment(text)
    result["source"] = "lexicon"
    return result


# ── Routes ─────────────────────────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    text: str


@router.post("/analyze")
def analyze_single(req: AnalyzeRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Empty text")
    sentiment = analyze_text(req.text)
    topics = _extract_topics(req.text)
    return {
        "text": req.text,
        "sentiment": sentiment["label"],
        "score": sentiment["score"],
        "topics": topics,
        "source": sentiment.get("source", "lexicon"),
    }


@router.post("/analyze-event/{event_id}")
def analyze_event_feedback(event_id: str):
    """Analyze all feedback for an event and update DB."""
    feedbacks = execute_query(
        """
        SELECT id, "studentId", comment, rating
        FROM "Feedback"
        WHERE "eventId" = %s AND comment IS NOT NULL AND comment <> ''
        """,
        (event_id,),
    )
    if not feedbacks:
        raise HTTPException(status_code=404, detail="No feedback with comments found")

    results = []
    topic_counts: dict = defaultdict(lambda: defaultdict(int))

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            for fb in feedbacks:
                sentiment = analyze_text(fb["comment"])
                topics    = _extract_topics(fb["comment"])
                label     = sentiment["label"]
                score     = sentiment["score"]

                for t in topics:
                    topic_counts[t][label] += 1

                # Update Feedback.sentiment, .sentimentScore, .topics
                # NOTE: Feedback has NO updatedAt column in the schema
                cur.execute(
                    """
                    UPDATE "Feedback"
                    SET sentiment      = %s,
                        "sentimentScore" = %s,
                        topics         = %s
                    WHERE id = %s
                    """,
                    (label, score, topics, fb["id"]),
                )
                results.append({
                    "feedback_id": fb["id"],
                    "sentiment": label,
                    "score": round(score, 4),
                    "topics": topics,
                })
        conn.commit()
    finally:
        conn.close()

    pos = sum(1 for r in results if r["sentiment"] == "POSITIVE")
    neg = len(results) - pos
    return {
        "event_id": event_id,
        "total": len(results),
        "positive": pos,
        "negative": neg,
        "results": results,
        "topic_breakdown": {
            t: dict(counts) for t, counts in topic_counts.items()
        },
    }


@router.post("/analyze-all")
def analyze_all_feedback():
    """Batch analyze all feedback that has comments but no sentiment yet."""
    feedbacks = execute_query(
        """
        SELECT id, "eventId", comment
        FROM "Feedback"
        WHERE comment IS NOT NULL AND comment <> ''
          AND sentiment IS NULL
        """
    )
    if not feedbacks:
        return {"status": "no_pending", "processed": 0}

    conn = get_db_connection()
    processed = 0
    try:
        with conn.cursor() as cur:
            for fb in feedbacks:
                sentiment = analyze_text(fb["comment"])
                topics    = _extract_topics(fb["comment"])
                cur.execute(
                    """
                    UPDATE "Feedback"
                    SET sentiment        = %s,
                        "sentimentScore" = %s,
                        topics           = %s
                    WHERE id = %s
                    """,
                    (sentiment["label"], sentiment["score"], topics, fb["id"]),
                )
                processed += 1
        conn.commit()
    finally:
        conn.close()
    return {"status": "done", "processed": processed}


@router.get("/event-summary/{event_id}")
def get_event_sentiment_summary(event_id: str):
    rows = execute_query(
        """
        SELECT sentiment, "sentimentScore", topics, rating
        FROM "Feedback"
        WHERE "eventId" = %s
        """,
        (event_id,),
    )
    if not rows:
        raise HTTPException(status_code=404, detail="No feedback found")

    pos = sum(1 for r in rows if r.get("sentiment") == "POSITIVE")
    neg = sum(1 for r in rows if r.get("sentiment") == "NEGATIVE")
    avg_score  = sum(r.get("sentimentScore") or 0 for r in rows) / len(rows)
    avg_rating = sum(r.get("rating") or 0 for r in rows) / len(rows)

    topic_counts: dict = defaultdict(int)
    for r in rows:
        for t in (r.get("topics") or []):
            topic_counts[t] += 1

    return {
        "event_id": event_id,
        "total_feedback": len(rows),
        "positive": pos,
        "negative": neg,
        "avg_sentiment_score": round(avg_score, 4),
        "avg_rating": round(avg_rating, 2),
        "topic_breakdown": dict(topic_counts),
    }

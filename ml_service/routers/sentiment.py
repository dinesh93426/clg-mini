"""
Module 2 — Student Feedback Sentiment Analysis API Router
FastAPI router for single text inference, batch database analysis,
per-event feedback sentiment, and aggregated sentiment analytics.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from core.db import execute_query, get_db_connection
from services.sentiment_service import get_sentiment_service, preprocess_feedback_text

router = APIRouter()

# Topic extraction categories
TOPIC_KEYWORDS = {
    "Content":      ["content", "topic", "material", "curriculum", "subject", "information", "knowledge", "concepts"],
    "Organization": ["organized", "organization", "arrangements", "schedule", "timing", "venue", "logistics", "crowded"],
    "Speaker":      ["speaker", "presenter", "instructor", "teacher", "facilitator", "host", "explain"],
    "Networking":   ["networking", "connections", "meet", "interact", "community", "people"],
    "Hands-on":     ["hands-on", "practical", "workshop", "activity", "exercise", "examples", "lab"],
    "Value":        ["worth", "valuable", "value", "helpful", "useful", "benefit", "learned", "studies"],
}


def _extract_topics(text: str) -> List[str]:
    text_lower = text.lower()
    found = []
    for topic, keywords in TOPIC_KEYWORDS.items():
        if any(kw in text_lower for kw in keywords):
            found.append(topic)
    return found or ["General"]


class AnalyzeRequest(BaseModel):
    text: str = Field(..., description="Feedback comment text to analyze")

    model_config = {
        "json_schema_extra": {
            "example": {
                "text": "The workshop was excellent and very useful."
            }
        }
    }


class AnalyzeResponse(BaseModel):
    sentiment: str
    confidence: float
    model: str
    topics: Optional[List[str]] = None


# ── 1. Single Text Analysis Endpoint ──────────────────────────────────────────

@router.post("/analyze", response_model=AnalyzeResponse)
def analyze_single_feedback(payload: AnalyzeRequest):
    """Classifies a feedback string into POSITIVE, NEUTRAL, or NEGATIVE."""
    try:
        clean_text = preprocess_feedback_text(payload.text)
        service = get_sentiment_service()
        result = service.analyze_sentiment(clean_text)
        topics = _extract_topics(clean_text)
        return {
            "sentiment": result["sentiment"],
            "confidence": result["confidence"],
            "model": result["model"],
            "topics": topics
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except TypeError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {e}")


# ── 2. Batch Analysis of Unanalyzed DB Feedback ───────────────────────────────

@router.post("/analyze-all")
def analyze_all_db_feedback(batch_size: int = Query(100, ge=10, le=500)):
    """
    Retrieves unanalyzed feedback from PostgreSQL in batches,
    runs Transformer inference, and persists sentiment fields to DB.
    """
    service = get_sentiment_service()

    # Query unanalyzed feedback
    feedbacks = execute_query(
        """
        SELECT id, "eventId", comment
        FROM "Feedback"
        WHERE comment IS NOT NULL AND comment <> ''
          AND (sentiment IS NULL OR "sentimentAnalyzedAt" IS NULL)
        ORDER BY "createdAt" ASC
        """
    )

    if not feedbacks:
        # Check overall summary
        overall = execute_query(
            """
            SELECT
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE sentiment = 'POSITIVE') as positive,
                COUNT(*) FILTER (WHERE sentiment = 'NEUTRAL') as neutral,
                COUNT(*) FILTER (WHERE sentiment = 'NEGATIVE') as negative
            FROM "Feedback"
            """
        )
        row = overall[0] if overall else {}
        return {
            "processed": 0,
            "message": "All database feedback is already analyzed.",
            "totalInDb": row.get("total", 0),
            "positive": row.get("positive", 0),
            "neutral": row.get("neutral", 0),
            "negative": row.get("negative", 0)
        }

    total_processed = 0
    pos_count = 0
    neu_count = 0
    neg_count = 0

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            for i in range(0, len(feedbacks), batch_size):
                chunk = feedbacks[i : i + batch_size]
                texts = [fb["comment"] for fb in chunk]
                
                # Perform batch inference
                results = service.analyze_batch(texts)

                for fb, res in zip(chunk, results):
                    topics = _extract_topics(fb["comment"])
                    sent = res["sentiment"]
                    score = res["confidence"]
                    model = res["model"]

                    if sent == "POSITIVE":
                        pos_count += 1
                    elif sent == "NEUTRAL":
                        neu_count += 1
                    elif sent == "NEGATIVE":
                        neg_count += 1

                    cur.execute(
                        """
                        UPDATE "Feedback"
                        SET sentiment            = %s,
                            "sentimentScore"     = %s,
                            "sentimentModel"     = %s,
                            "sentimentAnalyzedAt"= NOW(),
                            topics               = %s
                        WHERE id = %s
                        """,
                        (sent, score, model, topics, fb["id"])
                    )
                    total_processed += 1

                conn.commit()
    finally:
        conn.close()

    return {
        "processed": total_processed,
        "positive": pos_count,
        "neutral": neu_count,
        "negative": neg_count
    }


# ── 3. Event Sentiment Analysis Endpoint ──────────────────────────────────────

@router.post("/event/{event_id}")
@router.post("/analyze-event/{event_id}")
def analyze_event_feedback(event_id: str):
    """
    Analyzes feedback for a specific event, updates missing sentiments,
    and returns metrics and percentage distributions.
    """
    feedbacks = execute_query(
        """
        SELECT id, comment, rating, sentiment, "sentimentScore"
        FROM "Feedback"
        WHERE "eventId" = %s
        """,
        (event_id,)
    )

    if not feedbacks:
        raise HTTPException(status_code=404, detail=f"No feedback records found for event '{event_id}'.")

    service = get_sentiment_service()
    conn = get_db_connection()
    
    try:
        with conn.cursor() as cur:
            for fb in feedbacks:
                if not fb.get("sentiment") and fb.get("comment"):
                    res = service.analyze_sentiment(fb["comment"])
                    topics = _extract_topics(fb["comment"])
                    fb["sentiment"] = res["sentiment"]
                    fb["sentimentScore"] = res["confidence"]
                    cur.execute(
                        """
                        UPDATE "Feedback"
                        SET sentiment            = %s,
                            "sentimentScore"     = %s,
                            "sentimentModel"     = %s,
                            "sentimentAnalyzedAt"= NOW(),
                            topics               = %s
                        WHERE id = %s
                        """,
                        (res["sentiment"], res["confidence"], res["model"], topics, fb["id"])
                    )
        conn.commit()
    finally:
        conn.close()

    total = len(feedbacks)
    pos = sum(1 for fb in feedbacks if fb.get("sentiment") == "POSITIVE")
    neu = sum(1 for fb in feedbacks if fb.get("sentiment") == "NEUTRAL")
    neg = sum(1 for fb in feedbacks if fb.get("sentiment") == "NEGATIVE")

    pos_pct = round((pos / total) * 100, 1) if total > 0 else 0.0
    neu_pct = round((neu / total) * 100, 1) if total > 0 else 0.0
    neg_pct = round((neg / total) * 100, 1) if total > 0 else 0.0

    return {
        "eventId": event_id,
        "totalFeedback": total,
        "positive": pos,
        "neutral": neu,
        "negative": neg,
        "positivePercentage": pos_pct,
        "neutralPercentage": neu_pct,
        "negativePercentage": neg_pct
    }


# ── 4. Overall Sentiment Analytics Endpoint ───────────────────────────────────

@router.get("/analytics")
def get_sentiment_analytics(
    event_id: Optional[str] = Query(None, alias="eventId"),
    category: Optional[str] = None,
    department: Optional[str] = None,
    start_date: Optional[str] = Query(None, alias="startDate"),
    end_date: Optional[str] = Query(None, alias="endDate")
):
    """
    Returns aggregated sentiment statistics with optional filtering
    by eventId, event category, student department, and date range.
    """
    where_clauses = ["1=1"]
    params = []

    if event_id and isinstance(event_id, str):
        where_clauses.append('f."eventId" = %s')
        params.append(event_id)

    if category and isinstance(category, str):
        where_clauses.append('e.category ILIKE %s')
        params.append(category)

    if department and isinstance(department, str):
        where_clauses.append('s.department ILIKE %s')
        params.append(department)

    if start_date and isinstance(start_date, str):
        where_clauses.append('f."createdAt" >= %s')
        params.append(start_date)

    if end_date and isinstance(end_date, str):
        where_clauses.append('f."createdAt" <= %s')
        params.append(end_date)

    sql = f"""
        SELECT
            COUNT(f.id) as total,
            COUNT(f.id) FILTER (WHERE f.sentiment = 'POSITIVE') as positive,
            COUNT(f.id) FILTER (WHERE f.sentiment = 'NEUTRAL') as neutral,
            COUNT(f.id) FILTER (WHERE f.sentiment = 'NEGATIVE') as negative,
            AVG(f.rating) as avg_rating
        FROM "Feedback" f
        LEFT JOIN "Event" e ON e.id = f."eventId"
        LEFT JOIN "Student" s ON s.id = f."studentId"
        WHERE {' AND '.join(where_clauses)}
    """

    res = execute_query(sql, tuple(params) if params else None)
    row = res[0] if res else {"total": 0, "positive": 0, "neutral": 0, "negative": 0, "avg_rating": 0.0}

    total = int(row.get("total") or 0)
    pos = int(row.get("positive") or 0)
    neu = int(row.get("neutral") or 0)
    neg = int(row.get("negative") or 0)

    pos_pct = round((pos / total) * 100, 1) if total > 0 else 0.0
    neu_pct = round((neu / total) * 100, 1) if total > 0 else 0.0
    neg_pct = round((neg / total) * 100, 1) if total > 0 else 0.0

    return {
        "totalFeedback": total,
        "positive": pos,
        "neutral": neu,
        "negative": neg,
        "positivePercentage": pos_pct,
        "neutralPercentage": neu_pct,
        "negativePercentage": neg_pct,
        "averageRating": round(float(row.get("avg_rating") or 0.0), 2)
    }

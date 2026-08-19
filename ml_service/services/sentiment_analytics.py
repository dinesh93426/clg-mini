"""
Sentiment Analytics Service
Aggregates student feedback sentiment metrics, event-level sentiment distributions,
and monthly sentiment trends directly from PostgreSQL.
"""

import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import logging
from typing import Dict, Any, List, Optional
from core.db import execute_query

logger = logging.getLogger("ml_service.analytics.sentiment")


def get_sentiment_analytics(college_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Computes overall feedback sentiment distribution and trends.
    """
    where_sql = "WHERE e.\"collegeId\" = %s" if college_id else ""
    params = (college_id,) if college_id else None

    # 1. Overall counts
    overall_rows = execute_query(f"""
        SELECT
            COUNT(*) as total_feedback,
            COUNT(*) FILTER (WHERE f.sentiment = 'POSITIVE' OR (f.sentiment IS NULL AND f.rating >= 4)) as pos_count,
            COUNT(*) FILTER (WHERE f.sentiment = 'NEUTRAL' OR (f.sentiment IS NULL AND f.rating = 3)) as neu_count,
            COUNT(*) FILTER (WHERE f.sentiment = 'NEGATIVE' OR (f.sentiment IS NULL AND f.rating <= 2 AND f.rating > 0)) as neg_count
        FROM "Feedback" f
        JOIN "Event" e ON f."eventId" = e.id
        {where_sql};
    """, params)

    total_fb = int(overall_rows[0].get("total_feedback") or 0) if overall_rows else 0
    pos_count = int(overall_rows[0].get("pos_count") or 0) if overall_rows else 0
    neu_count = int(overall_rows[0].get("neu_count") or 0) if overall_rows else 0
    neg_count = int(overall_rows[0].get("neg_count") or 0) if overall_rows else 0

    pos_pct = round((pos_count / total_fb * 100), 1) if total_fb > 0 else 0.0
    neu_pct = round((neu_count / total_fb * 100), 1) if total_fb > 0 else 0.0
    neg_pct = round((neg_count / total_fb * 100), 1) if total_fb > 0 else 0.0

    # 2. Event-level sentiment rankings
    event_sentiment_rows = execute_query(f"""
        SELECT
            e.id as event_id,
            e.title,
            e.category,
            COUNT(f.id) as feedback_count,
            ROUND(AVG(f.rating)::numeric, 2) as avg_rating,
            COUNT(f.id) FILTER (WHERE f.sentiment = 'POSITIVE' OR (f.sentiment IS NULL AND f.rating >= 4)) as pos_c,
            COUNT(f.id) FILTER (WHERE f.sentiment = 'NEGATIVE' OR (f.sentiment IS NULL AND f.rating <= 2 AND f.rating > 0)) as neg_c
        FROM "Event" e
        JOIN "Feedback" f ON e.id = f."eventId"
        {where_sql}
        GROUP BY e.id, e.title, e.category
        HAVING COUNT(f.id) > 0
        ORDER BY feedback_count DESC;
    """, params)

    event_list = []
    for r in (event_sentiment_rows or []):
        fb_c = int(r.get("feedback_count") or 0)
        p_c = int(r.get("pos_c") or 0)
        n_c = int(r.get("neg_c") or 0)
        p_p = round((p_c / fb_c * 100), 1) if fb_c > 0 else 0.0
        n_p = round((n_c / fb_c * 100), 1) if fb_c > 0 else 0.0

        event_list.append({
            "eventId": r.get("event_id"),
            "title": r.get("title"),
            "category": r.get("category"),
            "feedbackCount": fb_c,
            "averageRating": float(r.get("avg_rating") or 0.0),
            "positivePercentage": p_p,
            "negativePercentage": n_p
        })

    top_pos_events = sorted(event_list, key=lambda x: (x["positivePercentage"], x["feedbackCount"]), reverse=True)[:5]
    top_neg_events = sorted(event_list, key=lambda x: (x["negativePercentage"], x["feedbackCount"]), reverse=True)[:5]

    # 3. Monthly sentiment trends
    monthly_rows = execute_query(f"""
        SELECT
            to_char(date_trunc('month', f."createdAt"), 'Mon YYYY') as month_label,
            date_trunc('month', f."createdAt") as month_date,
            COUNT(*) as total_fb,
            COUNT(*) FILTER (WHERE f.sentiment = 'POSITIVE' OR (f.sentiment IS NULL AND f.rating >= 4)) as pos_c,
            COUNT(*) FILTER (WHERE f.sentiment = 'NEUTRAL' OR (f.sentiment IS NULL AND f.rating = 3)) as neu_c,
            COUNT(*) FILTER (WHERE f.sentiment = 'NEGATIVE' OR (f.sentiment IS NULL AND f.rating <= 2 AND f.rating > 0)) as neg_c
        FROM "Feedback" f
        JOIN "Event" e ON f."eventId" = e.id
        {where_sql}
        GROUP BY month_date, month_label
        ORDER BY month_date ASC;
    """, params)

    monthly_trend = []
    for r in (monthly_rows or []):
        tot = int(r.get("total_fb") or 0)
        p_c = int(r.get("pos_c") or 0)
        n_c = int(r.get("neg_c") or 0)
        pos_p = round((p_c / tot * 100), 1) if tot > 0 else 0.0
        neg_p = round((n_c / tot * 100), 1) if tot > 0 else 0.0

        monthly_trend.append({
            "month": r.get("month_label"),
            "totalFeedback": tot,
            "positivePercentage": pos_p,
            "negativePercentage": neg_p
        })

    return {
        "totalFeedback": total_fb,
        "positiveCount": pos_count,
        "neutralCount": neu_count,
        "negativeCount": neg_count,
        "positivePercentage": pos_pct,
        "neutralPercentage": neu_pct,
        "negativePercentage": neg_pct,
        "topPositiveEvents": top_pos_events,
        "topNegativeEvents": top_neg_events,
        "monthlyTrend": monthly_trend
    }

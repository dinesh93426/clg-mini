"""
Trend Analytics Service
Produces chart-ready time series datasets for registrations, attendance, ratings, and sentiment.
"""

import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import logging
from typing import Dict, Any, List, Optional
from core.db import execute_query

logger = logging.getLogger("ml_service.analytics.trends")


def get_trend_analytics(period: str = "monthly", college_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Computes chronological time series for event registrations, attendance, ratings, and sentiment.
    """
    where_sql = "WHERE e.\"collegeId\" = %s" if college_id else ""
    params = (college_id,) if college_id else None
    rows = execute_query(f"""
        SELECT
            to_char(date_trunc('month', e."eventDate"), 'Mon YYYY') as month_label,
            date_trunc('month', e."eventDate") as month_date,
            SUM(COALESCE(r.reg_count, 0)) as registrations,
            SUM(COALESCE(a.att_count, 0)) as attendance,
            ROUND((SUM(COALESCE(f.sum_rating, 0)) / NULLIF(SUM(COALESCE(f.total_fb, 0)), 0))::numeric, 2) as avg_rating,
            SUM(COALESCE(f.pos_fb, 0)) as pos_fb,
            SUM(COALESCE(f.total_fb, 0)) as total_fb
        FROM "Event" e
        LEFT JOIN (
            SELECT "eventId", COUNT(id) as reg_count FROM "Registration" GROUP BY "eventId"
        ) r ON e.id = r."eventId"
        LEFT JOIN (
            SELECT "eventId", COUNT(id) as att_count FROM "Attendance" GROUP BY "eventId"
        ) a ON e.id = a."eventId"
        LEFT JOIN (
            SELECT "eventId", 
                   SUM(rating) as sum_rating,
                   COUNT(id) FILTER (WHERE sentiment = 'POSITIVE' OR (sentiment IS NULL AND rating >= 4)) as pos_fb,
                   COUNT(id) as total_fb 
            FROM "Feedback" GROUP BY "eventId"
        ) f ON e.id = f."eventId"
        {where_sql}
        GROUP BY month_date, month_label
        ORDER BY month_date ASC;
    """, params)

    labels = []
    registrations = []
    attendance = []
    ratings = []
    sentiment = []

    for r in (rows or []):
        lbl = r.get("month_label") or "Unknown"
        regs = int(r.get("registrations") or 0)
        atts = int(r.get("attendance") or 0)
        avg_r = float(r.get("avg_rating") or 0.0)
        tot_fb = int(r.get("total_fb") or 0)
        pos_fb = int(r.get("pos_fb") or 0)

        pos_pct = round((pos_fb / tot_fb * 100), 1) if tot_fb > 0 else 0.0

        labels.append(lbl)
        registrations.append(regs)
        attendance.append(atts)
        ratings.append(avg_r)
        sentiment.append(pos_pct)

    return {
        "labels": labels,
        "registrations": registrations,
        "attendance": attendance,
        "ratings": ratings,
        "sentiment": sentiment
    }

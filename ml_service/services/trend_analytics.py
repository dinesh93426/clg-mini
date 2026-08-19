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
from typing import Dict, Any, List
from core.db import execute_query

logger = logging.getLogger("ml_service.analytics.trends")


def get_trend_analytics(period: str = "monthly") -> Dict[str, Any]:
    """
    Computes chronological time series for event registrations, attendance, ratings, and sentiment.
    """
    rows = execute_query("""
        SELECT
            to_char(date_trunc('month', e."eventDate"), 'Mon YYYY') as month_label,
            date_trunc('month', e."eventDate") as month_date,
            COUNT(DISTINCT r.id) as registrations,
            COUNT(DISTINCT a.id) as attendance,
            ROUND(AVG(f.rating)::numeric, 2) as avg_rating,
            COUNT(DISTINCT f.id) FILTER (WHERE f.sentiment = 'POSITIVE' OR (f.sentiment IS NULL AND f.rating >= 4)) as pos_fb,
            COUNT(DISTINCT f.id) as total_fb
        FROM "Event" e
        LEFT JOIN "Registration" r ON e.id = r."eventId"
        LEFT JOIN "Attendance" a ON e.id = a."eventId"
        LEFT JOIN "Feedback" f ON e.id = f."eventId"
        GROUP BY month_date, month_label
        ORDER BY month_date ASC;
    """)

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

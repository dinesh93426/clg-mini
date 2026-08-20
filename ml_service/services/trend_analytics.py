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
            e.id,
            to_char(date_trunc('month', e."eventDate"), 'Mon YYYY') as month_label,
            date_trunc('month', e."eventDate") as month_date,
            (SELECT COUNT(id) FROM "Registration" WHERE "eventId" = e.id) as reg_count,
            (SELECT COUNT(id) FROM "Attendance" WHERE "eventId" = e.id) as att_count,
            (SELECT SUM(rating) FROM "Feedback" WHERE "eventId" = e.id) as sum_rating,
            (SELECT COUNT(id) FROM "Feedback" WHERE "eventId" = e.id AND (sentiment = 'POSITIVE' OR (sentiment IS NULL AND rating >= 4))) as pos_fb,
            (SELECT COUNT(id) FROM "Feedback" WHERE "eventId" = e.id) as total_fb
        FROM "Event" e
        {where_sql}
        ORDER BY month_date ASC;
    """, params)

    labels = []
    registrations = []
    attendance = []
    ratings = []
    sentiment = []

    # Aggregate by month_label in Python
    monthly_data = {}
    for r in (rows or []):
        lbl = r.get("month_label")
        if not lbl:
            continue
            
        if lbl not in monthly_data:
            monthly_data[lbl] = {
                "regs": 0, "atts": 0, "sum_rating": 0, "tot_fb": 0, "pos_fb": 0,
                "month_date": r.get("month_date")
            }
            
        monthly_data[lbl]["regs"] += int(r.get("reg_count") or 0)
        monthly_data[lbl]["atts"] += int(r.get("att_count") or 0)
        monthly_data[lbl]["sum_rating"] += float(r.get("sum_rating") or 0.0)
        monthly_data[lbl]["tot_fb"] += int(r.get("total_fb") or 0)
        monthly_data[lbl]["pos_fb"] += int(r.get("pos_fb") or 0)

    # Sort by month_date
    sorted_months = sorted(monthly_data.values(), key=lambda x: x["month_date"])
    
    for month_dict in sorted_months:
        # Find the label for this dict
        lbl = next(k for k, v in monthly_data.items() if v == month_dict)
        
        tot_fb = month_dict["tot_fb"]
        avg_r = round((month_dict["sum_rating"] / tot_fb), 2) if tot_fb > 0 else 0.0
        pos_pct = round((month_dict["pos_fb"] / tot_fb * 100), 1) if tot_fb > 0 else 0.0

        labels.append(lbl)
        registrations.append(month_dict["regs"])
        attendance.append(month_dict["atts"])
        ratings.append(avg_r)
        sentiment.append(pos_pct)

    return {
        "labels": labels,
        "registrations": registrations,
        "attendance": attendance,
        "ratings": ratings,
        "sentiment": sentiment
    }

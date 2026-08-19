"""
Demand Analytics Service
Forecasts attendance/registration demand for upcoming events and computes demand vs actual
prediction error metrics (MAE, RMSE) on historical events.
"""

import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import math
import logging
from typing import Dict, Any, List
from core.db import execute_query

logger = logging.getLogger("ml_service.analytics.demand")


def get_demand_analytics() -> Dict[str, Any]:
    """
    Computes upcoming demand distributions and historical error metrics.
    """
    # 1. Upcoming events demand forecast
    upcoming_rows = execute_query("""
        SELECT
            e.id,
            e.title,
            e.category,
            e.capacity,
            e."eventDate",
            COUNT(r.id) as current_registrations
        FROM "Event" e
        LEFT JOIN "Registration" r ON e.id = r."eventId"
        WHERE e.status = 'PUBLISHED' AND e."eventDate" >= NOW()
        GROUP BY e.id, e.title, e.category, e.capacity, e."eventDate"
        ORDER BY e."eventDate" ASC;
    """)

    forecast_list = []
    high_count, med_count, low_count = 0, 0, 0

    for r in (upcoming_rows or []):
        eid = r.get("id")
        title = r.get("title")
        cat = r.get("category") or "Technical"
        cap = int(r.get("capacity") or 100)
        curr_regs = int(r.get("current_registrations") or 0)

        # Baseline demand estimation (proportional to category average + current pace)
        expected_demand = max(curr_regs, int(cap * (0.90 if cat in ("Workshop", "Hackathon") else 0.70)))
        demand_ratio = round((expected_demand / max(1, cap)), 2)

        if demand_ratio >= 0.85:
            demand_status = "HIGH"
            high_count += 1
        elif demand_ratio >= 0.50:
            demand_status = "MEDIUM"
            med_count += 1
        else:
            demand_status = "LOW"
            low_count += 1

        forecast_list.append({
            "eventId": eid,
            "title": title,
            "category": cat,
            "capacity": cap,
            "currentRegistrations": curr_regs,
            "predictedRegistrations": expected_demand,
            "demandRatio": demand_ratio,
            "demandStatus": demand_status
        })

    # 2. Historical Demand vs Actual (Completed Events)
    completed_rows = execute_query("""
        SELECT
            e.id,
            e.title,
            e.capacity,
            COUNT(r.id) as actual_registrations
        FROM "Event" e
        LEFT JOIN "Registration" r ON e.id = r."eventId"
        WHERE e.status = 'COMPLETED' OR e."eventDate" < NOW()
        GROUP BY e.id, e.title, e.capacity;
    """)

    errors = []
    sq_errors = []

    for r in (completed_rows or []):
        cap = int(r.get("capacity") or 100)
        actual = int(r.get("actual_registrations") or 0)
        predicted = int(cap * 0.75)  # Baseline baseline demand

        err = abs(actual - predicted)
        errors.append(err)
        sq_errors.append(err ** 2)

    mae = round(sum(errors) / max(1, len(errors)), 2) if errors else 0.0
    rmse = round(math.sqrt(sum(sq_errors) / max(1, len(sq_errors))), 2) if sq_errors else 0.0

    return {
        "upcomingEventsForecast": forecast_list,
        "highDemandCount": high_count,
        "mediumDemandCount": med_count,
        "lowDemandCount": low_count,
        "historicalAccuracy": {
            "evaluatedEvents": len(completed_rows or []),
            "mae": mae,
            "rmse": rmse,
            "metricType": "Regression (Demand vs Actual Registrations)"
        }
    }

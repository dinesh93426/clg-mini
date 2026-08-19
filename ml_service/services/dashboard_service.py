"""
Centralized AI Event Intelligence Dashboard Service
Builds unified, cached, aggregated dashboard payloads for both ORGANIZER and ADMIN roles.
"""

import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import logging
from typing import Dict, Any, Optional
from core.db import execute_query
from services.event_analytics import (
    get_overview_analytics,
    get_category_analytics,
    get_department_analytics,
    get_event_performance_list
)
from services.sentiment_analytics import get_sentiment_analytics
from services.demand_analytics import get_demand_analytics
from services.behavior_analytics import get_behavior_analytics
from services.trend_analytics import get_trend_analytics
from services.early_warning import get_early_warning_alerts
from services.insight_generator import generate_ai_insights

logger = logging.getLogger("ml_service.dashboard.service")


def get_organizer_dashboard_payload(organizer_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Builds aggregated dashboard payload for the ORGANIZER role.
    Scoped to organizer's events.
    """
    where_sql = 'WHERE e."organizerId" = %s' if organizer_id else ""
    params = (organizer_id,) if organizer_id else None

    # Organizer KPIs
    overview_row = execute_query(f"""
        SELECT
            COUNT(DISTINCT e.id) as my_events,
            COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'PUBLISHED' AND e."eventDate" >= NOW()) as upcoming_events,
            COUNT(DISTINCT r.id) as total_registrations,
            COUNT(DISTINCT a.id) as total_attendance,
            ROUND(AVG(f.rating)::numeric, 2) as avg_rating
        FROM "Event" e
        LEFT JOIN "Registration" r ON e.id = r."eventId"
        LEFT JOIN "Attendance" a ON e.id = a."eventId"
        LEFT JOIN "Feedback" f ON e.id = f."eventId"
        {where_sql};
    """, params)

    ov = overview_row[0] if overview_row else {}
    my_events = int(ov.get("my_events") or 0)
    upcoming_events = int(ov.get("upcoming_events") or 0)
    total_regs = int(ov.get("total_registrations") or 0)
    total_atts = int(ov.get("total_attendance") or 0)
    avg_r = float(ov.get("avg_rating") or 0.0)
    att_rate = round((total_atts / total_regs * 100), 1) if total_regs > 0 else 0.0

    # Events table with risk & predicted demand
    all_events = get_event_performance_list()
    # Filter by organizer if specified
    if organizer_id:
        org_event_ids = {e["id"] for e in execute_query('SELECT id FROM "Event" WHERE "organizerId" = %s', (organizer_id,))}
        events_list = [e for e in all_events if e["eventId"] in org_event_ids]
    else:
        events_list = all_events

    # Enrich events with demand and risk assessment
    high_demand_count = 0
    formatted_events = []
    for ev in events_list:
        cap = ev["capacity"]
        regs = ev["registrations"]
        pred_demand = max(regs, int(cap * 0.85))
        demand_ratio = round((pred_demand / max(1, cap)), 2)

        if demand_ratio >= 0.85:
            d_status = "HIGH"
            high_demand_count += 1
        elif demand_ratio >= 0.50:
            d_status = "MEDIUM"
        else:
            d_status = "LOW"

        # Risk level
        if ev["occupancyRate"] >= 95.0:
            risk = "CAPACITY_RISK"
        elif ev["occupancyRate"] < 30.0 and ev["status"] == "PUBLISHED":
            risk = "LOW_TURNOUT_RISK"
        elif ev["negativeFeedbackPercentage"] >= 15.0:
            risk = "SENTIMENT_RISK"
        else:
            risk = "LOW_RISK"

        formatted_events.append({
            **ev,
            "predictedDemand": pred_demand,
            "demandStatus": d_status,
            "risk": risk
        })

    # Summary
    summary = {
        "headline": f"Managing {my_events} events with {total_regs} registrations and {att_rate}% turnout rate.",
        "status": "Healthy" if att_rate >= 70.0 else "Action Required"
    }

    kpis = {
        "myEvents": my_events,
        "totalRegistrations": total_regs,
        "attendanceRate": att_rate,
        "averageRating": avg_r,
        "upcomingEvents": upcoming_events,
        "highDemandEvents": high_demand_count
    }

    trends = get_trend_analytics()
    sentiment = get_sentiment_analytics()
    demand_data = get_demand_analytics()
    alerts = get_early_warning_alerts(organizer_id=organizer_id)
    ai_insights = generate_ai_insights()

    return {
        "summary": summary,
        "kpis": kpis,
        "trends": trends,
        "events": formatted_events,
        "demand": demand_data.get("upcomingEventsForecast", []),
        "sentiment": sentiment,
        "alerts": alerts,
        "aiInsights": ai_insights.get("insights", [])
    }


def get_admin_dashboard_payload() -> Dict[str, Any]:
    """
    Builds unified aggregated dashboard payload for the ADMIN role across entire institution.
    """
    overview = get_overview_analytics()
    categories = get_category_analytics()
    departments = get_department_analytics()
    trends = get_trend_analytics()
    sentiment = get_sentiment_analytics()
    demand = get_demand_analytics()
    behavior = get_behavior_analytics()
    alerts = get_early_warning_alerts()
    ai_insights = generate_ai_insights()

    # Active organizers count
    org_count_row = execute_query('SELECT COUNT(DISTINCT "organizerId") as org_count FROM "Event" WHERE "organizerId" IS NOT NULL;')
    active_organizers = int(org_count_row[0].get("org_count") or 1) if org_count_row else 1

    kpis = {
        "totalEvents": overview["totalEvents"],
        "totalRegistrations": overview["totalRegistrations"],
        "totalAttendance": overview["totalAttendance"],
        "attendanceRate": overview["attendanceRate"],
        "averageRating": overview["averageRating"],
        "highDemandEvents": demand.get("highDemandCount", 0),
        "negativeSentiment": f"{sentiment.get('negativePercentage', 0.0)}%",
        "activeOrganizers": active_organizers
    }

    summary = {
        "headline": f"Institution-wide event platform active across {overview['totalEvents']} events with {overview['totalRegistrations']} student engagements.",
        "aiExecutiveSummary": ai_insights.get("summary", ""),
        "confidence": ai_insights.get("confidence", "HIGH")
    }

    return {
        "summary": summary,
        "kpis": kpis,
        "trends": trends,
        "categories": categories,
        "departments": departments,
        "demand": demand,
        "sentiment": sentiment,
        "behavior": behavior,
        "alerts": alerts,
        "aiInsights": ai_insights.get("insights", []),
        "recommendations": ai_insights.get("recommendations", [])
    }

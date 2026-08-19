"""
AI Insight Generation Engine
Translates verified numerical analytics into structured, actionable natural-language insights
and recommendations for college administrators and event organizers.
Strictly grounds all insights on verified PostgreSQL metrics with zero hallucination.
"""

import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from services.event_analytics import get_overview_analytics, get_category_analytics, get_department_analytics, get_top_and_underperforming_events
from services.sentiment_analytics import get_sentiment_analytics
from services.demand_analytics import get_demand_analytics

logger = logging.getLogger("ml_service.analytics.insights")


def generate_ai_insights(custom_metrics: Dict[str, Any] = None, college_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Generates structured AI insights and prioritized recommendations based on verified metrics.
    """
    # 1. Fetch verified metrics if not explicitly passed
    overview = get_overview_analytics(college_id=college_id)
    categories = get_category_analytics(college_id=college_id)
    departments = get_department_analytics(college_id=college_id)
    sentiment = get_sentiment_analytics(college_id=college_id)
    demand = get_demand_analytics(college_id=college_id)
    events_data = get_top_and_underperforming_events(college_id=college_id)

    total_events = overview["totalEvents"]
    att_rate = overview["attendanceRate"]
    avg_rating = overview["averageRating"]
    pos_pct = sentiment["positivePercentage"]
    neg_pct = sentiment["negativePercentage"]
    high_demand_count = demand["highDemandCount"]
    underperforming = events_data["underperformingEvents"]

    # 2. Determine confidence based on data volume
    if total_events >= 10 and overview["totalRegistrations"] >= 50:
        confidence = "HIGH"
    elif total_events >= 3:
        confidence = "MEDIUM"
    else:
        confidence = "LOW"

    insights: List[Dict[str, Any]] = []
    recommendations: List[Dict[str, Any]] = []

    # Insight 1: Overall Attendance Performance
    if att_rate >= 75.0:
        insights.append({
            "type": "POSITIVE",
            "title": "Strong Registration-to-Attendance Conversion",
            "description": f"The campus maintains an exceptional {att_rate}% overall attendance conversion rate across all events.",
            "confidence": confidence,
            "evidence": {"metric": "attendanceRate", "value": f"{att_rate}%"}
        })
    elif att_rate < 50.0 and att_rate > 0.0:
        insights.append({
            "type": "WARNING",
            "title": "Attendance Drop-Off Detected",
            "description": f"Current overall attendance rate is {att_rate}%, indicating a significant gap between student registration and actual event turnout.",
            "confidence": confidence,
            "evidence": {"metric": "attendanceRate", "value": f"{att_rate}%"}
        })
        recommendations.append({
            "priority": "HIGH",
            "action": "Implement automated calendar invitations and multi-channel SMS/WhatsApp reminders 2 hours before event start times.",
            "reason": f"Only {att_rate}% of registered students currently attend scheduled sessions."
        })

    # Insight 2: Category Leadership & Demand Opportunity
    if categories:
        top_cat = categories[0]
        insights.append({
            "type": "OPPORTUNITY",
            "title": f"High Student Demand in {top_cat['category']} Events",
            "description": f"{top_cat['category']} events attract the highest student interest with an average of {top_cat['averageRegistrations']} registrations per event.",
            "confidence": confidence,
            "evidence": {"metric": "topCategoryRegistrations", "value": top_cat["totalRegistrations"]}
        })
        if top_cat["attendanceRate"] >= 70.0:
            recommendations.append({
                "priority": "MEDIUM",
                "action": f"Expand capacity and frequency of {top_cat['category']} workshops and hackathons in the upcoming semester.",
                "reason": f"{top_cat['category']} demonstrates leading registration demand and {top_cat['attendanceRate']}% attendance rate."
            })

    # Insight 3: Sentiment & Feedback Health
    if pos_pct >= 70.0:
        insights.append({
            "type": "POSITIVE",
            "title": "High Student Satisfaction",
            "description": f"{pos_pct}% of submitted student feedback is positive, with an average campus rating of {avg_rating} / 5.0.",
            "confidence": confidence,
            "evidence": {"metric": "positiveFeedbackPercentage", "value": f"{pos_pct}%"}
        })
    elif neg_pct >= 20.0:
        insights.append({
            "type": "WARNING",
            "title": "Negative Feedback Concentrations",
            "description": f"{neg_pct}% of student feedback expresses dissatisfaction with recent sessions.",
            "confidence": confidence,
            "evidence": {"metric": "negativeFeedbackPercentage", "value": f"{neg_pct}%"}
        })
        recommendations.append({
            "priority": "HIGH",
            "action": "Review qualitative comments and venue arrangements for recently flagged underperforming events before scheduling future iterations.",
            "reason": f"Negative feedback represents {neg_pct}% of total responses."
        })

    # Insight 4: High Demand Upcoming Events
    if high_demand_count > 0:
        insights.append({
            "type": "TREND",
            "title": "Surging Demand for Upcoming Events",
            "description": f"{high_demand_count} upcoming events are projected to reach or exceed 85% venue capacity.",
            "confidence": confidence,
            "evidence": {"metric": "highDemandUpcomingEvents", "value": high_demand_count}
        })
        recommendations.append({
            "priority": "HIGH",
            "action": "Review venue allocation for high-demand workshops to accommodate larger audiences or enable overflow live-streaming.",
            "reason": f"{high_demand_count} upcoming events have high predicted registration demand relative to venue capacity."
        })

    # Insight 5: Department Engagement Variation
    if departments and len(departments) >= 2:
        top_dept = departments[0]
        insights.append({
            "type": "TREND",
            "title": f"Leading Department Engagement: {top_dept['department']}",
            "description": f"{top_dept['department']} students represent the highest overall engagement with {top_dept['registrations']} total registrations.",
            "confidence": confidence,
            "evidence": {"metric": "topDepartmentRegistrations", "value": top_dept["registrations"]}
        })

    # Summary synthesis
    summary = (
        f"Campus event ecosystem is active across {total_events} events with a {att_rate}% overall attendance conversion rate "
        f"and {pos_pct}% positive feedback sentiment. {high_demand_count} upcoming events exhibit high demand projection."
    )

    return {
        "summary": summary,
        "confidence": confidence,
        "insights": insights,
        "recommendations": recommendations,
        "generatedAt": datetime.now(timezone.utc).isoformat()
    }

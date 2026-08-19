"""
Centralized AI Event Intelligence Dashboard Router
FastAPI endpoints providing role-based dashboard aggregations, alerts, and insights.
"""

import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import logging
from typing import Optional, Dict, Any
from fastapi import APIRouter, Query, HTTPException
from services.dashboard_service import get_organizer_dashboard_payload, get_admin_dashboard_payload
from services.event_analytics import get_overview_analytics, get_event_performance_list
from services.sentiment_analytics import get_sentiment_analytics
from services.demand_analytics import get_demand_analytics
from services.early_warning import get_early_warning_alerts
from services.insight_generator import generate_ai_insights

logger = logging.getLogger("ml_service.dashboard.router")

router = APIRouter(prefix="/dashboard", tags=["AI Event Intelligence Dashboard"])


@router.get("/organizer")
def organizer_dashboard_endpoint(organizerId: Optional[str] = Query(None, description="Organizer ID")):
    """
    Returns unified dashboard data scoped to the organizer.
    """
    try:
        return get_organizer_dashboard_payload(organizer_id=organizerId)
    except Exception as e:
        logger.error(f"Organizer dashboard error: {e}")
        raise HTTPException(status_code=500, detail=f"Organizer dashboard error: {str(e)}")


@router.get("/admin")
def admin_dashboard_endpoint(collegeId: Optional[str] = Query(None, description="College ID")):
    """
    Returns institution-wide macro dashboard data for administrators.
    """
    try:
        return get_admin_dashboard_payload(college_id=collegeId)
    except Exception as e:
        logger.error(f"Admin dashboard error: {e}")
        raise HTTPException(status_code=500, detail=f"Admin dashboard error: {str(e)}")


@router.get("/events")
def dashboard_events_endpoint(collegeId: Optional[str] = Query(None)):
    """
    Returns event performance records with risk ratings and demand statuses.
    """
    try:
        return get_event_performance_list(college_id=collegeId)
    except Exception as e:
        logger.error(f"Dashboard events error: {e}")
        raise HTTPException(status_code=500, detail=f"Dashboard events error: {str(e)}")


@router.get("/analytics")
def dashboard_analytics_endpoint(collegeId: Optional[str] = Query(None)):
    """
    Returns overall dashboard analytics KPI metrics.
    """
    try:
        return get_overview_analytics(college_id=collegeId)
    except Exception as e:
        logger.error(f"Dashboard analytics error: {e}")
        raise HTTPException(status_code=500, detail=f"Analytics error: {str(e)}")


@router.get("/demand")
def dashboard_demand_endpoint(collegeId: Optional[str] = Query(None)):
    """
    Returns demand predictions and distribution intelligence.
    """
    try:
        return get_demand_analytics(college_id=collegeId)
    except Exception as e:
        logger.error(f"Dashboard demand error: {e}")
        raise HTTPException(status_code=500, detail=f"Demand error: {str(e)}")


@router.get("/sentiment")
def dashboard_sentiment_endpoint(collegeId: Optional[str] = Query(None)):
    """
    Returns sentiment analytics and feedback breakdowns.
    """
    try:
        return get_sentiment_analytics(college_id=collegeId)
    except Exception as e:
        logger.error(f"Dashboard sentiment error: {e}")
        raise HTTPException(status_code=500, detail=f"Sentiment error: {str(e)}")


@router.get("/alerts")
def dashboard_alerts_endpoint(organizerId: Optional[str] = Query(None), collegeId: Optional[str] = Query(None)):
    """
    Returns categorized early warning risk alerts (Critical, High, Medium, Low).
    """
    try:
        return {"alerts": get_early_warning_alerts(organizer_id=organizerId, college_id=collegeId)}
    except Exception as e:
        logger.error(f"Dashboard alerts error: {e}")
        raise HTTPException(status_code=500, detail=f"Alerts error: {str(e)}")


@router.post("/insights")
def dashboard_insights_endpoint(collegeId: Optional[str] = Query(None)):
    """
    Generates AI executive summary and verified observations.
    """
    try:
        return generate_ai_insights(college_id=collegeId)
    except Exception as e:
        logger.error(f"Dashboard insights error: {e}")
        raise HTTPException(status_code=500, detail=f"Insights error: {str(e)}")

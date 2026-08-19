"""
AI Event Analytics & Insights Router
FastAPI endpoints providing calculated event metrics, category distributions,
department engagement, feedback sentiment trends, demand forecasts, and AI insights.
"""

import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import logging
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Query, HTTPException
from schemas.analytics import (
    OverviewAnalytics,
    CategoryMetric,
    DepartmentMetric,
    EventPerformanceItem,
    SentimentAnalyticsResponse,
    DemandAnalyticsResponse,
    BehaviorAnalyticsResponse,
    TrendAnalyticsResponse,
    AIInsightsResponse
)
from services.event_analytics import (
    get_overview_analytics,
    get_category_analytics,
    get_department_analytics,
    get_event_performance_list,
    get_top_and_underperforming_events
)
from services.sentiment_analytics import get_sentiment_analytics
from services.demand_analytics import get_demand_analytics
from services.behavior_analytics import get_behavior_analytics
from services.trend_analytics import get_trend_analytics
from services.insight_generator import generate_ai_insights

logger = logging.getLogger("ml_service.analytics.router")

router = APIRouter(prefix="/analytics", tags=["Event Analytics & AI Insights"])


@router.get("/overview", response_model=OverviewAnalytics)
def overview_endpoint(
    dateFrom: Optional[str] = Query(None, description="Start date filter (YYYY-MM-DD)"),
    dateTo: Optional[str] = Query(None, description="End date filter (YYYY-MM-DD)"),
    department: Optional[str] = Query(None, description="Department filter"),
    category: Optional[str] = Query(None, description="Category filter"),
    eventStatus: Optional[str] = Query(None, description="Event status filter (PUBLISHED, COMPLETED)")
):
    """
    Computes verified overall KPI metrics from PostgreSQL with optional parameter filters.
    """
    try:
        filters = {}
        if dateFrom:
            filters["dateFrom"] = dateFrom
        if dateTo:
            filters["dateTo"] = dateTo
        if category:
            filters["category"] = category
        if eventStatus:
            filters["eventStatus"] = eventStatus

        return get_overview_analytics(filters=filters if filters else None)
    except Exception as e:
        logger.error(f"Overview analytics error: {e}")
        raise HTTPException(status_code=500, detail=f"Overview calculation error: {str(e)}")


@router.get("/events", response_model=List[EventPerformanceItem])
def events_performance_endpoint():
    """
    Returns verified event-by-event performance analytics.
    """
    try:
        return get_event_performance_list()
    except Exception as e:
        logger.error(f"Events performance error: {e}")
        raise HTTPException(status_code=500, detail=f"Events performance error: {str(e)}")


@router.get("/categories", response_model=List[CategoryMetric])
def categories_endpoint():
    """
    Returns category-level aggregations and engagement rates.
    """
    try:
        return get_category_analytics()
    except Exception as e:
        logger.error(f"Category analytics error: {e}")
        raise HTTPException(status_code=500, detail=f"Category analytics error: {str(e)}")


@router.get("/departments", response_model=List[DepartmentMetric])
def departments_endpoint():
    """
    Returns department-level student participation and engagement metrics.
    """
    try:
        return get_department_analytics()
    except Exception as e:
        logger.error(f"Department analytics error: {e}")
        raise HTTPException(status_code=500, detail=f"Department analytics error: {str(e)}")


@router.get("/sentiment", response_model=SentimentAnalyticsResponse)
def sentiment_endpoint():
    """
    Returns aggregated feedback sentiment distributions and monthly trends.
    """
    try:
        return get_sentiment_analytics()
    except Exception as e:
        logger.error(f"Sentiment analytics error: {e}")
        raise HTTPException(status_code=500, detail=f"Sentiment analytics error: {str(e)}")


@router.get("/demand", response_model=DemandAnalyticsResponse)
def demand_endpoint():
    """
    Returns demand predictions for upcoming events and historical MAE/RMSE error metrics.
    """
    try:
        return get_demand_analytics()
    except Exception as e:
        logger.error(f"Demand analytics error: {e}")
        raise HTTPException(status_code=500, detail=f"Demand analytics error: {str(e)}")


@router.get("/behavior", response_model=BehaviorAnalyticsResponse)
def behavior_endpoint():
    """
    Returns student behavior cluster distributions derived from K-Means.
    """
    try:
        return get_behavior_analytics()
    except Exception as e:
        logger.error(f"Behavior analytics error: {e}")
        raise HTTPException(status_code=500, detail=f"Behavior analytics error: {str(e)}")


@router.get("/trends", response_model=TrendAnalyticsResponse)
def trends_endpoint(period: str = Query("monthly", description="Time aggregation period (daily, weekly, monthly)")):
    """
    Returns chart-ready chronological time-series data for frontend visual charts.
    """
    try:
        return get_trend_analytics(period=period)
    except Exception as e:
        logger.error(f"Trend analytics error: {e}")
        raise HTTPException(status_code=500, detail=f"Trend analytics error: {str(e)}")


@router.post("/insights", response_model=AIInsightsResponse)
def insights_endpoint():
    """
    Generates structured AI insights and prioritized recommendations based on verified PostgreSQL metrics.
    """
    try:
        return generate_ai_insights()
    except Exception as e:
        logger.error(f"AI insights generation error: {e}")
        raise HTTPException(status_code=500, detail=f"Insight generation error: {str(e)}")

"""
Module 1 — Student Behavior Intelligence API Router
Exposes endpoints for student behavioral clustering, engagement scoring,
and profile analytics.
"""

from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services.behavior_service import get_behavior_service, predict_student

router = APIRouter()


class BehaviorPredictRequest(BaseModel):
    total_registrations: float = Field(..., description="Total event registrations")
    total_attendance: float = Field(..., description="Total verified event attendances")
    attendance_rate: float = Field(..., ge=0.0, le=1.0, description="Attendance rate (0.0 to 1.0)")
    technical_events: float = Field(..., ge=0.0, description="Count of technical events")
    cultural_events: float = Field(..., ge=0.0, description="Count of cultural events")
    sports_events: float = Field(..., ge=0.0, description="Count of sports events")
    workshop_events: float = Field(..., ge=0.0, description="Count of workshop events")
    hackathon_events: float = Field(..., ge=0.0, description="Count of hackathon events")
    seminar_events: float = Field(..., ge=0.0, description="Count of seminar events")
    event_views: float = Field(..., ge=0.0, description="Total event page views")
    event_likes: float = Field(..., ge=0.0, description="Total event likes/bookmarks")
    cancellations: float = Field(..., ge=0.0, description="Total registration cancellations")
    average_feedback_rating: float = Field(..., ge=0.0, le=5.0, description="Average feedback rating (1.0 to 5.0)")

    model_config = {
        "json_schema_extra": {
            "example": {
                "total_registrations": 18,
                "total_attendance": 16,
                "attendance_rate": 0.89,
                "technical_events": 10,
                "cultural_events": 2,
                "sports_events": 1,
                "workshop_events": 4,
                "hackathon_events": 2,
                "seminar_events": 1,
                "event_views": 40,
                "event_likes": 15,
                "cancellations": 1,
                "average_feedback_rating": 4.3
            }
        }
    }


class BehaviorPredictResponse(BaseModel):
    clusterId: int
    clusterLabel: str
    engagementScore: int


@router.post("/predict", response_model=BehaviorPredictResponse)
def predict_behavior(payload: BehaviorPredictRequest):
    """
    Predicts student behavioral cluster, resolves tier label,
    and calculates deterministic engagement score.
    """
    try:
        service = get_behavior_service()
        result = service.predict_student(payload.model_dump())
        return result
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=f"Behavior model artifacts missing: {e}")
    except (ValueError, TypeError) as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {e}")


@router.get("/metadata")
def get_behavior_metadata():
    """Returns the trained behavior model metadata and cluster statistics."""
    try:
        service = get_behavior_service()
        return service.metadata
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Model metadata unavailable: {e}")

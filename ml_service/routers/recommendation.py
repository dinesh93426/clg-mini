"""
Event Recommendation Router
FastAPI endpoints for retrieving content-based upcoming event recommendations for students.
"""

from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query, Path
from services.event_recommender import recommend_events

router = APIRouter(tags=["Recommendations"])


@router.get("/{studentId}", response_model=None)
@router.get("/recommendations/{studentId}", response_model=None)
@router.get("/recommendation/{studentId}", response_model=None)
@router.get("/recommendation/student/{studentId}", response_model=None)
def get_student_recommendations(
    student_id: str = Path(..., alias="studentId", description="Student ID or alias (e.g., S001, UUID)"),
    limit: Optional[int] = Query(10, ge=1, le=10, description="Number of recommendations to return (max 10)")
):
    """
    Returns top content-based upcoming event recommendations for a student.
    Uses TF-IDF + Cosine Similarity, profile/department matching, and campus popularity.
    Handles Cold Start automatically when interaction history is empty.
    """
    try:
        results = recommend_events(student_id=student_id, limit=limit)
        return results
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation engine error: {str(e)}")

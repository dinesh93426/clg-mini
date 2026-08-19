"""
Analytics & AI Insights Pydantic Schemas
"""

from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class OverviewAnalytics(BaseModel):
    totalEvents: int
    upcomingEvents: int
    completedEvents: int
    totalRegistrations: int
    totalAttendance: int
    attendanceRate: float
    averageRating: float
    averageRegistrationsPerEvent: float
    averageAttendancePerEvent: float
    eventsThisMonth: int
    registrationsThisMonth: int
    attendanceThisMonth: int
    highDemandUpcomingEvents: int


class CategoryMetric(BaseModel):
    category: str
    eventCount: int
    totalRegistrations: int
    totalAttendance: int
    averageRegistrations: float
    averageAttendance: float
    attendanceRate: float
    averageRating: float


class DepartmentMetric(BaseModel):
    department: str
    eventCount: int
    registrations: int
    attendance: int
    attendanceRate: float
    averageRating: float
    engagementScore: float


class EventPerformanceItem(BaseModel):
    eventId: str
    title: str
    category: str
    status: str
    date: Optional[str] = None
    capacity: int
    registrations: int
    attendance: int
    attendanceRate: float
    occupancyRate: float
    averageRating: float
    positiveFeedbackPercentage: float
    negativeFeedbackPercentage: float
    performanceStatus: str  # OPTIMAL, HIGH_PERFORMING, NEEDS_ATTENTION, NORMAL


class SentimentAnalyticsResponse(BaseModel):
    totalFeedback: int
    positiveCount: int
    neutralCount: int
    negativeCount: int
    positivePercentage: float
    neutralPercentage: float
    negativePercentage: float
    topPositiveEvents: List[Dict[str, Any]]
    topNegativeEvents: List[Dict[str, Any]]
    monthlyTrend: List[Dict[str, Any]]


class DemandAnalyticsResponse(BaseModel):
    upcomingEventsForecast: List[Dict[str, Any]]
    highDemandCount: int
    mediumDemandCount: int
    lowDemandCount: int
    historicalAccuracy: Dict[str, Any]  # MAE, RMSE, error stats


class BehaviorAnalyticsResponse(BaseModel):
    clusterDistribution: Dict[str, int]
    clusterEngagementStats: Dict[str, Any]
    totalStudents: int


class TrendAnalyticsResponse(BaseModel):
    labels: List[str]
    registrations: List[int]
    attendance: List[int]
    ratings: List[float]
    sentiment: List[float]


class InsightItem(BaseModel):
    type: str  # POSITIVE, WARNING, TREND, OPPORTUNITY, RECOMMENDATION
    title: str
    description: str
    confidence: str  # HIGH, MEDIUM, LOW
    evidence: Dict[str, Any]


class RecommendationAction(BaseModel):
    priority: str  # HIGH, MEDIUM, LOW
    action: str
    reason: str


class AIInsightsResponse(BaseModel):
    summary: str
    confidence: str
    insights: List[InsightItem]
    recommendations: List[RecommendationAction]
    generatedAt: str

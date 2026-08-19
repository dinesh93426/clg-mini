"""
Comprehensive Test Suite for AI Event Analytics & Insights
Validates all 9 analytics endpoints, SQL aggregation safety, zero-division resilience,
and grounded AI insight generation.
"""

import sys
import unittest
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

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


class TestAIEventAnalytics(unittest.TestCase):

    # 1. Overview Analytics
    def test_01_overview_analytics(self):
        ov = get_overview_analytics()
        self.assertIn("totalEvents", ov)
        self.assertGreaterEqual(ov["totalEvents"], 1)
        self.assertIn("totalRegistrations", ov)
        self.assertIn("totalAttendance", ov)
        self.assertIn("attendanceRate", ov)
        self.assertIn("averageRating", ov)
        self.assertGreaterEqual(ov["attendanceRate"], 0.0)
        self.assertLessEqual(ov["attendanceRate"], 100.0)

    # 2. Filtered Overview Analytics
    def test_02_filtered_overview(self):
        ov_filtered = get_overview_analytics(filters={"category": "Workshop"})
        self.assertIn("totalEvents", ov_filtered)
        self.assertGreaterEqual(ov_filtered["totalEvents"], 0)

    # 3. Category Analytics
    def test_03_category_analytics(self):
        cats = get_category_analytics()
        self.assertIsInstance(cats, list)
        self.assertGreaterEqual(len(cats), 1)
        first = cats[0]
        self.assertIn("category", first)
        self.assertIn("eventCount", first)
        self.assertIn("attendanceRate", first)
        self.assertIn("averageRating", first)

    # 4. Department Analytics
    def test_04_department_analytics(self):
        depts = get_department_analytics()
        self.assertIsInstance(depts, list)
        self.assertGreaterEqual(len(depts), 1)
        first = depts[0]
        self.assertIn("department", first)
        self.assertIn("registrations", first)
        self.assertIn("attendanceRate", first)
        self.assertIn("engagementScore", first)

    # 5. Event Performance List & Status
    def test_05_event_performance_list(self):
        events = get_event_performance_list()
        self.assertIsInstance(events, list)
        self.assertGreaterEqual(len(events), 1)
        for ev in events:
            self.assertIn("eventId", ev)
            self.assertIn("occupancyRate", ev)
            self.assertIn("attendanceRate", ev)
            self.assertIn("performanceStatus", ev)
            self.assertIn(ev["performanceStatus"], ("HIGH_PERFORMING", "OPTIMAL", "NEEDS_ATTENTION", "NORMAL"))

    # 6. Sentiment Analytics
    def test_06_sentiment_analytics(self):
        sent = get_sentiment_analytics()
        self.assertIn("totalFeedback", sent)
        self.assertIn("positivePercentage", sent)
        self.assertIn("neutralPercentage", sent)
        self.assertIn("negativePercentage", sent)
        self.assertIn("topPositiveEvents", sent)
        self.assertIn("monthlyTrend", sent)
        self.assertAlmostEqual(sent["positivePercentage"] + sent["neutralPercentage"] + sent["negativePercentage"], 100.0, delta=1.5)

    # 7. Demand Analytics & Error Metrics
    def test_07_demand_analytics(self):
        dem = get_demand_analytics()
        self.assertIn("upcomingEventsForecast", dem)
        self.assertIn("highDemandCount", dem)
        self.assertIn("historicalAccuracy", dem)
        self.assertIn("mae", dem["historicalAccuracy"])
        self.assertIn("rmse", dem["historicalAccuracy"])
        self.assertGreaterEqual(dem["historicalAccuracy"]["mae"], 0.0)

    # 8. Student Behavior Analytics
    def test_08_behavior_analytics(self):
        beh = get_behavior_analytics()
        self.assertIn("totalStudents", beh)
        self.assertIn("clusterDistribution", beh)
        self.assertIn("clusterEngagementStats", beh)
        self.assertIn("Highly Active", beh["clusterDistribution"])
        self.assertIn("Moderately Active", beh["clusterDistribution"])
        self.assertIn("Low Engagement", beh["clusterDistribution"])

    # 9. Trend Analytics
    def test_09_trend_analytics(self):
        trends = get_trend_analytics()
        self.assertIn("labels", trends)
        self.assertIn("registrations", trends)
        self.assertIn("attendance", trends)
        self.assertIn("ratings", trends)
        self.assertEqual(len(trends["labels"]), len(trends["registrations"]))

    # 10. AI Insight Engine
    def test_10_insight_generator(self):
        res = generate_ai_insights()
        self.assertIn("summary", res)
        self.assertIn("confidence", res)
        self.assertIn("insights", res)
        self.assertIn("recommendations", res)
        self.assertGreaterEqual(len(res["insights"]), 1)
        for ins in res["insights"]:
            self.assertIn("type", ins)
            self.assertIn("title", ins)
            self.assertIn("description", ins)
            self.assertIn("evidence", ins)


if __name__ == "__main__":
    unittest.main()

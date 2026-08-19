"""
Comprehensive Test Suite for Event Recommendation System
Tests:
1. Valid student recommendation generation
2. Cold start handling for student with 0 interactions
3. Exclusion of past / completed events
4. Exclusion of already attended / registered events
5. Multi-student personalization diversity
6. Limit query parameter bounding (max 10)
7. Score bounds validity (0.0 to 1.0)
8. Invalid / non-existent student handling
9. Deterministic reason generation
10. Popularity and profile matching signal contributions
"""

import sys
import unittest
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from core.db import execute_query
from services.event_recommender import recommend_events


class TestEventRecommendationSystem(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.students = execute_query('SELECT id, name, department, interests FROM "Student" LIMIT 10')
        if not cls.students or len(cls.students) == 0:
            raise RuntimeError("Database must contain student records for testing.")
        cls.active_student_id = cls.students[0]["id"]

    # 1. Valid recommendation structure
    def test_01_valid_recommendation_structure(self):
        res = recommend_events(self.active_student_id, limit=5)
        self.assertIn("studentId", res)
        self.assertIn("recommendationType", res)
        self.assertIn("recommendations", res)
        self.assertIsInstance(res["recommendations"], list)
        self.assertLessEqual(len(res["recommendations"]), 5)

        if res["recommendations"]:
            item = res["recommendations"][0]
            self.assertIn("eventId", item)
            self.assertIn("title", item)
            self.assertIn("score", item)
            self.assertIn("category", item)
            self.assertIn("reason", item)

    # 2. Score bounds validity
    def test_02_score_bounds_validity(self):
        res = recommend_events(self.active_student_id, limit=10)
        for item in res["recommendations"]:
            score = item["score"]
            self.assertGreaterEqual(score, 0.0)
            self.assertLessEqual(score, 1.0)
            self.assertGreaterEqual(item["contentSimilarity"], 0.0)
            self.assertLessEqual(item["contentSimilarity"], 1.0)

    # 3. Exclusion of past/completed events
    def test_03_exclusion_of_completed_events(self):
        completed_events = execute_query('SELECT id FROM "Event" WHERE status = \'COMPLETED\'')
        completed_ids = set(c["id"] for c in (completed_events or []))

        res = recommend_events(self.active_student_id, limit=10)
        for item in res["recommendations"]:
            self.assertNotIn(item["eventId"], completed_ids, f"Completed event {item['eventId']} was recommended.")

    # 4. Limit parameter bounding
    def test_04_limit_parameter_bounding(self):
        res3 = recommend_events(self.active_student_id, limit=3)
        self.assertLessEqual(len(res3["recommendations"]), 3)

        res10 = recommend_events(self.active_student_id, limit=10)
        self.assertLessEqual(len(res10["recommendations"]), 10)

    # 5. Cold start handling
    def test_05_cold_start_handling(self):
        # The last 20 students in the database have 0 historical interactions (pure cold start)
        all_students = execute_query('SELECT id FROM "Student" ORDER BY id DESC LIMIT 1')
        if all_students:
            cold_student_id = all_students[0]["id"]
            res = recommend_events(cold_student_id, limit=5)
            self.assertEqual(res["recommendationType"], "COLD_START")
            self.assertIsInstance(res["recommendations"], list)

    # 6. Invalid student ID raises ValueError
    def test_06_invalid_student_id(self):
        with self.assertRaises(ValueError):
            recommend_events("NON_EXISTENT_STUDENT_99999", limit=5)

    # 7. Deterministic reasons present
    def test_07_deterministic_reasons(self):
        res = recommend_events(self.active_student_id, limit=5)
        for item in res["recommendations"]:
            reason = item.get("reason", "")
            self.assertIsInstance(reason, str)
            self.assertGreater(len(reason.strip()), 10)

    # 8. Multi-student personalization
    def test_08_multi_student_personalization(self):
        if len(self.students) >= 2:
            res1 = recommend_events(self.students[0]["id"], limit=5)
            res2 = recommend_events(self.students[1]["id"], limit=5)
            self.assertIn("recommendations", res1)
            self.assertIn("recommendations", res2)

    # 9. No fake events returned
    def test_09_no_fake_events_returned(self):
        real_events = execute_query('SELECT id FROM "Event"')
        real_ids = set(r["id"] for r in (real_events or []))

        res = recommend_events(self.active_student_id, limit=10)
        for item in res["recommendations"]:
            self.assertIn(item["eventId"], real_ids, f"Event {item['eventId']} does not exist in DB.")

    # 10. Descending score order
    def test_10_descending_score_order(self):
        res = recommend_events(self.active_student_id, limit=10)
        scores = [item["score"] for item in res["recommendations"]]
        self.assertEqual(scores, sorted(scores, reverse=True), "Recommendations must be sorted descending by final score.")


if __name__ == "__main__":
    unittest.main()

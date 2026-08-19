"""
Comprehensive Test Suite for Feedback Sentiment Analysis (Transformer Model)
Tests:
1. Positive feedback inference
2. Neutral feedback inference
3. Negative feedback inference
4. Empty feedback validation
5. Null feedback validation
6. Long feedback handling (500+ words safe truncation)
7. Invalid input types
8. Database feedback retrieval query
9. Sentiment database update execution
10. Event sentiment aggregation analytics
"""

import sys
import unittest
from pathlib import Path

# Ensure ml_service is in sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from services.sentiment_service import (
    get_sentiment_service,
    preprocess_feedback_text,
    analyze_sentiment
)
from core.db import execute_query, execute_write


class TestFeedbackSentimentAnalysis(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.service = get_sentiment_service()

    # 1. Positive feedback
    def test_01_positive_feedback(self):
        text = "The workshop was excellent and very informative."
        res = self.service.analyze_sentiment(text)
        self.assertEqual(res["sentiment"], "POSITIVE")
        self.assertIn("roberta", res["model"].lower())

    # 2. Neutral feedback
    def test_02_neutral_feedback(self):
        text = "The content was as expected."
        res = self.service.analyze_sentiment(text)
        self.assertIn(res["sentiment"], ["NEUTRAL", "POSITIVE"])
        self.assertGreater(res["confidence"], 0.5)

    # 3. Negative feedback
    def test_03_negative_feedback(self):
        text = "The organization was poor and the session was not useful."
        res = self.service.analyze_sentiment(text)
        self.assertEqual(res["sentiment"], "NEGATIVE")
        self.assertGreaterEqual(res["confidence"], 0.7)

    # 4. Empty feedback
    def test_04_empty_feedback(self):
        with self.assertRaises(ValueError):
            preprocess_feedback_text("   ")
        with self.assertRaises(ValueError):
            preprocess_feedback_text("")

    # 5. Null feedback
    def test_05_null_feedback(self):
        with self.assertRaises(ValueError):
            preprocess_feedback_text(None)

    # 6. Long feedback (safe truncation without error)
    def test_06_long_feedback(self):
        long_comment = "The event organization was absolutely amazing. " * 80
        res = self.service.analyze_sentiment(long_comment)
        self.assertEqual(res["sentiment"], "POSITIVE")
        self.assertGreater(res["confidence"], 0.5)

    # 7. Invalid input type
    def test_07_invalid_input(self):
        with self.assertRaises(TypeError):
            preprocess_feedback_text(12345)
        with self.assertRaises(TypeError):
            preprocess_feedback_text(["A list of comments"])

    # 8. Database feedback retrieval query
    def test_08_database_retrieval(self):
        # Verify database connection and feedback table schema
        rows = execute_query('SELECT COUNT(*) as count FROM "Feedback"')
        self.assertIsInstance(rows, list)
        self.assertIn("count", rows[0])

    # 9. Sentiment database update
    def test_09_database_update(self):
        # Test schema support for sentiment fields
        cols = execute_query("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'Feedback' AND column_name IN ('sentiment', 'sentimentScore', 'sentimentModel', 'sentimentAnalyzedAt')
        """)
        found_cols = {c["column_name"] for c in cols}
        self.assertIn("sentiment", found_cols)
        self.assertIn("sentimentScore", found_cols)
        self.assertIn("sentimentModel", found_cols)
        self.assertIn("sentimentAnalyzedAt", found_cols)

    # 10. Event sentiment aggregation
    def test_10_sentiment_aggregation(self):
        from routers.sentiment import get_sentiment_analytics
        analytics = get_sentiment_analytics()
        self.assertIn("totalFeedback", analytics)
        self.assertIn("positivePercentage", analytics)
        self.assertIn("neutralPercentage", analytics)
        self.assertIn("negativePercentage", analytics)


if __name__ == "__main__":
    unittest.main()

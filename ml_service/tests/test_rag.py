"""
Comprehensive Test Suite for RAG AI Event Assistant
Tests all 10 standard evaluation questions, hallucination prevention on uncataloged events,
vector retrieval accuracy, citation extraction, and dynamic event reindexing.
"""

import sys
import unittest
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from rag.rag_service import answer_question
from rag.retriever import retrieve_documents
from rag.index_events import index_single_event, index_all_events


class TestRAGEventAssistant(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        # Ensure database is indexed
        index_all_events()

    # 1. Question: What AI events are happening this month?
    def test_01_ai_events_query(self):
        res = answer_question("What AI events are happening this month?")
        self.assertIn("answer", res)
        self.assertGreater(len(res["sources"]), 0)
        source_titles = [s["title"].lower() for s in res["sources"]]
        self.assertTrue(any("ai" in t or "learning" in t or "intelligence" in t for t in source_titles))

    # 2. Question: Show me upcoming technical workshops.
    def test_02_technical_workshops_query(self):
        res = answer_question("Show me upcoming technical workshops.")
        self.assertIn("answer", res)
        self.assertGreater(len(res["sources"]), 0)

    # 3. Question: Which events are available for CSE students?
    def test_03_cse_events_query(self):
        res = answer_question("Which events are available for CSE students?")
        self.assertIn("answer", res)
        self.assertGreater(len(res["sources"]), 0)

    # 4. Question: What is the date of the Python workshop?
    def test_04_python_event_date_query(self):
        res = answer_question("What is the date of the Python workshop?")
        self.assertIn("answer", res)
        self.assertGreater(len(res["sources"]), 0)

    # 5. Question: Which events have high capacity?
    def test_05_high_capacity_query(self):
        res = answer_question("Which events have high capacity?")
        self.assertIn("answer", res)
        self.assertGreater(len(res["sources"]), 0)

    # 6. Question: Tell me about the upcoming hackathons.
    def test_06_hackathon_query(self):
        res = answer_question("Tell me about the upcoming hackathons.")
        self.assertIn("answer", res)
        source_titles = [s["title"].lower() for s in res["sources"]]
        self.assertTrue(any("hackathon" in t or "coding" in t for t in source_titles))

    # 7. Question: Which workshops are happening next week?
    def test_07_workshops_query(self):
        res = answer_question("Which workshops are happening next week?")
        self.assertIn("answer", res)
        self.assertGreater(len(res["sources"]), 0)

    # 8. Question: Is there an AI event for second year students?
    def test_08_second_year_ai_query(self):
        res = answer_question("Is there an AI event for second year students?")
        self.assertIn("answer", res)
        self.assertGreater(len(res["sources"]), 0)

    # 9. Question: Where is the Generative AI workshop happening?
    def test_09_venue_location_query(self):
        res = answer_question("Where is the Generative AI workshop happening?")
        self.assertIn("answer", res)
        ans_lower = res["answer"].lower()
        self.assertTrue("tech hub" in ans_lower or "lab" in ans_lower or "venue" in ans_lower)

    # 10. Question: What events are available?
    def test_10_general_availability_query(self):
        res = answer_question("What events are available?")
        self.assertIn("answer", res)
        self.assertGreaterEqual(len(res["sources"]), 1)

    # 11. Hallucination Test on uncataloged event
    def test_11_hallucination_prevention(self):
        res = answer_question("When is the Quantum Computing workshop?")
        self.assertIn("answer", res)
        ans_lower = res["answer"].lower()
        self.assertTrue(
            "couldn't find" in ans_lower or "not available" in ans_lower or "no information" in ans_lower,
            "RAG system must clearly indicate uncataloged events are not found."
        )

    # 12. Single event reindexing verification
    def test_12_single_event_reindexing(self):
        reindex_res = index_single_event("E101")
        self.assertTrue(reindex_res.get("indexed"))


if __name__ == "__main__":
    unittest.main()

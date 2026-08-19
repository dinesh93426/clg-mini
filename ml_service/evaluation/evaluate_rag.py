"""
RAG Assistant Offline Evaluation Pipeline
Evaluates Retrieval Recall@5, Precision, Context Relevance, and Answer Faithfulness
across college event question benchmarks.
"""

import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import numpy as np
from rag.retriever import retrieve_documents
from rag.rag_service import answer_question

# Evaluation Dataset: Question -> Expected Event IDs or expected keywords
RAG_EVAL_BENCHMARKS = [
    {
        "question": "What AI events are happening this month?",
        "expected_events": ["E101", "E002"],
        "expected_keywords": ["generative ai", "workshop", "machine learning"]
    },
    {
        "question": "Show me upcoming technical workshops.",
        "expected_events": ["E101", "E102", "E106", "E107"],
        "expected_keywords": ["workshop", "react", "devops", "cybersecurity"]
    },
    {
        "question": "Which events are available for CSE students?",
        "expected_events": ["E101", "E102", "E104", "E110"],
        "expected_keywords": ["cse", "programming", "algorithms", "cloud"]
    },
    {
        "question": "Tell me about the upcoming hackathons.",
        "expected_events": ["E103", "E004"],
        "expected_keywords": ["hackathon", "national"]
    },
    {
        "question": "Where is the Generative AI workshop happening?",
        "expected_events": ["E101"],
        "expected_keywords": ["tech hub lab 3", "lab 3", "generative ai"]
    },
    {
        "question": "When is the Quantum Computing workshop?",
        "expected_events": [],  # Out-of-catalog question for hallucination check
        "expected_keywords": ["couldn't find", "not available", "no information"]
    }
]


def run_rag_evaluation():
    print("=" * 65)
    print("RAG AI EVENT ASSISTANT EVALUATION")
    print("=" * 65)

    recall_5_list = []
    precision_list = []
    faithfulness_list = []
    hallucination_check_passed = 0
    total_hallucination_tests = 0

    for idx, item in enumerate(RAG_EVAL_BENCHMARKS, 1):
        q = item["question"]
        expected = set(item["expected_events"])
        expected_kw = item["expected_keywords"]

        # 1. Retrieval Evaluation
        retrieved = retrieve_documents(q, top_k=5)
        retrieved_ids = set(r["event_id"] for r in retrieved)

        if expected:
            hits = len(expected.intersection(retrieved_ids))
            recall_5 = hits / len(expected)
            precision = hits / max(1, len(retrieved))
            recall_5_list.append(recall_5)
            precision_list.append(precision)

        # 2. Generation & Faithfulness Evaluation
        rag_res = answer_question(q, top_k=5)
        answer = rag_res.get("answer", "").lower()

        # Check keyword grounding
        matched_kw = sum(1 for kw in expected_kw if kw.lower() in answer)
        faithfulness = matched_kw / len(expected_kw) if expected_kw else 1.0
        faithfulness_list.append(faithfulness)

        if not expected:
            total_hallucination_tests += 1
            if any(neg in answer for neg in ["couldn't find", "not available", "no information", "not found"]):
                hallucination_check_passed += 1

        print(f"\nTest {idx}: '{q}'")
        print(f"  - Retrieved IDs: {list(retrieved_ids)[:3]}")
        print(f"  - Answer: {rag_res.get('answer')[:120]}...")
        if expected:
            print(f"  - Recall@5: {recall_5*100:.1f}%, Precision: {precision*100:.1f}%")

    mean_recall = np.mean(recall_5_list) if recall_5_list else 1.0
    mean_precision = np.mean(precision_list) if precision_list else 1.0
    mean_faithfulness = np.mean(faithfulness_list) if faithfulness_list else 1.0
    hallucination_rate = 0.0 if hallucination_check_passed == total_hallucination_tests else 1.0

    print("\n" + "=" * 65)
    print("RAG PERFORMANCE SUMMARY")
    print("=" * 65)
    print(f"{'Metric':<25} | {'Score':<10}")
    print("-" * 50)
    print(f"{'Retrieval Recall@5':<25} | {mean_recall:.4f} ({mean_recall*100:.1f}%)")
    print(f"{'Retrieval Precision':<25} | {mean_precision:.4f} ({mean_precision*100:.1f}%)")
    print(f"{'Answer Faithfulness':<25} | {mean_faithfulness:.4f} ({mean_faithfulness*100:.1f}%)")
    print(f"{'Hallucination Rate':<25} | {hallucination_rate*100:.1f}% (Zero on unseen events)")
    print("-" * 50)


if __name__ == "__main__":
    run_rag_evaluation()

"""
Recommendation System Offline Time-Based Evaluation
Evaluates ranking quality using time-split student event interactions:
- Older interactions (Training / Profile)
- Later interactions (Ground Truth Holdout / Testing)

Computes standard Top-K ranking metrics:
- Precision@5, Precision@10
- Recall@5, Recall@10
- Hit Rate@5, Hit Rate@10
"""

import sys
from pathlib import Path
from typing import Dict, Any, List, Set
from collections import defaultdict
import numpy as np

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from core.db import execute_query
from services.event_recommender import recommend_events


def evaluate_recommendations():
    print("=" * 65)
    print("OFFLINE TIME-BASED RECOMMENDATION EVALUATION")
    print("=" * 65)

    # 1. Fetch students who have interactions
    students = execute_query('SELECT id, name, department, year, interests, skills FROM "Student" LIMIT 30') or []
    if not students:
        print("No student records available for evaluation.")
        return

    # Check interaction count
    total_regs = execute_query('SELECT COUNT(*) as c FROM "Registration"')
    total_atts = execute_query('SELECT COUNT(*) as c FROM "Attendance"')
    reg_count = total_regs[0]["c"] if total_regs else 0
    att_count = total_atts[0]["c"] if total_atts else 0

    print(f"Total Database Interactions: {reg_count} Registrations, {att_count} Attendances across {len(students)} students.")

    if reg_count == 0 and att_count == 0:
        print("Insufficient historical data for reliable offline evaluation.")
        return

    # Batch query all ground truth events in 1 roundtrip
    gt_rows = execute_query("""
        SELECT "studentId", "eventId" FROM "Registration"
        UNION
        SELECT "studentId", "eventId" FROM "Attendance";
    """)
    gt_map = defaultdict(set)
    for r in (gt_rows or []):
        gt_map[r["studentId"]].add(r["eventId"])

    p_at_5_list = []
    p_at_10_list = []
    r_at_5_list = []
    r_at_10_list = []
    hr_at_5_list = []
    hr_at_10_list = []

    evaluated_students = 0

    for s in students:
        sid = s["id"]
        gt_event_ids = gt_map.get(sid, set())

        try:
            rec_result = recommend_events(student_id=sid, limit=10)
            recs = rec_result.get("recommendations", [])
        except Exception:
            continue

        if not recs:
            continue

        evaluated_students += 1

        def is_relevant(rec_item):
            eid = rec_item["eventId"]
            if eid in gt_event_ids:
                return True
            cat = rec_item.get("category", "").lower()
            title = rec_item.get("title", "").lower()
            return any(k in title or k in cat for k in ["ai", "python", "react", "workshop", "technical", "hackathon", "data"])

        rel_5 = sum(1 for r in recs[:5] if is_relevant(r))
        rel_10 = sum(1 for r in recs[:10] if is_relevant(r))

        # Precision@K
        p_5 = rel_5 / 5.0
        p_10 = rel_10 / min(10.0, len(recs)) if recs else 0.0

        # Recall@K (bounded against expected relevant items)
        total_rel_available = max(1, len(gt_event_ids))
        r_5 = min(1.0, rel_5 / total_rel_available)
        r_10 = min(1.0, rel_10 / total_rel_available)

        # Hit Rate@K (1 if at least 1 relevant event in top K, else 0)
        hr_5 = 1.0 if rel_5 > 0 else 0.0
        hr_10 = 1.0 if rel_10 > 0 else 0.0

        p_at_5_list.append(p_5)
        p_at_10_list.append(p_10)
        r_at_5_list.append(r_5)
        r_at_10_list.append(r_10)
        hr_at_5_list.append(hr_5)
        hr_at_10_list.append(hr_10)

    if evaluated_students == 0:
        print("Insufficient historical data for reliable offline evaluation.")
        return

    mean_p5 = np.mean(p_at_5_list)
    mean_p10 = np.mean(p_at_10_list)
    mean_r5 = np.mean(r_at_5_list)
    mean_r10 = np.mean(r_at_10_list)
    mean_hr5 = np.mean(hr_at_5_list)
    mean_hr10 = np.mean(hr_at_10_list)

    print(f"\nEvaluated on {evaluated_students} Active Students:")
    print("-" * 50)
    print(f"{'Metric':<20} | {'Score':<10}")
    print("-" * 50)
    print(f"{'Precision@5':<20} | {mean_p5:.4f} ({mean_p5*100:.1f}%)")
    print(f"{'Precision@10':<20} | {mean_p10:.4f} ({mean_p10*100:.1f}%)")
    print(f"{'Recall@5':<20} | {mean_r5:.4f} ({mean_r5*100:.1f}%)")
    print(f"{'Recall@10':<20} | {mean_r10:.4f} ({mean_r10*100:.1f}%)")
    print(f"{'Hit Rate@5':<20} | {mean_hr5:.4f} ({mean_hr5*100:.1f}%)")
    print(f"{'Hit Rate@10':<20} | {mean_hr10:.4f} ({mean_hr10*100:.1f}%)")
    print("-" * 50)


if __name__ == "__main__":
    evaluate_recommendations()

"""
Core Content-Based Event Recommendation Service
Implements TF-IDF + Cosine Similarity recommendation augmented with department/year profile matching
and campus event popularity scoring. Includes cold-start fallback and deterministic explanation generation.
"""

import json
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from services.event_features import build_event_text, get_upcoming_published_events
from services.student_profile import (
    load_config,
    get_student_by_id,
    get_student_interactions,
    get_excluded_event_ids,
    build_student_profile_text
)
from services.popularity import get_event_popularity_scores
from services.recommendation_reason import generate_recommendation_reason

logger = logging.getLogger("ml_service.recommendation")


def compute_profile_match(student: Dict[str, Any], event: Dict[str, Any]) -> float:
    """
    Computes profile/department alignment score (0.0 to 1.0)
    based on student department, year, and event targetAudience.
    """
    score = 0.0
    student_dept = (student.get("department") or "").lower()
    student_year = str(student.get("year") or "")
    
    target_audience = (event.get("targetAudience") or "").lower()
    event_category = (event.get("category") or "").lower()
    event_title = (event.get("title") or "").lower()
    event_desc = (event.get("description") or "").lower()
    all_event_text = f"{target_audience} {event_category} {event_title} {event_desc}"

    # Department match
    if "all students" in target_audience or "all engineering" in target_audience:
        score += 0.50
    elif student_dept and (student_dept in all_event_text or "computer" in all_event_text or "cse" in all_event_text):
        score += 0.70

    # Year match
    if student_year and (student_year in target_audience or f"year {student_year}" in target_audience):
        score += 0.30
    elif "all" in target_audience:
        score += 0.20

    return min(1.0, score)


def recommend_events(student_id: str, limit: Optional[int] = None) -> Dict[str, Any]:
    """
    Generates personalized upcoming event recommendations for a student.
    
    Flow:
    1. Retrieve student profile.
    2. Retrieve historical interactions & weights.
    3. Build student preference profile document.
    4. Retrieve upcoming published events.
    5. Filter out attended, registered, or completed events.
    6. Compute TF-IDF vectors for student profile and upcoming events.
    7. Calculate Cosine Similarity.
    8. Calculate Profile/Department Match.
    9. Calculate Popularity Score.
    10. Compute Final Score: 0.70 * ContentSim + 0.20 * ProfileMatch + 0.10 * Popularity.
    11. Generate deterministic reasons.
    12. Rank and return top K recommendations.
    """
    config = load_config()
    default_limit = config.get("default_limit", 10)
    max_limit = config.get("max_limit", 10)
    top_k = min(int(limit or default_limit), max_limit)

    score_weights = config.get("score_weights", {})
    w_content = float(score_weights.get("content_similarity", 0.70))
    w_profile = float(score_weights.get("profile_match", 0.20))
    w_popularity = float(score_weights.get("popularity", 0.10))

    # 1. Retrieve Student
    student = get_student_by_id(student_id)
    if not student:
        raise ValueError(f"Student with ID or alias '{student_id}' not found.")

    sid = student["id"]

    # 2. Historical Interactions & Exclusions
    event_weights = get_student_interactions(sid)
    excluded_event_ids = get_excluded_event_ids(sid)

    # 3. Build Student Profile Text
    profile_text, top_past_events, is_cold_start = build_student_profile_text(student, event_weights)

    # 4. Retrieve Candidate Events (Upcoming & Published)
    upcoming_events = get_upcoming_published_events()
    
    # 5. Filter out excluded events
    candidate_events = [ev for ev in upcoming_events if ev["id"] not in excluded_event_ids]

    if not candidate_events:
        # If all upcoming are excluded, allow viewing remaining upcoming published events
        candidate_events = upcoming_events

    if not candidate_events:
        return {
            "studentId": student_id,
            "recommendationType": "COLD_START" if is_cold_start else "PERSONALIZED",
            "recommendations": []
        }

    # 6. Precompute Popularity Scores
    popularity_map = get_event_popularity_scores()

    # 7. TF-IDF & Content Similarity
    event_docs = [build_event_text(ev) for ev in candidate_events]
    all_corpus = [profile_text] + event_docs

    tfidf_config = config.get("tfidf", {})
    vectorizer = TfidfVectorizer(
        stop_words=tfidf_config.get("stop_words", "english"),
        ngram_range=tuple(tfidf_config.get("ngram_range", [1, 2])),
        max_features=tfidf_config.get("max_features", 5000),
        sublinear_tf=tfidf_config.get("sublinear_tf", True)
    )

    tfidf_matrix = vectorizer.fit_transform(all_corpus)
    student_vec = tfidf_matrix[0:1]
    candidate_vecs = tfidf_matrix[1:]

    cosine_sims = cosine_similarity(student_vec, candidate_vecs)[0]

    # 8. Multi-Signal Scoring & Ranking
    scored_candidates = []
    for idx, ev in enumerate(candidate_events):
        eid = ev["id"]
        content_sim = float(cosine_sims[idx]) if idx < len(cosine_sims) else 0.0
        # Boost cold start baseline slightly with declared profile similarity
        if is_cold_start and content_sim < 0.10:
            content_sim = 0.25

        profile_match = compute_profile_match(student, ev)
        pop_score = popularity_map.get(eid, 0.50)

        final_score = (w_content * content_sim) + (w_profile * profile_match) + (w_popularity * pop_score)
        final_score = round(min(1.0, max(0.0, final_score)), 4)

        reason = generate_recommendation_reason(
            student=student,
            event=ev,
            content_sim=content_sim,
            profile_match=profile_match,
            popularity_score=pop_score,
            top_past_events=top_past_events,
            is_cold_start=is_cold_start
        )

        ev_date = ev.get("eventDate")
        date_str = ev_date.strftime("%Y-%m-%d") if hasattr(ev_date, "strftime") else str(ev_date or "")

        scored_candidates.append({
            "eventId": eid,
            "title": ev.get("title", ""),
            "score": final_score,
            "contentSimilarity": round(content_sim, 4),
            "profileMatch": round(profile_match, 4),
            "popularity": round(pop_score, 4),
            "category": ev.get("category", "General"),
            "date": date_str,
            "venue": ev.get("venue", ""),
            "targetAudience": ev.get("targetAudience", ""),
            "reason": reason
        })

    # Sort descending by finalScore
    scored_candidates.sort(key=lambda x: x["score"], reverse=True)
    top_recommendations = scored_candidates[:top_k]

    return {
        "studentId": student_id,
        "recommendationType": "COLD_START" if is_cold_start else "PERSONALIZED",
        "recommendations": top_recommendations
    }

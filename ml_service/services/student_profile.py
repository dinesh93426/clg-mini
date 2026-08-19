"""
Student Preference Profile Builder
Aggregates historical student interactions (Attendance, Registrations, Positive Feedback, Likes, Views)
weighted by configurable interaction strengths, and constructs the student preference profile text.
"""

import json
from pathlib import Path
from typing import Dict, Any, List, Set, Tuple
from core.db import execute_query
from services.event_features import build_event_text, get_all_events_map

CONFIG_PATH = Path(__file__).resolve().parent.parent / "config" / "recommendation.json"


def load_config() -> Dict[str, Any]:
    if CONFIG_PATH.exists():
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {
        "interaction_weights": {
            "VIEW": 1.0,
            "LIKE": 3.0,
            "REGISTER": 5.0,
            "ATTEND": 7.0,
            "POSITIVE_RATING": 8.0
        },
        "score_weights": {
            "content_similarity": 0.70,
            "profile_match": 0.20,
            "popularity": 0.10
        },
        "default_limit": 10,
        "max_limit": 10,
        "min_rating_for_positive": 4
    }


_STUDENT_CACHE: Dict[str, Any] = {}


def get_student_by_id(student_id: str) -> Dict[str, Any]:
    """
    Retrieves student metadata from the database.
    Supports lookup by ID or alias with memory cache.
    """
    if student_id in _STUDENT_CACHE:
        return _STUDENT_CACHE[student_id]

    sql = """
        SELECT
            id,
            name,
            email,
            department,
            year,
            interests,
            skills,
            "clusterLabel",
            "attendanceRate"
        FROM "Student"
        WHERE id = %s
           OR id ILIKE %s
           OR email ILIKE %s
        LIMIT 1;
    """
    rows = execute_query(sql, (student_id, f"%{student_id}%", f"{student_id}%"))
    if not rows:
        # Fallback: check if student_id is an integer index like S001 -> row 1
        if student_id.upper().startswith("S") and student_id[1:].isdigit():
            idx = int(student_id[1:]) - 1
            all_s = execute_query('SELECT id, name, email, department, year, interests, skills, "clusterLabel", "attendanceRate" FROM "Student" ORDER BY id LIMIT 100')
            if 0 <= idx < len(all_s):
                res = all_s[idx]
                _STUDENT_CACHE[student_id] = res
                _STUDENT_CACHE[res["id"]] = res
                return res
        return None
    res = rows[0]
    _STUDENT_CACHE[student_id] = res
    _STUDENT_CACHE[res["id"]] = res
    return res


def get_student_interactions(student_id: str) -> Dict[str, float]:
    """
    Gathers all interactions for the student in a single unified query.
    Returns:
        { event_id: cumulative_interaction_weight }
    """
    config = load_config()
    weights = config.get("interaction_weights", {})
    w_attend = float(weights.get("ATTEND", 7.0))
    w_fb = float(weights.get("POSITIVE_RATING", 8.0))
    w_reg = float(weights.get("REGISTER", 5.0))
    w_like = float(weights.get("LIKE", 3.0))
    w_view = float(weights.get("VIEW", 1.0))
    min_rating = config.get("min_rating_for_positive", 4)

    sql = """
        SELECT "eventId", %s as weight FROM "Attendance" WHERE "studentId" = %s AND status = 'PRESENT'
        UNION ALL
        SELECT "eventId", (CASE WHEN rating >= %s THEN %s ELSE 2.0 END) as weight FROM "Feedback" WHERE "studentId" = %s
        UNION ALL
        SELECT "eventId", %s as weight FROM "Registration" WHERE "studentId" = %s AND status = 'REGISTERED'
        UNION ALL
        SELECT "eventId", (CASE WHEN UPPER("interactionType") = 'LIKE' THEN %s ELSE %s END) as weight FROM "EventInteraction" WHERE "studentId" = %s;
    """
    rows = execute_query(sql, (w_attend, student_id, min_rating, w_fb, student_id, w_reg, student_id, w_like, w_view, student_id))
    
    event_weights: Dict[str, float] = {}
    for r in (rows or []):
        eid = r["eventId"]
        w = float(r.get("weight") or 0.0)
        event_weights[eid] = max(event_weights.get(eid, 0.0), w)

    return event_weights


def get_excluded_event_ids(student_id: str) -> Set[str]:
    """
    Returns set of event IDs that must not be recommended in a single query:
    - Events already attended
    - Events already registered for
    - Events with COMPLETED or CANCELLED status
    """
    sql = """
        SELECT "eventId" FROM "Registration" WHERE "studentId" = %s
        UNION
        SELECT "eventId" FROM "Attendance" WHERE "studentId" = %s
        UNION
        SELECT id as "eventId" FROM "Event" WHERE status IN ('COMPLETED', 'CANCELLED');
    """
    rows = execute_query(sql, (student_id, student_id))
    return set(r["eventId"] for r in (rows or []))


def build_student_profile_text(student: Dict[str, Any], event_weights: Dict[str, float]) -> Tuple[str, List[str], bool]:
    """
    Constructs the weighted student preference text document.
    Returns:
        (profile_text, top_historical_event_titles, is_cold_start)
    """
    events_map = get_all_events_map()
    text_chunks = []
    top_events = []

    # Include explicit student profile attributes (Interests & Skills)
    interests = student.get("interests") or []
    if isinstance(interests, list) and interests:
        text_chunks.append(" ".join(interests) * 2)

    skills = student.get("skills") or []
    if isinstance(skills, list) and skills:
        text_chunks.append(" ".join(skills) * 2)

    dept = student.get("department") or ""
    if dept:
        text_chunks.append(f"{dept} department engineering")

    # If no interactions, return cold start profile built from interests & department
    if not event_weights:
        cold_text = " ".join(text_chunks).strip()
        return cold_text, [], True

    # Weight past event documents by interaction strength
    sorted_events = sorted(event_weights.items(), key=lambda x: x[1], reverse=True)

    for eid, weight in sorted_events:
        if eid in events_map:
            ev = events_map[eid]
            ev_doc = build_event_text(ev)
            top_events.append(ev.get("title", ""))
            # Repeat text proportionally to integer weight
            repeat_factor = max(1, int(round(weight / 2.0)))
            text_chunks.append((ev_doc + " ") * repeat_factor)

    full_profile_text = " ".join(text_chunks).strip()
    return full_profile_text, top_events[:5], False

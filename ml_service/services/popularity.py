"""
Event Popularity Scoring Service
Calculates normalized event popularity scores (0.0 to 1.0) using actual database interaction metrics
(registrations, attendance, views, likes).
"""

import time
from typing import Dict, Any
from core.db import execute_query

_POPULARITY_CACHE = None
_LAST_CACHE_TIME = 0
_CACHE_TTL = 30  # seconds


def get_event_popularity_scores() -> Dict[str, float]:
    """
    Computes popularity for all events from actual database aggregations.
    Score = (2 * registrations) + (3 * attendances) + (1 * likes/views)
    Normalized between 0.0 and 1.0 with soft upper bound.
    """
    global _POPULARITY_CACHE, _LAST_CACHE_TIME
    now = time.time()
    if _POPULARITY_CACHE is not None and (now - _LAST_CACHE_TIME) < _CACHE_TTL:
        return _POPULARITY_CACHE
    sql = """
        SELECT
            e.id as event_id,
            COALESCE(r.reg_count, 0) as reg_count,
            COALESCE(a.att_count, 0) as att_count,
            COALESCE(i.int_count, 0) as int_count
        FROM "Event" e
        LEFT JOIN (
            SELECT "eventId", COUNT(id) as reg_count
            FROM "Registration"
            GROUP BY "eventId"
        ) r ON r."eventId" = e.id
        LEFT JOIN (
            SELECT "eventId", COUNT(id) as att_count
            FROM "Attendance"
            GROUP BY "eventId"
        ) a ON a."eventId" = e.id
        LEFT JOIN (
            SELECT "eventId", COUNT(id) as int_count
            FROM "EventInteraction"
            GROUP BY "eventId"
        ) i ON i."eventId" = e.id;
    """
    rows = execute_query(sql) or []
    if not rows:
        return {}

    raw_scores = {}
    max_raw = 1.0

    for r in rows:
        eid = r["event_id"]
        reg = float(r.get("reg_count") or 0)
        att = float(r.get("att_count") or 0)
        interaction = float(r.get("int_count") or 0)

        raw = (2.0 * reg) + (3.0 * att) + (1.0 * interaction)
        raw_scores[eid] = raw
        if raw > max_raw:
            max_raw = raw

    # Normalize to [0.1, 1.0] to give base exposure
    normalized = {}
    for eid, raw in raw_scores.items():
        score = round(min(1.0, max(0.1, raw / max_raw)), 4)
        normalized[eid] = score

    _POPULARITY_CACHE = normalized
    _LAST_CACHE_TIME = now
    return normalized

import time
from typing import Dict, Any, List
from core.db import execute_query

_UPCOMING_CACHE = None
_LAST_UPCOMING_TIME = 0

_ALL_EVENTS_CACHE = None
_LAST_ALL_EVENTS_TIME = 0

_CACHE_TTL = 30  # seconds


def build_event_text(event: Dict[str, Any]) -> str:
    """
    Combines available event fields into a rich tokenized document string.
    Only fields that exist in the PostgreSQL Event schema are used:
    - title
    - description
    - category
    - targetAudience
    - venue
    """
    parts = []

    title = event.get("title") or ""
    if title:
        parts.append(title.strip())

    category = event.get("category") or ""
    if category:
        parts.append(category.strip())

    description = event.get("description") or ""
    if description:
        parts.append(description.strip())

    target_audience = event.get("targetAudience") or ""
    if target_audience:
        parts.append(target_audience.strip())

    venue = event.get("venue") or ""
    if venue:
        parts.append(venue.strip())

    return " ".join(parts)


def get_upcoming_published_events() -> List[Dict[str, Any]]:
    """
    Retrieves all upcoming events from the database with status = 'PUBLISHED'
    and eventDate >= NOW().
    """
    global _UPCOMING_CACHE, _LAST_UPCOMING_TIME
    now = time.time()
    if _UPCOMING_CACHE is not None and (now - _LAST_UPCOMING_TIME) < _CACHE_TTL:
        return _UPCOMING_CACHE

    sql = """
        SELECT
            id,
            title,
            description,
            category,
            "organizerId",
            venue,
            "eventDate",
            "startTime",
            "endTime",
            capacity,
            "targetAudience",
            status,
            "createdAt"
        FROM "Event"
        WHERE status = 'PUBLISHED'
          AND "eventDate" >= NOW() - INTERVAL '1 day'
        ORDER BY "eventDate" ASC;
    """
    res = execute_query(sql) or []
    _UPCOMING_CACHE = res
    _LAST_UPCOMING_TIME = now
    return res


def get_all_events_map() -> Dict[str, Dict[str, Any]]:
    """
    Retrieves all events in a lookup dictionary keyed by eventId.
    """
    global _ALL_EVENTS_CACHE, _LAST_ALL_EVENTS_TIME
    now = time.time()
    if _ALL_EVENTS_CACHE is not None and (now - _LAST_ALL_EVENTS_TIME) < _CACHE_TTL:
        return _ALL_EVENTS_CACHE

    sql = """
        SELECT
            id,
            title,
            description,
            category,
            venue,
            "eventDate",
            "targetAudience",
            status
        FROM "Event";
    """
    events = execute_query(sql) or []
    res_map = {ev["id"]: ev for ev in events}
    _ALL_EVENTS_CACHE = res_map
    _LAST_ALL_EVENTS_TIME = now
    return res_map

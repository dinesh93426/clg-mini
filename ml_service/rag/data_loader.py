import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import hashlib
import json
from typing import Dict, Any, List, Optional
from core.db import execute_query


def extract_department(target_audience: str, title: str, description: str) -> str:
    """Infers department if not directly specified in columns."""
    text = f"{target_audience} {title} {description}".upper()
    if "CSE" in text or "COMPUTER" in text:
        return "CSE"
    elif "IT" in text or "INFORMATION TECH" in text:
        return "IT"
    elif "ECE" in text or "ELECTRONICS" in text:
        return "ECE"
    elif "MECH" in text or "MECHANICAL" in text:
        return "Mechanical"
    elif "CIVIL" in text:
        return "Civil"
    elif "MBA" in text or "BUSINESS" in text:
        return "Business"
    return "All Departments"


def event_to_document(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Transforms a single database Event row into a normalized RAG document.
    """
    event_id = event["id"]
    title = event.get("title") or "Untitled Event"
    description = event.get("description") or ""
    category = event.get("category") or "General"
    venue = event.get("venue") or "Campus"
    capacity = event.get("capacity") or 100
    target_audience = event.get("targetAudience") or "All Students"
    status = event.get("status") or "PUBLISHED"

    ev_date = event.get("eventDate")
    date_str = ev_date.strftime("%Y-%m-%d") if hasattr(ev_date, "strftime") else str(ev_date or "")
    start_time = event.get("startTime") or ""
    end_time = event.get("endTime") or ""
    time_str = f"{start_time} - {end_time}".strip(" -") if (start_time or end_time) else "TBA"

    department = extract_department(target_audience, title, description)

    content = (
        f"Title: {title}\n"
        f"Category: {category}\n"
        f"Department: {department}\n"
        f"Date: {date_str}\n"
        f"Time: {time_str}\n"
        f"Venue: {venue}\n"
        f"Capacity: {capacity}\n"
        f"Target Audience: {target_audience}\n"
        f"Status: {status}\n"
        f"Description: {description}"
    )

    content_hash = hashlib.md5(content.encode("utf-8")).hexdigest()

    metadata = {
        "event_id": event_id,
        "title": title,
        "category": category,
        "department": department,
        "date": date_str,
        "time": time_str,
        "venue": venue,
        "capacity": capacity,
        "target_audience": target_audience,
        "status": status,
        "content_hash": content_hash
    }

    return {
        "document_id": f"event_{event_id}",
        "event_id": event_id,
        "title": title,
        "content": content,
        "metadata": metadata
    }


def load_event_documents(event_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Fetches events from PostgreSQL and converts them into structured RAG documents.
    If event_id is supplied, retrieves only that event.
    """
    if event_id:
        sql = """
            SELECT id, title, description, category, "organizerId", venue,
                   "eventDate", "startTime", "endTime", capacity, "targetAudience", status, "createdAt"
            FROM "Event"
            WHERE id = %s;
        """
        rows = execute_query(sql, (event_id,))
    else:
        sql = """
            SELECT id, title, description, category, "organizerId", venue,
                   "eventDate", "startTime", "endTime", capacity, "targetAudience", status, "createdAt"
            FROM "Event"
            ORDER BY "eventDate" ASC;
        """
        rows = execute_query(sql)

    documents = []
    for r in (rows or []):
        doc = event_to_document(r)
        documents.append(doc)

    return documents

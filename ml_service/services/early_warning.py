"""
Early Warning Alert Service
Scans event performance, demand forecasts, feedback sentiment, and attendance rates to produce
actionable, prioritized early warning risk alerts (CRITICAL, HIGH, MEDIUM, LOW).
"""

import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import logging
from typing import Dict, Any, List, Optional
from core.db import execute_query

logger = logging.getLogger("ml_service.dashboard.early_warning")


def get_early_warning_alerts(organizer_id: Optional[str] = None, college_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Scans events and generates structured early warning risk alerts.
    """
    where_clauses = []
    params = []
    
    if organizer_id:
        where_clauses.append("e.\"organizerId\" = %s")
        params.append(organizer_id)
        
    if college_id:
        where_clauses.append("e.\"collegeId\" = %s")
        params.append(college_id)

    where_sql = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""
    params = tuple(params) if params else None

    rows = execute_query(f"""
        SELECT
            e.id,
            e.title,
            e.category,
            e.status,
            e.capacity,
            e."eventDate",
            (SELECT COUNT(id) FROM "Registration" WHERE "eventId" = e.id) as reg_count,
            (SELECT COUNT(id) FROM "Attendance" WHERE "eventId" = e.id) as att_count,
            (SELECT AVG(rating) FROM "Feedback" WHERE "eventId" = e.id) as avg_rating,
            (SELECT COUNT(id) FROM "Feedback" WHERE "eventId" = e.id AND (sentiment = 'NEGATIVE' OR (sentiment IS NULL AND rating <= 2 AND rating > 0))) as neg_fb,
            (SELECT COUNT(id) FROM "Feedback" WHERE "eventId" = e.id) as total_fb
        FROM "Event" e
        {where_sql}
        ORDER BY e."eventDate" DESC;
    """, params)

    alerts = []
    alert_counter = 1

    for r in (rows or []):
        eid = r.get("id")
        title = r.get("title") or "Event"
        status = r.get("status") or "PUBLISHED"
        cap = int(r.get("capacity") or 100)
        regs = int(r.get("reg_count") or 0)
        atts = int(r.get("att_count") or 0)
        avg_r = float(r.get("avg_rating") or 0.0)
        neg_fb = int(r.get("neg_fb") or 0)
        tot_fb = int(r.get("total_fb") or 0)

        occupancy = round((regs / cap * 100), 1) if cap > 0 else 0.0
        att_rate = round((atts / regs * 100), 1) if regs > 0 else 0.0
        neg_pct = round((neg_fb / tot_fb * 100), 1) if tot_fb > 0 else 0.0

        # Check 1: Capacity Overload Risk
        if status == "PUBLISHED" and occupancy >= 90.0:
            alerts.append({
                "id": f"alt_{alert_counter:03d}",
                "eventId": eid,
                "eventTitle": title,
                "type": "Capacity Risk",
                "severity": "CRITICAL" if occupancy >= 100.0 else "HIGH",
                "evidence": f"Current registrations are {regs}/{cap} ({occupancy}% capacity).",
                "recommendedAction": "Consider upgrading venue capacity or closing public registrations to prevent overcrowding.",
                "status": "ACTIVE"
            })
            alert_counter += 1

        # Check 2: Low Registration Warning for upcoming events
        elif status == "PUBLISHED" and occupancy < 30.0:
            alerts.append({
                "id": f"alt_{alert_counter:03d}",
                "eventId": eid,
                "eventTitle": title,
                "type": "Low Registration Pace",
                "severity": "MEDIUM",
                "evidence": f"Registration occupancy is currently at {occupancy}% ({regs}/{cap} registered).",
                "recommendedAction": "Promote event across departmental communication channels and target active student clusters.",
                "status": "ACTIVE"
            })
            alert_counter += 1

        # Check 3: Low Attendance Rate for completed events
        if status == "COMPLETED" and att_rate < 50.0 and regs > 0:
            alerts.append({
                "id": f"alt_{alert_counter:03d}",
                "eventId": eid,
                "eventTitle": title,
                "type": "Low Attendance Conversion",
                "severity": "HIGH",
                "evidence": f"Only {att_rate}% of registered students attended ({atts}/{regs} attendees).",
                "recommendedAction": "Send SMS reminders 2 hours before future editions and review event scheduling times.",
                "status": "RESOLVED"
            })
            alert_counter += 1

        # Check 4: Negative Sentiment Warning
        if tot_fb >= 5 and neg_pct >= 15.0:
            alerts.append({
                "id": f"alt_{alert_counter:03d}",
                "eventId": eid,
                "eventTitle": title,
                "type": "Negative Feedback Spike",
                "severity": "CRITICAL" if neg_pct >= 30.0 else "HIGH",
                "evidence": f"{neg_pct}% of submitted reviews expressed negative sentiment ({neg_fb}/{tot_fb} reviews).",
                "recommendedAction": "Inspect attendee comments regarding audio, presentation pace, and facility quality.",
                "status": "ACTIVE"
            })
            alert_counter += 1

        # Check 5: Low Rating Alert
        elif tot_fb >= 5 and avg_r < 3.2:
            alerts.append({
                "id": f"alt_{alert_counter:03d}",
                "eventId": eid,
                "eventTitle": title,
                "type": "Low Average Rating",
                "severity": "MEDIUM",
                "evidence": f"Average rating fell to {avg_r} / 5.0 across {tot_fb} student reviews.",
                "recommendedAction": "Review presenter syllabus and incorporate participant feedback for the next session.",
                "status": "ACTIVE"
            })
            alert_counter += 1

    return alerts

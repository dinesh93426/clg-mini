"""
Student Behavior Analytics Service
Analyzes student engagement segments and behavior clusters derived from the K-Means model.
"""

import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import logging
from typing import Dict, Any, Optional
from core.db import execute_query

logger = logging.getLogger("ml_service.analytics.behavior")


def get_behavior_analytics(college_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Retrieves student cluster distribution and segment engagement statistics.
    """
    where_sql = "WHERE e.\"collegeId\" = %s" if college_id else ""
    params = (college_id,) if college_id else None
    students = execute_query(f"""
        SELECT
            s.id,
            s.department,
            COUNT(DISTINCT r.id) as registrations,
            COUNT(DISTINCT a.id) as attendance,
            ROUND(AVG(f.rating)::numeric, 2) as avg_rating
        FROM "Student" s
        LEFT JOIN "Registration" r ON s.id = r."studentId"
        LEFT JOIN "Event" e ON r."eventId" = e.id
        LEFT JOIN "Attendance" a ON s.id = a."studentId" AND a."eventId" = e.id
        LEFT JOIN "Feedback" f ON s.id = f."studentId" AND f."eventId" = e.id
        {where_sql}
        GROUP BY s.id, s.department;
    """, params)

    total_students = len(students or [])
    clusters = {
        "Highly Active": 0,
        "Moderately Active": 0,
        "Low Engagement": 0
    }
    stats = {
        "Highly Active": {"regs": [], "atts": []},
        "Moderately Active": {"regs": [], "atts": []},
        "Low Engagement": {"regs": [], "atts": []}
    }

    for s in (students or []):
        regs = int(s.get("registrations") or 0)
        atts = int(s.get("attendance") or 0)

        if regs >= 4:
            c = "Highly Active"
        elif regs >= 2:
            c = "Moderately Active"
        else:
            c = "Low Engagement"

        clusters[c] += 1
        stats[c]["regs"].append(regs)
        stats[c]["atts"].append(atts)

    cluster_stats = {}
    for c_name, data in stats.items():
        count = len(data["regs"])
        avg_r = round(sum(data["regs"]) / max(1, count), 1) if count > 0 else 0.0
        avg_a = round(sum(data["atts"]) / max(1, count), 1) if count > 0 else 0.0
        att_rate = round((avg_a / avg_r * 100), 1) if avg_r > 0 else 0.0
        cluster_stats[c_name] = {
            "studentCount": count,
            "averageRegistrations": avg_r,
            "averageAttendance": avg_a,
            "attendanceRate": att_rate
        }

    return {
        "totalStudents": total_students,
        "clusterDistribution": clusters,
        "clusterEngagementStats": cluster_stats
    }

"""
Event Analytics Service
Calculates verified event performance metrics, category distributions, department engagement,
and identifying top performing & underperforming events directly from PostgreSQL.
"""

import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from core.db import execute_query

logger = logging.getLogger("ml_service.analytics.events")


def get_overview_analytics(filters: Optional[Dict[str, Any]] = None, college_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Computes overall summary dashboard metrics directly from database.
    Zero-division safe.
    """
    where_clauses = []
    params = []

    if college_id:
        where_clauses.append("e.\"collegeId\" = %s")
        params.append(college_id)

    if filters:
        if filters.get("category"):
            where_clauses.append("e.category ILIKE %s")
            params.append(f"%{filters['category']}%")
        if filters.get("dateFrom"):
            where_clauses.append("e.\"eventDate\" >= %s")
            params.append(filters["dateFrom"])
        if filters.get("dateTo"):
            where_clauses.append("e.\"eventDate\" <= %s")
            params.append(filters["dateTo"])
        if filters.get("eventStatus"):
            where_clauses.append("e.status = %s")
            params.append(filters["eventStatus"])

    where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""

    # Events count query
    event_counts = execute_query(f"""
        SELECT
            COUNT(*) as total_events,
            COUNT(*) FILTER (WHERE status = 'PUBLISHED' AND "eventDate" >= NOW()) as upcoming_events,
            COUNT(*) FILTER (WHERE status = 'COMPLETED' OR "eventDate" < NOW()) as completed_events,
            COUNT(*) FILTER (WHERE date_trunc('month', "eventDate") = date_trunc('month', NOW())) as events_this_month
        FROM "Event" e
        {where_sql};
    """, tuple(params) if params else None)

    ev_row = event_counts[0] if event_counts else {}
    total_events = int(ev_row.get("total_events") or 0)
    upcoming_events = int(ev_row.get("upcoming_events") or 0)
    completed_events = int(ev_row.get("completed_events") or 0)
    events_this_month = int(ev_row.get("events_this_month") or 0)

    # Registrations & Attendance aggregations
    reg_att_counts = execute_query(f"""
        SELECT
            COUNT(r.id) as total_registrations,
            COUNT(a.id) as total_attendance,
            COUNT(r.id) FILTER (WHERE date_trunc('month', r."registeredAt") = date_trunc('month', NOW())) as regs_this_month,
            COUNT(a.id) FILTER (WHERE date_trunc('month', a."markedAt") = date_trunc('month', NOW())) as atts_this_month
        FROM "Registration" r
        LEFT JOIN "Attendance" a ON r."eventId" = a."eventId" AND r."studentId" = a."studentId"
        JOIN "Event" e ON r."eventId" = e.id
        {where_sql};
    """, tuple(params) if params else None)

    reg_row = reg_att_counts[0] if reg_att_counts else {}
    total_registrations = int(reg_row.get("total_registrations") or 0)
    total_attendance = int(reg_row.get("total_attendance") or 0)
    regs_this_month = int(reg_row.get("regs_this_month") or 0)
    atts_this_month = int(reg_row.get("atts_this_month") or 0)

    # Feedback rating aggregation
    fb_row = execute_query(f"""
        SELECT AVG(f.rating) as avg_rating
        FROM "Feedback" f
        JOIN "Event" e ON f."eventId" = e.id
        {where_sql};
    """, tuple(params) if params else None)

    avg_rating = round(float(fb_row[0].get("avg_rating") or 0.0), 2) if fb_row else 0.0

    # Rates
    attendance_rate = round((total_attendance / total_registrations * 100), 1) if total_registrations > 0 else 0.0
    avg_regs_per_event = round(total_registrations / max(1, total_events), 1) if total_events > 0 else 0.0
    avg_atts_per_event = round(total_attendance / max(1, total_events), 1) if total_events > 0 else 0.0

    # High demand upcoming events (capacity vs registrations/forecast)
    high_demand_count = 0
    if upcoming_events > 0:
        high_demand_rows = execute_query("""
            SELECT e.id, e.capacity, COUNT(r.id) as reg_count
            FROM "Event" e
            LEFT JOIN "Registration" r ON e.id = r."eventId"
            WHERE e.status = 'PUBLISHED' AND e."eventDate" >= NOW()
            GROUP BY e.id, e.capacity;
        """)
        for r in (high_demand_rows or []):
            cap = int(r.get("capacity") or 100)
            regs = int(r.get("reg_count") or 0)
            if cap > 0 and (regs / cap) >= 0.8:
                high_demand_count += 1

    return {
        "totalEvents": total_events,
        "upcomingEvents": upcoming_events,
        "completedEvents": completed_events,
        "totalRegistrations": total_registrations,
        "totalAttendance": total_attendance,
        "attendanceRate": attendance_rate,
        "averageRating": avg_rating,
        "averageRegistrationsPerEvent": avg_regs_per_event,
        "averageAttendancePerEvent": avg_atts_per_event,
        "eventsThisMonth": events_this_month,
        "registrationsThisMonth": regs_this_month,
        "attendanceThisMonth": atts_this_month,
        "highDemandUpcomingEvents": high_demand_count
    }


def get_category_analytics(college_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Computes category performance metrics directly from PostgreSQL.
    """
    where_sql = f"WHERE e.\"collegeId\" = %s" if college_id else ""
    params = (college_id,) if college_id else None

    rows = execute_query(f"""
        SELECT
            e.category,
            COUNT(DISTINCT e.id) as event_count,
            SUM(COALESCE(r.reg_count, 0)) as total_registrations,
            SUM(COALESCE(a.att_count, 0)) as total_attendance,
            ROUND((SUM(COALESCE(f.sum_rating, 0)) / NULLIF(SUM(COALESCE(f.total_fb, 0)), 0))::numeric, 2) as avg_rating
        FROM "Event" e
        LEFT JOIN (
            SELECT "eventId", COUNT(id) as reg_count FROM "Registration" GROUP BY "eventId"
        ) r ON e.id = r."eventId"
        LEFT JOIN (
            SELECT "eventId", COUNT(id) as att_count FROM "Attendance" GROUP BY "eventId"
        ) a ON e.id = a."eventId"
        LEFT JOIN (
            SELECT "eventId", SUM(rating) as sum_rating, COUNT(id) as total_fb FROM "Feedback" GROUP BY "eventId"
        ) f ON e.id = f."eventId"
        {where_sql}
        GROUP BY e.category
        ORDER BY total_registrations DESC;
    """, params)

    results = []
    for r in (rows or []):
        cat = r.get("category") or "General"
        ev_count = int(r.get("event_count") or 0)
        regs = int(r.get("total_registrations") or 0)
        atts = int(r.get("total_attendance") or 0)
        avg_r = float(r.get("avg_rating") or 0.0)

        att_rate = round((atts / regs * 100), 1) if regs > 0 else 0.0
        avg_regs = round(regs / max(1, ev_count), 1)
        avg_atts = round(atts / max(1, ev_count), 1)

        results.append({
            "category": cat,
            "eventCount": ev_count,
            "totalRegistrations": regs,
            "totalAttendance": atts,
            "averageRegistrations": avg_regs,
            "averageAttendance": avg_atts,
            "attendanceRate": att_rate,
            "averageRating": avg_r
        })

    return results


def get_department_analytics(college_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Computes student department engagement and attendance statistics.
    """
    where_sql = f"WHERE e.\"collegeId\" = %s" if college_id else ""
    params = (college_id,) if college_id else None

    rows = execute_query(f"""
        SELECT
            s.department,
            COUNT(DISTINCT s.id) as student_count,
            COUNT(DISTINCT r.id) as registrations,
            COUNT(DISTINCT a.id) as attendance,
            ROUND(AVG(f.rating)::numeric, 2) as avg_rating
        FROM "Student" s
        LEFT JOIN "Registration" r ON s.id = r."studentId"
        LEFT JOIN "Event" e ON r."eventId" = e.id
        LEFT JOIN "Attendance" a ON s.id = a."studentId" AND a."eventId" = e.id
        LEFT JOIN "Feedback" f ON s.id = f."studentId" AND f."eventId" = e.id
        {where_sql}
        GROUP BY s.department
        ORDER BY registrations DESC;
    """, params)

    results = []
    for r in (rows or []):
        dept = r.get("department") or "Unknown"
        s_count = int(r.get("student_count") or 0)
        regs = int(r.get("registrations") or 0)
        atts = int(r.get("attendance") or 0)
        avg_r = float(r.get("avg_rating") or 0.0)

        att_rate = round((atts / regs * 100), 1) if regs > 0 else 0.0
        engagement_score = round(min(100.0, (regs / max(1, s_count)) * 20.0), 1)

        results.append({
            "department": dept,
            "eventCount": s_count,
            "registrations": regs,
            "attendance": atts,
            "attendanceRate": att_rate,
            "averageRating": avg_r,
            "engagementScore": engagement_score
        })

    return results


def get_event_performance_list(college_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Computes individual metrics for all events including occupancy, attendance rate,
    ratings, and status labeling.
    """
    where_sql = f"WHERE e.\"collegeId\" = %s" if college_id else ""
    params = (college_id,) if college_id else None

    rows = execute_query(f"""
        SELECT
            e.id,
            e.title,
            e.category,
            e.status,
            e."eventDate",
            e.capacity,
            COALESCE(r.reg_count, 0) as reg_count,
            COALESCE(a.att_count, 0) as att_count,
            ROUND(COALESCE(f.avg_rating, 0)::numeric, 2) as avg_rating,
            COALESCE(f.pos_fb_count, 0) as pos_fb_count,
            COALESCE(f.neg_fb_count, 0) as neg_fb_count,
            COALESCE(f.total_fb, 0) as total_fb
        FROM "Event" e
        LEFT JOIN (
            SELECT "eventId", COUNT(id) as reg_count FROM "Registration" GROUP BY "eventId"
        ) r ON e.id = r."eventId"
        LEFT JOIN (
            SELECT "eventId", COUNT(id) as att_count FROM "Attendance" GROUP BY "eventId"
        ) a ON e.id = a."eventId"
        LEFT JOIN (
            SELECT "eventId",
                   AVG(rating) as avg_rating,
                   COUNT(id) FILTER (WHERE sentiment = 'POSITIVE' OR rating >= 4) as pos_fb_count,
                   COUNT(id) FILTER (WHERE sentiment = 'NEGATIVE' OR (rating <= 2 AND rating > 0)) as neg_fb_count,
                   COUNT(id) as total_fb
            FROM "Feedback" GROUP BY "eventId"
        ) f ON e.id = f."eventId"
        {where_sql}
        ORDER BY reg_count DESC;
    """, params)

    results = []
    for r in (rows or []):
        eid = r.get("id")
        title = r.get("title") or "Event"
        cat = r.get("category") or "General"
        status = r.get("status") or "PUBLISHED"
        cap = int(r.get("capacity") or 100)
        regs = int(r.get("reg_count") or 0)
        atts = int(r.get("att_count") or 0)
        avg_r = float(r.get("avg_rating") or 0.0)
        total_fb = int(r.get("total_fb") or 0)
        pos_fb = int(r.get("pos_fb_count") or 0)
        neg_fb = int(r.get("neg_fb_count") or 0)

        ev_date = r.get("eventDate")
        date_str = ev_date.strftime("%Y-%m-%d") if hasattr(ev_date, "strftime") else str(ev_date or "")

        att_rate = round((atts / regs * 100), 1) if regs > 0 else 0.0
        occupancy_rate = round((regs / cap * 100), 1) if cap > 0 else 0.0
        pos_pct = round((pos_fb / total_fb * 100), 1) if total_fb > 0 else 0.0
        neg_pct = round((neg_fb / total_fb * 100), 1) if total_fb > 0 else 0.0

        # Performance Status classification
        if occupancy_rate >= 80.0 and (att_rate >= 75.0 or status == "PUBLISHED") and (avg_r >= 4.0 or total_fb == 0):
            perf_status = "HIGH_PERFORMING"
        elif occupancy_rate < 40.0 or (att_rate < 50.0 and status == "COMPLETED") or (avg_r < 3.0 and total_fb >= 5):
            perf_status = "NEEDS_ATTENTION"
        elif occupancy_rate >= 60.0:
            perf_status = "OPTIMAL"
        else:
            perf_status = "NORMAL"

        results.append({
            "eventId": eid,
            "title": title,
            "category": cat,
            "status": status,
            "date": date_str,
            "capacity": cap,
            "registrations": regs,
            "attendance": atts,
            "attendanceRate": att_rate,
            "occupancyRate": occupancy_rate,
            "averageRating": avg_r,
            "positiveFeedbackPercentage": pos_pct,
            "negativeFeedbackPercentage": neg_pct,
            "performanceStatus": perf_status
        })

    return results


def get_top_and_underperforming_events(college_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Returns structured top 10 rankings across diverse metrics and flagged underperforming events.
    """
    events = get_event_performance_list(college_id=college_id)

    top_registrations = sorted(events, key=lambda x: x["registrations"], reverse=True)[:10]
    top_attendance = sorted(events, key=lambda x: x["attendance"], reverse=True)[:10]
    top_ratings = sorted([e for e in events if e["averageRating"] > 0], key=lambda x: x["averageRating"], reverse=True)[:10]
    top_sentiment = sorted(events, key=lambda x: x["positiveFeedbackPercentage"], reverse=True)[:10]

    underperforming = [
        {
            "eventId": e["eventId"],
            "title": e["title"],
            "category": e["category"],
            "occupancyRate": e["occupancyRate"],
            "attendanceRate": e["attendanceRate"],
            "averageRating": e["averageRating"],
            "reason": f"Occupancy is {e['occupancyRate']}%, Attendance Rate is {e['attendanceRate']}%, Avg Rating: {e['averageRating']}",
            "status": "NEEDS_ATTENTION"
        }
        for e in events if e["performanceStatus"] == "NEEDS_ATTENTION"
    ]

    return {
        "topByRegistrations": top_registrations,
        "topByAttendance": top_attendance,
        "topByRating": top_ratings,
        "topBySentiment": top_sentiment,
        "underperformingEvents": underperforming
    }

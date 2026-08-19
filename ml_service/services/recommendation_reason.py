"""
Deterministic Recommendation Reason Generator
Generates transparent, data-grounded explanations without relying on LLMs.
Reasons are strictly supported by student interaction history, content keywords,
department/year alignment, and campus popularity.
"""

from typing import Dict, Any, List


def generate_recommendation_reason(
    student: Dict[str, Any],
    event: Dict[str, Any],
    content_sim: float,
    profile_match: float,
    popularity_score: float,
    top_past_events: List[str],
    is_cold_start: bool
) -> str:
    """
    Produces a concise, deterministic explanation based on the primary ranking factors.
    """
    category = event.get("category") or "Technical"
    title = event.get("title") or ""
    dept = student.get("department") or "Engineering"
    interests = student.get("interests") or []
    skills = student.get("skills") or []
    profile_keywords = set([i.lower() for i in (interests + skills)])

    event_text = (title + " " + (event.get("description") or "") + " " + category).lower()
    matching_keywords = [k.title() for k in profile_keywords if k in event_text]

    # Cold Start Reason
    if is_cold_start:
        if matching_keywords:
            return f"Recommended based on your declared interests in {', '.join(matching_keywords[:2])} and {category} events."
        elif profile_match > 0.5:
            return f"Curated for {dept} students to build core practical and professional skills."
        elif popularity_score >= 0.7:
            return f"Popular upcoming {category} event trending among {dept} students."
        else:
            return f"Recommended {category} event to help kickstart your campus participation."

    # Personalized Reason (with historical data)
    if top_past_events and content_sim >= 0.35:
        return f"Matches your previous participation in '{top_past_events[0]}' and similar {category} workshops."

    if content_sim >= 0.40:
        if matching_keywords:
            return f"Highly aligns with your active engagement in {', '.join(matching_keywords[:2])} and {category} topics."
        return f"Matches your historical event participation pattern in {category} sessions."

    if profile_match >= 0.70:
        return f"Recommended because this event is directly relevant to your {dept} curriculum."

    if popularity_score >= 0.80:
        return f"Trending {category} event with high peer registration and strong campus interest."

    return f"Recommended {category} event relevant to your academic and technical development."

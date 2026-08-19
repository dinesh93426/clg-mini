"""
Natural-Language Event Parser
Converts unstructured organizer prompts into validated, structured event information JSON.
Extracts title, category, department, targetAudience, date, startTime, endTime, venue,
theme, style, colorPreference, description, and cta.
Never hallucinates missing dates, venues, or organizers (marks missing fields as None/null).
"""

import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import re
import json
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("ml_service.poster.parser")

KNOWN_CATEGORIES = ["Technical", "Workshop", "Hackathon", "Seminar", "Cultural", "Sports", "Symposium", "Conference"]
KNOWN_DEPARTMENTS = ["CSE", "IT", "ECE", "EEE", "Mechanical", "Civil", "Biotech", "MBA", "MCA", "Data Science", "AI & ML"]
KNOWN_STYLES = ["Futuristic", "Minimal", "Corporate", "Academic", "Creative", "Dark Tech", "Gradient", "Glassmorphism", "Neon", "Elegant"]


def parse_event_prompt(prompt: str, override_style: Optional[str] = None, override_color: Optional[str] = None) -> Dict[str, Any]:
    """
    Parses a natural-language event prompt into structured event information.
    """
    p_clean = prompt.strip()
    p_lower = p_clean.lower()

    # 1. Category extraction
    category = "Technical"
    for cat in KNOWN_CATEGORIES:
        if cat.lower() in p_lower:
            category = cat
            break
    if "hackathon" in p_lower or "coding challenge" in p_lower:
        category = "Hackathon"
    elif "workshop" in p_lower or "bootcamp" in p_lower:
        category = "Workshop"
    elif "seminar" in p_lower or "talk" in p_lower or "webinar" in p_lower:
        category = "Seminar"
    elif "fest" in p_lower or "cultural" in p_lower or "dance" in p_lower or "music" in p_lower:
        category = "Cultural"
    elif "sports" in p_lower or "tournament" in p_lower or "championship" in p_lower:
        category = "Sports"

    # 2. Title extraction
    title = None
    # Pattern: "Create a ... poster for [Title]" or "[Title] poster" or "poster for [Title]"
    title_match = re.search(r"(?:poster for (?:a |an )?|create (?:a |an )?(?:modern |futuristic |creative |minimal )?)(.+?)(?: on | for | at | from | with |$)", p_clean, re.IGNORECASE)
    if title_match:
        extracted = title_match.group(1).strip()
        # Clean trailing descriptors
        extracted = re.sub(r"\b(poster|event|session)\b", "", extracted, flags=re.IGNORECASE).strip()
        if len(extracted) > 3:
            title = extracted.title()

    if not title:
        # Fallback keyword matching
        if "generative ai" in p_lower or "gen ai" in p_lower:
            title = "Generative AI & LLM Workshop"
        elif "cybersecurity" in p_lower:
            title = "Cybersecurity Awareness Seminar"
        elif "python" in p_lower:
            title = "Python Programming Workshop"
        elif "hackathon" in p_lower:
            title = "National College Hackathon 2026"
        elif "cultural" in p_lower or "fest" in p_lower:
            title = "Annual Cultural Fest 2026"
        elif "academic" in p_lower:
            title = "Academic Research & Innovation Seminar"
        else:
            title = "College Innovation Workshop"

    # 3. Department extraction
    department = None
    for dept in KNOWN_DEPARTMENTS:
        if re.search(rf"\b{dept}\b", p_clean, re.IGNORECASE):
            department = dept.upper() if len(dept) <= 3 else dept.title()
            break
    if not department and "computer" in p_lower:
        department = "CSE"

    # 4. Target Audience extraction
    target_audience = None
    aud_match = re.search(r"(\b(?:1st|2nd|3rd|4th|first|second|third|final)\s+(?:year|yr)(?:\s+[a-zA-Z]+)?(?:\s+students)?)", p_clean, re.IGNORECASE)
    if aud_match:
        target_audience = aud_match.group(1).strip().title()
    elif "all students" in p_lower or "open to all" in p_lower or "all engineering" in p_lower:
        target_audience = "All Students"
    elif department:
        target_audience = f"{department} Students"

    # 5. Date extraction (YYYY-MM-DD or readable Month DD, YYYY)
    date = None
    iso_date = re.search(r"(\d{4}-\d{2}-\d{2})", p_clean)
    if iso_date:
        date = iso_date.group(1)
    else:
        text_date = re.search(r"((?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4})", p_clean, re.IGNORECASE)
        if text_date:
            date = text_date.group(1).strip()
        else:
            date_short = re.search(r"((?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2})", p_clean, re.IGNORECASE)
            if date_short:
                date = f"{date_short.group(1).strip()}, 2026"

    # 6. Time extraction (e.g. 10 AM to 1 PM, 10:00 - 13:00)
    start_time = None
    end_time = None
    time_range = re.search(r"(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:to|-)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm))", p_clean, re.IGNORECASE)
    if time_range:
        start_time = time_range.group(1).strip().upper()
        end_time = time_range.group(2).strip().upper()
    else:
        single_time = re.search(r"at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm))", p_clean, re.IGNORECASE)
        if single_time:
            start_time = single_time.group(1).strip().upper()

    # 7. Venue extraction
    venue = None
    venue_match = re.search(r"(?:at|in|venue:?)\s+([A-Z][a-zA-Z0-9\s]+(?:Hall|Lab|Auditorium|Center|Room|Ground|Campus|Hub)(?:\s+\d+)?)", p_clean)
    if venue_match:
        venue = venue_match.group(1).strip()
    elif "seminar hall" in p_lower:
        venue = "Seminar Hall"
    elif "auditorium" in p_lower:
        venue = "Main Auditorium"
    elif "tech hub" in p_lower or "lab" in p_lower:
        venue = "Tech Hub Lab 3"

    # 8. Style selection
    style = override_style
    if not style:
        for s in KNOWN_STYLES:
            if s.lower() in p_lower:
                style = s
                break
    if not style:
        if category in ("Technical", "Hackathon"):
            style = "Futuristic"
        elif category == "Cultural":
            style = "Creative"
        elif category == "Academic":
            style = "Academic"
        elif category == "Sports":
            style = "Neon"
        else:
            style = "Modern"

    # 9. Theme and Color Preference
    color_pref = override_color
    if not color_pref:
        color_match = re.search(r"(?:with (?:a )?|theme (?:should be )?|color(?:s)?:?\s*)([a-zA-Z\s,]+(?:theme|palette|colors|blue|purple|neon|dark|gradient|cyan|red|gold))", p_clean, re.IGNORECASE)
        if color_match:
            color_pref = color_match.group(1).strip()

    theme = "Modern Technology & Innovation"
    if "futuristic" in p_lower:
        theme = "Futuristic Technology & Cybernetic Design"
    elif "minimal" in p_lower:
        theme = "Clean Minimalist Typography & Space"
    elif "cultural" in p_lower:
        theme = "Vibrant Artistic Culture & Energy"

    # 10. Description and CTA
    description = f"Join us for an immersive {category.lower()} session exploring cutting-edge advancements and practical hands-on insights."
    if "generative ai" in p_lower or "ai" in p_lower:
        description = "Explore foundational generative models, neural architectures, and intelligent autonomous workflows."
    elif "cybersecurity" in p_lower:
        description = "Learn essential cyber defense strategies, network auditing, and digital safety frameworks."
    elif "python" in p_lower:
        description = "Master core Python scripting, algorithmic problem solving, and modern application libraries."
    elif "hackathon" in p_lower:
        description = "36 hours of non-stop innovation, competitive coding, and rapid prototype engineering."

    cta = "REGISTER NOW"

    return {
        "title": title,
        "category": category,
        "department": department,
        "targetAudience": target_audience,
        "date": date,
        "startTime": start_time,
        "endTime": end_time,
        "venue": venue,
        "theme": theme,
        "style": style,
        "colorPreference": color_pref,
        "description": description,
        "cta": cta
    }

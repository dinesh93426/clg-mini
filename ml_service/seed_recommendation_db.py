"""
Seed real events and historical interactions in PostgreSQL if table is empty.
Creates both completed historical events (for training/profiles) and upcoming published events.
"""

from datetime import datetime, timedelta, timezone
from core.db import execute_query, get_db_connection

EVENTS_CATALOG = [
    # ── Upcoming Published Events (for recommendation) ──────────────────────────
    {
        "id": "E101",
        "title": "Generative AI & LLM Workshop",
        "description": "Hands-on workshop building autonomous AI agents with LangChain, Transformers, and vector databases in Python.",
        "category": "Workshop",
        "venue": "Tech Hub Lab 3",
        "days_offset": 5,
        "targetAudience": "CSE & AI Students",
        "status": "PUBLISHED"
    },
    {
        "id": "E102",
        "title": "Full Stack React & Node.js Bootcamp",
        "description": "Comprehensive practical bootcamp covering React 19, Express REST APIs, PostgreSQL, and modern web application deployment.",
        "category": "Workshop",
        "venue": "Software Center Hall A",
        "days_offset": 8,
        "targetAudience": "CSE & IT Students",
        "status": "PUBLISHED"
    },
    {
        "id": "E103",
        "title": "National Collegiate Hackathon 2026",
        "description": "24-hour hackathon solving real-world AI, Web3, FinTech, and IoT challenges with mentors and industry prizes.",
        "category": "Hackathon",
        "venue": "Main Auditorium",
        "days_offset": 12,
        "targetAudience": "All Engineering Students",
        "status": "PUBLISHED"
    },
    {
        "id": "E104",
        "title": "Cloud Computing & DevOps with AWS",
        "description": "Master containerization with Docker, Kubernetes cluster orchestration, and CI/CD automation on AWS cloud infrastructure.",
        "category": "Technical",
        "venue": "Cloud Lab 2",
        "days_offset": 15,
        "targetAudience": "CSE 3rd & 4th Year",
        "status": "PUBLISHED"
    },
    {
        "id": "E105",
        "title": "Data Science & Predictive Analytics Summit",
        "description": "Explore machine learning models, statistical inference, feature engineering, and big data processing with Python and Pandas.",
        "category": "Seminar",
        "venue": "Seminar Hall 1",
        "days_offset": 18,
        "targetAudience": "CSE & Data Science Students",
        "status": "PUBLISHED"
    },
    {
        "id": "E106",
        "title": "Cybersecurity & Ethical Hacking Hands-on",
        "description": "Learn network vulnerability analysis, web application penetration testing, digital forensics, and zero-trust security.",
        "category": "Workshop",
        "venue": "Cyber Defense Lab",
        "days_offset": 21,
        "targetAudience": "All Students",
        "status": "PUBLISHED"
    },
    {
        "id": "E107",
        "title": "Mobile App Development with Flutter",
        "description": "Build high-performance cross-platform iOS and Android applications with Dart, Flutter state management, and Firebase.",
        "category": "Workshop",
        "venue": "Mobile Innovation Center",
        "days_offset": 24,
        "targetAudience": "CSE 2nd & 3rd Year",
        "status": "PUBLISHED"
    },
    {
        "id": "E108",
        "title": "Annual Inter-College Sports Fest",
        "description": "Competitive inter-department tournament featuring Football, Basketball, Badminton, Cricket, and Track events.",
        "category": "Sports",
        "venue": "University Sports Complex",
        "days_offset": 28,
        "targetAudience": "All Students",
        "status": "PUBLISHED"
    },
    {
        "id": "E109",
        "title": "Spring Cultural Music & Drama Fiesta",
        "description": "Campus-wide cultural celebration with battle of bands, theatrical plays, classical dance performances, and art exhibitions.",
        "category": "Cultural",
        "venue": "Open Air Amphitheatre",
        "days_offset": 30,
        "targetAudience": "All Students",
        "status": "PUBLISHED"
    },
    {
        "id": "E110",
        "title": "Competitive Programming & DSA Masterclass",
        "description": "Deep dive into dynamic programming, graph algorithms, segment trees, and coding interview preparation in C++ and Java.",
        "category": "Technical",
        "venue": "Algorithms Lab",
        "days_offset": 33,
        "targetAudience": "CSE Students",
        "status": "PUBLISHED"
    },

    # ── Past Completed Events (for historical interactions) ─────────────────────
    {
        "id": "E001",
        "title": "Introduction to Python & Data Analysis",
        "description": "Foundational Python syntax, data structures, Jupyter notebooks, NumPy arrays, and exploratory data visualization.",
        "category": "Workshop",
        "venue": "Lab 1",
        "days_offset": -45,
        "targetAudience": "CSE 1st & 2nd Year",
        "status": "COMPLETED"
    },
    {
        "id": "E002",
        "title": "Machine Learning Fundamentals",
        "description": "Supervised learning, classification, regression, Scikit-Learn pipelines, and model evaluation metrics.",
        "category": "Seminar",
        "venue": "Seminar Hall 2",
        "days_offset": -35,
        "targetAudience": "CSE & AI Students",
        "status": "COMPLETED"
    },
    {
        "id": "E003",
        "title": "Web Development Foundations: HTML, CSS & JS",
        "description": "Core frontend web development, responsive design layouts, DOM manipulation, and asynchronous JavaScript.",
        "category": "Workshop",
        "venue": "Tech Hall B",
        "days_offset": -25,
        "targetAudience": "CSE 2nd Year",
        "status": "COMPLETED"
    },
    {
        "id": "E004",
        "title": "Autumn Coding Challenge 2025",
        "description": "Speed coding contest testing algorithmic problem solving, data structures, and mathematical optimization.",
        "category": "Hackathon",
        "venue": "Central Computing Lab",
        "days_offset": -20,
        "targetAudience": "All Engineering Students",
        "status": "COMPLETED"
    },
    {
        "id": "E005",
        "title": "Database Systems & SQL Optimization",
        "description": "Relational schema design, normalization, complex SQL joins, indexing strategies, and PostgreSQL query tuning.",
        "category": "Technical",
        "venue": "Lab 4",
        "days_offset": -15,
        "targetAudience": "CSE Students",
        "status": "COMPLETED"
    }
]


def seed_database():
    # 1. Get an organizer
    orgs = execute_query('SELECT id FROM "Organizer" LIMIT 1')
    if not orgs:
        print("No organizer found. Cannot seed events.")
        return
    org_id = orgs[0]["id"]

    # 2. Check if events exist
    existing_events = execute_query('SELECT COUNT(*) as c FROM "Event"')
    if existing_events and existing_events[0]["c"] > 0:
        print(f"Events already exist ({existing_events[0]['c']} found). Skipping event insertion.")
    else:
        print("Seeding events into database...")
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                for ev in EVENTS_CATALOG:
                    ev_date = datetime.now() + timedelta(days=ev["days_offset"])
                    cur.execute(
                        """
                        INSERT INTO "Event" (id, title, description, category, "organizerId", venue, "eventDate", "startTime", "endTime", capacity, "targetAudience", status, "createdAt", "updatedAt")
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                        ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, "eventDate" = EXCLUDED."eventDate", status = EXCLUDED.status;
                        """,
                        (ev["id"], ev["title"], ev["description"], ev["category"], org_id, ev["venue"], ev_date, "10:00", "13:00", 100, ev["targetAudience"], ev["status"])
                    )
            conn.commit()
            print(f"Successfully seeded {len(EVENTS_CATALOG)} events.")
        finally:
            conn.close()

    # 3. Seed historical interactions for existing students
    students = execute_query('SELECT id, name, department, interests, skills FROM "Student"')
    if not students:
        print("No students found.")
        return

    # Seed past interactions for first 20 students based on their profile interests
    print("Seeding realistic historical interactions for students...")
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            for s in students[:30]:
                sid = s["id"]
                interests = [i.lower() for i in (s["interests"] or [])]
                skills = [sk.lower() for sk in (s["skills"] or [])]
                profile_terms = set(interests + skills)

                # Match with past events
                for past_ev in EVENTS_CATALOG[10:]:  # E001 to E005
                    eid = past_ev["id"]
                    ev_text = (past_ev["title"] + " " + past_ev["description"] + " " + past_ev["category"]).lower()
                    
                    has_match = any(t in ev_text for t in profile_terms) or "computer" in s.get("department", "").lower() or "cse" in s.get("department", "").lower()

                    if has_match:
                        # Add Registration
                        cur.execute(
                            """
                            INSERT INTO "Registration" (id, "studentId", "eventId", status, "registeredAt")
                            VALUES (gen_random_uuid(), %s, %s, 'REGISTERED', NOW() - INTERVAL '20 days')
                            ON CONFLICT ("studentId", "eventId") DO NOTHING;
                            """,
                            (sid, eid)
                        )
                        # Add Attendance
                        cur.execute(
                            """
                            INSERT INTO "Attendance" (id, "studentId", "eventId", status, "markedAt")
                            VALUES (gen_random_uuid(), %s, %s, 'PRESENT', NOW() - INTERVAL '19 days')
                            ON CONFLICT ("studentId", "eventId") DO NOTHING;
                            """,
                            (sid, eid)
                        )
                        # Add Feedback
                        cur.execute(
                            """
                            INSERT INTO "Feedback" (id, "studentId", "eventId", rating, comment, sentiment, "sentimentScore", topics, "createdAt", "sentimentModel", "sentimentAnalyzedAt")
                            VALUES (gen_random_uuid(), %s, %s, 5, 'The workshop was excellent and very informative.', 'POSITIVE', 0.99, ARRAY['Hands-on', 'Content'], NOW() - INTERVAL '18 days', 'roberta-base-college-sentiment-finetuned', NOW())
                            ON CONFLICT ("studentId", "eventId") DO NOTHING;
                            """,
                            (sid, eid)
                        )
                        # Add EventInteraction (LIKE, VIEW)
                        cur.execute(
                            """
                            INSERT INTO "EventInteraction" (id, "studentId", "eventId", "interactionType", "createdAt")
                            VALUES (gen_random_uuid(), %s, %s, 'LIKE', NOW() - INTERVAL '21 days');
                            """,
                            (sid, eid)
                        )
                        cur.execute(
                            """
                            INSERT INTO "EventInteraction" (id, "studentId", "eventId", "interactionType", "createdAt")
                            VALUES (gen_random_uuid(), %s, %s, 'VIEW', NOW() - INTERVAL '22 days');
                            """,
                            (sid, eid)
                        )
        conn.commit()
        print("Historical student interactions successfully populated.")
    finally:
        conn.close()


if __name__ == "__main__":
    seed_database()

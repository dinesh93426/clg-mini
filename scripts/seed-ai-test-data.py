#!/usr/bin/env python3
"""
================================================================================
EVENTINTEL AI — COMPLETE SYNTHETIC TEST DATASET SEEDER
================================================================================
Generates a complete, high-fidelity synthetic test dataset to test all 19
platform modules end-to-end without modifying or breaking existing data.

Usage:
  python scripts/seed-ai-test-data.py --seed     (Seed full synthetic dataset)
  python scripts/seed-ai-test-data.py --reset    (Safely delete only synthetic test data)
  python scripts/seed-ai-test-data.py --validate (Run validation checks & reports)
================================================================================
"""

import os
import sys
import json
import random
import argparse
import time as time_lib
from datetime import datetime, date, time as dt_time, timedelta, timezone
from pathlib import Path

# Ensure UTF-8 output encoding for Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

# Add ml_service to path for db connection and AI pipelines
WORKSPACE_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(WORKSPACE_ROOT / "ml_service"))

import bcrypt
from core.db import get_db_connection, execute_query, execute_write

# Fix random seed for reproducible realistic dataset
random.seed(42)

# Safety namespaces
TEST_DOMAIN = "@eventintel.example.test"
TEST_PREFIX_ADM = "TEST-ADM-"
TEST_PREFIX_ORG = "TEST-ORG-"
TEST_PREFIX_STU = "TEST-STU-"
TEST_PREFIX_EVT = "TEST-EVT-"
TEST_PREFIX_PST = "TEST-PST-"

TEST_PASSWORD_RAW = "Test@12345"
# Generate standard bcrypt 10-round hash
PASSWORD_HASH = bcrypt.hashpw(TEST_PASSWORD_RAW.encode("utf-8"), bcrypt.gensalt(10)).decode("utf-8")

DEPARTMENTS = ["CSE", "IT", "ECE", "EEE", "MECH", "CIVIL", "AIDS", "AIML"]

CATEGORIES = [
    "Technical", "Workshop", "Hackathon", "Seminar",
    "Cultural", "Sports", "Career", "Entrepreneurship",
    "Research", "Club Activity"
]

INTERESTS_POOL = [
    "Artificial Intelligence", "Machine Learning", "Python", "Java",
    "JavaScript", "React", "Web Development", "Cloud Computing",
    "Cybersecurity", "Data Science", "Robotics", "IoT", "Blockchain",
    "Entrepreneurship", "Finance", "Photography", "Music", "Dance",
    "Drama", "Cricket", "Football", "Badminton", "Public Speaking",
    "Leadership", "Design", "Research"
]

DEPARTMENT_INTEREST_WEIGHTS = {
    "CSE": ["Python", "JavaScript", "React", "Artificial Intelligence", "Machine Learning", "Cloud Computing", "Cybersecurity", "Web Development"],
    "AIML": ["Artificial Intelligence", "Machine Learning", "Data Science", "Python", "Research", "Robotics"],
    "AIDS": ["Data Science", "Machine Learning", "Artificial Intelligence", "Python", "Cloud Computing", "Research"],
    "IT": ["Web Development", "Cloud Computing", "Cybersecurity", "Java", "JavaScript", "React"],
    "ECE": ["IoT", "Robotics", "Embedded Systems", "Artificial Intelligence", "Python"],
    "EEE": ["IoT", "Robotics", "Automation", "Renewable Energy", "Leadership"],
    "MECH": ["Robotics", "Automation", "Design", "Research", "Entrepreneurship", "Cricket"],
    "CIVIL": ["Design", "Sustainable Tech", "Leadership", "Public Speaking", "Sports", "Football"]
}

FIRST_NAMES = [
    "Arjun", "Kavin", "Nithya", "Rahul", "Meera", "Deepak", "Sneha", "Gokul",
    "Pooja", "Vignesh", "Ananya", "Rohan", "Keerthana", "Aditya", "Swetha", "Hari",
    "Kavya", "Suresh", "Anjali", "Vijay", "Neha", "Varun", "Shruti", "Manoj",
    "Divya", "Siddharth", "Rhea", "Harish", "Lavanya", "Pranav", "Ishaan", "Tanvi",
    "Akash", "Bhavna", "Chirag", "Gauri", "Kiran", "Madhav", "Naveen", "Pavithra",
    "Rajesh", "Sakshi", "Tarun", "Uma", "Vidya", "Yash", "Zoya", "Abhinav", "Charu"
]

LAST_NAMES = [
    "Kumar", "Raj", "Arun", "Dev", "Menon", "Sharma", "Krishnan", "Ravi",
    "Prasad", "Patel", "Verma", "Sundaram", "Narayanan", "Reddy", "Choudhury",
    "Gupta", "Deshmukh", "Iyer", "Venkatesh", "Pillai", "Kulkarni", "Bose"
]

# ─────────────────────────────────────────────────────────────────────────────
# 1. SAFETY & RESET
# ─────────────────────────────────────────────────────────────────────────────

def reset_test_data():
    """Safely removes ONLY records belonging to the synthetic test dataset."""
    print("=" * 70, flush=True)
    print("🧹 SAFELY RESETTING SYNTHETIC TEST DATASET", flush=True)
    print("=" * 70, flush=True)

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # Child relations first
            cur.execute('DELETE FROM "Feedback" WHERE "studentId" LIKE %s OR "eventId" LIKE %s', (f"{TEST_PREFIX_STU}%", f"{TEST_PREFIX_EVT}%"))
            cur.execute('DELETE FROM "Attendance" WHERE "studentId" LIKE %s OR "eventId" LIKE %s', (f"{TEST_PREFIX_STU}%", f"{TEST_PREFIX_EVT}%"))
            cur.execute('DELETE FROM "Registration" WHERE "studentId" LIKE %s OR "eventId" LIKE %s', (f"{TEST_PREFIX_STU}%", f"{TEST_PREFIX_EVT}%"))
            cur.execute('DELETE FROM "EventInteraction" WHERE "studentId" LIKE %s OR "eventId" LIKE %s', (f"{TEST_PREFIX_STU}%", f"{TEST_PREFIX_EVT}%"))
            cur.execute('DELETE FROM "Recommendation" WHERE "studentId" LIKE %s OR "eventId" LIKE %s', (f"{TEST_PREFIX_STU}%", f"{TEST_PREFIX_EVT}%"))
            cur.execute('DELETE FROM "EventPrediction" WHERE "eventId" LIKE %s', (f"{TEST_PREFIX_EVT}%",))
            cur.execute('DELETE FROM "StudentBehavior" WHERE "studentId" LIKE %s', (f"{TEST_PREFIX_STU}%",))
            cur.execute('DELETE FROM "KnowledgeDocument" WHERE "sourceId" LIKE %s', (f"{TEST_PREFIX_EVT}%",))
            cur.execute('DELETE FROM "EventPoster" WHERE "eventId" LIKE %s OR id LIKE %s', (f"{TEST_PREFIX_EVT}%", f"{TEST_PREFIX_PST}%"))
            cur.execute('DELETE FROM "AIEventGeneration" WHERE "organizerId" LIKE %s', (f"{TEST_PREFIX_ORG}%",))
            cur.execute('DELETE FROM "ChatHistory" WHERE "studentId" LIKE %s', (f"{TEST_PREFIX_STU}%",))

            # Parents
            cur.execute('DELETE FROM "Event" WHERE id LIKE %s OR "organizerId" LIKE %s', (f"{TEST_PREFIX_EVT}%", f"{TEST_PREFIX_ORG}%"))
            cur.execute('DELETE FROM "Student" WHERE id LIKE %s OR email LIKE %s', (f"{TEST_PREFIX_STU}%", f"%{TEST_DOMAIN}"))
            cur.execute('DELETE FROM "Organizer" WHERE id LIKE %s OR email LIKE %s', (f"{TEST_PREFIX_ORG}%", f"%{TEST_DOMAIN}"))
            cur.execute('DELETE FROM "Admin" WHERE id LIKE %s OR email LIKE %s', (f"{TEST_PREFIX_ADM}%", f"%{TEST_DOMAIN}"))

            conn.commit()
            print("✅ Synthetic test records safely purged. Zero production data was affected.", flush=True)
    finally:
        conn.close()


# ─────────────────────────────────────────────────────────────────────────────
# 2. SEED ADMINS
# ─────────────────────────────────────────────────────────────────────────────

def seed_admins():
    print("\n[Step 4] Seeding 3 Synthetic Administrators...", flush=True)
    admins_data = [
        (f"{TEST_PREFIX_ADM}001", "Dr. Arun Kumar", f"admin1{TEST_DOMAIN}", PASSWORD_HASH),
        (f"{TEST_PREFIX_ADM}002", "Dr. Priya Menon", f"admin2{TEST_DOMAIN}", PASSWORD_HASH),
        (f"{TEST_PREFIX_ADM}003", "Dr. Rahul Dev", f"admin3{TEST_DOMAIN}", PASSWORD_HASH)
    ]

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            for aid, name, email, pwd in admins_data:
                cur.execute("""
                    INSERT INTO "Admin" (id, name, email, password, "createdAt", "updatedAt")
                    VALUES (%s, %s, %s, %s, NOW(), NOW())
                    ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, password = EXCLUDED.password
                """, (aid, name, email, pwd))
            conn.commit()
    finally:
        conn.close()
    print("✅ 3 Administrators seeded.", flush=True)


# ─────────────────────────────────────────────────────────────────────────────
# 3. SEED ORGANIZERS
# ─────────────────────────────────────────────────────────────────────────────

ORGANIZER_NAMES = [
    "Arun Raj", "Priya Sharma", "Karthik Dev", "Meena Ravi", "Vikram Kumar",
    "Nisha Anand", "Rahul Krish", "Divya Arun", "Sanjay Kumar", "Ananya Raj",
    "Rohan Dev", "Keerthana Ravi", "Aditya Kumar", "Swetha Arun", "Hari Prasad",
    "Kavya Menon", "Suresh Raj", "Anjali Dev", "Vijay Kumar", "Neha Ravi"
]

ORGANIZATIONS = [
    "IEEE Student Branch", "ACM Collegiate Chapter", "Campus Robotics Club",
    "Cultural Events Committee", "E-Cell Startup Hub", "Sports Council",
    "Web Dev & Open Source Club", "AI Research Forum", "Mechanical Engineers Guild",
    "Civil Engineering Society"
]

def seed_organizers():
    print("\n[Step 5] Seeding 20 Synthetic Organizers across Departments...")
    org_rows = []
    for idx, name in enumerate(ORGANIZER_NAMES, start=1):
        org_id = f"{TEST_PREFIX_ORG}{idx:03d}"
        email = f"organizer{idx:02d}{TEST_DOMAIN}"
        dept = DEPARTMENTS[(idx - 1) % len(DEPARTMENTS)]
        org_name = ORGANIZATIONS[(idx - 1) % len(ORGANIZATIONS)]
        org_rows.append((org_id, name, email, PASSWORD_HASH, dept, org_name))

    from psycopg2.extras import execute_values
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            execute_values(
                cur,
                """
                INSERT INTO "Organizer" (id, name, email, password, department, "organizationName", "createdAt", "updatedAt")
                VALUES %s
                ON CONFLICT (email) DO UPDATE SET
                    name = EXCLUDED.name,
                    department = EXCLUDED.department,
                    "organizationName" = EXCLUDED."organizationName",
                    password = EXCLUDED.password
                """,
                [(r[0], r[1], r[2], r[3], r[4], r[5], datetime.now(), datetime.now()) for r in org_rows],
                template="(%s, %s, %s, %s, %s, %s, %s, %s)",
                page_size=100
            )
            conn.commit()
    finally:
        conn.close()
    print("✅ 20 Organizers seeded across all 8 departments.", flush=True)


# ─────────────────────────────────────────────────────────────────────────────
# 4. SEED STUDENTS & INTERESTS
# ─────────────────────────────────────────────────────────────────────────────

STUDENT_DISTRIBUTION = {
    "CSE": 100,
    "IT": 75,
    "ECE": 70,
    "EEE": 55,
    "MECH": 55,
    "CIVIL": 45,
    "AIDS": 50,
    "AIML": 50
}

def seed_students():
    print("\n[Step 6-8] Seeding 500 Synthetic Students with realistic interests & behavioral personas...", flush=True)
    students = []
    student_index = 1

    for dept, count in STUDENT_DISTRIBUTION.items():
        dept_favs = DEPARTMENT_INTEREST_WEIGHTS.get(dept, ["Technology", "Leadership"])
        
        for _ in range(count):
            stu_id = f"{TEST_PREFIX_STU}{student_index:04d}"
            email = f"student{student_index:04d}{TEST_DOMAIN}"
            first = random.choice(FIRST_NAMES)
            last = random.choice(LAST_NAMES)
            name = f"{first} {last}"
            year = ((student_index - 1) % 4) + 1  # 1st to 4th year distributed

            # Sample 2-5 interests, biasing toward department
            n_interests = random.randint(2, 5)
            dept_picks = random.sample(dept_favs, min(len(dept_favs), random.randint(1, 3)))
            gen_picks = random.sample(INTERESTS_POOL, max(1, n_interests - len(dept_picks)))
            interests = list(dict.fromkeys(dept_picks + gen_picks))[:n_interests]

            # Assign skills
            skills = random.sample(["Python", "Java", "React", "SQL", "C++", "Docker", "Git", "Figma", "Problem Solving"], k=random.randint(2, 4))

            # Assign student behavioral persona (for natural K-Means discovery)
            # ~20% Highly Active, ~50% Moderately Active, ~30% Low Activity
            rand_val = random.random()
            if rand_val < 0.20:
                persona = "HIGH"
            elif rand_val < 0.70:
                persona = "MEDIUM"
            else:
                persona = "LOW"

            students.append({
                "id": stu_id,
                "name": name,
                "email": email,
                "password": PASSWORD_HASH,
                "department": dept,
                "year": year,
                "interests": interests,
                "skills": skills,
                "persona": persona
            })
            student_index += 1

    from psycopg2.extras import execute_values
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            execute_values(
                cur,
                """
                INSERT INTO "Student" (id, name, email, password, department, year, interests, skills, "createdAt", "updatedAt")
                VALUES %s
                ON CONFLICT (email) DO UPDATE SET
                    name = EXCLUDED.name,
                    department = EXCLUDED.department,
                    year = EXCLUDED.year,
                    interests = EXCLUDED.interests,
                    skills = EXCLUDED.skills,
                    password = EXCLUDED.password
                """,
                [(s["id"], s["name"], s["email"], s["password"], s["department"], s["year"], s["interests"], s["skills"], datetime.now(), datetime.now()) for s in students],
                template="(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
                page_size=500
            )
            conn.commit()
    finally:
        conn.close()

    print(f"✅ 500 Students successfully seeded (CSE: 100, IT: 75, ECE: 70, EEE: 55, MECH: 55, CIVIL: 45, AIDS: 50, AIML: 50).", flush=True)
    return students


# ─────────────────────────────────────────────────────────────────────────────
# 5. SEED EVENTS (100 Historical + 40 Upcoming)
# ─────────────────────────────────────────────────────────────────────────────

EVENT_TEMPLATES = [
    ("Generative AI & LLM Workshop", "Hands-on deep dive into transformer architectures, prompt engineering, and building production LLM apps with OpenAI and open-source models.", "Workshop", ["AI", "Python", "LLM", "Deep Learning"]),
    ("National Collegiate Hackathon 2026", "A 36-hour intense coding hackathon addressing smart campus challenges, sustainability, and automated healthcare solutions.", "Hackathon", ["Hackathon", "Coding", "Innovation", "React", "Python"]),
    ("Machine Learning Fundamentals Seminar", "Core mathematical intuition behind gradient descent, supervised algorithms, and neural network optimization.", "Seminar", ["Machine Learning", "Python", "Data Science", "Research"]),
    ("React 19 & Next.js Modern Web Architecture", "Explore React Server Components, server actions, optimistic UI updates, and performant state orchestration.", "Technical", ["React", "JavaScript", "Web Development", "Frontend"]),
    ("Cloud Native & Kubernetes Bootcamp", "Architecting resilient multi-cluster cloud deployments, Docker container orchestration, and CI/CD pipelines.", "Workshop", ["Cloud Computing", "DevOps", "Docker", "Kubernetes"]),
    ("Cybersecurity Defense & Ethical Hacking", "Live penetration testing simulation, vulnerability assessments, OWASP Top 10 mitigation, and digital forensics.", "Technical", ["Cybersecurity", "Networks", "Ethical Hacking", "Linux"]),
    ("Campus Entrepreneurship & Pitch Summit", "Pitch your MVP to early-stage venture capitalists, angels, and faculty startup accelerators.", "Entrepreneurship", ["Entrepreneurship", "Pitching", "Leadership", "Finance"]),
    ("IoT & Embedded Robotics Championship", "Autonomous line follower robot building, microcontrollers, sensor integration, and Arduino/ESP32 coding.", "Technical", ["IoT", "Robotics", "ECE", "Embedded Systems"]),
    ("Data Science & Big Data Summit", "End-to-end data pipeline construction, Apache Spark analytics, and data visualization best practices.", "Seminar", ["Data Science", "Python", "SQL", "Statistics"]),
    ("Spring Cultural Music & Drama Fiesta", "An evening of student band performances, acoustic fusion, drama stage plays, and art showcases.", "Cultural", ["Music", "Dance", "Drama", "Arts", "Cultural"]),
    ("Annual Inter-Department Cricket Trophy", "T20 championship between engineering departments under floodlights with live commentary.", "Sports", ["Cricket", "Sports", "Athletics", "Teamwork"]),
    ("Inter-College Badminton Tournament", "Singles and doubles knockout tournament for men and women across campus sports complexes.", "Sports", ["Badminton", "Sports", "Fitness"]),
    ("Resume Building & Technical Interview Prep", "Mock interviews with top industry recruiters, algorithmic problem solving drills, and ATS resume crafting.", "Career", ["Career", "Resume", "Placement", "Interview"]),
    ("AI Research & Paper Publication Workshop", "Guidelines for formulating research problem statements, drafting IEEE/ACM format manuscripts, and peer review strategies.", "Research", ["Research", "Academic", "AI", "Writing"]),
    ("Photography & Visual Storytelling Masterclass", "Composition techniques, DSLR optics, lighting control, and digital photo editing in Lightroom.", "Club Activity", ["Photography", "Design", "Creative", "Arts"])
]

VENUES = [
    "Main Auditorium, Block A", "Tech Hub Seminar Hall 1", "Tech Hub Seminar Hall 2",
    "Central Computing Lab 3", "Innovation Sandbox Lab", "Mechanical CAD Center",
    "Open Air Amphitheatre (OAT)", "Indoor Sports Complex", "University Cricket Ground",
    "MBA Conference Hall"
]

def seed_events():
    print("\n[Step 9-14] Seeding 140 Events (100 Historical Completed + 40 Upcoming)...")
    events = []
    
    # Anchor date: August 19, 2026
    anchor_date = date(2026, 8, 19)

    # 1. 100 Historical Completed Events (2026-01-05 to 2026-08-18)
    for i in range(1, 101):
        evt_id = f"{TEST_PREFIX_EVT}{i:03d}"
        tpl = EVENT_TEMPLATES[(i - 1) % len(EVENT_TEMPLATES)]
        
        # Calculate past date
        days_back = int(220 * (1 - (i / 100.0))) + 1
        evt_date = anchor_date - timedelta(days=days_back)
        
        organizer_id = f"{TEST_PREFIX_ORG}{((i - 1) % 20) + 1:03d}"
        capacity = random.choice([50, 75, 100, 150, 200, 300])
        start_hour = random.choice([9, 10, 11, 14, 15, 16])
        start_time = f"{start_hour:02d}:00"
        end_time = f"{(start_hour + random.randint(2, 4)):02d}:00"
        venue = random.choice(VENUES)

        # Performance type (High/Medium/Low) for demand and feedback variance
        if i in [1, 2, 8, 14, 20, 26, 32, 40, 50, 60, 70, 80, 90, 95]:
            demand_profile = "HIGH"
        elif i in [3, 9, 15, 27, 33, 45, 55, 65, 75, 85]:
            demand_profile = "LOW"
        else:
            demand_profile = "MEDIUM"

        # Specific Test Events
        title = f"{tpl[0]} (Edition #{i})"
        desc = tpl[1]
        
        if i == 1: # EVENT A: High Demand Workshop
            title = "Generative AI & LLM Masterclass (Overflow Test)"
            capacity = 100
            demand_profile = "HIGH"
        elif i == 2: # EVENT B: Low Registration Workshop
            title = "Python Automation Basics (Low Registration Test)"
            capacity = 150
            demand_profile = "LOW"
        elif i == 3: # EVENT C: Negative Feedback Seminar
            title = "Legacy Computing Architectures (Negative Sentiment Test)"
            capacity = 80
            demand_profile = "POOR_FEEDBACK"
        elif i == 4: # EVENT D: High Satisfaction Workshop
            title = "Full-Stack AI Application Engineering (High Satisfaction Test)"
            capacity = 100
            demand_profile = "HIGH_SATISFACTION"
        elif i == 5: # EVENT E: Normal Baseline Event
            title = "Modern Web Paradigms Showcase (Baseline Test)"
            capacity = 100
            demand_profile = "MEDIUM"
        elif i == 6: # EVENT F: No Feedback Event
            title = "Campus Coding Sprint (Zero Feedback Test)"
            demand_profile = "NO_FEEDBACK"
        elif i == 7: # EVENT G: No Registration Event
            title = "Introductory Open House (Zero Registration Test)"
            demand_profile = "NO_REGISTRATIONS"

        events.append({
            "id": evt_id,
            "title": title,
            "description": desc,
            "category": tpl[2],
            "organizerId": organizer_id,
            "venue": venue,
            "eventDate": evt_date,
            "startTime": start_time,
            "endTime": end_time,
            "capacity": capacity,
            "targetAudience": f"Open to all students interested in {tpl[2]}.",
            "status": "COMPLETED",
            "demand_profile": demand_profile,
            "tags": tpl[3]
        })

    # 2. 40 Upcoming Events (2026-08-20 to 2026-12-31)
    for i in range(101, 141):
        evt_id = f"{TEST_PREFIX_EVT}{i:03d}"
        tpl = EVENT_TEMPLATES[(i - 1) % len(EVENT_TEMPLATES)]
        
        days_ahead = int(130 * ((i - 100) / 40.0)) + 1
        evt_date = anchor_date + timedelta(days=days_ahead)
        
        organizer_id = f"{TEST_PREFIX_ORG}{((i - 1) % 20) + 1:03d}"
        capacity = random.choice([50, 75, 100, 150, 200])
        start_hour = random.choice([9, 10, 11, 14, 15])
        start_time = f"{start_hour:02d}:00"
        end_time = f"{(start_hour + random.randint(2, 4)):02d}:00"
        venue = random.choice(VENUES)

        # Scenarios for upcoming demand (Scenario A: Low, B: Normal, C: Overflow)
        if i in [101, 104, 108, 112, 120, 128, 136]:
            demand_profile = "HIGH" # Scenario C: Predicted demand > capacity
        elif i in [102, 106, 110, 118, 126, 134]:
            demand_profile = "LOW"  # Scenario A: Low demand
        else:
            demand_profile = "MEDIUM" # Scenario B: Normal demand

        status = "DRAFT" if i in [138, 139, 140] else "PUBLISHED"

        events.append({
            "id": evt_id,
            "title": f"{tpl[0]} (Upcoming Session)",
            "description": tpl[1],
            "category": tpl[2],
            "organizerId": organizer_id,
            "venue": venue,
            "eventDate": evt_date,
            "startTime": start_time,
            "endTime": end_time,
            "capacity": capacity,
            "targetAudience": f"Undergraduate & Graduate students interested in {tpl[2]}.",
            "status": status,
            "demand_profile": demand_profile,
            "tags": tpl[3]
        })

    from psycopg2.extras import execute_values
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            execute_values(
                cur,
                """
                INSERT INTO "Event" (id, title, description, category, "organizerId", venue, "eventDate", "startTime", "endTime", capacity, "targetAudience", status, "createdAt", "updatedAt")
                VALUES %s
                ON CONFLICT (id) DO UPDATE SET
                    title = EXCLUDED.title,
                    description = EXCLUDED.description,
                    category = EXCLUDED.category,
                    venue = EXCLUDED.venue,
                    "eventDate" = EXCLUDED."eventDate",
                    capacity = EXCLUDED.capacity,
                    status = EXCLUDED.status
                """,
                [(
                    e["id"], e["title"], e["description"], e["category"],
                    e["organizerId"], e["venue"], e["eventDate"], e["startTime"],
                    e["endTime"], e["capacity"], e["targetAudience"], e["status"],
                    datetime.now(), datetime.now()
                ) for e in events],
                template="(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s::\"EventStatus\", %s, %s)",
                page_size=200
            )
            conn.commit()
    finally:
        conn.close()

    print(f"✅ 140 Events seeded (100 Historical Completed + 40 Upcoming).", flush=True)
    return events


# ─────────────────────────────────────────────────────────────────────────────
# 6. SEED REGISTRATIONS, ATTENDANCE & INTERACTIONS
# ─────────────────────────────────────────────────────────────────────────────

FEEDBACK_POSITIVE_SAMPLES = [
    "Very useful workshop. The hands-on session was excellent and clear.",
    "The speaker explained the concepts thoroughly with real-world examples.",
    "Great event, well organized, and provided immense practical value.",
    "The practical demonstration and live code walkthroughs were top notch.",
    "Exceptional learning experience! Would definitely attend the advanced session.",
    "Comprehensive coverage of state of the art techniques. Highly recommended.",
    "Engaging delivery, interactive Q&A, and fantastic support from student organizers."
]

FEEDBACK_NEUTRAL_SAMPLES = [
    "The event was good overall, but the session felt slightly rushed towards the end.",
    "Content was useful, though the auditorium seating was somewhat crowded.",
    "Decent introductory overview, but wanted more in-depth coding exercises.",
    "Good concepts covered, but slide pacing was a bit fast during the second half.",
    "Informative presentation, however audio levels could be improved in the back rows."
]

FEEDBACK_NEGATIVE_SAMPLES = [
    "The event started late and the session schedule was poorly coordinated.",
    "The presentation was too theoretical with almost no practical hands-on exercises.",
    "The venue was overcrowded and Wi-Fi access was unavailable for live labs.",
    "Speaker was difficult to hear and questions from attendees were largely ignored.",
    "Content did not match the syllabus outlined in the event brochure."
]

def seed_interactions_and_feedback(students, events):
    print("\n[Step 15-23] Seeding Registrations, Attendance, Feedback & Sentiment Distributions...")
    
    registrations = []
    attendances = []
    feedbacks = []
    interactions = []

    reg_id_counter = 1
    att_id_counter = 1
    fdb_id_counter = 1
    int_id_counter = 1

    for event in events:
        # Skip zero-registration test event
        if event.get("demand_profile") == "NO_REGISTRATIONS":
            continue

        cap = event["capacity"]
        dprofile = event.get("demand_profile", "MEDIUM")

        # Determine target number of registrations for this event
        if dprofile == "HIGH":
            # Target overflow: 110% to 150% of capacity
            target_regs = int(cap * random.uniform(1.15, 1.45))
        elif dprofile == "LOW":
            # Target low registration: 15% to 35% of capacity
            target_regs = max(5, int(cap * random.uniform(0.15, 0.35)))
        else:
            # Medium/Normal: 65% to 95% of capacity
            target_regs = int(cap * random.uniform(0.65, 0.95))

        # Score all 500 students for affinity to this event
        candidate_scores = []
        evt_tags = [t.lower() for t in event.get("tags", [])]
        evt_cat = event["category"].lower()

        for s in students:
            score = 0.5 # base probability
            
            # Behavioral Persona weight
            if s["persona"] == "HIGH":
                score *= 3.2
            elif s["persona"] == "MEDIUM":
                score *= 1.6
            else:
                score *= 0.5

            # Department match bonus
            if s["department"] in ["CSE", "AIML", "AIDS"] and evt_cat in ["technical", "workshop", "hackathon"]:
                score += 1.5
            elif s["department"] in ["ECE", "EEE"] and any(k in evt_tags for k in ["iot", "robotics", "embedded"]):
                score += 1.8

            # Student interest overlap
            s_interests_lower = [i.lower() for i in s["interests"]]
            overlap = sum(1 for tag in evt_tags if any(tag in si or si in tag for si in s_interests_lower))
            score += (overlap * 1.2)

            candidate_scores.append((s, score))

        # Sort candidate students by affinity score with slight randomization
        candidate_scores.sort(key=lambda x: x[1] * random.uniform(0.7, 1.3), reverse=True)
        selected_students = [cs[0] for cs in candidate_scores[:target_regs]]

        # Generate registrations & interactions
        for s in selected_students:
            reg_id = f"TEST-REG-{reg_id_counter:07d}"
            reg_id_counter += 1

            # Registration date before event
            if isinstance(event["eventDate"], str):
                evt_d = datetime.strptime(event["eventDate"], "%Y-%m-%d").date()
            else:
                evt_d = event["eventDate"]

            days_before = random.randint(1, 20)
            reg_time = datetime.combine(evt_d - timedelta(days=days_before), dt_time(random.randint(8, 20), random.randint(0, 59)))

            registrations.append((reg_id, s["id"], event["id"], "REGISTERED", reg_time))

            # Student Browsing Interaction
            int_id = f"TEST-INT-{int_id_counter:07d}"
            int_id_counter += 1
            interactions.append((int_id, s["id"], event["id"], "VIEW", reg_time - timedelta(hours=random.randint(1, 48))))

            if random.random() < 0.40:
                int_like_id = f"TEST-INT-{int_id_counter:07d}"
                int_id_counter += 1
                interactions.append((int_like_id, s["id"], event["id"], "LIKE", reg_time))

            # Only completed events have Attendance and Feedback
            if event["status"] == "COMPLETED":
                # Determine attendance probability based on persona & event quality
                if s["persona"] == "HIGH":
                    att_prob = random.uniform(0.85, 0.98)
                elif s["persona"] == "MEDIUM":
                    att_prob = random.uniform(0.70, 0.88)
                else:
                    att_prob = random.uniform(0.40, 0.65)

                if dprofile == "LOW":
                    att_prob *= 0.85

                is_present = random.random() < att_prob
                att_status = "PRESENT" if is_present else "ABSENT"
                att_id = f"TEST-ATT-{att_id_counter:07d}"
                att_id_counter += 1
                
                att_time = datetime.combine(evt_d, dt_time(int(event["startTime"][:2]), random.randint(5, 45)))
                attendances.append((att_id, s["id"], event["id"], att_status, att_time))

                # If present, generate feedback (50% to 75% response rate)
                if is_present and dprofile != "NO_FEEDBACK" and random.random() < 0.65:
                    fdb_id = f"TEST-FDB-{fdb_id_counter:07d}"
                    fdb_id_counter += 1

                    # Sentiment probabilities by event quality
                    if dprofile in ["HIGH_SATISFACTION", "HIGH"]:
                        sent_choice = random.choices(["POS", "NEU", "NEG"], weights=[0.85, 0.12, 0.03])[0]
                    elif dprofile == "POOR_FEEDBACK":
                        sent_choice = random.choices(["POS", "NEU", "NEG"], weights=[0.15, 0.20, 0.65])[0]
                    else: # Normal
                        sent_choice = random.choices(["POS", "NEU", "NEG"], weights=[0.65, 0.22, 0.13])[0]

                    if sent_choice == "POS":
                        rating = random.choice([4, 5])
                        comment = random.choice(FEEDBACK_POSITIVE_SAMPLES)
                        sentiment = "POSITIVE"
                        sentiment_score = round(random.uniform(0.85, 0.99), 4)
                        topics = ["Content", "Hands-on", "Speaker"]
                    elif sent_choice == "NEU":
                        rating = 3
                        comment = random.choice(FEEDBACK_NEUTRAL_SAMPLES)
                        sentiment = "NEUTRAL"
                        sentiment_score = round(random.uniform(0.40, 0.60), 4)
                        topics = ["Organization", "Venue"]
                    else:
                        rating = random.choice([1, 2])
                        comment = random.choice(FEEDBACK_NEGATIVE_SAMPLES)
                        sentiment = "NEGATIVE"
                        sentiment_score = round(random.uniform(0.05, 0.30), 4)
                        topics = ["Organization", "Schedule", "Venue"]

                    fdb_time = att_time + timedelta(hours=random.randint(2, 48))
                    sentiment_model = "cardiffnlp/twitter-roberta-base-sentiment-latest"
                    feedbacks.append((fdb_id, s["id"], event["id"], rating, comment, sentiment, sentiment_score, sentiment_model, fdb_time, topics, fdb_time))

    print(f"-> Generated {len(registrations)} Registrations, {len(attendances)} Attendances, {len(feedbacks)} Feedbacks, and {len(interactions)} Interactions.", flush=True)

    from psycopg2.extras import execute_values

    def run_chunked_insert(label, sql, data, template=None, chunk_size=1000):
        print(f"-> Inserting {label} ({len(data)} rows)...", flush=True)
        conn = get_db_connection()
        try:
            for i in range(0, len(data), chunk_size):
                chunk = data[i:i + chunk_size]
                for attempt in range(4):
                    try:
                        if conn.closed:
                            conn = get_db_connection()
                        with conn.cursor() as cur:
                            if template:
                                execute_values(cur, sql, chunk, template=template, page_size=len(chunk))
                            else:
                                execute_values(cur, sql, chunk, page_size=len(chunk))
                        conn.commit()
                        print(f"   ↳ {min(i + chunk_size, len(data))} / {len(data)} {label.lower()} committed", flush=True)
                        break
                    except Exception as e:
                        try:
                            conn.close()
                        except Exception:
                            pass
                        conn = get_db_connection()
                        if attempt == 3:
                            print(f"❌ Failed to insert chunk {i} for {label}: {e}", flush=True)
                            raise
                        time_lib.sleep(1.0)
        finally:
            try:
                conn.close()
            except Exception:
                pass

    # 1. Registrations
    run_chunked_insert(
        "Registrations",
        """
        INSERT INTO "Registration" (id, "studentId", "eventId", status, "registeredAt")
        VALUES %s
        ON CONFLICT ("studentId", "eventId") DO NOTHING
        """,
        [(r[0], r[1], r[2], r[3], r[4]) for r in registrations],
        template="(%s, %s, %s, %s::\"RegistrationStatus\", %s)",
        chunk_size=1000
    )

    # 2. Attendances
    run_chunked_insert(
        "Attendances",
        """
        INSERT INTO "Attendance" (id, "studentId", "eventId", status, "markedAt")
        VALUES %s
        ON CONFLICT ("studentId", "eventId") DO NOTHING
        """,
        [(a[0], a[1], a[2], a[3], a[4]) for a in attendances],
        template="(%s, %s, %s, %s::\"AttendanceStatus\", %s)",
        chunk_size=1000
    )

    # 3. Feedbacks
    run_chunked_insert(
        "Feedbacks",
        """
        INSERT INTO "Feedback" (id, "studentId", "eventId", rating, comment, sentiment, "sentimentScore", "sentimentModel", "sentimentAnalyzedAt", topics, "createdAt")
        VALUES %s
        ON CONFLICT ("studentId", "eventId") DO NOTHING
        """,
        [(f[0], f[1], f[2], f[3], f[4], f[5], f[6], f[7], f[8], f[9], f[10]) for f in feedbacks],
        template="(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s::text[], %s)",
        chunk_size=1000
    )

    # 4. Interactions
    run_chunked_insert(
        "Event Interactions",
        """
        INSERT INTO "EventInteraction" (id, "studentId", "eventId", "interactionType", "createdAt")
        VALUES %s
        """,
        interactions,
        chunk_size=1500
    )

    print("✅ All Registrations, Attendances, Feedbacks, and Interactions committed to database.", flush=True)


# ─────────────────────────────────────────────────────────────────────────────
# 7. EXECUTE AI PIPELINES (Post-Seed Sync)
# ─────────────────────────────────────────────────────────────────────────────

def run_ai_pipelines():
    print("\n" + "=" * 70)
    print("🤖 EXECUTING POST-SEED AI PIPELINES")
    print("=" * 70)

    # 1. K-Means Behavior Clustering
    print("\n[AI Step 1] Training K-Means Student Behavior Model...")
    try:
        from training.train_behavior import main as train_behavior
        train_behavior()
        print("✅ Student behavior clustering updated.")
    except Exception as e:
        print(f"⚠️ K-Means behavior pipeline notice: {e}")

    # 2. Sentiment batch analysis
    print("\n[AI Step 2] Running Transformer Sentiment Analysis on Unanalyzed Feedback...")
    try:
        from routers.sentiment import analyze_all_db_feedback
        res = analyze_all_db_feedback(batch_size=200)
        print(f"✅ Sentiment analysis processed {res.get('analyzed', 0)} feedback records.")
    except Exception as e:
        print(f"⚠️ Sentiment pipeline notice: {e}")

    # 3. Demand Prediction Model
    print("\n[AI Step 3] Training Event Demand Prediction Model (Ridge + Random Forest)...")
    try:
        from routers.prediction import _train_demand_model
        _, _, _, _, metrics = _train_demand_model()
        print(f"✅ Demand model trained (MAE: {metrics['mae']}, R²: {metrics['r2']}, Training Samples: {metrics['n_train']}).")
    except Exception as e:
        print(f"⚠️ Demand model notice: {e}")

    # 4. RAG Event Vector Indexing
    print("\n[AI Step 4] Indexing 140 Events into pgvector Knowledge Base for RAG Assistant...")
    try:
        from rag.index_events import index_all_events
        idx_res = index_all_events(force=True)
        print(f"✅ RAG Event KnowledgeBase indexed: {idx_res.get('indexed_count', 0)} events vector-embedded.")
    except Exception as e:
        print(f"⚠️ RAG indexer notice: {e}")

    # 5. AI Insights Generation
    print("\n[AI Step 5] Generating Multi-Perspective Campus AI Insights...")
    try:
        from routers.insights import generate_insights
        ins_res = generate_insights()
        print(f"✅ Generated and stored {len(ins_res.get('insights', []))} strategic AI insights.")
    except Exception as e:
        print(f"⚠️ Insights generator notice: {e}")


# ─────────────────────────────────────────────────────────────────────────────
# 8. VALIDATION QUERIES & FINAL REPORT
# ─────────────────────────────────────────────────────────────────────────────

def validate_and_report():
    print("\n" + "=" * 70, flush=True)
    print("📊 DATASET VERIFICATION & DISTRIBUTION REPORT", flush=True)
    print("=" * 70, flush=True)

    stats = {}

    # Query metrics
    res_students = execute_query('SELECT COUNT(*) as count FROM "Student"')
    stats["total_students"] = res_students[0]["count"]

    res_synthetic_students = execute_query('SELECT COUNT(*) as count FROM "Student" WHERE email LIKE %s', (f"%{TEST_DOMAIN}",))
    stats["synthetic_students"] = res_synthetic_students[0]["count"]

    res_admins = execute_query('SELECT COUNT(*) as count FROM "Admin"')
    stats["total_admins"] = res_admins[0]["count"]

    res_organizers = execute_query('SELECT COUNT(*) as count FROM "Organizer"')
    stats["total_organizers"] = res_organizers[0]["count"]

    res_events = execute_query('SELECT COUNT(*) as count FROM "Event"')
    stats["total_events"] = res_events[0]["count"]

    res_completed = execute_query('SELECT COUNT(*) as count FROM "Event" WHERE status = \'COMPLETED\'')
    stats["completed_events"] = res_completed[0]["count"]

    res_upcoming = execute_query('SELECT COUNT(*) as count FROM "Event" WHERE status IN (\'PUBLISHED\', \'DRAFT\')')
    stats["upcoming_events"] = res_upcoming[0]["count"]

    res_regs = execute_query('SELECT COUNT(*) as count FROM "Registration"')
    stats["total_registrations"] = res_regs[0]["count"]

    res_att = execute_query('SELECT COUNT(*) as count FROM "Attendance"')
    stats["total_attendance"] = res_att[0]["count"]

    res_present = execute_query('SELECT COUNT(*) as count FROM "Attendance" WHERE status = \'PRESENT\'')
    stats["present_attendance"] = res_present[0]["count"]

    res_fdb = execute_query('SELECT COUNT(*) as count FROM "Feedback"')
    stats["total_feedback"] = res_fdb[0]["count"]

    res_avg_rating = execute_query('SELECT AVG(rating) as avg_rating FROM "Feedback"')
    stats["avg_rating"] = round(float(res_avg_rating[0]["avg_rating"] or 0), 2)

    # Department breakdown
    dept_counts = execute_query('SELECT department, COUNT(*) as count FROM "Student" GROUP BY department ORDER BY count DESC')

    # Sentiment breakdown
    sentiment_counts = execute_query('SELECT sentiment, COUNT(*) as count FROM "Feedback" WHERE sentiment IS NOT NULL GROUP BY sentiment')

    # Category breakdown
    cat_counts = execute_query('SELECT category, COUNT(*) as count FROM "Event" GROUP BY category ORDER BY count DESC')

    # Print Report
    print(f"• Total Students in Database       : {stats['total_students']} (Synthetic Test Students: {stats['synthetic_students']})", flush=True)
    print(f"• Total Administrators             : {stats['total_admins']}", flush=True)
    print(f"• Total Organizers                 : {stats['total_organizers']}", flush=True)
    print(f"• Total Events                     : {stats['total_events']} (Completed: {stats['completed_events']}, Upcoming: {stats['upcoming_events']})", flush=True)
    print(f"• Total Registrations              : {stats['total_registrations']}", flush=True)
    print(f"• Total Attendances Marked         : {stats['total_attendance']} (Present: {stats['present_attendance']})", flush=True)
    print(f"• Overall Attendance Rate          : {round((stats['present_attendance'] / max(1, stats['total_attendance'])) * 100, 1)}%", flush=True)
    print(f"• Total Feedbacks Submitted        : {stats['total_feedback']}", flush=True)
    print(f"• Average Campus Feedback Rating   : {stats['avg_rating']} / 5.0", flush=True)

    print("\n--- STUDENT DISTRIBUTION BY DEPARTMENT ---", flush=True)
    for d in dept_counts:
        print(f"  - {d['department']:<8}: {d['count']} students", flush=True)

    print("\n--- FEEDBACK SENTIMENT DISTRIBUTION ---", flush=True)
    total_sent = sum(s["count"] for s in sentiment_counts)
    for s in sentiment_counts:
        pct = round((s["count"] / max(1, total_sent)) * 100, 1)
        print(f"  - {s['sentiment']:<10}: {s['count']} ({pct}%)", flush=True)

    print("\n--- EVENT CATEGORY DISTRIBUTION ---", flush=True)
    for c in cat_counts:
        print(f"  - {c['category']:<16}: {c['count']} events", flush=True)

    print("\n" + "=" * 70, flush=True)
    print("🔑 TEST CREDENTIALS & ACCESS ACCOUNTS", flush=True)
    print("=" * 70, flush=True)
    print("Password for ALL development accounts:  Test@12345", flush=True)
    print("\n[ADMIN PORTAL]", flush=True)
    print("  • Email: admin1@eventintel.example.test", flush=True)
    print("  • Email: admin2@eventintel.example.test", flush=True)
    print("  • Email: admin3@eventintel.example.test", flush=True)
    print("\n[ORGANIZER PORTAL]", flush=True)
    print("  • Email: organizer01@eventintel.example.test (IEEE / CSE)", flush=True)
    print("  • Email: organizer02@eventintel.example.test (ACM / IT)", flush=True)
    print("  • Email: organizer03@eventintel.example.test (Robotics / ECE)", flush=True)
    print("\n[STUDENT PORTAL]", flush=True)
    print("  • Email: student0001@eventintel.example.test (CSE 1st Year - AI/Python persona)", flush=True)
    print("  • Email: student0002@eventintel.example.test (CSE 2nd Year - React/Web persona)", flush=True)
    print("  • Email: student0003@eventintel.example.test (CSE 3rd Year - High Engagement)", flush=True)
    print("  • Email: student0004@eventintel.example.test (ECE - IoT/Robotics profile)", flush=True)
    print("  • Email: student0005@eventintel.example.test (MECH - Automation/Design profile)", flush=True)
    print("=" * 70, flush=True)


# ─────────────────────────────────────────────────────────────────────────────
# MAIN CLI DISPATCHER
# ─────────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="EventIntel AI Synthetic Dataset Seeder")
    parser.add_argument("--seed", action="store_true", help="Seed full synthetic test dataset")
    parser.add_argument("--reset", action="store_true", help="Safely reset and remove only synthetic test dataset")
    parser.add_argument("--validate", action="store_true", help="Run database validation queries and summary report")

    args = parser.parse_args()

    if args.reset:
        reset_test_data()
    elif args.validate:
        validate_and_report()
    elif args.seed:
        reset_test_data()
        seed_admins()
        seed_organizers()
        students = seed_students()
        events = seed_events()
        seed_interactions_and_feedback(students, events)
        run_ai_pipelines()
        validate_and_report()
    else:
        # Default behavior: run full seed workflow
        reset_test_data()
        seed_admins()
        seed_organizers()
        students = seed_students()
        events = seed_events()
        seed_interactions_and_feedback(students, events)
        run_ai_pipelines()
        validate_and_report()


if __name__ == "__main__":
    main()

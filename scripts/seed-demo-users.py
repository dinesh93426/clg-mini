import os
import sys
import bcrypt
import psycopg2
from dotenv import load_dotenv

load_dotenv("backend/.env")
db_url = os.environ.get("DATABASE_URL")
if not db_url:
    load_dotenv("ml_service/.env")
    db_url = os.environ.get("DATABASE_URL")

print(f"Connecting to database...")
conn = psycopg2.connect(db_url)
cur = conn.cursor()

pwd_test = bcrypt.hashpw(b"Test@12345", bcrypt.gensalt(10)).decode()

students = [
    ("DEMO-STU-001", "Alex Johnson", "alex.johnson@university.edu", pwd_test, "Computer Science", 3),
    ("DEMO-STU-002", "Student Demo", "student@university.edu", pwd_test, "Computer Science", 2)
]
for sid, name, email, pwd, dept, yr in students:
    cur.execute("""
        INSERT INTO "Student" (id, name, email, password, department, year, "createdAt", "updatedAt")
        VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW())
        ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, name = EXCLUDED.name
    """, (sid, name, email, pwd, dept, yr))

organizers = [
    ("DEMO-ORG-001", "Sarah Organizer", "sarah.organizer@university.edu", pwd_test, "Computer Science", "ACM Student Chapter"),
    ("DEMO-ORG-002", "Organizer Demo", "organizer@university.edu", pwd_test, "Computer Science", "IEEE Student Chapter")
]
for oid, name, email, pwd, dept, org_name in organizers:
    cur.execute("""
        INSERT INTO "Organizer" (id, name, email, password, department, "organizationName", "createdAt", "updatedAt")
        VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW())
        ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, name = EXCLUDED.name, "organizationName" = EXCLUDED."organizationName"
    """, (oid, name, email, pwd, dept, org_name))

admins = [
    ("DEMO-ADM-001", "Dean Vance", "dean.vance@university.edu", pwd_test),
    ("DEMO-ADM-002", "Admin Demo", "admin@university.edu", pwd_test)
]
for aid, name, email, pwd in admins:
    cur.execute("""
        INSERT INTO "Admin" (id, name, email, password, "createdAt", "updatedAt")
        VALUES (%s, %s, %s, %s, NOW(), NOW())
        ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, name = EXCLUDED.name
    """, (aid, name, email, pwd))

conn.commit()
conn.close()
print("✅ Demo users successfully seeded into PostgreSQL database!")

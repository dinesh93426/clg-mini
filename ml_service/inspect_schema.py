from core.db import execute_query

tables = ["Student", "Event", "Registration", "Attendance", "Feedback", "EventInteraction", "Recommendation"]

for table in tables:
    cols = execute_query(f"""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = '{table}'
        ORDER BY ordinal_position;
    """)
    print(f"\n=== TABLE: {table} ===")
    for c in cols:
        print(f"  - {c['column_name']}: {c['data_type']}")

# Sample row from Student and Event
print("\n=== SAMPLE STUDENT ===")
s_sample = execute_query('SELECT * FROM "Student" LIMIT 1')
print(s_sample)

print("\n=== SAMPLE EVENT ===")
e_sample = execute_query('SELECT * FROM "Event" LIMIT 1')
print(e_sample)

print("\n=== EVENT STATUSES ===")
statuses = execute_query('SELECT status, COUNT(*) FROM "Event" GROUP BY status')
print(statuses)

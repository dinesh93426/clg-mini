from core.db import execute_query

print("=== DB Verification ===")
events = execute_query('SELECT id, title, category, status, capacity, "eventDate" FROM "Event"')
print(f"Events ({len(events)}): {[e['id'] for e in events]}")

regs = execute_query('SELECT COUNT(*) as c FROM "Registration"')
atts = execute_query('SELECT COUNT(*) as c FROM "Attendance"')
fb = execute_query('SELECT COUNT(*) as c, AVG(rating) as avg_r FROM "Feedback"')
st = execute_query('SELECT COUNT(*) as c FROM "Student"')

print(f"Registrations: {regs[0]['c']}")
print(f"Attendance: {atts[0]['c']}")
print(f"Feedback: {fb[0]['c']}, Avg Rating: {fb[0]['avg_r']}")
print(f"Students: {st[0]['c']}")

from core.db import execute_query

print("Students in DB:", execute_query('SELECT COUNT(*) as count FROM "Student"'))
print("Events in DB:", execute_query('SELECT COUNT(*) as count FROM "Event"'))
print("Student sample:", execute_query('SELECT id, name, email FROM "Student" LIMIT 3'))
print("Event sample:", execute_query('SELECT id, title, category FROM "Event" LIMIT 3'))

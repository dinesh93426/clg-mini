from core.db import execute_query

students = execute_query('SELECT id, name, email, department, year, interests, skills FROM "Student" LIMIT 10')
print("Students in DB:")
for s in students:
    print(s)

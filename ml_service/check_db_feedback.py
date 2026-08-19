from core.db import execute_query

count_res = execute_query('SELECT COUNT(*) as count FROM "Feedback"')
sample_res = execute_query('SELECT id, "studentId", "eventId", rating, comment, sentiment, "sentimentScore" FROM "Feedback" LIMIT 5')
print("Total feedback in DB:", count_res)
print("Sample feedback in DB:", sample_res)

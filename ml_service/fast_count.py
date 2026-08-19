from core.db import get_db_connection

conn = get_db_connection()
try:
    with conn.cursor() as cur:
        for t in ["Student", "Organizer", "Event", "Registration", "Attendance", "Feedback", "EventInteraction"]:
            cur.execute(f'SELECT COUNT(*) as count FROM "{t}"')
            print(f"{t}: {cur.fetchone()['count']}")
finally:
    conn.close()

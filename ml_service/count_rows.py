from core.db import execute_query

for t in ["Student", "Organizer", "Admin", "Event", "Registration", "Attendance", "Feedback", "EventInteraction"]:
    try:
        cnt = execute_query(f'SELECT COUNT(*) as c FROM "{t}"')
        print(f"{t}: {cnt[0]['c']} rows")
    except Exception as e:
        print(f"{t}: error {e}")

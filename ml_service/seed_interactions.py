from core.db import get_db_connection

conn = get_db_connection()
try:
    with conn.cursor() as cur:
        cur.execute('SELECT id, name, department, interests, skills FROM "Student"')
        students = cur.fetchall()
        
        # Historical events
        cur.execute('SELECT id, title, category FROM "Event" WHERE status = \'COMPLETED\'')
        past_events = cur.fetchall()
        
        print(f"Populating interactions for {len(students)} students across {len(past_events)} past events...")
        
        reg_tuples = []
        att_tuples = []
        fb_tuples = []
        int_tuples = []
        
        for idx, s in enumerate(students):
            sid = s["id"]
            # Give first 50 students past interactions; leave last 20 students as pure COLD_START (0 interactions) for testing cold-start!
            if idx < 50:
                for pev in past_events:
                    eid = pev["id"]
                    # Registration
                    cur.execute(
                        """
                        INSERT INTO "Registration" (id, "studentId", "eventId", status, "registeredAt")
                        VALUES (gen_random_uuid(), %s, %s, 'REGISTERED', NOW() - INTERVAL '30 days')
                        ON CONFLICT ("studentId", "eventId") DO NOTHING;
                        """,
                        (sid, eid)
                    )
                    # Attendance
                    cur.execute(
                        """
                        INSERT INTO "Attendance" (id, "studentId", "eventId", status, "markedAt")
                        VALUES (gen_random_uuid(), %s, %s, 'PRESENT', NOW() - INTERVAL '29 days')
                        ON CONFLICT ("studentId", "eventId") DO NOTHING;
                        """,
                        (sid, eid)
                    )
                    # Feedback
                    cur.execute(
                        """
                        INSERT INTO "Feedback" (id, "studentId", "eventId", rating, comment, sentiment, "sentimentScore", topics, "createdAt", "sentimentModel", "sentimentAnalyzedAt")
                        VALUES (gen_random_uuid(), %s, %s, 5, 'The workshop was excellent and very informative.', 'POSITIVE', 0.99, ARRAY['Hands-on', 'Content'], NOW() - INTERVAL '28 days', 'roberta-base-college-sentiment-finetuned', NOW())
                        ON CONFLICT ("studentId", "eventId") DO NOTHING;
                        """,
                        (sid, eid)
                    )
                    # Likes & Views
                    cur.execute(
                        """
                        INSERT INTO "EventInteraction" (id, "studentId", "eventId", "interactionType", "createdAt")
                        VALUES (gen_random_uuid(), %s, %s, 'LIKE', NOW() - INTERVAL '31 days');
                        """,
                        (sid, eid)
                    )
                    cur.execute(
                        """
                        INSERT INTO "EventInteraction" (id, "studentId", "eventId", "interactionType", "createdAt")
                        VALUES (gen_random_uuid(), %s, %s, 'VIEW', NOW() - INTERVAL '32 days');
                        """,
                        (sid, eid)
                    )
        conn.commit()
        print("Bulk interactions successfully committed.")
finally:
    conn.close()

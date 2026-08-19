import psycopg2.extras
from core.db import get_db_connection

conn = get_db_connection()
try:
    with conn.cursor() as cur:
        cur.execute('SELECT id, name, department, interests, skills FROM "Student"')
        students = cur.fetchall()
        
        cur.execute('SELECT id, title, category FROM "Event" WHERE status = \'COMPLETED\'')
        past_events = cur.fetchall()
        
        reg_data = []
        att_data = []
        fb_data = []
        int_data = []
        
        for idx, s in enumerate(students):
            sid = s["id"]
            if idx < 45: # First 45 students have rich history; remaining 25 are Cold Start!
                for pev in past_events:
                    eid = pev["id"]
                    reg_data.append((sid, eid))
                    att_data.append((sid, eid))
                    fb_data.append((sid, eid, 5, 'Great workshop and very practical.', 'POSITIVE', 0.99, ['Hands-on', 'Content'], 'roberta-base-college-sentiment-finetuned'))
                    int_data.append((sid, eid, 'LIKE'))
                    int_data.append((sid, eid, 'VIEW'))
        
        print(f"Executing batch inserts for {len(reg_data)} records...")
        
        psycopg2.extras.execute_batch(
            cur,
            'INSERT INTO "Registration" (id, "studentId", "eventId", status, "registeredAt") VALUES (gen_random_uuid(), %s, %s, \'REGISTERED\', NOW() - INTERVAL \'30 days\') ON CONFLICT ("studentId", "eventId") DO NOTHING;',
            reg_data,
            page_size=200
        )
        
        psycopg2.extras.execute_batch(
            cur,
            'INSERT INTO "Attendance" (id, "studentId", "eventId", status, "markedAt") VALUES (gen_random_uuid(), %s, %s, \'PRESENT\', NOW() - INTERVAL \'29 days\') ON CONFLICT ("studentId", "eventId") DO NOTHING;',
            att_data,
            page_size=200
        )
        
        psycopg2.extras.execute_batch(
            cur,
            'INSERT INTO "Feedback" (id, "studentId", "eventId", rating, comment, sentiment, "sentimentScore", topics, "createdAt", "sentimentModel", "sentimentAnalyzedAt") VALUES (gen_random_uuid(), %s, %s, %s, %s, %s, %s, %s, NOW() - INTERVAL \'28 days\', %s, NOW()) ON CONFLICT ("studentId", "eventId") DO NOTHING;',
            fb_data,
            page_size=200
        )
        
        psycopg2.extras.execute_batch(
            cur,
            'INSERT INTO "EventInteraction" (id, "studentId", "eventId", "interactionType", "createdAt") VALUES (gen_random_uuid(), %s, %s, %s, NOW() - INTERVAL \'31 days\');',
            int_data,
            page_size=200
        )
        
        conn.commit()
        print("Fast batch seeding completed successfully!")
finally:
    conn.close()

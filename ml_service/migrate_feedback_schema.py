from core.db import get_db_connection

conn = get_db_connection()
try:
    with conn.cursor() as cur:
        cur.execute("""
            ALTER TABLE "Feedback"
            ADD COLUMN IF NOT EXISTS "sentimentModel" TEXT,
            ADD COLUMN IF NOT EXISTS "sentimentAnalyzedAt" TIMESTAMP;
        """)
    conn.commit()
    print("Columns sentimentModel and sentimentAnalyzedAt ensured in Feedback table.")
finally:
    conn.close()

from core.db import execute_write, execute_query

execute_write("""
    CREATE TABLE IF NOT EXISTS "EventPoster" (
        "id" TEXT PRIMARY KEY,
        "eventId" TEXT,
        "posterImageUrl" TEXT NOT NULL,
        "backgroundImageUrl" TEXT NOT NULL,
        "style" TEXT DEFAULT 'Futuristic',
        "format" TEXT DEFAULT '1080x1350',
        "prompt" TEXT,
        "modelName" TEXT DEFAULT 'Procedural+NeuralAI',
        "status" TEXT DEFAULT 'DRAFT',
        "eventData" JSONB,
        "createdAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
    );
""")

cols = execute_query("""
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'EventPoster';
""")
print("EventPoster table columns:")
for c in cols:
    print(f"  - {c['column_name']}: {c['data_type']}")

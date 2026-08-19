from core.db import execute_write, execute_query

execute_write("""
    ALTER TABLE "KnowledgeDocument" 
    ADD COLUMN IF NOT EXISTS "embedding_vec" vector(384);
""")

cols = execute_query("""
    SELECT column_name, data_type, udt_name 
    FROM information_schema.columns 
    WHERE table_name = 'KnowledgeDocument';
""")
print("Updated KnowledgeDocument columns:")
for c in cols:
    print(f"  - {c['column_name']}: {c['data_type']} ({c['udt_name']})")

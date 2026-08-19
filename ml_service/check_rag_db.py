from core.db import execute_query

# Check KnowledgeDocument columns
cols = execute_query("""
    SELECT column_name, data_type, udt_name 
    FROM information_schema.columns 
    WHERE table_name = 'KnowledgeDocument'
    ORDER BY ordinal_position;
""")
print("=== KnowledgeDocument Columns ===")
for c in cols:
    print(f"  - {c['column_name']}: {c['data_type']} ({c['udt_name']})")

# Check pgvector extension status
ext = execute_query("SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';")
print("\n=== pgvector Extension ===")
print(ext)

# Count existing events and knowledge documents
ev_count = execute_query('SELECT COUNT(*) FROM "Event"')
kd_count = execute_query('SELECT COUNT(*) FROM "KnowledgeDocument"')
print(f"\nEvents in DB: {ev_count[0]['count']}, KnowledgeDocuments: {kd_count[0]['count']}")

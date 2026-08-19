from core.db import execute_query, execute_write

# Clear old mock documents without vector embeddings and re-index cleanly
execute_write('DELETE FROM "KnowledgeDocument" WHERE "embedding_vec" IS NULL;')

# Check remaining
rows = execute_query('SELECT id, "sourceId", (embedding_vec IS NOT NULL) as has_vec FROM "KnowledgeDocument"')
print(f"Remaining KnowledgeDocument rows ({len(rows)}):")
for r in rows:
    print(r)

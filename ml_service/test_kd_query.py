from core.db import execute_query
rows = execute_query('SELECT id, "sourceType", "sourceId", (embedding_vec IS NOT NULL) as has_vec FROM "KnowledgeDocument" LIMIT 10')
print("KnowledgeDocument sample:")
for r in rows:
    print(r)

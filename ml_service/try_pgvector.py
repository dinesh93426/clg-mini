from core.db import execute_write, execute_query

try:
    execute_write("CREATE EXTENSION IF NOT EXISTS vector;")
    ext = execute_query("SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';")
    print("pgvector successfully enabled:", ext)
except Exception as e:
    print("pgvector extension check:", e)

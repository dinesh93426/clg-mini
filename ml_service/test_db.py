from core.db import execute_query
rows = execute_query('SELECT embedding FROM "KnowledgeDocument"')
types = set(type(r['embedding']) for r in rows)
print("Types:", types)

lengths = set()
for r in rows:
    emb = r['embedding']
    if isinstance(emb, str):
        import json
        try:
            emb = json.loads(emb)
        except:
            pass
    if isinstance(emb, list):
        lengths.add(len(emb))
    elif emb is None:
        lengths.add(0)
    else:
        lengths.add(-1)
print("Lengths:", lengths)

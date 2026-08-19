"""Database helpers for the ML service using psycopg2."""
import os
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = (
    os.getenv("DATABASE_URL", "")
    .replace("-pooler", "")
    .replace("&channel_binding=require", "")
    .replace("?channel_binding=require", "")
)


def get_db_connection():
    """Return a new psycopg2 connection with RealDictCursor as default."""
    import time
    for attempt in range(3):
        try:
            conn = psycopg2.connect(DATABASE_URL, cursor_factory=psycopg2.extras.RealDictCursor)
            return conn
        except Exception as e:
            if attempt == 2:
                raise
            time.sleep(1)


def execute_query(sql: str, params=None) -> list[dict]:
    """Execute a SELECT query and return rows as plain dicts."""
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(sql, params or ())
            rows = cur.fetchall()
            return [dict(r) for r in rows]
    finally:
        conn.close()


def execute_write(sql: str, params=None):
    """Execute an INSERT/UPDATE/DELETE and commit."""
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(sql, params or ())
        conn.commit()
    finally:
        conn.close()


def execute_write_returning(sql: str, params=None) -> dict | None:
    """Execute an INSERT … RETURNING and return the first row."""
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(sql, params or ())
            row = cur.fetchone()
            conn.commit()
            return dict(row) if row else None
    finally:
        conn.close()

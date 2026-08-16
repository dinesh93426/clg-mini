"""
Module 3 — Personalized Event Recommendation
Hybrid system combining:
  - Content-based (TF-IDF cosine similarity of student interests vs event content)  40%
  - Collaborative filtering (interaction-matrix cosine similarity)                  30%
  - Behavioral cluster boost (same-cluster preference lift)                         20%
  - Popularity score                                                                10%

Cold-start: students with no interactions get pure content + popularity.

NOTE: All SQL column names are camelCase because Prisma (without @map) stores
      them that way in PostgreSQL — e.g. "eventId", "studentId", "clusterId".
"""

import os, json
import numpy as np
import pandas as pd
from fastapi import APIRouter, HTTPException
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from scipy.sparse import csr_matrix
from collections import Counter
from typing import Optional

from core.db import execute_query, get_db_connection

router = APIRouter()

# ── Data loaders ───────────────────────────────────────────────────────────────

def _load_events():
    return execute_query("""
        SELECT e.id, e.title, e.description, e.category, e.status,
               e."eventDate", e.capacity,
               COUNT(r.id) AS registration_count
        FROM "Event" e
        LEFT JOIN "Registration" r ON r."eventId" = e.id AND r.status = 'REGISTERED'
        WHERE e.status IN ('PUBLISHED', 'COMPLETED')
        GROUP BY e.id
        ORDER BY e."eventDate" DESC
    """)


def _load_students():
    return execute_query("""
        SELECT sp."userId"          AS student_id,
               sp.interests,
               sp.skills,
               sp."clusterId"       AS cluster_id,
               sp."clusterLabel"    AS cluster_label,
               sp."engagementScore" AS engagement_score
        FROM "StudentProfile" sp
    """)


def _load_interactions():
    """Return all interactions with numeric weights."""
    WEIGHTS = {"VIEW": 1, "LIKE": 2, "SHARE": 3, "REGISTER": 5, "CANCEL": -3}
    rows = execute_query("""
        SELECT "studentId"       AS student_id,
               "eventId"         AS event_id,
               "interactionType" AS interaction_type
        FROM "EventInteraction"
    """)
    return rows or [], WEIGHTS


def _load_registrations():
    return execute_query("""
        SELECT "studentId" AS student_id,
               "eventId"   AS event_id
        FROM "Registration"
        WHERE status = 'REGISTERED'
    """) or []


# ── Content-based ──────────────────────────────────────────────────────────────

def _build_event_corpus(events: list) -> tuple:
    """Build text corpus from event metadata."""
    event_ids = [e["id"] for e in events]
    corpus = []
    for e in events:
        text = (
            (e.get("category") or "") + " " +
            (e.get("title") or "") + " " +
            (e.get("description") or "")
        )
        corpus.append(text.lower())
    return event_ids, corpus


def _student_content_profile(student: dict) -> str:
    interests = student.get("interests") or []
    skills = student.get("skills") or []
    return " ".join(interests + skills).lower()


# ── Collaborative ──────────────────────────────────────────────────────────────

def _build_interaction_matrix(students, events, interactions, weights):
    sid_idx = {s["student_id"]: i for i, s in enumerate(students)}
    eid_idx = {e["id"]: j for j, e in enumerate(events)}
    n_s, n_e = len(students), len(events)

    data, rows, cols = [], [], []
    for row in interactions:
        si = sid_idx.get(row["student_id"])
        ei = eid_idx.get(row["event_id"])
        if si is None or ei is None:
            continue
        w = weights.get(row["interaction_type"], 0)
        data.append(w)
        rows.append(si)
        cols.append(ei)

    if not data:
        return csr_matrix((n_s, n_e)), sid_idx, eid_idx

    mat = csr_matrix((data, (rows, cols)), shape=(n_s, n_e))
    return mat, sid_idx, eid_idx


# ── Popularity ─────────────────────────────────────────────────────────────────

def _popularity_scores(events: list) -> dict:
    max_reg = max((e.get("registration_count") or 0 for e in events), default=1)
    max_reg = max(max_reg, 1)
    return {e["id"]: min((e.get("registration_count") or 0) / max_reg, 1.0) for e in events}


# ── Main recommendation engine ─────────────────────────────────────────────────

@router.get("/{student_id}")
def get_recommendations(student_id: str, top_k: int = 10):
    events = _load_events()
    students = _load_students()
    interactions, weights = _load_interactions()
    registrations = _load_registrations()

    if not events:
        raise HTTPException(status_code=404, detail="No events available")

    student_map = {s["student_id"]: s for s in students}
    student = student_map.get(student_id)
    if not student:
        # Cold start fallback for new/sandbox students
        student = {
            "student_id": student_id,
            "interests": ["Technology", "Workshop", "Hackathon", "Seminar"],
            "skills": ["AI", "Python", "Web Development"],
            "cluster_id": None,
        }

    # Events the student is already registered for (exclude)
    registered_event_ids = {
        r["event_id"] for r in registrations if r["student_id"] == student_id
    }

    # Only recommend PUBLISHED events not yet registered
    candidate_events = [
        e for e in events
        if e["status"] == "PUBLISHED" and e["id"] not in registered_event_ids
    ]
    if not candidate_events:
        candidate_events = [e for e in events if e["id"] not in registered_event_ids]
    if not candidate_events:
        candidate_events = events

    event_ids = [e["id"] for e in candidate_events]

    # ── 1. Content-based score ──────────────────────────────────────────────
    all_event_ids, corpus = _build_event_corpus(candidate_events)
    student_profile_text = _student_content_profile(student)

    if not student_profile_text.strip():
        student_profile_text = "technology workshop seminar"

    vectorizer = TfidfVectorizer(stop_words="english", max_features=3000)
    tfidf_matrix = vectorizer.fit_transform(corpus + [student_profile_text])
    event_vectors = tfidf_matrix[:-1]
    student_vector = tfidf_matrix[-1]
    content_scores_raw = cosine_similarity(student_vector, event_vectors)[0]
    content_scores = dict(zip(all_event_ids, content_scores_raw.tolist()))

    # ── 2. Collaborative score ──────────────────────────────────────────────
    mat, sid_idx, eid_idx = _build_interaction_matrix(students, events, interactions, weights)
    s_idx = sid_idx.get(student_id)

    collab_scores: dict = {}
    if s_idx is not None and mat.nnz > 0:
        dense = mat.toarray().astype(float)
        student_vec = dense[s_idx].reshape(1, -1)
        norm = np.linalg.norm(dense, axis=1, keepdims=True)
        norm[norm == 0] = 1
        dense_norm = dense / norm
        student_norm = student_vec / (np.linalg.norm(student_vec) or 1)
        similarities = cosine_similarity(student_norm, dense_norm)[0]
        similarities[s_idx] = 0
        top_similar = np.argsort(similarities)[::-1][:20]
        for eid in event_ids:
            ei = eid_idx.get(eid)
            if ei is None:
                continue
            score = sum(
                similarities[si] * dense[si, ei]
                for si in top_similar
                if dense[si, ei] > 0
            )
            collab_scores[eid] = float(score)

        if collab_scores:
            max_c = max(collab_scores.values()) or 1
            collab_scores = {k: v / max_c for k, v in collab_scores.items()}

    # ── 3. Cluster-based boost ──────────────────────────────────────────────
    cluster_id = student.get("cluster_id")
    cluster_boost: dict = {}
    if cluster_id is not None:
        same_cluster_students = [
            s["student_id"] for s in students
            if s.get("cluster_id") == cluster_id and s["student_id"] != student_id
        ]
        cluster_regs = [
            r for r in registrations
            if r["student_id"] in set(same_cluster_students)
        ]
        cluster_event_counts = Counter(r["event_id"] for r in cluster_regs)
        max_c = max(cluster_event_counts.values()) if cluster_event_counts else 1
        cluster_boost = {
            eid: cluster_event_counts.get(eid, 0) / max_c
            for eid in event_ids
        }

    # ── 4. Popularity ───────────────────────────────────────────────────────
    all_pop = _popularity_scores(candidate_events)

    # ── 5. Weighted hybrid ──────────────────────────────────────────────────
    W = {"content": 0.40, "collab": 0.30, "cluster": 0.20, "pop": 0.10}

    scored = []
    for e in candidate_events:
        eid = e["id"]
        cs  = content_scores.get(eid, 0.0)
        col = collab_scores.get(eid, 0.0)
        cl  = cluster_boost.get(eid, 0.0)
        pop = all_pop.get(eid, 0.0)

        total = cs * W["content"] + col * W["collab"] + cl * W["cluster"] + pop * W["pop"]

        reasons = []
        if cs  > 0.3: reasons.append("matches your interests")
        if col > 0.3: reasons.append("popular with similar students")
        if cl  > 0.4: reasons.append("trending in your group")
        if pop > 0.6: reasons.append("highly popular")
        reason = (", ".join(reasons).capitalize() + ".") if reasons else "Recommended for you."

        scored.append({
            "event_id": eid,
            "score": round(total, 5),
            "content_score": round(cs, 4),
            "collab_score": round(col, 4),
            "cluster_score": round(cl, 4),
            "popularity_score": round(pop, 4),
            "reason": reason,
            "event": {
                "id": e["id"],
                "title": e["title"],
                "category": e["category"],
                "status": e["status"],
                "eventDate": str(e.get("eventDate", "")),
                "capacity": e.get("capacity"),
                "currentRegistrations": e.get("registration_count", 0),
                "description": e.get("description", ""),
            },
        })

    scored.sort(key=lambda x: -x["score"])
    top = scored[:top_k]

    _persist_recommendations(student_id, top)

    return {
        "student_id": student_id,
        "recommendations": top,
        "algorithm": "hybrid_content_collab_cluster_popularity",
    }


def _persist_recommendations(student_id: str, recommendations: list):
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute('DELETE FROM "Recommendation" WHERE "studentId" = %s', (student_id,))
            for rec in recommendations:
                cur.execute(
                    """
                    INSERT INTO "Recommendation"
                        (id, "studentId", "eventId", score, reason, algorithm, "createdAt")
                    VALUES (gen_random_uuid(), %s, %s, %s, %s, %s, NOW())
                    """,
                    (
                        student_id,
                        rec["event_id"],
                        rec["score"],
                        rec["reason"],
                        "hybrid_content_collab_cluster_popularity",
                    ),
                )
        conn.commit()
    except Exception as e:
        print(f"[Recommendation] persist error: {e}")
        conn.rollback()
    finally:
        conn.close()

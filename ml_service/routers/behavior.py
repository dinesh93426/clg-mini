"""
Module 1 — Student Behavior Intelligence
K-Means clustering on real student engagement features extracted from the DB.

Features per student:
  - total_registrations
  - attendance_rate       (present / registered for completed events)
  - avg_feedback_rating
  - category_entropy      (diversity of event categories attended)
  - interaction_score     (weighted sum of interaction types)
  - cancellation_rate     (cancelled / total registered)
"""

import os, json, math, joblib
import numpy as np
import pandas as pd
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score

from core.db import execute_query, execute_write, get_db_connection

router = APIRouter()

MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
os.makedirs(MODEL_DIR, exist_ok=True)
BEHAVIOR_MODEL_PATH = os.path.join(MODEL_DIR, "behavior_model.joblib")
BEHAVIOR_SCALER_PATH = os.path.join(MODEL_DIR, "behavior_scaler.joblib")

INTERACTION_WEIGHTS = {
    "VIEW": 1,
    "LIKE": 2,
    "SHARE": 3,
    "REGISTER": 4,
    "CANCEL": -2,
}

# NOTE: Prisma without @map stores columns with camelCase names in PostgreSQL
# e.g. "userId", "eventId", "clusterLabel", "engagementScore", "attendanceRate"


# ── Feature extraction ─────────────────────────────────────────────────────────

def _fetch_student_features() -> pd.DataFrame:
    """Pull per-student aggregates from the real DB."""

    students = execute_query("""
        SELECT "userId" AS student_id
        FROM "StudentProfile"
    """)
    if not students:
        return pd.DataFrame()

    student_ids = [r["student_id"] for r in students]

    # Registrations with event status and category
    registrations = execute_query("""
        SELECT r."studentId" AS student_id,
               r."eventId"   AS event_id,
               r.status,
               e.status      AS event_status,
               e.category
        FROM "Registration" r
        JOIN "Event" e ON e.id = r."eventId"
    """)

    # Attendances
    attendances = execute_query("""
        SELECT a."studentId" AS student_id,
               a."eventId"   AS event_id,
               a.status
        FROM "Attendance" a
    """)

    # Feedbacks
    feedbacks = execute_query("""
        SELECT f."studentId" AS student_id,
               f.rating
        FROM "Feedback" f
    """)

    # Interactions
    interactions = execute_query("""
        SELECT i."studentId"       AS student_id,
               i."interactionType" AS interaction_type
        FROM "EventInteraction" i
    """)

    reg_df = pd.DataFrame(registrations) if registrations else pd.DataFrame(columns=["student_id","event_id","status","event_status","category"])
    att_df = pd.DataFrame(attendances)   if attendances   else pd.DataFrame(columns=["student_id","event_id","status"])
    fb_df  = pd.DataFrame(feedbacks)     if feedbacks     else pd.DataFrame(columns=["student_id","rating"])
    int_df = pd.DataFrame(interactions)  if interactions  else pd.DataFrame(columns=["student_id","interaction_type"])

    rows = []
    for sid in student_ids:
        s_reg = reg_df[reg_df.student_id == sid]
        total_reg = len(s_reg)
        cancelled  = len(s_reg[s_reg.status == "CANCELLED"])

        completed_reg = s_reg[s_reg.event_status == "COMPLETED"]
        att_for_completed = att_df[
            (att_df.student_id == sid) &
            (att_df.event_id.isin(completed_reg.event_id.tolist()))
        ]
        attendance_rate = (
            len(att_for_completed[att_for_completed.status == "PRESENT"]) / len(completed_reg)
            if len(completed_reg) > 0 else 0.0
        )

        s_fb = fb_df[fb_df.student_id == sid]
        avg_rating = float(s_fb.rating.mean()) if len(s_fb) > 0 else 0.0

        # Category diversity entropy
        cat_counts = s_reg.category.value_counts() if total_reg > 0 else pd.Series(dtype=int)
        if len(cat_counts) > 0:
            probs = cat_counts / cat_counts.sum()
            entropy = -float((probs * np.log(probs + 1e-9)).sum())
        else:
            entropy = 0.0

        # Interaction score
        s_int = int_df[int_df.student_id == sid]
        interaction_score = float(
            s_int.interaction_type.map(INTERACTION_WEIGHTS).fillna(0).sum()
        )

        cancellation_rate = cancelled / total_reg if total_reg > 0 else 0.0

        rows.append({
            "student_id": sid,
            "total_registrations": total_reg,
            "attendance_rate": attendance_rate,
            "avg_feedback_rating": avg_rating,
            "category_entropy": entropy,
            "interaction_score": interaction_score,
            "cancellation_rate": cancellation_rate,
        })

    return pd.DataFrame(rows)


FEATURE_COLS = [
    "total_registrations",
    "attendance_rate",
    "avg_feedback_rating",
    "category_entropy",
    "interaction_score",
    "cancellation_rate",
]


# ── Training ───────────────────────────────────────────────────────────────────

def _train_and_save(df: pd.DataFrame, n_clusters: int = 3):
    X = df[FEATURE_COLS].fillna(0).values

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Find best K between 2 and 6 via silhouette
    best_k = n_clusters
    if len(df) >= 10:
        best_score = -1
        for k in range(2, min(7, len(df))):
            km = KMeans(n_clusters=k, random_state=42, n_init=10)
            labels = km.fit_predict(X_scaled)
            n_labels = len(set(labels))
            if n_labels > 1:
                score = silhouette_score(X_scaled, labels)
                if score > best_score:
                    best_score = score
                    best_k = k

    kmeans = KMeans(n_clusters=best_k, random_state=42, n_init=10)
    kmeans.fit(X_scaled)

    joblib.dump(kmeans, BEHAVIOR_MODEL_PATH)
    joblib.dump(scaler,  BEHAVIOR_SCALER_PATH)
    return kmeans, scaler, best_k


def _assign_label_score(cluster_id: int, kmeans: KMeans, scaler: StandardScaler) -> float:
    """Return engagement proxy score for a cluster centroid."""
    center = scaler.inverse_transform(kmeans.cluster_centers_[cluster_id].reshape(1, -1))[0]
    score = (
        center[0] * 0.25 +   # total_registrations
        center[1] * 3.0  +   # attendance_rate
        center[2] * 0.5  +   # avg_feedback_rating
        center[3] * 0.3  +   # category_entropy
        center[4] * 0.05 +   # interaction_score
        -center[5] * 2.0     # cancellation_rate (negative)
    )
    return float(score)


def _build_cluster_label_map(k: int, kmeans: KMeans, scaler: StandardScaler) -> dict:
    centroid_scores = [_assign_label_score(i, kmeans, scaler) for i in range(k)]
    ranking = sorted(enumerate(centroid_scores), key=lambda x: x[1])
    level_names = ["Low Engagement", "Moderate Engagement", "High Engagement"]
    extra = [f"Engagement Tier {i+4}" for i in range(10)]
    all_names = level_names + extra
    label_map = {}
    for rank, (cid, _) in enumerate(ranking):
        label_map[cid] = all_names[rank % len(all_names)]
    return label_map


def _compute_engagement_score(row: pd.Series) -> float:
    """Normalised 0-1 engagement score from raw features."""
    score = (
        min(row["total_registrations"] / 20, 1.0) * 0.25 +
        row["attendance_rate"]                      * 0.30 +
        (row["avg_feedback_rating"] / 5.0)          * 0.20 +
        min(row["category_entropy"] / 2.0, 1.0)    * 0.15 +
        min(row["interaction_score"] / 50, 1.0)    * 0.10
    )
    return float(round(score, 4))


# ── DB persistence ─────────────────────────────────────────────────────────────

def _save_behaviors_to_db(df: pd.DataFrame, cluster_labels_map: dict, engagement_scores: dict):
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute('DELETE FROM "StudentBehavior"')
            for _, row in df.iterrows():
                sid = row["student_id"]
                cid = int(row["cluster_id"])
                features = {col: float(row[col]) for col in FEATURE_COLS}
                label = cluster_labels_map.get(cid, "Moderate Engagement")
                eng_score = float(engagement_scores.get(sid, 0.5))
                cur.execute(
                    """
                    INSERT INTO "StudentBehavior"
                        (id, "studentId", features, "clusterId", "clusterLabel",
                         "engagementScore", "createdAt", "updatedAt")
                    VALUES (gen_random_uuid(), %s, %s, %s, %s, %s, NOW(), NOW())
                    """,
                    (sid, json.dumps(features), cid, label, eng_score),
                )
            # Update StudentProfile
            for _, row in df.iterrows():
                sid = row["student_id"]
                cid = int(row["cluster_id"])
                label = cluster_labels_map.get(cid, "Moderate Engagement")
                eng_score = float(engagement_scores.get(sid, 0.5))
                cur.execute(
                    """
                    UPDATE "StudentProfile"
                    SET "clusterId"       = %s,
                        "clusterLabel"    = %s,
                        "engagementScore" = %s,
                        "attendanceRate"  = %s
                    WHERE "userId" = %s
                    """,
                    (cid, label, eng_score, float(row["attendance_rate"]), sid),
                )
        conn.commit()
    finally:
        conn.close()


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.post("/train")
def train_behavior_model():
    """Train K-Means on real student data and persist results to DB."""
    df = _fetch_student_features()
    if df.empty or len(df) < 5:
        raise HTTPException(status_code=400, detail="Not enough student data to train")

    kmeans, scaler, k = _train_and_save(df)
    X_scaled = scaler.transform(df[FEATURE_COLS].fillna(0).values)
    df["cluster_id"] = kmeans.predict(X_scaled)

    df["engagement_score"] = df.apply(_compute_engagement_score, axis=1)
    engagement_scores = dict(zip(df["student_id"], df["engagement_score"]))
    cluster_labels_map = _build_cluster_label_map(k, kmeans, scaler)

    _save_behaviors_to_db(df, cluster_labels_map, engagement_scores)

    n_labels = len(set(df["cluster_id"].values))
    sil = (
        silhouette_score(X_scaled, df["cluster_id"].values)
        if len(df) >= 10 and n_labels > 1 else 0.0
    )

    cluster_summary = df.groupby("cluster_id").agg(
        count=("student_id", "count"),
        avg_attendance=("attendance_rate", "mean"),
        avg_rating=("avg_feedback_rating", "mean"),
        avg_registrations=("total_registrations", "mean"),
    ).reset_index()

    return {
        "status": "trained",
        "n_students": len(df),
        "n_clusters": k,
        "silhouette_score": round(sil, 4),
        "cluster_labels": cluster_labels_map,
        "cluster_summary": [
            {
                "cluster_id": int(r["cluster_id"]),
                "label": cluster_labels_map.get(int(r["cluster_id"]), "Unknown"),
                "count": int(r["count"]),
                "avg_attendance": round(float(r["avg_attendance"]), 3),
                "avg_feedback_rating": round(float(r["avg_rating"]), 2),
                "avg_registrations": round(float(r["avg_registrations"]), 1),
            }
            for _, r in cluster_summary.iterrows()
        ],
    }


@router.get("/clusters")
def get_clusters():
    """Return cluster distribution from StudentBehavior table."""
    rows = execute_query("""
        SELECT "clusterId"       AS cluster_id,
               "clusterLabel"    AS cluster_label,
               COUNT(*)          AS count,
               AVG("engagementScore") AS avg_engagement
        FROM "StudentBehavior"
        GROUP BY "clusterId", "clusterLabel"
        ORDER BY "clusterId"
    """)
    return {"clusters": rows}


@router.get("/student/{student_id}")
def get_student_behavior(student_id: str):
    rows = execute_query(
        'SELECT * FROM "StudentBehavior" WHERE "studentId" = %s',
        (student_id,)
    )
    if not rows:
        raise HTTPException(status_code=404, detail="No behavior data for this student")
    row = rows[0]
    return {
        "student_id": student_id,
        "cluster_id": row.get("clusterId"),
        "cluster_label": row.get("clusterLabel"),
        "engagement_score": row.get("engagementScore"),
        "features": row.get("features"),
    }


class PredictRequest(BaseModel):
    student_id: str


@router.post("/predict")
def predict_behavior(req: PredictRequest):
    if not os.path.exists(BEHAVIOR_MODEL_PATH):
        raise HTTPException(status_code=503, detail="Model not trained yet. Call /train first.")

    kmeans: KMeans = joblib.load(BEHAVIOR_MODEL_PATH)
    scaler: StandardScaler = joblib.load(BEHAVIOR_SCALER_PATH)

    df = _fetch_student_features()
    student_row = df[df.student_id == req.student_id]
    if student_row.empty:
        raise HTTPException(status_code=404, detail="Student not found")

    X = student_row[FEATURE_COLS].fillna(0).values
    X_scaled = scaler.transform(X)
    cluster_id = int(kmeans.predict(X_scaled)[0])
    engagement_score = _compute_engagement_score(student_row.iloc[0])

    return {
        "student_id": req.student_id,
        "cluster_id": cluster_id,
        "engagement_score": engagement_score,
        "features": {col: float(student_row.iloc[0][col]) for col in FEATURE_COLS},
    }

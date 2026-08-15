"""
Module 4 — Event Demand Prediction
RandomForestRegressor trained on historical completed events.
Features: category (encoded), day_of_week, hour_of_day, capacity,
          organizer_avg_registrations, historical_avg_by_category.

NOTE: All SQL column names are camelCase because Prisma (without @map) stores
      them that way in PostgreSQL.
"""

import os, json, joblib, math
import numpy as np
import pandas as pd
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_absolute_error, r2_score

from core.db import execute_query, get_db_connection

router = APIRouter()

MODEL_DIR  = os.path.join(os.path.dirname(__file__), "..", "models")
os.makedirs(MODEL_DIR, exist_ok=True)
DEMAND_MODEL_PATH   = os.path.join(MODEL_DIR, "demand_model.joblib")
DEMAND_ENCODER_PATH = os.path.join(MODEL_DIR, "demand_encoder.joblib")

CATEGORIES = ["Technology", "Workshop", "Seminar", "Cultural", "Sports", "Hackathon"]


# ── Feature engineering ────────────────────────────────────────────────────────

def _load_training_data() -> pd.DataFrame:
    """Load completed events with actual registration counts."""
    events = execute_query("""
        SELECT e.id, e.category, e.status,
               e."eventDate"    AS event_date,
               e."startTime"    AS start_time,
               e.capacity,
               e."organizerId"  AS organizer_id,
               COUNT(r.id)      AS actual_registrations
        FROM "Event" e
        LEFT JOIN "Registration" r ON r."eventId" = e.id AND r.status = 'REGISTERED'
        WHERE e.status = 'COMPLETED'
        GROUP BY e.id
        HAVING COUNT(r.id) > 0
    """)
    if not events:
        return pd.DataFrame()
    return pd.DataFrame(events)


def _load_all_events() -> pd.DataFrame:
    events = execute_query("""
        SELECT e.id, e.title, e.category, e.status,
               e."eventDate"    AS event_date,
               e."startTime"    AS start_time,
               e.capacity,
               e."organizerId"  AS organizer_id,
               COUNT(r.id)      AS current_registrations
        FROM "Event" e
        LEFT JOIN "Registration" r ON r."eventId" = e.id AND r.status = 'REGISTERED'
        GROUP BY e.id
    """)
    return pd.DataFrame(events) if events else pd.DataFrame()


def _engineer_features(df: pd.DataFrame, cat_avgs: dict, org_avgs: dict) -> pd.DataFrame:
    df = df.copy()

    df["event_date"] = pd.to_datetime(df["event_date"], errors="coerce")
    df["day_of_week"] = df["event_date"].dt.dayofweek.fillna(2).astype(int)
    df["month"] = df["event_date"].dt.month.fillna(6).astype(int)

    def extract_hour(t):
        try:
            return int(str(t).split(":")[0])
        except Exception:
            return 10
    df["hour"] = df["start_time"].apply(extract_hour)

    global_avg = df.get("actual_registrations", pd.Series(dtype=float)).mean() or 20
    df["cat_avg_reg"] = df["category"].map(cat_avgs).fillna(global_avg)
    df["org_avg_reg"] = df["organizer_id"].map(org_avgs).fillna(global_avg)

    df["capacity"] = df["capacity"].fillna(50).astype(float)
    df["capacity_log"] = np.log1p(df["capacity"])
    df["fill_ratio_hint"] = df["cat_avg_reg"] / df["capacity"].clip(lower=1)

    return df


FEATURE_COLS = [
    "day_of_week", "month", "hour", "capacity_log",
    "cat_avg_reg", "org_avg_reg", "fill_ratio_hint",
    "category_enc",
]


# ── Training ───────────────────────────────────────────────────────────────────

def _train_demand_model():
    df = _load_training_data()
    if df.empty or len(df) < 5:
        raise ValueError("Not enough completed events to train")

    cat_avgs = df.groupby("category")["actual_registrations"].mean().to_dict()
    org_avgs = df.groupby("organizer_id")["actual_registrations"].mean().to_dict()

    df = _engineer_features(df, cat_avgs, org_avgs)

    le = LabelEncoder()
    le.classes_ = np.array(CATEGORIES)
    df["category_enc"] = df["category"].apply(
        lambda c: int(le.transform([c])[0]) if c in le.classes_ else 0
    )

    X = df[FEATURE_COLS].fillna(0).values
    y = df["actual_registrations"].values.astype(float)

    if len(df) >= 10:
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    else:
        X_train, X_test, y_train, y_test = X, X, y, y

    rf = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
    rf.fit(X_train, y_train)

    y_pred = rf.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    r2  = r2_score(y_test, y_pred) if len(y_test) > 1 else 1.0

    joblib.dump(rf, DEMAND_MODEL_PATH)
    joblib.dump({"le": le, "cat_avgs": cat_avgs, "org_avgs": org_avgs}, DEMAND_ENCODER_PATH)

    return rf, le, cat_avgs, org_avgs, {
        "mae": round(mae, 2), "r2": round(r2, 4), "n_train": int(len(X_train))
    }


# ── Prediction helpers ─────────────────────────────────────────────────────────

def _predict_for_event(event: dict, rf, le, cat_avgs: dict, org_avgs: dict) -> tuple:
    row = pd.DataFrame([event])
    row = _engineer_features(row, cat_avgs, org_avgs)
    cat = event.get("category", "Technology")
    row["category_enc"] = int(le.transform([cat])[0]) if cat in le.classes_ else 0
    X = row[FEATURE_COLS].fillna(0).values

    pred = float(rf.predict(X)[0])
    pred = max(0, min(pred, event.get("capacity", 200) or 200))

    tree_preds = np.array([t.predict(X)[0] for t in rf.estimators_])
    std  = float(np.std(tree_preds))
    conf = round(max(0.0, min(1.0, 1.0 - std / (pred + 1))), 4)

    return int(round(pred)), conf


def _demand_status(predicted: int, current: int, capacity: int) -> str:
    ratio = predicted / max(capacity, 1)
    if predicted <= current:
        return "STABLE"
    if ratio >= 0.9:
        return "HIGH_DEMAND"
    if ratio >= 0.6:
        return "MODERATE_DEMAND"
    return "LOW_DEMAND"


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.post("/train")
def train_demand():
    try:
        rf, le, cat_avgs, org_avgs, metrics = _train_demand_model()
        return {"status": "trained", "metrics": metrics}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/all-events")
def predict_all_events():
    """Return demand predictions for all events."""
    if not os.path.exists(DEMAND_MODEL_PATH):
        try:
            _train_demand_model()
        except ValueError as e:
            raise HTTPException(status_code=503, detail=f"Could not auto-train: {e}")

    rf      = joblib.load(DEMAND_MODEL_PATH)
    enc     = joblib.load(DEMAND_ENCODER_PATH)
    le, cat_avgs, org_avgs = enc["le"], enc["cat_avgs"], enc["org_avgs"]

    events_df = _load_all_events()
    if events_df.empty:
        return {"predictions": []}

    results = []
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            for _, row in events_df.iterrows():
                ev = row.to_dict()
                pred, conf = _predict_for_event(ev, rf, le, cat_avgs, org_avgs)
                status = _demand_status(
                    pred,
                    int(ev.get("current_registrations") or 0),
                    int(ev.get("capacity") or 100),
                )

                # DELETE + INSERT (no unique constraint on eventId)
                cur.execute('DELETE FROM "EventPrediction" WHERE "eventId" = %s', (ev["id"],))
                cur.execute(
                    """
                    INSERT INTO "EventPrediction"
                        (id, "eventId", "predictedRegistrations", confidence, "createdAt")
                    VALUES (gen_random_uuid(), %s, %s, %s, NOW())
                    """,
                    (ev["id"], pred, conf),
                )

                results.append({
                    "id": ev["id"],
                    "eventTitle": ev.get("title", ""),
                    "category": ev.get("category", ""),
                    "currentRegistrations": int(ev.get("current_registrations") or 0),
                    "capacity": int(ev.get("capacity") or 100),
                    "predictedRegistrations": pred,
                    "confidence": conf,
                    "demandStatus": status,
                })
        conn.commit()
    finally:
        conn.close()

    return {"predictions": results}


class PredictEventRequest(BaseModel):
    event_id: Optional[str] = None
    category: str = "Technology"
    capacity: int = 100
    event_date: Optional[str] = None
    start_time: Optional[str] = "10:00"
    organizer_id: Optional[str] = None


@router.post("/event-demand")
def predict_event_demand(req: PredictEventRequest):
    if not os.path.exists(DEMAND_MODEL_PATH):
        try:
            _train_demand_model()
        except ValueError as e:
            raise HTTPException(status_code=503, detail=f"Could not auto-train: {e}")

    rf  = joblib.load(DEMAND_MODEL_PATH)
    enc = joblib.load(DEMAND_ENCODER_PATH)
    le, cat_avgs, org_avgs = enc["le"], enc["cat_avgs"], enc["org_avgs"]

    ev = {
        "category":     req.category,
        "capacity":     req.capacity,
        "event_date":   req.event_date or "2026-01-01",
        "start_time":   req.start_time or "10:00",
        "organizer_id": req.organizer_id,
    }
    pred, conf = _predict_for_event(ev, rf, le, cat_avgs, org_avgs)
    status = _demand_status(pred, 0, req.capacity)

    return {
        "predicted_registrations": pred,
        "confidence": conf,
        "demand_status": status,
        "category": req.category,
    }

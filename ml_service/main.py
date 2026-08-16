"""
College Event Intelligence Platform — ML Service
FastAPI application that exposes all AI/ML endpoints.
Runs on port 8000; the Node.js backend proxies to it internally.

Never expose this service directly to the frontend — all calls
must pass through the Express backend which enforces JWT auth.
"""

import os
import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from routers import behavior, sentiment, recommendation, prediction, rag, generator, insights

logger = logging.getLogger("ml_service.startup")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")


def _auto_train():
    """
    Auto-train all models that require pre-training on startup.
    Runs in a background thread — errors are logged but never crash or block the service.
    """
    import time
    time.sleep(1)

    # ── 1. K-Means student behavior clustering ──────────────────────────────
    logger.info("[startup] Training student behavior model (K-Means)...")
    try:
        from routers.behavior import _fetch_student_features, _train_and_save, \
            _build_cluster_label_map, _compute_engagement_score, _save_behaviors_to_db
        import pandas as pd

        df = _fetch_student_features()
        if df.empty or len(df) < 5:
            logger.warning("[startup] Not enough students to train behavior model (need ≥5). Skipping.")
        else:
            kmeans, scaler, k = _train_and_save(df)
            from sklearn.metrics import silhouette_score
            from routers.behavior import FEATURE_COLS
            import numpy as np

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
            logger.info(
                f"[startup] Behavior model trained — {len(df)} students, "
                f"{k} clusters, silhouette={round(sil, 4)}"
            )
    except Exception as e:
        logger.error(f"[startup] Behavior model training failed: {e}")

    # ── 2. RandomForest event demand prediction ─────────────────────────────
    logger.info("[startup] Training event demand prediction model (RandomForest)...")
    try:
        from routers.prediction import _train_demand_model
        _, _, _, _, metrics = _train_demand_model()
        logger.info(
            f"[startup] Demand model trained — MAE={metrics['mae']}, "
            f"R²={metrics['r2']}, n_train={metrics['n_train']}"
        )
    except ValueError as e:
        logger.warning(f"[startup] Demand model skipped — not enough data: {e}")
    except Exception as e:
        logger.error(f"[startup] Demand model training failed: {e}")

    # ── 3. Sentiment — batch-analyze all unanalyzed feedback ───────────────
    logger.info("[startup] Running sentiment analysis on unanalyzed feedback...")
    try:
        from routers.sentiment import analyze_text, _extract_topics
        from core.db import execute_query, get_db_connection

        pending = execute_query(
            """
            SELECT id, comment FROM "Feedback"
            WHERE comment IS NOT NULL AND comment <> ''
              AND sentiment IS NULL
            """
        )
        if not pending:
            logger.info("[startup] No unanalyzed feedback — sentiment step skipped.")
        else:
            conn = get_db_connection()
            processed = 0
            try:
                with conn.cursor() as cur:
                    for fb in pending:
                        result = analyze_text(fb["comment"])
                        topics = _extract_topics(fb["comment"])
                        cur.execute(
                            """
                            UPDATE "Feedback"
                            SET sentiment        = %s,
                                "sentimentScore" = %s,
                                topics           = %s
                            WHERE id = %s
                            """,
                            (result["label"], result["score"], topics, fb["id"]),
                        )
                        processed += 1
                conn.commit()
            finally:
                conn.close()
            logger.info(f"[startup] Sentiment analysis complete — {processed} feedback records processed.")
    except Exception as e:
        logger.error(f"[startup] Sentiment analysis failed: {e}")

    # ── 4. RAG — index all events into KnowledgeDocument ───────────────────
    logger.info("[startup] Indexing events for RAG knowledge base...")
    try:
        from routers.rag import index_events
        result = index_events()
        logger.info(f"[startup] RAG index complete — {result}")
    except Exception as e:
        logger.error(f"[startup] RAG indexing failed: {e}")

    # ── 5. AI Insights — generate fresh insights from DB analytics ─────────
    logger.info("[startup] Generating AI insights...")
    try:
        from routers.insights import generate_insights
        result = generate_insights()
        count = len(result.get("insights", []))
        logger.info(f"[startup] AI insights generated — {count} insights stored.")
    except Exception as e:
        logger.error(f"[startup] Insights generation failed: {e}")

    logger.info("[startup] ✅ All auto-training and indexing complete.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run startup tasks in background thread, yield control to FastAPI."""
    import threading
    t = threading.Thread(target=_auto_train, daemon=True)
    t.start()
    yield


app = FastAPI(
    title="College Event Intelligence — ML Service",
    version="1.0.0",
    description="AI/ML microservice: clustering, sentiment, recommendations, predictions, RAG, event generation, insights.",
    lifespan=lifespan,
)

# CORS — only allow requests from the Node.js backend (localhost:5000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(behavior.router,       prefix="/ml/behavior",       tags=["Behavior"])
app.include_router(sentiment.router,      prefix="/ml/sentiment",      tags=["Sentiment"])
app.include_router(recommendation.router, prefix="/ml/recommendation", tags=["Recommendation"])
app.include_router(prediction.router,     prefix="/ml/prediction",     tags=["Prediction"])
app.include_router(rag.router,            prefix="/ml/rag",            tags=["RAG"])
app.include_router(generator.router,      prefix="/ml/generator",      tags=["Generator"])
app.include_router(insights.router,       prefix="/ml/insights",       tags=["Insights"])


@app.get("/health")
def health():
    return {"status": "ok", "service": "college-events-ml"}


@app.get("/startup-status")
def startup_status():
    """Check which models are trained and ready."""
    import os
    MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
    behavior_ready  = os.path.exists(os.path.join(MODEL_DIR, "behavior_model.joblib"))
    demand_ready    = os.path.exists(os.path.join(MODEL_DIR, "demand_model.joblib"))
    return {
        "behavior_model":  "ready" if behavior_ready  else "not_trained",
        "demand_model":    "ready" if demand_ready    else "not_trained",
        "sentiment_model": "huggingface_api",   # no local file needed
        "rag_index":       "in_db",             # stored in KnowledgeDocument table
        "insights":        "in_db",             # stored in AIInsight table
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

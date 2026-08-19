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
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

load_dotenv()

from routers import behavior, sentiment, recommendation, prediction, rag, generator, insights, poster, analytics, dashboard

logger = logging.getLogger("ml_service.startup")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")


def _auto_train():
    """
    Auto-train all models that require pre-training on startup.
    Runs in a background thread with garbage collection — errors are logged but never crash or block the service.
    """
    import time
    import gc
    time.sleep(3)

    # ── 1. K-Means student behavior clustering ──────────────────────────────
    logger.info("[startup] Training student behavior model (K-Means)...")
    try:
        from pathlib import Path
        model_file = Path(__file__).resolve().parent / "models" / "behavior_kmeans.joblib"
        if not model_file.exists():
            from training.train_behavior import main as train_behavior
            train_behavior()
            logger.info("[startup] Behavior model trained and artifacts saved.")
        else:
            from services.behavior_service import get_behavior_service
            svc = get_behavior_service()
            logger.info(f"[startup] Behavior model loaded — {len(svc.cluster_labels)} cluster labels active.")
    except Exception as e:
        logger.error(f"[startup] Behavior model training failed: {e}")
    gc.collect()

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
    gc.collect()

    # ── 3. Sentiment — batch-analyze all unanalyzed feedback ───────────────
    logger.info("[startup] Running sentiment analysis on unanalyzed feedback...")
    try:
        from routers.sentiment import analyze_all_db_feedback
        result = analyze_all_db_feedback(batch_size=50)
        logger.info(f"[startup] Sentiment analysis complete — {result.get('analyzed', 0)} feedback records processed.")
    except Exception as e:
        logger.error(f"[startup] Sentiment analysis failed: {e}")
    gc.collect()

    # ── 4. RAG — index all events into KnowledgeDocument ───────────────────
    logger.info("[startup] Indexing events for RAG knowledge base...")
    try:
        from rag.index_events import index_all_events
        result = index_all_events()
        logger.info(f"[startup] RAG index complete — {result}")
    except Exception as e:
        logger.error(f"[startup] RAG indexing failed: {e}")
    gc.collect()

    # ── 5. AI Insights — generate fresh insights from DB analytics ─────────
    logger.info("[startup] Generating AI insights...")
    try:
        from routers.insights import generate_insights
        result = generate_insights()
        count = len(result.get("insights", []))
        logger.info(f"[startup] AI insights generated — {count} insights stored.")
    except Exception as e:
        logger.error(f"[startup] Insights generation failed: {e}")
    gc.collect()

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

# CORS — allow requests from local and production deployed backends
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(behavior.router,       prefix="/api/v1/behavior",   tags=["Behavior"])
app.include_router(behavior.router,       prefix="/ml/behavior",       tags=["Behavior"])
app.include_router(sentiment.router,      prefix="/api/v1/sentiment",  tags=["Sentiment"])
app.include_router(sentiment.router,      prefix="/ml/sentiment",      tags=["Sentiment"])
app.include_router(recommendation.router, prefix="/api/v1",            tags=["Recommendation"])
app.include_router(recommendation.router, prefix="/ml/recommendation", tags=["Recommendation"])
app.include_router(prediction.router,     prefix="/ml/prediction",     tags=["Prediction"])
app.include_router(rag.router,            prefix="/api/v1",            tags=["RAG"])
app.include_router(rag.router,            prefix="/ml/rag",            tags=["RAG"])
app.include_router(generator.router,      prefix="/ml/generator",      tags=["Generator"])
app.include_router(insights.router,       prefix="/ml/insights",       tags=["Insights"])
app.include_router(poster.router,         prefix="/api/v1",            tags=["Poster"])
app.include_router(poster.router,         prefix="/ml",                tags=["Poster"])
app.include_router(analytics.router,      prefix="/api/v1",            tags=["Analytics"])
app.include_router(analytics.router,      prefix="/ml",                tags=["Analytics"])
app.include_router(dashboard.router,      prefix="/api/v1",            tags=["Dashboard"])
app.include_router(dashboard.router,      prefix="/ml",                tags=["Dashboard"])

# Mount static directory for generated posters & background images
static_path = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(static_path, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_path), name="static")


@app.get("/")
def root():
    return {
        "status": "online",
        "service": "EventIntel AI ML Service",
        "version": "1.0.0",
        "health": "/health",
        "startup_status": "/startup-status"
    }


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
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)

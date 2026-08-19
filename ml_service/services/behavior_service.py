"""
Student Behavior Intelligence — Prediction Service
Loads trained K-Means model, StandardScaler, and metadata,
validates incoming feature payloads, and performs behavioral cluster inference.
"""

import os
import json
from pathlib import Path
from typing import Dict, Any
import joblib
import numpy as np

from preprocessing.behavior_preprocessor import (
    FEATURE_NAMES,
    validate_feature_dict,
    extract_feature_vector,
    compute_engagement_score
)

ROOT_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = ROOT_DIR / "models"

MODEL_FILE = MODELS_DIR / "behavior_kmeans.joblib"
SCALER_FILE = MODELS_DIR / "behavior_scaler.joblib"
METADATA_FILE = MODELS_DIR / "behavior_metadata.json"


class BehaviorService:
    """Singleton service for student behavior cluster predictions."""

    def __init__(self):
        self.model = None
        self.scaler = None
        self.metadata = None
        self.cluster_labels = {}
        self._load_artifacts()

    def _load_artifacts(self):
        """Loads model, scaler, and metadata from disk."""
        if not MODEL_FILE.exists():
            raise FileNotFoundError(f"Model file missing: {MODEL_FILE}")
        if not SCALER_FILE.exists():
            raise FileNotFoundError(f"Scaler file missing: {SCALER_FILE}")
        if not METADATA_FILE.exists():
            raise FileNotFoundError(f"Metadata file missing: {METADATA_FILE}")

        self.model = joblib.load(MODEL_FILE)
        self.scaler = joblib.load(SCALER_FILE)

        with open(METADATA_FILE, "r", encoding="utf-8") as f:
            self.metadata = json.load(f)

        self.cluster_labels = self.metadata.get("cluster_labels", {})

    def predict_student(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes behavioral inference for a student:
        1. Validates all 13 feature inputs.
        2. Aligns feature values to exact training feature order.
        3. Scales features with fitted StandardScaler.
        4. Predicts cluster assignment via KMeans.
        5. Resolves behavioral tier label (LOW_ACTIVITY / MODERATE_ACTIVITY / HIGHLY_ACTIVE).
        6. Computes transparent, deterministic engagement score (0-100).
        """
        if self.model is None or self.scaler is None:
            self._load_artifacts()

        # Validate and extract vector
        clean_features = validate_feature_dict(features)
        feature_vector = extract_feature_vector(clean_features)

        # Scale features
        scaled_vector = self.scaler.transform(feature_vector)

        # Predict cluster ID
        cluster_id = int(self.model.predict(scaled_vector)[0])

        # Resolve cluster label
        cluster_label = self.cluster_labels.get(str(cluster_id), f"CLUSTER_{cluster_id}")

        # Compute deterministic engagement score
        engagement_score = compute_engagement_score(clean_features)

        return {
            "clusterId": cluster_id,
            "clusterLabel": cluster_label,
            "engagementScore": engagement_score
        }


# Global singleton instance
_behavior_service = None

def get_behavior_service() -> BehaviorService:
    global _behavior_service
    if _behavior_service is None:
        _behavior_service = BehaviorService()
    return _behavior_service

def predict_student(features: Dict[str, Any]) -> Dict[str, Any]:
    """Convenience functional wrapper around BehaviorService."""
    service = get_behavior_service()
    return service.predict_student(features)

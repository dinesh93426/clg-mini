"""
Student Behavior Intelligence — Preprocessing Module
Handles feature schema definition, input validation, missing value imputation,
and deterministic engagement scoring.
"""

from typing import Dict, Any, List, Union
import numpy as np
import pandas as pd

FEATURE_NAMES: List[str] = [
    "total_registrations",
    "total_attendance",
    "attendance_rate",
    "technical_events",
    "cultural_events",
    "sports_events",
    "workshop_events",
    "hackathon_events",
    "seminar_events",
    "event_views",
    "event_likes",
    "cancellations",
    "average_feedback_rating"
]

EVENT_CATEGORY_COLS: List[str] = [
    "technical_events",
    "cultural_events",
    "sports_events",
    "workshop_events",
    "hackathon_events",
    "seminar_events"
]


def validate_feature_dict(features: Dict[str, Any]) -> Dict[str, float]:
    """
    Validate that all required features are present and numeric.
    Raises ValueError if required features are missing or invalid.
    """
    if not isinstance(features, dict):
        raise TypeError(f"Expected dictionary of features, got {type(features).__name__}")

    clean_features: Dict[str, float] = {}
    missing_keys = []

    for name in FEATURE_NAMES:
        if name not in features or features[name] is None:
            missing_keys.append(name)
        else:
            val = features[name]
            try:
                numeric_val = float(val)
                if np.isnan(numeric_val):
                    missing_keys.append(name)
                else:
                    clean_features[name] = numeric_val
            except (ValueError, TypeError):
                raise TypeError(f"Feature '{name}' must be numeric, received value: {val!r}")

    if missing_keys:
        raise ValueError(f"Missing required feature(s): {', '.join(missing_keys)}")

    return clean_features


def extract_feature_vector(features: Dict[str, Any]) -> np.ndarray:
    """
    Extracts a 1D numpy feature vector in the exact training feature order.
    """
    valid_dict = validate_feature_dict(features)
    vector = np.array([valid_dict[col] for col in FEATURE_NAMES], dtype=np.float64)
    return vector.reshape(1, -1)


def compute_engagement_score(row: Union[pd.Series, Dict[str, Any]]) -> int:
    """
    Computes a deterministic engagement score (0 to 100) from normalized behavioral features.
    
    Formula Breakdown (Weights sum to 100):
    1. Attendance Quality (30%): attendance_rate * 30 (range: 0-30)
    2. Attendance Volume (25%): min(total_attendance / 25.0, 1.0) * 25 (range: 0-25)
    3. Activity Volume (10%): min(total_registrations / 30.0, 1.0) * 10 (range: 0-10)
    4. Community Interaction (15%):
       - Views (10%): min(event_views / 60.0, 1.0) * 10
       - Likes (5%): min(event_likes / 30.0, 1.0) * 5
    5. Feedback Quality (10%): min(max(average_feedback_rating / 5.0, 0.0), 1.0) * 10 (range: 0-10)
    6. Participation Diversity (10%): (count of categories with >0 events / 6.0) * 10 (range: 0-10)
    7. Cancellation Penalty: Deduct up to 5 points based on cancellation ratio.
    
    Final score bounded between 0 and 100.
    """
    if isinstance(row, dict):
        d = row
    else:
        d = row.to_dict()

    tot_reg = float(d.get("total_registrations", 0))
    tot_att = float(d.get("total_attendance", 0))
    att_rate = float(d.get("attendance_rate", 0.0))
    views = float(d.get("event_views", 0))
    likes = float(d.get("event_likes", 0))
    rating = float(d.get("average_feedback_rating", 0.0))
    cancels = float(d.get("cancellations", 0))

    # Diversity count
    diversity_count = 0
    for cat in EVENT_CATEGORY_COLS:
        if float(d.get(cat, 0)) > 0:
            diversity_count += 1

    # Components
    c_att_rate = np.clip(att_rate, 0.0, 1.0) * 30.0
    c_att_vol = min(max(tot_att, 0.0) / 25.0, 1.0) * 25.0
    c_reg_vol = min(max(tot_reg, 0.0) / 30.0, 1.0) * 10.0
    c_views = min(max(views, 0.0) / 60.0, 1.0) * 10.0
    c_likes = min(max(likes, 0.0) / 30.0, 1.0) * 5.0
    c_rating = (np.clip(rating, 0.0, 5.0) / 5.0) * 10.0
    c_diversity = (diversity_count / 6.0) * 10.0

    raw_score = c_att_rate + c_att_vol + c_reg_vol + c_views + c_likes + c_rating + c_diversity

    # Cancellation penalty
    if tot_reg > 0:
        cancel_ratio = min(cancels / tot_reg, 1.0)
        penalty = cancel_ratio * 8.0
        raw_score -= penalty

    final_score = int(round(np.clip(raw_score, 0.0, 100.0)))
    return final_score

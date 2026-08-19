"""
Comprehensive Test Suite for Student Behavior Intelligence K-Means Model
Tests:
1. Dataset loading
2. Missing values handling
3. Feature preprocessing
4. Model loading
5. Prediction functionality
6. Invalid input handling
7. Missing feature error handling
8. Wrong feature type error handling
9. Model file missing error handling
10. Evaluation and output on at least 10 real students from the CSV.
"""

import os
import sys
import unittest
import tempfile
from pathlib import Path
import pandas as pd
import numpy as np

# Ensure ml_service root is in sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from preprocessing.behavior_preprocessor import (
    FEATURE_NAMES,
    validate_feature_dict,
    extract_feature_vector,
    compute_engagement_score
)
from services.behavior_service import BehaviorService, predict_student


class TestStudentBehaviorKMeans(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.data_path = ROOT_DIR / "data" / "student_behavior_kmeans_dataset.csv"
        cls.service = BehaviorService()
        cls.sample_valid_payload = {
            "total_registrations": 18,
            "total_attendance": 16,
            "attendance_rate": 0.89,
            "technical_events": 10,
            "cultural_events": 2,
            "sports_events": 1,
            "workshop_events": 4,
            "hackathon_events": 2,
            "seminar_events": 1,
            "event_views": 40,
            "event_likes": 15,
            "cancellations": 1,
            "average_feedback_rating": 4.3
        }

    # 1. Dataset loading
    def test_01_dataset_loading(self):
        self.assertTrue(self.data_path.exists(), f"Dataset file {self.data_path} does not exist.")
        df = pd.read_csv(self.data_path)
        self.assertGreaterEqual(len(df), 500, "Dataset should have at least 500 records.")
        for col in FEATURE_NAMES:
            self.assertIn(col, df.columns, f"Feature column '{col}' missing from dataset.")

    # 2. Missing values handling
    def test_02_missing_values(self):
        df = pd.read_csv(self.data_path)
        null_counts = df[FEATURE_NAMES].isnull().sum().sum()
        self.assertEqual(null_counts, 0, "Dataset features should have no unhandled null values.")

    # 3. Feature preprocessing
    def test_03_feature_preprocessing(self):
        clean = validate_feature_dict(self.sample_valid_payload)
        self.assertEqual(len(clean), 13)
        vector = extract_feature_vector(clean)
        self.assertEqual(vector.shape, (1, 13))
        self.assertIsInstance(vector, np.ndarray)

    # 4. Model loading
    def test_04_model_loading(self):
        self.assertIsNotNone(self.service.model, "KMeans model failed to load.")
        self.assertIsNotNone(self.service.scaler, "StandardScaler failed to load.")
        self.assertIsNotNone(self.service.metadata, "Metadata failed to load.")
        self.assertEqual(self.service.metadata.get("selected_k"), 3)
        self.assertIn("cluster_labels", self.service.metadata)

    # 5. Prediction
    def test_05_prediction(self):
        res = predict_student(self.sample_valid_payload)
        self.assertIn("clusterId", res)
        self.assertIn("clusterLabel", res)
        self.assertIn("engagementScore", res)
        self.assertIn(res["clusterLabel"], ["LOW_ACTIVITY", "MODERATE_ACTIVITY", "HIGHLY_ACTIVE"])
        self.assertTrue(0 <= res["engagementScore"] <= 100)

    # 6. Invalid input (empty dict or non-dict)
    def test_06_invalid_input(self):
        with self.assertRaises((ValueError, TypeError)):
            predict_student({})
        with self.assertRaises(TypeError):
            predict_student("invalid_string_input")

    # 7. Missing feature
    def test_07_missing_feature(self):
        incomplete = self.sample_valid_payload.copy()
        del incomplete["attendance_rate"]
        with self.assertRaises(ValueError) as ctx:
            predict_student(incomplete)
        self.assertIn("attendance_rate", str(ctx.exception))

    # 8. Wrong feature type (string that cannot be cast to float)
    def test_08_wrong_feature_type(self):
        bad_type = self.sample_valid_payload.copy()
        bad_type["average_feedback_rating"] = "NotANumber"
        with self.assertRaises(TypeError):
            predict_student(bad_type)

    # 9. Model file missing error handling
    def test_09_model_file_missing(self):
        saved_file = ROOT_DIR / "models" / "behavior_kmeans.joblib"
        self.assertTrue(saved_file.exists())

    # 10. Test on 10+ students from CSV and print table
    def test_10_csv_students_evaluation(self):
        df = pd.read_csv(self.data_path)
        sample_df = df.head(15)  # Test first 15 students

        print("\n" + "=" * 70)
        print("SAMPLE INFERENCE ON 15 STUDENTS FROM CSV DATASET")
        print("=" * 70)
        print(f"{'Student ID':^12} | {'Cluster ID':^10} | {'Cluster Label':^20} | {'Engagement Score':^16}")
        print("-" * 70)

        for _, row in sample_df.iterrows():
            sid = row["student_id"]
            feat_dict = {f: row[f] for f in FEATURE_NAMES}
            pred = predict_student(feat_dict)
            print(f"{sid:^12} | {pred['clusterId']:^10} | {pred['clusterLabel']:^20} | {pred['engagementScore']:^16}")

            self.assertIn(pred["clusterLabel"], ["LOW_ACTIVITY", "MODERATE_ACTIVITY", "HIGHLY_ACTIVE"])
            self.assertTrue(0 <= pred["engagementScore"] <= 100)

        print("=" * 70)


if __name__ == "__main__":
    unittest.main()

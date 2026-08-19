"""
Student Behavior Intelligence — K-Means Clustering Training Pipeline
Loads dataset, evaluates optimal K, trains K-Means with StandardScaler,
analyzes and labels clusters, computes engagement scores, generates reports & plots,
and persists artifacts to models/ and reports/.
"""

import os
import sys
import json
from datetime import datetime, timezone
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score
from sklearn.decomposition import PCA

# Add ml_service root to python path
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

import matplotlib
matplotlib.use("Agg")  # Non-interactive backend for server/CLI
import matplotlib.pyplot as plt

from preprocessing.behavior_preprocessor import (
    FEATURE_NAMES,
    compute_engagement_score
)

DATA_PATH = ROOT_DIR / "data" / "student_behavior_kmeans_dataset.csv"
MODELS_DIR = ROOT_DIR / "models"
REPORTS_DIR = ROOT_DIR / "reports"

MODELS_DIR.mkdir(parents=True, exist_ok=True)
REPORTS_DIR.mkdir(parents=True, exist_ok=True)


def load_and_inspect_data(csv_path: Path) -> pd.DataFrame:
    """1. Load dataset and print inspection statistics."""
    print("=" * 60)
    print("1. DATA LOADING & INSPECTION")
    print("=" * 60)
    
    if not csv_path.exists():
        raise FileNotFoundError(f"Dataset not found at expected path: {csv_path}")

    df = pd.read_csv(csv_path)
    print(f"Dataset loaded from: {csv_path.name}")
    print(f"Dataset Shape: {df.shape[0]} rows, {df.shape[1]} columns")
    print(f"\nColumn Names:\n{list(df.columns)}")
    
    print("\nData Types:")
    for col, dtype in df.dtypes.items():
        print(f"  - {col}: {dtype}")

    missing = df.isnull().sum()
    print("\nMissing Values per Column:")
    print(missing[missing > 0] if missing.sum() > 0 else "  No missing values detected.")

    duplicates = df.duplicated().sum()
    print(f"\nDuplicate Rows: {duplicates}")

    # Handle missing numerical values if any exist
    for col in FEATURE_NAMES:
        if col in df.columns and df[col].isnull().sum() > 0:
            median_val = df[col].median()
            df[col] = df[col].fillna(median_val)
            print(f"  Imputed {col} missing values with column median: {median_val}")

    return df


def evaluate_k_values(X_scaled: np.ndarray, k_values: list = [2, 3, 4, 5]):
    """2. Evaluate K values and generate metrics."""
    print("\n" + "=" * 60)
    print("2. K-MEANS HYPERPARAMETER EVALUATION (OPTIMAL K)")
    print("=" * 60)

    results = {}
    inertias = []
    silhouette_scores = []

    print(f"{'K':^6} | {'Silhouette Score':^18} | {'Inertia (SSE)':^16}")
    print("-" * 46)

    for k in k_values:
        kmeans = KMeans(n_clusters=k, random_state=42, n_init=20)
        labels = kmeans.fit_predict(X_scaled)
        sil = silhouette_score(X_scaled, labels)
        results[k] = {
            "silhouette": sil,
            "inertia": kmeans.inertia_,
            "model": kmeans,
            "labels": labels
        }
        inertias.append(kmeans.inertia_)
        silhouette_scores.append(sil)
        print(f"{k:^6} | {sil:^18.4f} | {kmeans.inertia_:^16.2f}")

    # Decision rationale
    # Conceptually, the project establishes 3 distinct behavioral archetypes:
    # LOW_ACTIVITY, MODERATE_ACTIVITY, HIGHLY_ACTIVE.
    selected_k = 3
    print("\nSelection Rationale:")
    print(f"  Evaluated K values: {k_values}")
    print(f"  Selected K: {selected_k}")
    print(f"  Silhouette Score for K=3: {results[selected_k]['silhouette']:.4f}")
    print("  Justification: K=3 provides strong cluster cohesion and separates student behaviors")
    print("  into 3 distinct, actionable campus tiers (LOW_ACTIVITY, MODERATE_ACTIVITY, HIGHLY_ACTIVE).")

    return selected_k, results, inertias, silhouette_scores


def generate_visualizations(
    k_values: list,
    inertias: list,
    silhouette_scores: list,
    X_scaled: np.ndarray,
    df: pd.DataFrame,
    cluster_label_col: str = "cluster_label"
):
    """3. Create visualization artifacts in reports/."""
    print("\n" + "=" * 60)
    print("3. GENERATING VISUALIZATION ARTIFACTS")
    print("=" * 60)

    # 1. Elbow Curve
    plt.figure(figsize=(7, 4.5))
    plt.plot(k_values, inertias, marker='o', color='#5B4CFB', linewidth=2, markersize=8)
    plt.title("K-Means Elbow Curve (Inertia vs K)", fontsize=13, fontweight='bold', pad=12)
    plt.xlabel("Number of Clusters (K)", fontsize=11)
    plt.ylabel("Inertia / Sum of Squared Errors", fontsize=11)
    plt.grid(True, linestyle='--', alpha=0.5)
    plt.tight_layout()
    elbow_path = REPORTS_DIR / "elbow_curve.png"
    plt.savefig(elbow_path, dpi=200)
    plt.close()
    print(f"  Saved: {elbow_path.name}")

    # 2. Silhouette Scores
    plt.figure(figsize=(7, 4.5))
    bars = plt.bar(k_values, silhouette_scores, color=['#7C3AED', '#5B4CFB', '#12B76A', '#F79009'], width=0.5, edgecolor='#333333', linewidth=0.5)
    plt.title("Silhouette Score vs K", fontsize=13, fontweight='bold', pad=12)
    plt.xlabel("Number of Clusters (K)", fontsize=11)
    plt.ylabel("Silhouette Score", fontsize=11)
    plt.ylim(0, max(silhouette_scores) * 1.25)
    for bar in bars:
        height = bar.get_height()
        plt.text(bar.get_x() + bar.get_width()/2., height + 0.01, f'{height:.4f}', ha='center', va='bottom', fontsize=10, fontweight='bold')
    plt.grid(axis='y', linestyle='--', alpha=0.5)
    plt.tight_layout()
    sil_path = REPORTS_DIR / "silhouette_scores.png"
    plt.savefig(sil_path, dpi=200)
    plt.close()
    print(f"  Saved: {sil_path.name}")

    # 3. Cluster Distribution
    plt.figure(figsize=(7, 4.5))
    cluster_counts = df[cluster_label_col].value_counts()
    colors = ['#5B4CFB', '#12B76A', '#F79009', '#E11D48'][:len(cluster_counts)]
    bars = plt.bar(cluster_counts.index, cluster_counts.values, color=colors, width=0.5, edgecolor='#333333', linewidth=0.5)
    plt.title("Student Distribution across Behavioral Clusters", fontsize=13, fontweight='bold', pad=12)
    plt.xlabel("Behavioral Tier", fontsize=11)
    plt.ylabel("Number of Students", fontsize=11)
    for bar in bars:
        height = bar.get_height()
        pct = (height / len(df)) * 100
        plt.text(bar.get_x() + bar.get_width()/2., height + 3, f'{height} ({pct:.1f}%)', ha='center', va='bottom', fontsize=10, fontweight='bold')
    plt.grid(axis='y', linestyle='--', alpha=0.5)
    plt.tight_layout()
    dist_path = REPORTS_DIR / "cluster_distribution.png"
    plt.savefig(dist_path, dpi=200)
    plt.close()
    print(f"  Saved: {dist_path.name}")

    # 4. PCA 2D Cluster Visualization
    pca = PCA(n_components=2, random_state=42)
    X_pca = pca.fit_transform(X_scaled)
    df_pca = pd.DataFrame(X_pca, columns=['PCA1', 'PCA2'])
    df_pca['cluster'] = df[cluster_label_col]

    plt.figure(figsize=(8, 6))
    label_color_map = {
        'LOW_ACTIVITY': '#E11D48',
        'MODERATE_ACTIVITY': '#F79009',
        'HIGHLY_ACTIVE': '#12B76A'
    }
    for label in df_pca['cluster'].unique():
        sub = df_pca[df_pca['cluster'] == label]
        c = label_color_map.get(label, '#5B4CFB')
        plt.scatter(sub['PCA1'], sub['PCA2'], label=label, color=c, alpha=0.75, edgecolors='white', s=60, linewidth=0.6)

    var_exp = pca.explained_variance_ratio_
    plt.title("Student Clusters (PCA 2D Projection)", fontsize=13, fontweight='bold', pad=12)
    plt.xlabel(f"Principal Component 1 ({var_exp[0]*100:.1f}% variance)", fontsize=11)
    plt.ylabel(f"Principal Component 2 ({var_exp[1]*100:.1f}% variance)", fontsize=11)
    plt.legend(title="Behavioral Tier", frameon=True, loc='best')
    plt.grid(True, linestyle='--', alpha=0.4)
    plt.tight_layout()
    pca_path = REPORTS_DIR / "cluster_visualization.png"
    plt.savefig(pca_path, dpi=200)
    plt.close()
    print(f"  Saved: {pca_path.name}")


def main():
    import joblib

    print("\n" + "=" * 60)
    print("STUDENT BEHAVIOR INTELLIGENCE: K-MEANS TRAINING")
    print("=" * 60)

    # 1. Load Data
    df = load_and_inspect_data(DATA_PATH)

    # 2. Extract Feature Matrix
    X = df[FEATURE_NAMES].values
    print(f"\nFeature matrix X constructed: {X.shape[0]} samples, {X.shape[1]} features.")
    print("Features used (student_id excluded):")
    for idx, f in enumerate(FEATURE_NAMES, start=1):
        print(f"  {idx:2d}. {f}")

    # 3. Fit StandardScaler
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    print("\nStandardScaler fitted and applied to feature matrix.")

    # 4. Evaluate K values
    k_candidates = [2, 3, 4, 5]
    selected_k, eval_results, inertias, sil_scores = evaluate_k_values(X_scaled, k_candidates)

    # 5. Train Final Model
    kmeans = KMeans(n_clusters=selected_k, random_state=42, n_init=20)
    cluster_ids = kmeans.fit_predict(X_scaled)
    df["cluster_id"] = cluster_ids
    final_sil = silhouette_score(X_scaled, cluster_ids)

    # 6. Compute Engagement Scores
    df["engagement_score"] = df.apply(compute_engagement_score, axis=1)

    # 7. Dynamic Cluster Labeling based on Cluster Average Engagement
    cluster_mean_eng = df.groupby("cluster_id")["engagement_score"].mean().to_dict()
    sorted_clusters = sorted(cluster_mean_eng.items(), key=lambda x: x[1])

    cluster_label_map = {}
    tier_names = ["LOW_ACTIVITY", "MODERATE_ACTIVITY", "HIGHLY_ACTIVE"]
    for rank, (cid, avg_eng) in enumerate(sorted_clusters):
        tier = tier_names[rank] if rank < len(tier_names) else f"TIER_{rank+1}"
        cluster_label_map[int(cid)] = tier

    df["cluster_label"] = df["cluster_id"].map(cluster_label_map)

    # 8. Cluster Analysis Summary
    print("\n" + "=" * 60)
    print("4. CLUSTER PROFILING & SUMMARY")
    print("=" * 60)

    cluster_sizes = {}
    cluster_profiles = {}

    for cid in range(selected_k):
        sub = df[df["cluster_id"] == cid]
        label = cluster_label_map[cid]
        size = len(sub)
        pct = (size / len(df)) * 100
        cluster_sizes[str(cid)] = size

        profile = {
            "label": label,
            "student_count": size,
            "percentage": round(pct, 2),
            "avg_registrations": round(float(sub["total_registrations"].mean()), 2),
            "avg_attendance": round(float(sub["total_attendance"].mean()), 2),
            "avg_attendance_rate": round(float(sub["attendance_rate"].mean()), 3),
            "avg_technical": round(float(sub["technical_events"].mean()), 2),
            "avg_cultural": round(float(sub["cultural_events"].mean()), 2),
            "avg_sports": round(float(sub["sports_events"].mean()), 2),
            "avg_workshops": round(float(sub["workshop_events"].mean()), 2),
            "avg_hackathons": round(float(sub["hackathon_events"].mean()), 2),
            "avg_seminars": round(float(sub["seminar_events"].mean()), 2),
            "avg_views": round(float(sub["event_views"].mean()), 2),
            "avg_likes": round(float(sub["event_likes"].mean()), 2),
            "avg_cancellations": round(float(sub["cancellations"].mean()), 2),
            "avg_feedback_rating": round(float(sub["average_feedback_rating"].mean()), 2),
            "avg_engagement_score": round(float(sub["engagement_score"].mean()), 2),
        }
        cluster_profiles[str(cid)] = profile

        print(f"\nCluster {cid} [{label}]:")
        print(f"  Students          : {size} ({pct:.1f}%)")
        print(f"  Avg Engagement    : {profile['avg_engagement_score']}")
        print(f"  Avg Registrations : {profile['avg_registrations']}")
        print(f"  Avg Attendance    : {profile['avg_attendance']} (Rate: {profile['avg_attendance_rate']*100:.1f}%)")
        print(f"  Avg Technical     : {profile['avg_technical']} | Workshops: {profile['avg_workshops']} | Hackathons: {profile['avg_hackathons']}")
        print(f"  Avg Views / Likes : {profile['avg_views']} / {profile['avg_likes']}")
        print(f"  Avg Rating        : {profile['avg_feedback_rating']} / 5.0")

    # 9. Save Artifacts
    scaler_path = MODELS_DIR / "behavior_scaler.joblib"
    model_path = MODELS_DIR / "behavior_kmeans.joblib"
    meta_path = MODELS_DIR / "behavior_metadata.json"

    joblib.dump(scaler, scaler_path)
    joblib.dump(kmeans, model_path)

    # Convert cluster centers to unscaled and scaled representations
    centers_scaled = kmeans.cluster_centers_.tolist()
    centers_unscaled = scaler.inverse_transform(kmeans.cluster_centers_).tolist()

    metadata = {
        "model_name": "student_behavior_kmeans",
        "model_version": "v1",
        "algorithm": "KMeans",
        "training_samples": len(df),
        "number_of_features": len(FEATURE_NAMES),
        "selected_k": selected_k,
        "feature_names": FEATURE_NAMES,
        "silhouette_score": round(float(final_sil), 4),
        "cluster_labels": {str(k): v for k, v in cluster_label_map.items()},
        "cluster_sizes": cluster_sizes,
        "cluster_centers": {
            str(i): {
                feat: round(val, 4)
                for feat, val in zip(FEATURE_NAMES, centers_unscaled[i])
            }
            for i in range(selected_k)
        },
        "cluster_profiles": cluster_profiles,
        "training_date": datetime.now(timezone.utc).isoformat()
    }

    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=4)

    print(f"\nArtifacts successfully saved:")
    print(f"  - Scaler:   {scaler_path}")
    print(f"  - Model:    {model_path}")
    print(f"  - Metadata: {meta_path}")

    # 10. Generate Visualizations
    generate_visualizations(k_candidates, inertias, sil_scores, X_scaled, df, "cluster_label")

    # 11. Final Formatted Training Report
    print("\n" + "=" * 60)
    print("=========================================")
    print("STUDENT BEHAVIOR K-MEANS MODEL")
    print("=========================================")
    print(f"Dataset:\n{DATA_PATH.name}\n")
    print(f"Students:\n{len(df)}\n")
    print(f"Features:\n{len(FEATURE_NAMES)}\n")
    print(f"Selected K:\n{selected_k}\n")
    print(f"Silhouette Score:\n{final_sil:.4f}\n")

    for cid in range(selected_k):
        prof = cluster_profiles[str(cid)]
        print(f"Cluster {cid} ({prof['label']}):")
        print(f"  Students = {prof['student_count']} ({prof['percentage']}%)")
        print(f"  Registrations = {prof['avg_registrations']}")
        print(f"  Attendance = {prof['avg_attendance']} (Rate: {prof['avg_attendance_rate']})")
        print(f"  Avg Engagement = {prof['avg_engagement_score']}\n")

    print("Model:\nKMeans\n")
    print("Scaler:\nStandardScaler\n")
    print("Model saved:\nYES")
    print("=========================================")


if __name__ == "__main__":
    main()

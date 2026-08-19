"""
Student Feedback Sentiment Analysis — Transformer Fine-Tuning Pipeline
Loads 1,000 human-labeled college feedback samples, splits into Train/Val/Test (70/15/15),
evaluates the pretrained baseline, fine-tunes RoBERTa on college feedback,
compares metrics on an independent test set, and saves model artifacts and reports.
"""

import os
import sys
import json
import time
from pathlib import Path
from datetime import datetime, timezone
import pandas as pd
import numpy as np
import torch
from torch.utils.data import Dataset, DataLoader
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    get_linear_schedule_with_warmup
)
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

DATA_PATH = ROOT_DIR / "data" / "human_labeled_feedback_evaluation.csv"
MODELS_DIR = ROOT_DIR / "models" / "sentiment_model"
REPORTS_DIR = ROOT_DIR / "reports"
METADATA_FILE = ROOT_DIR / "models" / "sentiment_metadata.json"

MODELS_DIR.mkdir(parents=True, exist_ok=True)
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

BASE_MODEL_NAME = "cardiffnlp/twitter-roberta-base-sentiment-latest"
LABEL2ID = {"NEGATIVE": 0, "NEUTRAL": 1, "POSITIVE": 2}
ID2LABEL = {0: "NEGATIVE", 1: "NEUTRAL", 2: "POSITIVE"}


class FeedbackDataset(Dataset):
    def __init__(self, encodings, labels):
        self.encodings = encodings
        self.labels = labels

    def __getitem__(self, idx):
        item = {key: torch.tensor(val[idx]) for key, val in self.encodings.items()}
        item["labels"] = torch.tensor(self.labels[idx], dtype=torch.long)
        return item

    def __len__(self):
        return len(self.labels)


def compute_metrics(y_true, y_pred):
    acc = accuracy_score(y_true, y_pred)
    prec, rec, f1, _ = precision_recall_fscore_support(y_true, y_pred, average="weighted", zero_division=0)
    cm = confusion_matrix(y_true, y_pred, labels=[2, 1, 0])  # POSITIVE, NEUTRAL, NEGATIVE
    return {
        "accuracy": round(float(acc), 4),
        "precision": round(float(prec), 4),
        "recall": round(float(rec), 4),
        "f1": round(float(f1), 4),
        "confusion_matrix": cm.tolist()
    }


def evaluate_model(model, dataloader, device):
    model.eval()
    all_preds = []
    all_labels = []

    with torch.no_grad():
        for batch in dataloader:
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            labels = batch["labels"]

            outputs = model(input_ids, attention_mask=attention_mask)
            logits = outputs.logits
            preds = torch.argmax(logits, dim=-1).cpu().numpy()

            all_preds.extend(preds)
            all_labels.extend(labels.numpy())

    return compute_metrics(all_labels, all_preds), all_labels, all_preds


def generate_comparison_plots(base_metrics, fine_metrics, cm_base, cm_fine):
    fig, axes = plt.subplots(1, 2, figsize=(13, 5))

    # Metric comparison bar chart
    metrics_names = ["Accuracy", "Precision", "Recall", "F1 Score"]
    base_vals = [base_metrics["accuracy"]*100, base_metrics["precision"]*100, base_metrics["recall"]*100, base_metrics["f1"]*100]
    fine_vals = [fine_metrics["accuracy"]*100, fine_metrics["precision"]*100, fine_metrics["recall"]*100, fine_metrics["f1"]*100]

    x = np.arange(len(metrics_names))
    width = 0.35

    ax = axes[0]
    bars1 = ax.bar(x - width/2, base_vals, width, label="Pretrained Base", color="#94A3B8")
    bars2 = ax.bar(x + width/2, fine_vals, width, label="College Fine-Tuned", color="#5B4CFB")

    ax.set_ylabel("Score (%)", fontsize=11)
    ax.set_title("Pretrained Base vs Fine-Tuned Model (Test Set)", fontsize=12, fontweight="bold")
    ax.set_xticks(x)
    ax.set_xticklabels(metrics_names, fontsize=10)
    ax.legend()
    ax.set_ylim(0, 115)
    ax.grid(axis='y', linestyle='--', alpha=0.4)

    for bar in bars1:
        h = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2., h + 1, f"{h:.1f}%", ha='center', va='bottom', fontsize=8)
    for bar in bars2:
        h = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2., h + 1, f"{h:.1f}%", ha='center', va='bottom', fontsize=8, fontweight="bold")

    # Confusion matrix of fine-tuned model
    ax2 = axes[1]
    cm_arr = np.array(fine_metrics["confusion_matrix"])
    cax = ax2.matshow(cm_arr, cmap=plt.cm.Blues, alpha=0.8)
    classes = ["POS", "NEU", "NEG"]
    ax2.set_xticks([0, 1, 2])
    ax2.set_yticks([0, 1, 2])
    ax2.set_xticklabels(classes)
    ax2.set_yticklabels(classes)
    ax2.set_xlabel("Predicted Label", fontsize=11)
    ax2.set_ylabel("True Label", fontsize=11)
    ax2.set_title("Fine-Tuned Confusion Matrix", fontsize=12, fontweight="bold", pad=15)

    for i in range(3):
        for j in range(3):
            ax2.text(j, i, str(cm_arr[i, j]), ha="center", va="center", color="black" if cm_arr[i, j] < cm_arr.max()/2 else "white", fontsize=12, fontweight="bold")

    fig.colorbar(cax, ax=ax2, fraction=0.046, pad=0.04)
    plt.tight_layout()
    plot_path = REPORTS_DIR / "sentiment_evaluation.png"
    plt.savefig(plot_path, dpi=200)
    plt.close()
    print(f"Saved evaluation plot: {plot_path}")


def main():
    print("=" * 65)
    print("FEEDBACK SENTIMENT ANALYSIS: TRANSFORMER FINE-TUNING")
    print("=" * 65)

    # 1. Load Data
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Dataset not found at: {DATA_PATH}")

    df = pd.read_csv(DATA_PATH)
    print(f"Dataset Loaded: {DATA_PATH.name} ({len(df)} samples)")
    df["clean_text"] = df["feedback_text"].astype(str).str.strip()
    df["label"] = df["sentiment"].str.upper().map(LABEL2ID)

    print("\nClass Distribution:")
    for label_name, label_id in LABEL2ID.items():
        count = (df["label"] == label_id).sum()
        print(f"  - {label_name:10s} (ID {label_id}): {count:4d} ({count/len(df)*100:.1f}%)")

    # 2. Split Data: 70% Train, 15% Val, 15% Test
    train_df, temp_df = train_test_split(df, test_size=0.30, random_state=42, stratify=df["label"])
    val_df, test_df = train_test_split(temp_df, test_size=0.50, random_state=42, stratify=temp_df["label"])

    print(f"\nDataset Splits:")
    print(f"  - Training Set:   {len(train_df)} samples (70%)")
    print(f"  - Validation Set: {len(val_df)} samples (15%)")
    print(f"  - Test Set:       {len(test_df)} samples (15%)")

    # 3. Tokenization
    print(f"\nLoading tokenizer: {BASE_MODEL_NAME}...")
    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL_NAME)

    train_encodings = tokenizer(train_df["clean_text"].tolist(), truncation=True, padding=True, max_length=128)
    val_encodings = tokenizer(val_df["clean_text"].tolist(), truncation=True, padding=True, max_length=128)
    test_encodings = tokenizer(test_df["clean_text"].tolist(), truncation=True, padding=True, max_length=128)

    train_dataset = FeedbackDataset(train_encodings, train_df["label"].tolist())
    val_dataset = FeedbackDataset(val_encodings, val_df["label"].tolist())
    test_dataset = FeedbackDataset(test_encodings, test_df["label"].tolist())

    train_loader = DataLoader(train_dataset, batch_size=16, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=16, shuffle=False)
    test_loader = DataLoader(test_dataset, batch_size=16, shuffle=False)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using Compute Device: {device}")

    # 4. Baseline Evaluation
    print("\nEvaluating Pretrained Baseline on Test Set...")
    base_model = AutoModelForSequenceClassification.from_pretrained(
        BASE_MODEL_NAME,
        num_labels=3,
        id2label=ID2LABEL,
        label2id=LABEL2ID
    ).to(device)

    base_metrics, _, _ = evaluate_model(base_model, test_loader, device)
    print(f"  Baseline Test Accuracy:  {base_metrics['accuracy']*100:.2f}%")
    print(f"  Baseline Test F1 Score:  {base_metrics['f1']:.4f}")

    # 5. Fine-Tuning
    print("\n" + "=" * 65)
    print("FINE-TUNING ROBERTA ON COLLEGE FEEDBACK")
    print("=" * 65)

    epochs = 2
    learning_rate = 2e-5
    optimizer = torch.optim.AdamW(base_model.parameters(), lr=learning_rate, weight_decay=0.01)
    total_steps = len(train_loader) * epochs
    scheduler = get_linear_schedule_with_warmup(optimizer, num_warmup_steps=int(total_steps * 0.1), num_training_steps=total_steps)

    for epoch in range(1, epochs + 1):
        base_model.train()
        total_train_loss = 0
        start_time = time.time()

        for step, batch in enumerate(train_loader, 1):
            optimizer.zero_grad()
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            labels = batch["labels"].to(device)

            outputs = base_model(input_ids, attention_mask=attention_mask, labels=labels)
            loss = outputs.loss
            loss.backward()
            torch.nn.utils.clip_grad_norm_(base_model.parameters(), max_norm=1.0)
            optimizer.step()
            scheduler.step()

            total_train_loss += loss.item()

        avg_train_loss = total_train_loss / len(train_loader)
        val_metrics, _, _ = evaluate_model(base_model, val_loader, device)
        elapsed = time.time() - start_time

        print(f"Epoch {epoch}/{epochs} ({elapsed:.1f}s) | Train Loss: {avg_train_loss:.4f} | Val Acc: {val_metrics['accuracy']*100:.2f}% | Val F1: {val_metrics['f1']:.4f}")

    # 6. Post Fine-Tuning Evaluation on Independent Test Set
    print("\n" + "=" * 65)
    print("POST FINE-TUNING EVALUATION ON INDEPENDENT TEST SET")
    print("=" * 65)
    fine_metrics, y_true, y_pred = evaluate_model(base_model, test_loader, device)

    print(f"\n{'Metric':<15} | {'Pretrained Baseline':<20} | {'Fine-Tuned Model':<20}")
    print("-" * 60)
    print(f"{'Accuracy':<15} | {base_metrics['accuracy']*100:6.2f}%{'':<13} | {fine_metrics['accuracy']*100:6.2f}%")
    print(f"{'Precision':<15} | {base_metrics['precision']:6.4f}{'':<14} | {fine_metrics['precision']:6.4f}")
    print(f"{'Recall':<15} | {base_metrics['recall']:6.4f}{'':<14} | {fine_metrics['recall']:6.4f}")
    print(f"{'F1 Score':<15} | {base_metrics['f1']:6.4f}{'':<14} | {fine_metrics['f1']:6.4f}")
    print("-" * 60)

    print("\nFine-Tuned Confusion Matrix [POSITIVE, NEUTRAL, NEGATIVE]:")
    for row in fine_metrics["confusion_matrix"]:
        print(f"  {row}")

    # 7. Persist Artifacts
    print("\nSaving Fine-Tuned Model & Tokenizer Artifacts...")
    base_model.save_pretrained(str(MODELS_DIR))
    tokenizer.save_pretrained(str(MODELS_DIR))
    print(f"  Saved weights to: {MODELS_DIR}")

    metadata = {
        "model_name": "student_feedback_roberta_sentiment",
        "model_version": "v1_finetuned",
        "base_model": BASE_MODEL_NAME,
        "training_samples": len(train_df),
        "validation_samples": len(val_df),
        "test_samples": len(test_df),
        "classes": ["NEGATIVE", "NEUTRAL", "POSITIVE"],
        "baseline_metrics": base_metrics,
        "finetuned_metrics": fine_metrics,
        "training_date": datetime.now(timezone.utc).isoformat()
    }

    with open(METADATA_FILE, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=4)
    print(f"  Saved metadata to: {METADATA_FILE}")

    # 8. Generate Visualizations
    generate_comparison_plots(base_metrics, fine_metrics, base_metrics["confusion_matrix"], fine_metrics["confusion_matrix"])

    print("\n=========================================")
    print("FEEDBACK SENTIMENT MODEL TRAINING COMPLETE")
    print("=========================================")
    print(f"Model saved at: {MODELS_DIR}")
    print(f"Final Test Accuracy: {fine_metrics['accuracy']*100:.2f}% (F1: {fine_metrics['f1']:.4f})")
    print("=========================================")


if __name__ == "__main__":
    main()

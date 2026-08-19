import sys
import pandas as pd
from transformers import pipeline
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix

print("Loading cardiffnlp/twitter-roberta-base-sentiment-latest...")
try:
    classifier = pipeline(
        "sentiment-analysis",
        model="cardiffnlp/twitter-roberta-base-sentiment-latest",
        tokenizer="cardiffnlp/twitter-roberta-base-sentiment-latest",
        top_k=None
    )
    print("Model successfully loaded!")
except Exception as e:
    print(f"Error loading model: {e}")
    sys.exit(1)

sample_sentences = [
    ("The workshop was excellent and very informative.", "POSITIVE"),
    ("The speaker explained everything clearly.", "POSITIVE"),
    ("I really enjoyed this event.", "POSITIVE"),
    ("Great event with practical examples.", "POSITIVE"),
    ("The content was interesting and engaging.", "POSITIVE"),
    ("The event was okay.", "NEUTRAL"),
    ("The workshop was average.", "NEUTRAL"),
    ("The session was fine.", "NEUTRAL"),
    ("The content was as expected.", "NEUTRAL"),
    ("The event was conducted normally.", "NEUTRAL"),
    ("The venue was too crowded.", "NEGATIVE"),
    ("The event started very late.", "NEGATIVE"),
    ("The organization was poor.", "NEGATIVE"),
    ("The session was not useful.", "NEGATIVE"),
    ("There were problems with the arrangements.", "NEGATIVE"),
]

print("\n" + "=" * 75)
print(f"{'Text':<50} | {'Predicted':<10} | {'Score':<8}")
print("-" * 75)
for text, _ in sample_sentences:
    res = classifier(text)[0]
    best = max(res, key=lambda x: x["score"])
    label = best["label"].upper()
    score = best["score"]
    print(f"{text:<50} | {label:<10} | {score:.4f}")
print("=" * 75)

# Evaluate on human-labeled CSV (1000 rows)
print("\nEvaluating on 1000 human-labeled evaluation samples...")
df = pd.read_csv("data/human_labeled_feedback_evaluation.csv")
y_true = df["sentiment"].str.upper().tolist()
y_pred = []
scores = []

# Batch process
batch_size = 64
texts = df["feedback_text"].astype(str).tolist()
for i in range(0, len(texts), batch_size):
    batch = texts[i:i+batch_size]
    results = classifier(batch)
    for r in results:
        best = max(r, key=lambda x: x["score"])
        y_pred.append(best["label"].upper())
        scores.append(best["score"])

acc = accuracy_score(y_true, y_pred)
precision, recall, f1, _ = precision_recall_fscore_support(y_true, y_pred, average="weighted")
cm = confusion_matrix(y_true, y_pred, labels=["POSITIVE", "NEUTRAL", "NEGATIVE"])

print("\n" + "=" * 50)
print("EVALUATION RESULTS ON 1000 LABELED SAMPLES")
print("=" * 50)
print(f"Accuracy:  {acc:.4f} ({acc*100:.2f}%)")
print(f"Precision: {precision:.4f}")
print(f"Recall:    {recall:.4f}")
print(f"F1 Score:  {f1:.4f}")
print("\nConfusion Matrix [POSITIVE, NEUTRAL, NEGATIVE]:")
print(cm)
print("=" * 50)

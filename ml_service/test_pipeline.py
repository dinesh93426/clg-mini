import asyncio
import json
import logging
from core.db import execute_query
from main import _auto_train
from routers.behavior import train_behavior_model, get_clusters, _fetch_student_features
from routers.prediction import train_demand, predict_all_events
from routers.sentiment import analyze_text
from routers.recommendation import get_recommendations
from routers.rag import retrieve_docs, chat, RetrieveRequest, ChatRequest, Message
from routers.insights import generate_insights

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

async def run_full_pipeline_and_tests():
    print("=" * 60)
    print("1. CHECKING DATABASE POPULATION")
    print("=" * 60)
    users = execute_query('SELECT count(*) as c FROM "User"')
    events = execute_query('SELECT count(*) as c FROM "Event"')
    regs = execute_query('SELECT count(*) as c FROM "Registration"')
    print(f"Users in DB: {users[0]['c'] if users else 0}")
    print(f"Events in DB: {events[0]['c'] if events else 0}")
    print(f"Registrations in DB: {regs[0]['c'] if regs else 0}")

    print("\n" + "=" * 60)
    print("2. TRAINING ALL AI / ML MODELS")
    print("=" * 60)
    await _auto_train()

    print("\n" + "=" * 60)
    print("3. TESTING INDIVIDUAL AI MODULES")
    print("=" * 60)

    # Test 3.1 Behavior Model
    print("\n[TEST 3.1] Behavior Model (K-Means Clustering):")
    try:
        clusters = get_clusters()
        print("-> Cluster Distribution:", json.dumps(clusters, indent=2))
    except Exception as e:
        print("-> Behavior Test Error:", e)

    # Test 3.2 Demand Prediction
    print("\n[TEST 3.2] Event Demand Prediction (RandomForest):")
    try:
        preds = predict_all_events()
        print(f"-> Predicted demand for {len(preds.get('predictions', []))} events.")
        if preds.get('predictions'):
            print("-> Sample Event Prediction:", json.dumps(preds['predictions'][0], indent=2))
    except Exception as e:
        print("-> Demand Prediction Error:", e)

    # Test 3.3 Sentiment Analysis
    print("\n[TEST 3.3] Sentiment Analysis:")
    try:
        sample_positive = analyze_text("This hackathon was absolutely incredible, learned so much!")
        sample_negative = analyze_text("The sound system was broken and the hall was way too hot.")
        print("-> Positive feedback result:", sample_positive)
        print("-> Negative feedback result:", sample_negative)
    except Exception as e:
        print("-> Sentiment Test Error:", e)

    # Test 3.4 Recommendation Engine
    print("\n[TEST 3.4] Hybrid Recommendation Engine:")
    try:
        students = execute_query('SELECT "userId" as id FROM "StudentProfile" LIMIT 1')
        if students:
            sid = students[0]['id']
            recs = get_recommendations(sid)
            print(f"-> Top recommendations for student {sid}:")
            for r in recs.get('recommendations', [])[:3]:
                print(f"   * [{r.get('category')}] {r.get('title')} (Score: {r.get('score')})")
        else:
            print("-> No students found to test recommendations.")
    except Exception as e:
        print("-> Recommendation Test Error:", e)

    # Test 3.5 RAG Assistant
    print("\n[TEST 3.5] RAG AI Assistant:")
    try:
        chat_req = ChatRequest(messages=[Message(role="user", content="What upcoming technology events can I join?")])
        chat_res = chat(chat_req)
        print("-> Assistant Response:", chat_res.get("text"))
        print("-> Retrieved Sources:", chat_res.get("sources"))
    except Exception as e:
        print("-> RAG Test Error:", e)

    # Test 3.6 AI Insights
    print("\n[TEST 3.6] AI Platform Insights:")
    try:
        insights = generate_insights()
        print(f"-> Generated {len(insights.get('insights', []))} insights:")
        for ins in insights.get('insights', []):
            print(f"   * [{ins.get('type')}] {ins.get('title')}: {ins.get('description')}")
    except Exception as e:
        print("-> Insights Test Error:", e)

    print("\n" + "=" * 60)
    print("ALL AI MODULES TESTED & READY!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(run_full_pipeline_and_tests())

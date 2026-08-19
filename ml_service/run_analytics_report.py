import json
from services.event_analytics import get_overview_analytics, get_category_analytics, get_department_analytics
from services.sentiment_analytics import get_sentiment_analytics
from services.demand_analytics import get_demand_analytics
from services.behavior_analytics import get_behavior_analytics
from services.trend_analytics import get_trend_analytics
from services.insight_generator import generate_ai_insights

print("=== 1. OVERVIEW ===")
print(json.dumps(get_overview_analytics(), indent=2))

print("\n=== 2. CATEGORIES ===")
print(json.dumps(get_category_analytics(), indent=2))

print("\n=== 3. DEPARTMENTS ===")
print(json.dumps(get_department_analytics(), indent=2))

print("\n=== 4. SENTIMENT ===")
print(json.dumps(get_sentiment_analytics(), indent=2))

print("\n=== 5. DEMAND ===")
print(json.dumps(get_demand_analytics(), indent=2))

print("\n=== 6. BEHAVIOR ===")
print(json.dumps(get_behavior_analytics(), indent=2))

print("\n=== 7. INSIGHTS ===")
print(json.dumps(generate_ai_insights(), indent=2))

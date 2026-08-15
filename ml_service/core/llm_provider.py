"""
LLM Provider — supports HuggingFace Inference API and mock fallback.
Never exposes API keys to the frontend; all calls happen server-side.
"""
import os
import json
import re
import requests
from dotenv import load_dotenv

load_dotenv()

PROVIDER = os.getenv("LLM_PROVIDER", "mock")          # "huggingface" | "mock"
HF_API_KEY = os.getenv("HUGGINGFACE_API_KEY", "")

# Text-generation model on HuggingFace Inference API (free tier)
HF_TEXT_MODEL = "mistralai/Mistral-7B-Instruct-v0.3"
HF_API_URL = f"https://api-inference.huggingface.co/models/{HF_TEXT_MODEL}"

HEADERS = {"Authorization": f"Bearer {HF_API_KEY}", "Content-Type": "application/json"}


def call_hf_inference(model_id: str, payload: dict) -> any:
    """
    Generic HuggingFace Inference API call for any model (classification, etc.).
    Returns parsed JSON or None on error.
    """
    url = f"https://api-inference.huggingface.co/models/{model_id}"
    try:
        resp = requests.post(url, headers=HEADERS, json=payload, timeout=30)
        if resp.status_code == 200:
            return resp.json()
        print(f"[LLM] HF inference {model_id} status {resp.status_code}: {resp.text[:200]}")
    except Exception as e:
        print(f"[LLM] HF inference error for {model_id}: {e}")
    return None


def _hf_generate(prompt: str, max_new_tokens: int = 512) -> str:
    """Call HuggingFace Inference API and return generated text."""
    payload = {
        "inputs": prompt,
        "parameters": {
            "max_new_tokens": max_new_tokens,
            "temperature": 0.7,
            "do_sample": True,
            "return_full_text": False,
        },
    }
    try:
        resp = requests.post(HF_API_URL, headers=HEADERS, json=payload, timeout=60)
        if resp.status_code == 200:
            data = resp.json()
            if isinstance(data, list) and data:
                return data[0].get("generated_text", "").strip()
        # Model loading / rate-limit — fall through to mock
        print(f"[LLM] HF API status {resp.status_code}: {resp.text[:200]}")
    except Exception as e:
        print(f"[LLM] HF API error: {e}")
    return ""


def generate_text(prompt: str, max_tokens: int = 512) -> str:
    """Generate free-form text. Falls back to mock if HF unavailable."""
    if PROVIDER == "huggingface" and HF_API_KEY:
        result = _hf_generate(prompt, max_tokens)
        if result:
            return result
    # Mock fallback
    return _mock_text(prompt)


def generate_json(prompt: str, schema_hint: dict = None) -> dict:
    """Generate a JSON object. Parses LLM output or returns mock."""
    if PROVIDER == "huggingface" and HF_API_KEY:
        json_prompt = (
            prompt
            + "\n\nRespond ONLY with valid JSON, no markdown fences, no explanation."
        )
        raw = _hf_generate(json_prompt, max_new_tokens=800)
        if raw:
            parsed = _extract_json(raw)
            if parsed:
                return parsed
    return _mock_event_json(prompt)


# ─── Mock fallbacks ────────────────────────────────────────────────────────────

def _mock_text(prompt: str) -> str:
    prompt_lower = prompt.lower()
    if "insight" in prompt_lower or "analytics" in prompt_lower:
        return (
            "Student engagement is trending upward this semester. "
            "Technology events show the highest registration rates, while Cultural events "
            "have strong satisfaction scores. Consider scheduling Hackathons on weekends "
            "to maximize participation. Students in the top engagement cluster attend "
            "3× more events than average — targeted outreach to lower-engagement clusters "
            "could improve overall participation by an estimated 20%."
        )
    if "assist" in prompt_lower or "question" in prompt_lower or "help" in prompt_lower:
        return (
            "I'm your College Event Assistant! Based on current data, there are several "
            "exciting upcoming events. Technology workshops are popular right now. "
            "You can register through the Events page. Is there a specific category "
            "you're interested in?"
        )
    return "I've analyzed the data and have some recommendations for your consideration."


def _mock_event_json(prompt: str) -> dict:
    return {
        "title": "AI & Machine Learning Workshop",
        "category": "Technology",
        "description": (
            "An intensive hands-on workshop covering the fundamentals of AI and machine "
            "learning. Participants will build real models and understand deployment strategies."
        ),
        "targetAudience": "Computer Science and Engineering students",
        "objectives": [
            "Understand core ML concepts",
            "Implement models with scikit-learn and PyTorch",
            "Deploy a simple ML API",
        ],
        "agenda": [
            {"time": "09:00", "activity": "Introduction to AI/ML"},
            {"time": "10:00", "activity": "Hands-on: Data preprocessing"},
            {"time": "11:00", "activity": "Model training and evaluation"},
            {"time": "12:00", "activity": "Lunch break"},
            {"time": "13:00", "activity": "Model deployment"},
            {"time": "14:30", "activity": "Q&A and wrap-up"},
        ],
        "requirements": ["Laptop with Python 3.10+", "Basic Python knowledge"],
        "suggestedDuration": "6 hours",
        "tags": ["AI", "Machine Learning", "Python", "Technology"],
        "suggestedCapacity": 50,
    }


def _extract_json(text: str) -> dict | None:
    """Extract the first valid JSON object from LLM output."""
    # Strip markdown code fences
    text = re.sub(r"```(?:json)?", "", text).strip()
    # Try direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    # Find first {...}
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass
    return None

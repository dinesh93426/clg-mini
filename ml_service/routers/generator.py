"""
Module 6 — AI Event Generator
Uses the LLM to generate structured event JSON from organizer prompts.
API key stays server-side; the frontend sends only the prompt string.

NOTE: All SQL column names are camelCase (Prisma without @map convention).
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from core.llm_provider import generate_json
from core.db import execute_query, get_db_connection

import json

router = APIRouter()


class GenerateRequest(BaseModel):
    prompt: str
    organizer_id: Optional[str] = None


@router.post("/generate")
def generate_event(req: GenerateRequest):
    if not req.prompt or not req.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")

    schema_hint = {
        "title": "string",
        "category": "Technology|Workshop|Seminar|Cultural|Sports|Hackathon",
        "description": "string (2-3 sentences)",
        "targetAudience": "string",
        "objectives": ["string"],
        "agenda": [{"time": "HH:MM", "activity": "string"}],
        "requirements": ["string"],
        "suggestedDuration": "string",
        "tags": ["string"],
        "suggestedCapacity": "integer",
    }

    full_prompt = (
        f"You are an expert college event planner. "
        f"Generate a detailed, realistic event based on this organizer request:\n\n"
        f"\"{req.prompt}\"\n\n"
        f"Output a JSON object with these exact fields:\n"
        f"{json.dumps(schema_hint, indent=2)}\n\n"
        f"Make the event realistic, educational, and engaging for college students. "
        f"Return ONLY the JSON object, no extra text."
    )

    generated = generate_json(full_prompt, schema_hint)

    # Validate required fields
    required = ["title", "category", "description"]
    for field in required:
        if field not in generated:
            raise HTTPException(
                status_code=500,
                detail=f"Generated event missing required field: {field}",
            )

    # Persist to AIEventGeneration table if organizer_id provided
    if req.organizer_id:
        try:
            conn = get_db_connection()
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO "AIEventGeneration"
                        (id, "organizerId", prompt, "generatedData", "createdAt")
                    VALUES (gen_random_uuid(), %s, %s, %s, NOW())
                    """,
                    (req.organizer_id, req.prompt, json.dumps(generated)),
                )
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"[EventGenerator] DB persist error: {e}")

    return generated

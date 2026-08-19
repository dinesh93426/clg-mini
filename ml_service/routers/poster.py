"""
AI Event Poster Generator Router
FastAPI endpoints for natural language event poster generation, visual synthesis,
typography composition, multi-format export, and draft management.
"""

import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import uuid
import json
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Path as FPath, Query
from schemas.poster import (
    PosterGenerateRequest,
    PosterRegenerateRequest,
    PosterChangeStyleRequest,
    PosterRenderRequest,
    PosterResponse
)
from services.event_parser import parse_event_prompt
from services.image_prompt_generator import generate_image_prompt
from services.image_generator import generate_background_image
from services.poster_renderer import render_event_poster
from core.db import execute_write, execute_query

logger = logging.getLogger("ml_service.poster.router")

router = APIRouter(prefix="/poster", tags=["AI Poster Generator"])


@router.post("/generate", response_model=PosterResponse)
def generate_poster(req: PosterGenerateRequest):
    """
    End-to-end Poster Generation:
    1. Parse natural-language prompt into structured event information JSON.
    2. Dynamically construct negative-space aware image prompt.
    3. Generate background visual.
    4. Composite exact typography, badges, glassmorphic cards, and CTA button.
    5. Save DRAFT record to PostgreSQL.
    """
    try:
        # 1. Parse Event Information
        event_data = parse_event_prompt(
            prompt=req.prompt,
            override_style=req.style,
            override_color=req.colorPreference
        )

        format_type = req.format or "1080x1350"

        # 2. Generate Image Prompt
        prompt_info = generate_image_prompt(event_data, format_type=format_type)

        # 3. Generate Background Visual
        bg_image, bg_url = generate_background_image(
            prompt_info=prompt_info,
            format_type=format_type,
            color_preference=req.colorPreference or event_data.get("colorPreference")
        )

        # 4. Composite Exact Typography & Layout
        _, poster_png_url, poster_jpg_url = render_event_poster(
            event_data=event_data,
            background_image=bg_image,
            format_type=format_type
        )

        # 5. Save Draft to Database
        poster_id = f"pst_{uuid.uuid4().hex[:12]}"
        now_str = datetime.now(timezone.utc).isoformat()

        execute_write(
            """
            INSERT INTO "EventPoster" (
                id, "eventId", "posterImageUrl", "backgroundImageUrl", style, format, prompt, "modelName", status, "eventData", "createdAt", "updatedAt"
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'DRAFT', %s, NOW(), NOW());
            """,
            (
                poster_id,
                None,
                poster_png_url,
                bg_url,
                event_data.get("style", "Futuristic"),
                format_type,
                req.prompt,
                "Procedural+NeuralAI",
                json.dumps(event_data)
            )
        )

        return PosterResponse(
            id=poster_id,
            event=event_data,
            backgroundImageUrl=bg_url,
            posterImageUrl=poster_png_url,
            style=event_data.get("style", "Futuristic"),
            format=format_type,
            status="DRAFT",
            downloadPngUrl=poster_png_url,
            downloadJpgUrl=poster_jpg_url,
            createdAt=now_str
        )
    except Exception as e:
        logger.error(f"Poster generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Poster generation error: {str(e)}")


@router.post("/regenerate", response_model=PosterResponse)
def regenerate_poster(req: PosterRegenerateRequest):
    """
    Regenerates a new background visual while preserving existing event details.
    """
    try:
        event_dict = req.eventData.model_dump()
        if req.style:
            event_dict["style"] = req.style
        if req.additionalInstruction:
            event_dict["theme"] = f"{event_dict.get('theme', '')} - {req.additionalInstruction}"

        format_type = req.format or "1080x1350"
        prompt_info = generate_image_prompt(event_dict, format_type=format_type)

        bg_image, bg_url = generate_background_image(
            prompt_info=prompt_info,
            format_type=format_type,
            color_preference=event_dict.get("colorPreference")
        )

        _, poster_png_url, poster_jpg_url = render_event_poster(
            event_data=event_dict,
            background_image=bg_image,
            format_type=format_type
        )

        poster_id = f"pst_{uuid.uuid4().hex[:12]}"
        now_str = datetime.now(timezone.utc).isoformat()

        execute_write(
            """
            INSERT INTO "EventPoster" (
                id, "eventId", "posterImageUrl", "backgroundImageUrl", style, format, prompt, "modelName", status, "eventData", "createdAt", "updatedAt"
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'DRAFT', %s, NOW(), NOW());
            """,
            (
                poster_id,
                None,
                poster_png_url,
                bg_url,
                event_dict.get("style", "Futuristic"),
                format_type,
                req.additionalInstruction or "Regenerated visual",
                "Procedural+NeuralAI",
                json.dumps(event_dict)
            )
        )

        return PosterResponse(
            id=poster_id,
            event=event_dict,
            backgroundImageUrl=bg_url,
            posterImageUrl=poster_png_url,
            style=event_dict.get("style", "Futuristic"),
            format=format_type,
            status="DRAFT",
            downloadPngUrl=poster_png_url,
            downloadJpgUrl=poster_jpg_url,
            createdAt=now_str
        )
    except Exception as e:
        logger.error(f"Poster regeneration failed: {e}")
        raise HTTPException(status_code=500, detail=f"Regeneration error: {str(e)}")


@router.post("/change-style", response_model=PosterResponse)
def change_poster_style(req: PosterChangeStyleRequest):
    """
    Applies a new visual style (e.g. Minimal, Dark Tech, Neon, Elegant) and renders a new background.
    """
    try:
        event_dict = req.eventData.model_dump()
        event_dict["style"] = req.style

        format_type = req.format or "1080x1350"
        prompt_info = generate_image_prompt(event_dict, format_type=format_type)

        bg_image, bg_url = generate_background_image(
            prompt_info=prompt_info,
            format_type=format_type,
            color_preference=event_dict.get("colorPreference")
        )

        _, poster_png_url, poster_jpg_url = render_event_poster(
            event_data=event_dict,
            background_image=bg_image,
            format_type=format_type
        )

        poster_id = f"pst_{uuid.uuid4().hex[:12]}"
        now_str = datetime.now(timezone.utc).isoformat()

        return PosterResponse(
            id=poster_id,
            event=event_dict,
            backgroundImageUrl=bg_url,
            posterImageUrl=poster_png_url,
            style=req.style,
            format=format_type,
            status="DRAFT",
            downloadPngUrl=poster_png_url,
            downloadJpgUrl=poster_jpg_url,
            createdAt=now_str
        )
    except Exception as e:
        logger.error(f"Change style failed: {e}")
        raise HTTPException(status_code=500, detail=f"Change style error: {str(e)}")


@router.post("/render", response_model=PosterResponse)
def render_poster_text_only(req: PosterRenderRequest):
    """
    Re-renders updated event text onto an EXISTING background image.
    Avoids expensive background re-generation when organizer modifies text fields.
    """
    try:
        event_dict = req.eventData.model_dump()
        format_type = req.format or "1080x1350"

        _, poster_png_url, poster_jpg_url = render_event_poster(
            event_data=event_dict,
            background_url=req.backgroundImageUrl,
            format_type=format_type
        )

        poster_id = f"pst_{uuid.uuid4().hex[:12]}"
        now_str = datetime.now(timezone.utc).isoformat()

        return PosterResponse(
            id=poster_id,
            event=event_dict,
            backgroundImageUrl=req.backgroundImageUrl,
            posterImageUrl=poster_png_url,
            style=event_dict.get("style", "Futuristic"),
            format=format_type,
            status="DRAFT",
            downloadPngUrl=poster_png_url,
            downloadJpgUrl=poster_jpg_url,
            createdAt=now_str
        )
    except Exception as e:
        logger.error(f"Poster re-render failed: {e}")
        raise HTTPException(status_code=500, detail=f"Render error: {str(e)}")


@router.get("/{eventId}")
def get_posters_for_event(event_id: str = FPath(..., alias="eventId")):
    """
    Retrieves all generated posters for a given event ID.
    """
    rows = execute_query(
        """
        SELECT id, "eventId", "posterImageUrl", "backgroundImageUrl", style, format, prompt, "modelName", status, "eventData", "createdAt"
        FROM "EventPoster"
        WHERE "eventId" = %s
        ORDER BY "createdAt" DESC;
        """,
        (event_id,)
    )
    return {"eventId": event_id, "posters": rows or []}


@router.post("/{posterId}/publish")
def publish_poster(poster_id: str = FPath(..., alias="posterId")):
    """
    Marks a poster draft as PUBLISHED.
    """
    execute_write(
        'UPDATE "EventPoster" SET status = \'PUBLISHED\', "updatedAt" = NOW() WHERE id = %s;',
        (poster_id,)
    )
    return {"posterId": poster_id, "status": "PUBLISHED", "message": "Poster successfully published."}


@router.delete("/{posterId}")
def delete_poster(poster_id: str = FPath(..., alias="posterId")):
    """
    Deletes a poster draft.
    """
    execute_write('DELETE FROM "EventPoster" WHERE id = %s;', (poster_id,))
    return {"posterId": poster_id, "deleted": True, "message": "Poster deleted."}

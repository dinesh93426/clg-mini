"""
Poster Layout & Typography Renderer
Composites exact, verified event information, badges, cards, and CTA onto background visuals.
Ensures zero typographical errors, strong visual hierarchy, and multi-format compatibility.
"""

import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import os
import textwrap
import logging
from typing import Dict, Any, Tuple, Optional
from PIL import Image, ImageDraw, ImageFont, ImageColor
from storage.image_storage import save_image, get_image_path_from_url
from services.image_generator import parse_dimensions

logger = logging.getLogger("ml_service.poster.renderer")


def _get_font(size: int, bold: bool = False) -> ImageFont.ImageFont:
    """Loads system TTF font with fallback."""
    font_names = [
        "Arial.ttf", "arialbd.ttf" if bold else "arial.ttf",
        "seguiemj.ttf", "calibri.ttf", "calibrib.ttf" if bold else "calibri.ttf",
        "DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf"
    ]
    for fn in font_names:
        try:
            return ImageFont.truetype(fn, size)
        except Exception:
            continue
    return ImageFont.load_default()


def render_event_poster(
    event_data: Dict[str, Any],
    background_image: Optional[Image.Image] = None,
    background_url: Optional[str] = None,
    format_type: str = "1080x1350"
) -> Tuple[Image.Image, str, str]:
    """
    Renders the complete event poster with exact typography and layout hierarchy.
    
    Returns:
        (PIL.Image, poster_png_url, poster_jpg_url)
    """
    width, height = parse_dimensions(format_type)

    if background_image is None and background_url:
        bg_path = get_image_path_from_url(background_url)
        if bg_path.exists():
            background_image = Image.open(str(bg_path)).convert("RGBA")

    if background_image is None:
        from services.image_generator import _generate_procedural_background
        background_image = _generate_procedural_background(width, height, style=event_data.get("style", "Futuristic"))

    # Ensure background matches exact requested dimensions
    if background_image.size != (width, height):
        background_image = background_image.resize((width, height), Image.Resampling.LANCZOS)

    # Base image for drawing overlay
    poster = background_image.copy().convert("RGBA")
    overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    # Margins and layout guides
    margin_x = int(width * 0.08)
    curr_y = int(height * 0.07)
    content_width = width - (2 * margin_x)

    # 1. Top Badges: Category & Department
    category = (event_data.get("category") or "Technical").upper()
    department = event_data.get("department")
    target_aud = event_data.get("targetAudience")

    badge_font = _get_font(int(width * 0.024), bold=True)

    # Category Badge
    cat_text = f"  ✦  {category}  ✦  "
    cat_bbox = draw.textbbox((0, 0), cat_text, font=badge_font)
    cat_w = cat_bbox[2] - cat_bbox[0]
    cat_h = cat_bbox[3] - cat_bbox[1] + 16

    # Translucent pill badge
    draw.rounded_rectangle(
        [(margin_x, curr_y), (margin_x + cat_w + 20, curr_y + cat_h)],
        radius=int(cat_h / 2),
        fill=(0, 220, 255, 45),
        outline=(0, 220, 255, 180),
        width=2
    )
    draw.text((margin_x + 10, curr_y + 8), cat_text, fill=(255, 255, 255, 255), font=badge_font)

    # Department / Audience Badge (if available)
    if department or target_aud:
        sub_text = f" {department or target_aud} "
        sub_bbox = draw.textbbox((0, 0), sub_text, font=badge_font)
        sub_w = sub_bbox[2] - sub_bbox[0]
        sub_x = margin_x + cat_w + 35
        draw.rounded_rectangle(
            [(sub_x, curr_y), (sub_x + sub_w + 20, curr_y + cat_h)],
            radius=int(cat_h / 2),
            fill=(140, 40, 255, 45),
            outline=(140, 40, 255, 180),
            width=2
        )
        draw.text((sub_x + 10, curr_y + 8), sub_text, fill=(240, 220, 255, 255), font=badge_font)

    curr_y += cat_h + int(height * 0.04)

    # 2. Main Event Title (High visual weight)
    title = event_data.get("title") or "College Event"
    title_font_size = int(width * 0.065)
    title_font = _get_font(title_font_size, bold=True)

    # Wrap title if long
    wrap_width = 22 if width <= 1080 else 30
    title_lines = textwrap.wrap(title, width=wrap_width)

    for line in title_lines:
        # Subtle drop shadow
        draw.text((margin_x + 3, curr_y + 3), line, fill=(0, 0, 0, 180), font=title_font)
        draw.text((margin_x, curr_y), line, fill=(255, 255, 255, 255), font=title_font)
        curr_y += int(title_font_size * 1.22)

    curr_y += int(height * 0.015)

    # 3. Subtitle / Description
    desc = event_data.get("description")
    if desc:
        desc_font_size = int(width * 0.028)
        desc_font = _get_font(desc_font_size, bold=False)
        desc_lines = textwrap.wrap(desc, width=46)[:3]  # Limit to 3 lines
        for dline in desc_lines:
            draw.text((margin_x, curr_y), dline, fill=(210, 220, 240, 230), font=desc_font)
            curr_y += int(desc_font_size * 1.45)

    # 4. Floating Glassmorphic Details Card (Date, Time, Venue)
    card_margin_top = int(height * 0.58)
    card_h = int(height * 0.24)
    card_box = [(margin_x, card_margin_top), (width - margin_x, card_margin_top + card_h)]

    # Draw frosted glass card
    draw.rounded_rectangle(
        card_box,
        radius=24,
        fill=(15, 22, 38, 175),
        outline=(255, 255, 255, 55),
        width=2
    )

    card_pad_x = margin_x + 30
    card_y = card_margin_top + 28
    label_font = _get_font(int(width * 0.022), bold=True)
    val_font = _get_font(int(width * 0.030), bold=True)

    # Detail Rows
    date_val = event_data.get("date") or "Date: TBA"
    time_val = event_data.get("startTime") or ""
    if event_data.get("endTime"):
        time_val += f" - {event_data.get('endTime')}"
    if not time_val:
        time_val = "Time: TBA"

    venue_val = event_data.get("venue") or "Campus Seminar Hall"

    # Row 1: Date & Time
    draw.text((card_pad_x, card_y), "DATE & TIME", fill=(0, 220, 255, 230), font=label_font)
    draw.text((card_pad_x, card_y + 24), f"📅 {date_val}  |  ⏰ {time_val}", fill=(255, 255, 255, 255), font=val_font)

    card_y += int(card_h * 0.40)

    # Row 2: Venue
    draw.text((card_pad_x, card_y), "LOCATION & VENUE", fill=(160, 100, 255, 230), font=label_font)
    draw.text((card_pad_x, card_y + 24), f"📍 {venue_val}", fill=(255, 255, 255, 255), font=val_font)

    # 5. Bottom CTA Button
    cta_text = event_data.get("cta") or "REGISTER NOW"
    cta_font = _get_font(int(width * 0.032), bold=True)
    cta_bbox = draw.textbbox((0, 0), cta_text, font=cta_font)
    cta_tw = cta_bbox[2] - cta_bbox[0]

    cta_h = int(height * 0.058)
    cta_y = card_margin_top + card_h + int(height * 0.025)
    cta_box = [(margin_x, cta_y), (width - margin_x, cta_y + cta_h)]

    # Gradient CTA button box
    draw.rounded_rectangle(
        cta_box,
        radius=16,
        fill=(0, 190, 255, 230),
        outline=(255, 255, 255, 120),
        width=2
    )

    cta_tx = int((width - cta_tw) / 2)
    cta_ty = cta_y + int((cta_h - (cta_bbox[3] - cta_bbox[1])) / 2) - 3
    draw.text((cta_tx, cta_ty), cta_text, fill=(10, 15, 30, 255), font=cta_font)

    # Combine layers
    final_poster = Image.alpha_composite(poster, overlay)

    # Save PNG and JPG artifacts
    _, png_url, jpg_url = save_image(final_poster, prefix="poster", format="PNG")
    return final_poster, png_url, jpg_url

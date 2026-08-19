"""
Image Generation Service
Generates high-quality background visuals using configurable AI image providers
or high-resolution procedural vector/mesh synthesis.
"""

import os
import math
import random
import logging
from typing import Tuple, Dict, Any, Optional
from PIL import Image, ImageDraw, ImageFilter
from storage.image_storage import save_image

logger = logging.getLogger("ml_service.poster.image_generator")

IMAGE_API_KEY = os.getenv("IMAGE_API_KEY")
IMAGE_MODEL = os.getenv("IMAGE_MODEL", "dall-e-3")


def parse_dimensions(format_str: str) -> Tuple[int, int]:
    """Parses format string (e.g. 1080x1350) into width and height."""
    if "x" in format_str:
        parts = format_str.lower().split("x")
        try:
            return int(parts[0]), int(parts[1])
        except Exception:
            pass
    return 1080, 1350


def _generate_procedural_background(
    width: int,
    height: int,
    style: str = "Futuristic",
    color_pref: Optional[str] = None
) -> Image.Image:
    """
    Generates a high-end multi-layer abstract background using procedural mesh gradients,
    cyber grids, volumetric glow, and soft bokeh shapes tailored to the selected style.
    """
    base = Image.new("RGBA", (width, height), (15, 18, 25, 255))
    draw = ImageDraw.Draw(base)

    # Style Color Palettes: [(r,g,b), (r,g,b), (r,g,b)]
    palettes = {
        "Futuristic": [(10, 12, 28), (28, 16, 68), (12, 60, 110), (0, 220, 255), (140, 40, 255)],
        "Minimal": [(245, 246, 250), (230, 233, 240), (210, 215, 225), (40, 50, 70), (100, 115, 140)],
        "Corporate": [(12, 24, 45), (18, 42, 85), (28, 75, 140), (0, 150, 230), (220, 240, 255)],
        "Academic": [(18, 22, 36), (30, 40, 65), (50, 65, 100), (180, 150, 90), (240, 220, 170)],
        "Creative": [(25, 10, 35), (90, 20, 70), (160, 40, 100), (255, 120, 50), (255, 210, 60)],
        "Dark Tech": [(8, 10, 15), (16, 22, 35), (25, 38, 60), (0, 200, 160), (30, 144, 255)],
        "Gradient": [(15, 10, 40), (45, 20, 90), (110, 40, 160), (220, 60, 140), (0, 200, 240)],
        "Glassmorphism": [(18, 20, 32), (32, 40, 60), (55, 70, 100), (0, 180, 220), (160, 100, 240)],
        "Neon": [(5, 5, 12), (20, 10, 40), (80, 15, 95), (255, 0, 128), (0, 255, 200)],
        "Elegant": [(10, 18, 16), (20, 36, 32), (35, 60, 50), (212, 175, 55), (245, 225, 160)]
    }

    # Color preference overrides
    if color_pref:
        cp_lower = color_pref.lower()
        if "blue" in cp_lower and "purple" in cp_lower:
            pal = [(10, 12, 35), (35, 18, 75), (20, 65, 140), (130, 50, 250), (0, 210, 255)]
        elif "green" in cp_lower or "emerald" in cp_lower:
            pal = [(8, 18, 15), (14, 38, 30), (22, 65, 50), (0, 220, 140), (180, 255, 200)]
        elif "red" in cp_lower or "crimson" in cp_lower:
            pal = [(25, 8, 12), (55, 14, 25), (110, 25, 45), (235, 50, 75), (255, 180, 100)]
        else:
            pal = palettes.get(style, palettes["Futuristic"])
    else:
        pal = palettes.get(style, palettes["Futuristic"])

    c_dark, c_mid, c_deep, c_accent1, c_accent2 = pal[0], pal[1], pal[2], pal[3], pal[4]

    # 1. Base Vertical Gradient
    for y in range(height):
        factor = y / height
        # Non-linear easing for deep top/bottom contrast
        eased = factor * factor * (3 - 2 * factor)
        r = int(c_dark[0] * (1 - eased) + c_mid[0] * eased)
        g = int(c_dark[1] * (1 - eased) + c_mid[1] * eased)
        b = int(c_dark[2] * (1 - eased) + c_mid[2] * eased)
        draw.line([(0, y), (width, y)], fill=(r, g, b, 255))

    # 2. Layered Ambient Radial Glow Orbs (Volumetric depth)
    glow_layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_layer)

    # Upper right accent glow
    glow_draw.ellipse(
        [width * 0.55, -height * 0.1, width * 1.3, height * 0.5],
        fill=(c_accent1[0], c_accent1[1], c_accent1[2], 90)
    )
    # Lower left accent glow
    glow_draw.ellipse(
        [-width * 0.3, height * 0.55, width * 0.55, height * 1.15],
        fill=(c_accent2[0], c_accent2[1], c_accent2[2], 75)
    )
    # Center ambient wave
    glow_draw.ellipse(
        [width * 0.15, height * 0.25, width * 0.85, height * 0.75],
        fill=(c_deep[0], c_deep[1], c_deep[2], 60)
    )

    # Blur glow layer heavily for cinematic ambient lighting
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(radius=80))
    base = Image.alpha_composite(base, glow_layer)

    # 3. Geometric Vector Elements (Style Specific)
    geom_layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    geom_draw = ImageDraw.Draw(geom_layer)

    if style in ("Futuristic", "Dark Tech", "Neon"):
        # Cyber grid & data flow lines
        grid_step = 60
        for x in range(0, width, grid_step):
            geom_draw.line([(x, 0), (x, height)], fill=(255, 255, 255, 12), width=1)
        for y in range(0, height, grid_step):
            geom_draw.line([(0, y), (width, y)], fill=(255, 255, 255, 12), width=1)

        # Concentric Tech Rings in backdrop
        cx, cy = int(width * 0.75), int(height * 0.35)
        for radius in (120, 220, 320, 420):
            geom_draw.arc([cx - radius, cy - radius, cx + radius, cy + radius], start=0, end=360, fill=(c_accent1[0], c_accent1[1], c_accent1[2], 40), width=2)
            # Dotted segment
            geom_draw.arc([cx - radius - 15, cy - radius - 15, cx + radius + 15, cy + radius + 15], start=45, end=180, fill=(c_accent2[0], c_accent2[1], c_accent2[2], 65), width=2)

    elif style in ("Glassmorphism", "Gradient", "Creative"):
        # Translucent floating polygon shapes
        geom_draw.polygon(
            [(width * 0.6, height * 0.15), (width * 0.95, height * 0.25), (width * 0.8, height * 0.55), (width * 0.45, height * 0.4)],
            fill=(255, 255, 255, 20),
            outline=(c_accent1[0], c_accent1[1], c_accent1[2], 80)
        )
        geom_draw.ellipse(
            [width * 0.05, height * 0.6, width * 0.45, height * 0.95],
            fill=(c_accent2[0], c_accent2[1], c_accent2[2], 30),
            outline=(255, 255, 255, 50)
        )

    elif style in ("Corporate", "Academic", "Elegant"):
        # Clean architectural angle dividers
        geom_draw.line([(0, height * 0.25), (width, height * 0.15)], fill=(c_accent1[0], c_accent1[1], c_accent1[2], 45), width=2)
        geom_draw.line([(0, height * 0.75), (width, height * 0.85)], fill=(c_accent2[0], c_accent2[1], c_accent2[2], 45), width=2)
        # Framed corner accents
        c_len = 40
        geom_draw.line([(40, 40), (40 + c_len, 40)], fill=(255, 255, 255, 80), width=2)
        geom_draw.line([(40, 40), (40, 40 + c_len)], fill=(255, 255, 255, 80), width=2)
        geom_draw.line([(width - 40, height - 40), (width - 40 - c_len, height - 40)], fill=(255, 255, 255, 80), width=2)
        geom_draw.line([(width - 40, height - 40), (width - 40, height - 40 - c_len)], fill=(255, 255, 255, 80), width=2)

    base = Image.alpha_composite(base, geom_layer)

    # 4. Top and Bottom Vignette for Guaranteed Clean Typography Readability
    vignette = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    v_draw = ImageDraw.Draw(vignette)

    # Top dark gradient for header
    for y in range(int(height * 0.2)):
        alpha = int(140 * (1 - y / (height * 0.2)))
        v_draw.line([(0, y), (width, y)], fill=(0, 0, 0, alpha))

    # Bottom dark gradient for date/venue/CTA
    bottom_start = int(height * 0.65)
    for y in range(bottom_start, height):
        factor = (y - bottom_start) / (height - bottom_start)
        alpha = int(190 * factor)
        v_draw.line([(0, y), (width, y)], fill=(0, 0, 0, alpha))

    base = Image.alpha_composite(base, vignette)
    return base


def generate_background_image(
    prompt_info: Dict[str, Any],
    format_type: str = "1080x1350",
    color_preference: Optional[str] = None
) -> Tuple[Image.Image, str]:
    """
    Generates the background visual for the event poster and saves it to static storage.
    
    Returns:
        (PIL.Image, background_image_url)
    """
    width, height = parse_dimensions(format_type)
    style = prompt_info.get("style", "Futuristic")

    # Generate procedural high-res vector/gradient visual
    bg_image = _generate_procedural_background(width, height, style=style, color_pref=color_preference)

    # Save to storage
    _, bg_url, _ = save_image(bg_image, prefix="bg", format="PNG")
    return bg_image, bg_url

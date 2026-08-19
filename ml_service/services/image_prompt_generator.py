"""
Image Prompt Generator
Dynamically constructs high-end AI image generation prompts from structured event data.
Enforces negative-space composition rules and negative prompts to produce clean backgrounds
ready for exact typography overlay.
"""

from typing import Dict, Any


def generate_image_prompt(event_data: Dict[str, Any], format_type: str = "1080x1350") -> Dict[str, str]:
    """
    Generates positive and negative prompts for background image generation.
    """
    title = event_data.get("title") or "College Event"
    category = event_data.get("category") or "Technical"
    style = event_data.get("style") or "Futuristic"
    color_pref = event_data.get("colorPreference")
    theme = event_data.get("theme") or "Technology"

    # Style-specific visual concepts
    style_prompts = {
        "Futuristic": "ultra-modern cyberpunk aesthetic, glowing fiber optic lines, dark obsidian background, holographic energy wave, neural matrix, quantum data particles",
        "Minimal": "clean minimalist aesthetic, smooth matte architectural surfaces, soft studio lighting, subtle geometric lines, balanced negative space",
        "Corporate": "sleek executive corporate design, geometric blue glass layers, ambient refraction, professional business summit lighting",
        "Academic": "scholarly collegiate symposium, architectural campus motif, refined brass and navy depth, subtle geometric wireframes",
        "Creative": "vibrant abstract dynamic fluid splash, colorful acrylic swirls, volumetric lighting, artistic festival momentum",
        "Dark Tech": "deep dark tech mode, charcoal carbon fiber textures, glowing electric blue and violet accent ribbons, server grid telemetry",
        "Gradient": "luxurious smooth mesh gradient, rich indigo violet cyan silk blend, soft ambient lighting, modern digital backdrop",
        "Glassmorphism": "frosted glassmorphic panels, translucent geometric shapes, soft blurred background reflections, subtle prismatic dispersion",
        "Neon": "vibrant high-contrast neon luminescence, ultraviolet and magenta glow, dark moody reflections, energetic pulse",
        "Elegant": "prestigious gold and deep emerald/midnight blue textures, subtle ambient glow, luxury ribbon curvature, premium award gala backdrop"
    }

    style_desc = style_prompts.get(style, style_prompts["Futuristic"])

    # Color guidance
    color_desc = f"Color palette featuring {color_pref}" if color_pref else "Harmonious curated color palette with dark base and glowing accents"

    positive_prompt = (
        f"Professional event poster background for '{title}'. "
        f"Theme: {theme}. Category: {category}. "
        f"Visual style: {style_desc}. {color_desc}. "
        f"Composition: High-end promotional poster background with spacious clean negative space in the center-top and lower thirds for typography. "
        f"Atmospheric depth of field, 8k resolution, cinematic lighting, octane render style."
    )

    negative_prompt = (
        "readable text, letters, words, alphabet, numbers, font, typography, watermark, logo, "
        "distorted human faces, fake people, crowded foreground, messy artifacts, low resolution, blurry"
    )

    aspect_ratio = "4:5"
    if "1080x1080" in format_type:
        aspect_ratio = "1:1"
    elif "1080x1920" in format_type:
        aspect_ratio = "9:16"

    return {
        "positive_prompt": positive_prompt,
        "negative_prompt": negative_prompt,
        "aspect_ratio": aspect_ratio,
        "style": style
    }

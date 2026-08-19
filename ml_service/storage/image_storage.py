"""
Image Storage Service
Manages local file storage for AI generated background visuals and rendered event posters.
Supports PNG and JPG formats with caching and retrieval.
"""

import os
import uuid
import logging
from pathlib import Path
from typing import Tuple
from PIL import Image

logger = logging.getLogger("ml_service.storage.images")

ROOT_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = ROOT_DIR / "static" / "posters"
STATIC_DIR.mkdir(parents=True, exist_ok=True)


def save_image(image: Image.Image, prefix: str = "poster", format: str = "PNG") -> Tuple[str, str, str]:
    """
    Saves a PIL Image in PNG and JPG formats.
    
    Returns:
        (image_id, png_url, jpg_url)
    """
    img_id = f"{prefix}_{uuid.uuid4().hex[:12]}"
    png_filename = f"{img_id}.png"
    jpg_filename = f"{img_id}.jpg"

    png_path = STATIC_DIR / png_filename
    jpg_path = STATIC_DIR / jpg_filename

    # Save PNG
    image.save(str(png_path), format="PNG", quality=95)

    # Save JPG (convert RGBA to RGB if needed)
    rgb_image = image.convert("RGB") if image.mode in ("RGBA", "P") else image
    rgb_image.save(str(jpg_path), format="JPEG", quality=92)

    png_url = f"/static/posters/{png_filename}"
    jpg_url = f"/static/posters/{jpg_filename}"

    return img_id, png_url, jpg_url


def get_image_path_from_url(url: str) -> Path:
    """Resolves local absolute path from a /static/posters/... URL."""
    filename = Path(url).name
    return STATIC_DIR / filename

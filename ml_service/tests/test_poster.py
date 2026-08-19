"""
Comprehensive Test Suite for AI Event Poster Generator
Tests all 6 benchmark prompts, style variations, multi-format rendering,
dynamic regeneration, text re-rendering, and draft publishing.
"""

import sys
import unittest
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from services.event_parser import parse_event_prompt
from services.image_prompt_generator import generate_image_prompt
from services.image_generator import generate_background_image
from services.poster_renderer import render_event_poster
from routers.poster import generate_poster, regenerate_poster, change_poster_style, render_poster_text_only
from schemas.poster import (
    PosterGenerateRequest,
    PosterRegenerateRequest,
    PosterChangeStyleRequest,
    PosterRenderRequest,
    EventDataModel
)


class TestAIPosterGenerator(unittest.TestCase):

    # 1. Benchmark Prompt 1: Generative AI Workshop
    def test_01_gen_ai_workshop_prompt(self):
        prompt = "Create a futuristic Generative AI workshop poster for second-year CSE students on September 15, 2026 from 10 AM to 1 PM at Seminar Hall."
        res = generate_poster(PosterGenerateRequest(prompt=prompt))
        self.assertIsNotNone(res.id)
        self.assertEqual(res.status, "DRAFT")
        self.assertTrue("AI" in res.event["title"] or "Generative" in res.event["title"])
        self.assertEqual(res.event["department"], "CSE")
        self.assertEqual(res.event["date"], "September 15, 2026")
        self.assertEqual(res.event["venue"], "Seminar Hall")
        self.assertTrue(res.posterImageUrl.endswith(".png"))
        self.assertTrue(res.downloadJpgUrl.endswith(".jpg"))

    # 2. Benchmark Prompt 2: Cybersecurity Awareness Seminar
    def test_02_cybersecurity_seminar_prompt(self):
        prompt = "Create a cybersecurity awareness seminar poster."
        res = generate_poster(PosterGenerateRequest(prompt=prompt))
        self.assertIsNotNone(res.id)
        self.assertEqual(res.event["category"], "Seminar")
        self.assertTrue("Cybersecurity" in res.event["title"])
        self.assertIsNone(res.event["date"])  # Must not hallucinate unmentioned date

    # 3. Benchmark Prompt 3: Python Workshop with Modern Blue Theme
    def test_03_python_workshop_color_theme(self):
        prompt = "Create a Python workshop poster with a modern blue theme."
        res = generate_poster(PosterGenerateRequest(prompt=prompt))
        self.assertIsNotNone(res.id)
        self.assertTrue("Python" in res.event["title"])
        self.assertTrue("blue" in (res.event["colorPreference"] or "").lower())

    # 4. Benchmark Prompt 4: College Hackathon with Energetic Futuristic Design
    def test_04_hackathon_futuristic_prompt(self):
        prompt = "Create a college hackathon poster with an energetic futuristic design."
        res = generate_poster(PosterGenerateRequest(prompt=prompt))
        self.assertIsNotNone(res.id)
        self.assertEqual(res.event["category"], "Hackathon")
        self.assertEqual(res.style, "Futuristic")

    # 5. Benchmark Prompt 5: Cultural Fest with Vibrant Creative Design
    def test_05_cultural_fest_creative_prompt(self):
        prompt = "Create a cultural fest poster with a vibrant creative design."
        res = generate_poster(PosterGenerateRequest(prompt=prompt))
        self.assertIsNotNone(res.id)
        self.assertEqual(res.event["category"], "Cultural")
        self.assertEqual(res.style, "Creative")

    # 6. Benchmark Prompt 6: Minimal Academic Seminar Poster
    def test_06_minimal_academic_seminar_prompt(self):
        prompt = "Create a minimal academic seminar poster."
        res = generate_poster(PosterGenerateRequest(prompt=prompt))
        self.assertIsNotNone(res.id)
        self.assertEqual(res.event["category"], "Seminar")
        self.assertTrue(res.style in ("Minimal", "Academic"))

    # 7. Multi-Format Rendering (Square, Story, A4)
    def test_07_multi_format_rendering(self):
        event_dict = {
            "title": "National Tech Summit",
            "category": "Technical",
            "department": "CSE",
            "date": "2026-10-10",
            "startTime": "09:00 AM",
            "endTime": "05:00 PM",
            "venue": "Main Auditorium",
            "style": "Futuristic",
            "cta": "JOIN NOW"
        }
        for fmt in ("1080x1080", "1080x1920", "1080x1350"):
            prompt_info = generate_image_prompt(event_dict, format_type=fmt)
            bg_img, bg_url = generate_background_image(prompt_info, format_type=fmt)
            img, png_url, _ = render_event_poster(event_dict, background_image=bg_img, format_type=fmt)
            self.assertEqual(img.size, (int(fmt.split("x")[0]), int(fmt.split("x")[1])))
            self.assertTrue(png_url.startswith("/static/posters/"))

    # 8. Poster Regeneration
    def test_08_poster_regeneration(self):
        req = PosterRegenerateRequest(
            eventData=EventDataModel(
                title="Generative AI Bootcamp",
                category="Workshop",
                department="CSE",
                date="2026-09-20",
                venue="Tech Hub Lab",
                style="Futuristic"
            ),
            additionalInstruction="Add deeper cybernetic blue and cyan glow",
            style="Futuristic"
        )
        res = regenerate_poster(req)
        self.assertIsNotNone(res.id)
        self.assertTrue(res.posterImageUrl.endswith(".png"))

    # 9. Poster Style Switching (Futuristic -> Minimal)
    def test_09_poster_style_change(self):
        req = PosterChangeStyleRequest(
            eventData=EventDataModel(
                title="Data Science Research Symposium",
                category="Seminar",
                department="IT",
                date="2026-11-15",
                venue="Hall 1"
            ),
            style="Minimal"
        )
        res = change_poster_style(req)
        self.assertEqual(res.style, "Minimal")

    # 10. Text Re-rendering without background regeneration
    def test_10_text_re_render_only(self):
        # Generate initial
        init_res = generate_poster(PosterGenerateRequest(prompt="Create a Python coding bootcamp poster on Oct 5."))
        # Edit title and venue
        updated_event = EventDataModel(**init_res.event)
        updated_event.title = "Advanced Python & PyTorch Bootcamp"
        updated_event.venue = "AI Research Center 4"

        render_req = PosterRenderRequest(
            eventData=updated_event,
            backgroundImageUrl=init_res.backgroundImageUrl,
            format="1080x1350"
        )
        render_res = render_poster_text_only(render_req)
        self.assertEqual(render_res.event["title"], "Advanced Python & PyTorch Bootcamp")
        self.assertEqual(render_res.backgroundImageUrl, init_res.backgroundImageUrl)


if __name__ == "__main__":
    unittest.main()

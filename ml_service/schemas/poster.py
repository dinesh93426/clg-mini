"""
Poster Generator Pydantic Schemas
"""

from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class EventDataModel(BaseModel):
    title: str = Field(..., description="Event Title")
    category: Optional[str] = Field("Technical", description="Event Category (Technical, Cultural, Sports, Workshop, Hackathon, Seminar)")
    department: Optional[str] = Field(None, description="Department (e.g. CSE, IT, ECE, Mechanical)")
    targetAudience: Optional[str] = Field(None, description="Target Audience (e.g. 2nd Year, All Students)")
    date: Optional[str] = Field(None, description="Event Date in YYYY-MM-DD or readable format")
    startTime: Optional[str] = Field(None, description="Event Start Time (e.g. 10:00 AM)")
    endTime: Optional[str] = Field(None, description="Event End Time (e.g. 01:00 PM)")
    venue: Optional[str] = Field(None, description="Event Venue/Location")
    theme: Optional[str] = Field("Modern Technology", description="Theme description")
    style: Optional[str] = Field("Futuristic", description="Poster Style (Futuristic, Minimal, Corporate, Academic, Creative, Dark Tech, Gradient, Glassmorphism, Neon, Elegant)")
    colorPreference: Optional[str] = Field(None, description="Color preference (e.g. blue and purple, neon green, dark)")
    description: Optional[str] = Field(None, description="Brief event description")
    cta: Optional[str] = Field("REGISTER NOW", description="Call to action text")
    logoUrl: Optional[str] = Field(None, description="Optional organizer/college logo URL")


class PosterGenerateRequest(BaseModel):
    prompt: str = Field(..., description="Natural language description of the event poster.")
    style: Optional[str] = Field(None, description="Poster Style override")
    format: Optional[str] = Field("1080x1350", description="Poster format (1080x1350, 1080x1080, 1080x1920, 2480x3508)")
    colorPreference: Optional[str] = Field(None, description="Color preference override")
    logoUrl: Optional[str] = Field(None, description="Optional uploaded logo path or URL")


class PosterRegenerateRequest(BaseModel):
    eventData: EventDataModel
    style: Optional[str] = Field("Futuristic", description="Selected poster style")
    format: Optional[str] = Field("1080x1350", description="Poster format")
    additionalInstruction: Optional[str] = Field(None, description="Prompt refinement instruction")
    logoUrl: Optional[str] = Field(None, description="Optional logo URL")


class PosterChangeStyleRequest(BaseModel):
    eventData: EventDataModel
    style: str = Field(..., description="New poster style to apply")
    format: Optional[str] = Field("1080x1350", description="Poster format")
    logoUrl: Optional[str] = Field(None, description="Optional logo URL")


class PosterRenderRequest(BaseModel):
    eventData: EventDataModel
    backgroundImageUrl: str = Field(..., description="Existing background image URL to overlay text onto")
    style: Optional[str] = Field("Futuristic", description="Poster style")
    format: Optional[str] = Field("1080x1350", description="Poster format")
    logoUrl: Optional[str] = Field(None, description="Optional logo URL")


class PosterResponse(BaseModel):
    id: str
    event: Dict[str, Any]
    backgroundImageUrl: str
    posterImageUrl: str
    style: str
    format: str
    status: str
    downloadPngUrl: str
    downloadJpgUrl: str
    createdAt: str

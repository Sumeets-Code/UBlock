"""Pydantic request / response schemas."""

from pydantic import BaseModel, Field
from typing import Optional


# ── Register ──────────────────────────────────────────────────────────────────

class RegisterBase64Request(BaseModel):
    user_id: str = Field(..., description="MongoDB _id of the user")
    image_data: str = Field(..., description="Base64-encoded image (data URL or raw)")


class RegisterResponse(BaseModel):
    success: bool
    user_id: str
    encodings_stored: int
    message: str


# ── Recognize (1-to-N search) ─────────────────────────────────────────────────

class RecognizeBase64Request(BaseModel):
    image_data: str = Field(..., description="Base64-encoded image")
    threshold: Optional[float] = Field(None, description="Override similarity threshold (0–1)")


class RecognizeResponse(BaseModel):
    matched: bool
    user_id: Optional[str]
    similarity: float
    message: str


# ── Verify (1-to-1 check) ─────────────────────────────────────────────────────

class VerifyBase64Request(BaseModel):
    user_id: str = Field(..., description="MongoDB _id to verify against")
    image_data: str = Field(..., description="Base64-encoded image")
    threshold: Optional[float] = None


class VerifyResponse(BaseModel):
    verified: bool
    user_id: str
    similarity: float
    message: str


# ── Delete ────────────────────────────────────────────────────────────────────

class DeleteResponse(BaseModel):
    success: bool
    user_id: str
    message: str


# ── Health ────────────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str
    registered_users: int
    version: str

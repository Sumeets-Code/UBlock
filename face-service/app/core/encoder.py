"""
Face detection + encoding pipeline.

Uses:
  - facenet-pytorch MTCNN  — blazing-fast face detection + alignment
  - facenet-pytorch InceptionResnetV1 (VGGFace2-pretrained) — 512-d embeddings

Why this stack:
  - Single pip install (facenet-pytorch) pulls both models
  - VGGFace2 weights achieve 99.65% LFW accuracy
  - Runs on CPU without issue (< 200ms per image on modern hardware)
  - No dlib dependency (no cmake hell on Linux/Mac/Windows)
"""

import io
import base64
import logging
import numpy as np
from typing import Optional

import torch
from PIL import Image, UnidentifiedImageError
from facenet_pytorch import MTCNN, InceptionResnetV1

from app.core.config import settings

logger = logging.getLogger("ublock.face.encoder")

# ── Model singletons (loaded once at import time) ─────────────────────────────
# Use CPU — simpler deployment, still fast enough for auth flows
_device = torch.device("cpu")

# MTCNN: detects faces, aligns, returns 160×160 tensor
_detector = MTCNN(
    image_size=160,
    margin=20,
    min_face_size=40,
    thresholds=[0.6, 0.7, 0.7],   # P, R, O network thresholds
    factor=0.709,
    post_process=True,
    select_largest=True,           # only the largest (closest) face
    device=_device,
    keep_all=False,
)

# InceptionResnetV1: VGGFace2 weights, outputs 512-d L2-normed embedding
_encoder = InceptionResnetV1(pretrained="vggface2", device=_device).eval()

logger.info("Face encoder models loaded (MTCNN + InceptionResnetV1/VGGFace2)")


# ── Public API ────────────────────────────────────────────────────────────────

class FaceEncodingError(Exception):
    """Raised when a face cannot be detected or encoded."""
    pass


def encode_from_bytes(image_bytes: bytes) -> np.ndarray:
    """
    Detect + encode a face from raw image bytes.

    Returns a 512-d numpy float32 array (unit-normalised by InceptionResnetV1).
    Raises FaceEncodingError if no face is detected or confidence is too low.
    """
    img = _load_image(image_bytes)
    return _detect_and_encode(img)


def encode_from_base64(b64_string: str) -> np.ndarray:
    """
    Detect + encode from a base64-encoded image string.
    Strips the data: URL prefix if present (e.g. data:image/jpeg;base64,...).
    """
    if "," in b64_string:
        b64_string = b64_string.split(",", 1)[1]
    raw = base64.b64decode(b64_string)
    return encode_from_bytes(raw)


# ── Internal helpers ──────────────────────────────────────────────────────────

def _load_image(data: bytes) -> Image.Image:
    """Decode bytes → PIL RGB, enforce size limit."""
    if len(data) > settings.MAX_IMAGE_SIZE_MB * 1024 * 1024:
        raise FaceEncodingError(
            f"Image too large (max {settings.MAX_IMAGE_SIZE_MB} MB)"
        )
    try:
        img = Image.open(io.BytesIO(data)).convert("RGB")
    except UnidentifiedImageError:
        raise FaceEncodingError("Could not decode image — unsupported format")
    return img


def _detect_and_encode(img: Image.Image) -> np.ndarray:
    """Run MTCNN detection + InceptionResnetV1 encoding."""
    # MTCNN returns a (1, 3, 160, 160) float tensor or None
    face_tensor, prob = _detector(img, return_prob=True)

    if face_tensor is None or prob is None:
        raise FaceEncodingError(
            "No face detected. Please ensure your face is clearly visible and well-lit."
        )

    if float(prob) < settings.MIN_FACE_CONFIDENCE:
        raise FaceEncodingError(
            f"Face detection confidence too low ({prob:.2f}). "
            "Please use a clearer, front-facing photo."
        )

    # Add batch dimension → (1, 3, 160, 160)
    face_batch = face_tensor.unsqueeze(0).to(_device)

    with torch.no_grad():
        embedding = _encoder(face_batch)   # (1, 512)

    return embedding.squeeze(0).cpu().numpy().astype(np.float32)

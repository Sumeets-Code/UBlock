"""
Registration endpoints.

POST /face/register       — multipart/form-data
POST /face/register-b64   — JSON base64
DELETE /face/{user_id}    — remove all encodings
GET  /face/users          — list user IDs (debug)
"""

import logging
import asyncio
from concurrent.futures import ThreadPoolExecutor
from functools import partial

from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException

from app.core.encoder import encode_from_bytes, encode_from_base64, FaceEncodingError
from app.core.face_store import face_store
from app.core.security import verify_service_secret
from app.models.schemas import RegisterBase64Request, RegisterResponse, DeleteResponse

logger = logging.getLogger("ublock.face.register")
router = APIRouter(dependencies=[Depends(verify_service_secret)])

# Thread pool for CPU-bound face encoding (keeps the async event loop unblocked)
_executor = ThreadPoolExecutor(max_workers=2, thread_name_prefix="face-encoder")


async def _run_in_thread(fn, *args):
    """Run a blocking CPU-bound function in a thread pool."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(_executor, partial(fn, *args))


@router.post("/register", response_model=RegisterResponse)
async def register_face_file(
    user_id: str = Form(...),
    image: UploadFile = File(...),
):
    _validate_content_type(image.content_type)
    raw = await image.read()
    return await _do_register(user_id, lambda: encode_from_bytes(raw))


@router.post("/register-b64", response_model=RegisterResponse)
async def register_face_base64(body: RegisterBase64Request):
    return await _do_register(body.user_id, lambda: encode_from_base64(body.image_data))


@router.delete("/{user_id}", response_model=DeleteResponse)
async def delete_face(user_id: str):
    deleted = face_store.delete_user(user_id)
    return DeleteResponse(
        success=deleted,
        user_id=user_id,
        message="Face data deleted" if deleted else "User not found",
    )


@router.get("/users")
async def list_users():
    return {"user_ids": face_store.list_users(), "count": len(face_store)}


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _do_register(user_id: str, encode_fn) -> RegisterResponse:
    if not user_id or not user_id.strip():
        raise HTTPException(status_code=400, detail="user_id must not be empty")
    try:
        # Run heavy inference off the event loop
        encoding = await _run_in_thread(encode_fn)
    except FaceEncodingError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception:
        logger.exception("Unexpected error during face encoding")
        raise HTTPException(status_code=500, detail="Face encoding failed")

    count = face_store.add_encoding(user_id, encoding)
    logger.info(f"Registered face for user {user_id!r} — {count} encoding(s) stored")
    return RegisterResponse(
        success=True,
        user_id=user_id,
        encodings_stored=count,
        message=f"Face registered ({count}/3 samples stored)",
    )


def _validate_content_type(ct: str | None) -> None:
    allowed = {"image/jpeg", "image/png", "image/webp", "image/bmp"}
    if ct and ct.split(";")[0].strip() not in allowed:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported image type '{ct}'. Use JPEG, PNG, WebP or BMP.",
        )

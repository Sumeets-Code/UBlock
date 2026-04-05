"""
Recognition / verification endpoints — all encoding runs in a thread pool.

POST /face/recognize      — 1-to-N search (file upload)
POST /face/recognize-b64  — 1-to-N search (base64)
POST /face/verify         — 1-to-1 check (file upload)
POST /face/verify-b64     — 1-to-1 check (base64)
"""

import logging
import asyncio
from concurrent.futures import ThreadPoolExecutor
from functools import partial

from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException

from app.core.encoder import encode_from_bytes, encode_from_base64, FaceEncodingError
from app.core.face_store import face_store
from app.core.security import verify_service_secret
from app.models.schemas import (
    RecognizeBase64Request, RecognizeResponse,
    VerifyBase64Request,    VerifyResponse,
)

logger   = logging.getLogger("ublock.face.recognize")
router   = APIRouter(dependencies=[Depends(verify_service_secret)])
_executor = ThreadPoolExecutor(max_workers=2, thread_name_prefix="face-encoder")


async def _run_in_thread(fn, *args):
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(_executor, partial(fn, *args))


@router.post("/recognize", response_model=RecognizeResponse)
async def recognize_file(image: UploadFile = File(...), threshold: float = Form(default=None)):
    raw = await image.read()
    return await _do_recognize(lambda: encode_from_bytes(raw), threshold)


@router.post("/recognize-b64", response_model=RecognizeResponse)
async def recognize_b64(body: RecognizeBase64Request):
    return await _do_recognize(lambda: encode_from_base64(body.image_data), body.threshold)


@router.post("/verify", response_model=VerifyResponse)
async def verify_file(
    user_id: str = Form(...),
    image: UploadFile = File(...),
    threshold: float = Form(default=None),
):
    raw = await image.read()
    return await _do_verify(user_id, lambda: encode_from_bytes(raw), threshold)


@router.post("/verify-b64", response_model=VerifyResponse)
async def verify_b64(body: VerifyBase64Request):
    return await _do_verify(body.user_id, lambda: encode_from_base64(body.image_data), body.threshold)


# ── Internal ──────────────────────────────────────────────────────────────────

async def _do_recognize(encode_fn, threshold) -> RecognizeResponse:
    try:
        probe = await _run_in_thread(encode_fn)
    except FaceEncodingError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    user_id, score = face_store.find_match(probe, threshold)
    matched = user_id is not None
    logger.info(f"Recognize matched={matched} user={user_id} score={score:.4f}")
    return RecognizeResponse(
        matched=matched,
        user_id=user_id,
        similarity=round(score, 4),
        message="Face matched" if matched else "No matching face found",
    )


async def _do_verify(user_id: str, encode_fn, threshold) -> VerifyResponse:
    if not face_store.has_user(user_id):
        raise HTTPException(status_code=404, detail=f"No face registered for user {user_id}")
    try:
        probe = await _run_in_thread(encode_fn)
    except FaceEncodingError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    verified, score = face_store.verify_user(user_id, probe, threshold)
    logger.info(f"Verify user={user_id} verified={verified} score={score:.4f}")
    return VerifyResponse(
        verified=verified,
        user_id=user_id,
        similarity=round(score, 4),
        message="Identity verified" if verified else "Face does not match",
    )

"""
UBlock Face Recognition Microservice
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
import os

from app.core.config import settings
from app.core.face_store import face_store
from app.routers import register, recognize, health

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
)
logger = logging.getLogger("ublock.face")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure data directory exists
    os.makedirs(settings.DATA_DIR, exist_ok=True)

    logger.info(f"Loading face encodings from {settings.DATA_DIR}...")
    face_store.load()
    logger.info(f"Loaded {len(face_store)} registered face(s)")
    logger.info(f"SERVICE_SECRET configured: {'yes' if settings.SERVICE_SECRET != 'CHANGE_ME_TO_A_STRONG_RANDOM_STRING' else 'NO — using default, set it in .env!'}")
    yield
    logger.info("Saving face encodings to disk...")
    face_store.save()


app = FastAPI(
    title="UBlock Face Recognition",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(register.router,  prefix="/face", tags=["Registration"])
app.include_router(recognize.router, prefix="/face", tags=["Recognition"])


@app.exception_handler(Exception)
async def global_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.url}: {exc}", exc_info=True)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})

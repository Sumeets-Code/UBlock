from pydantic_settings import BaseSettings
from typing import List
import os


# Resolve path to face-service/.env regardless of where uvicorn is run from
_THIS_DIR    = os.path.dirname(os.path.abspath(__file__))
_SERVICE_DIR = os.path.join(_THIS_DIR, "..", "..")   # face-service/
_ENV_FILE    = os.path.join(_SERVICE_DIR, ".env")


class Settings(BaseSettings):
    # Service
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    WORKERS: int = 1          # keep at 1 — face_store is in-process

    # Face recognition
    SIMILARITY_THRESHOLD: float = 0.55   # cosine similarity; lower = stricter
    MIN_FACE_CONFIDENCE: float = 0.90    # MTCNN detection confidence floor
    MAX_IMAGE_SIZE_MB: int = 10
    # Number of encodings stored per user (helps with lighting variation)
    ENCODINGS_PER_USER: int = 3

    # Persistence
    DATA_DIR:   str = os.path.join(_SERVICE_DIR, "data", "faces")
    STORE_FILE: str = "face_store.pkl"   # pickle of all encodings

    # CORS — allow the Node.js backend and React dev server
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
    ]

    # Internal service auth — the Node.js backend must send this header
    # so random clients cannot register or verify faces.
    # Set the same value in api/.env as FACE_SERVICE_SECRET
    # ── IMPORTANT: must match FACE_SERVICE_SECRET in api/.env exactly ─────────
    SERVICE_SECRET: str = "CHANGE_ME_TO_A_STRONG_RANDOM_STRING"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()

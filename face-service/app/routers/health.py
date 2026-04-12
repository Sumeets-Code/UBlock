from fastapi import APIRouter
from app.models.schemas import HealthResponse
from app.core.face_store import face_store

router = APIRouter()


@router.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    return HealthResponse(
        status="ok",
        registered_users=len(face_store),
        version="1.0.0",
    )

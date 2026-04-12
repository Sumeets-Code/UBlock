"""
Service-to-service authentication.

The Node.js backend sends X-Service-Secret: <token> on every request.
This prevents external clients from registering or verifying faces directly.
"""

from fastapi import Header, HTTPException, status
from app.core.config import settings


async def verify_service_secret(
    x_service_secret: str = Header(..., alias="X-Service-Secret"),
) -> None:
    """FastAPI dependency — raises 403 if secret does not match."""
    if x_service_secret != settings.SERVICE_SECRET:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid service secret",
        )

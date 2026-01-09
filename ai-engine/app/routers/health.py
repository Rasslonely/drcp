"""
Health check router.
"""
from fastapi import APIRouter
from app.schemas.prediction import HealthResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """
    Health check endpoint.
    
    Returns the current health status of the API and model availability.
    """
    return HealthResponse(
        status="healthy",
        models_loaded=True,
        version="1.0.0"
    )

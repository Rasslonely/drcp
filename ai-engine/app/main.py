"""
DRCP AI Engine - FastAPI Application Entry Point

This is the disaster prediction API for the Disaster Response Coordination Protocol.
It provides risk scores that are consumed by Chainlink Functions oracles.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import get_settings
from app.routers import health, predict


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle management."""
    # Startup
    print("[*] DRCP AI Engine starting...")
    print("[+] Models loaded successfully")
    yield
    # Shutdown
    print("[*] DRCP AI Engine shutting down...")


# Initialize FastAPI app
settings = get_settings()
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="""
    ## Disaster Response Coordination Protocol - AI Engine
    
    Provides real-time disaster risk predictions for:
    - 🌊 **Floods** - Based on rainfall, soil moisture, river levels
    - 🌋 **Earthquakes** - Based on seismic activity and magnitude
    - 🔥 **Wildfires** - Based on temperature and humidity
    
    ### Severity Levels
    
    | Score | Level | Contract Action |
    |-------|-------|-----------------|
    | 0-39 | LOW | No action |
    | 40-59 | MODERATE | DAO vote (72hr) |
    | 60-79 | HIGH | DAO vote (24hr) |
    | 80-100 | CRITICAL | Auto-release 20% |
    """,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router)
app.include_router(predict.router)


@app.get("/")
async def root():
    """Root endpoint - API info."""
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs",
        "health": "/health",
        "predict": "/predict"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug
    )

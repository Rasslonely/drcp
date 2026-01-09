"""
Pydantic schemas for API request/response validation.
"""
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from enum import Enum


class DisasterType(str, Enum):
    """Supported disaster types for prediction."""
    FLOOD = "FLOOD"
    EARTHQUAKE = "EARTHQUAKE"
    WILDFIRE = "WILDFIRE"


class PredictionRequest(BaseModel):
    """Request body for /predict endpoint."""
    latitude: float = Field(..., ge=-90, le=90, description="Latitude coordinate")
    longitude: float = Field(..., ge=-180, le=180, description="Longitude coordinate")
    disaster_type: DisasterType = Field(..., description="Type of disaster to predict")
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "latitude": -6.2088,
                    "longitude": 106.8456,
                    "disaster_type": "FLOOD"
                }
            ]
        }
    }


class PredictionResponse(BaseModel):
    """Response body for /predict endpoint."""
    severity: int = Field(..., ge=0, le=100, description="Risk severity score 0-100")
    confidence: float = Field(..., ge=0, le=1, description="Model confidence 0-1")
    disaster_type: DisasterType
    geohash: str = Field(..., description="Geohash of the location")
    factors: List[str] = Field(default_factory=list, description="Contributing factors")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "severity": 75,
                    "confidence": 0.85,
                    "disaster_type": "FLOOD",
                    "geohash": "qqguw",
                    "factors": ["heavy_rainfall", "soil_saturation"],
                    "timestamp": "2025-12-26T21:30:00Z"
                }
            ]
        }
    }


class HealthResponse(BaseModel):
    """Response body for /health endpoint."""
    status: str = "healthy"
    models_loaded: bool = True
    version: str = "1.0.0"


class RiskScoreForChainlink(BaseModel):
    """Simplified response format for Chainlink Functions."""
    severity: int
    disaster_type: str
    geohash: str
    timestamp: int  # Unix timestamp

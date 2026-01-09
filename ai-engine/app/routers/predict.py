"""
Prediction router - /predict endpoint.
"""
from fastapi import APIRouter, HTTPException
from app.schemas.prediction import (
    PredictionRequest, 
    PredictionResponse,
    RiskScoreForChainlink
)
from app.models.ensemble import ensemble_predictor
import time

router = APIRouter(tags=["Prediction"])


@router.post("/predict", response_model=PredictionResponse)
async def predict_disaster_risk(request: PredictionRequest) -> PredictionResponse:
    """
    Predict disaster risk for a given location.
    
    This endpoint accepts coordinates and a disaster type, then returns
    a risk severity score (0-100), confidence level, and contributing factors.
    
    The severity score determines smart contract behavior:
    - 0-39: LOW - No action
    - 40-59: MODERATE - DAO vote (72hr window)
    - 60-79: HIGH - DAO vote (24hr window)
    - 80-100: CRITICAL - Auto-release 20% funds
    """
    try:
        result = await ensemble_predictor.predict(
            latitude=request.latitude,
            longitude=request.longitude,
            disaster_type=request.disaster_type
        )
        
        return PredictionResponse(
            severity=result["severity"],
            confidence=result["confidence"],
            disaster_type=result["disaster_type"],
            geohash=result["geohash"],
            factors=result["factors"],
            timestamp=result["timestamp"]
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(e)}"
        )


@router.post("/predict/chainlink", response_model=RiskScoreForChainlink)
async def predict_for_chainlink(request: PredictionRequest) -> RiskScoreForChainlink:
    """
    Simplified prediction endpoint for Chainlink Functions.
    
    Returns minimal data optimized for on-chain consumption.
    """
    try:
        result = await ensemble_predictor.predict(
            latitude=request.latitude,
            longitude=request.longitude,
            disaster_type=request.disaster_type
        )
        
        return RiskScoreForChainlink(
            severity=result["severity"],
            disaster_type=request.disaster_type.value,
            geohash=result["geohash"],
            timestamp=int(time.time())
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(e)}"
        )

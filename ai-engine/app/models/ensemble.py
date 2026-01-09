"""
Ensemble model that aggregates predictions from multiple disaster models.
"""
from typing import Dict, Any, List, Tuple
from datetime import datetime

from app.models.flood_risk import flood_model
from app.models.earthquake_risk import earthquake_model
from app.services.weather import get_weather_data
from app.services.seismic import get_seismic_data
from app.schemas.prediction import DisasterType


class EnsemblePredictor:
    """
    Aggregates predictions from specialized models.
    
    Routes requests to the appropriate model based on disaster type.
    """
    
    def __init__(self):
        self.models = {
            DisasterType.FLOOD: self._predict_flood,
            DisasterType.EARTHQUAKE: self._predict_earthquake,
            DisasterType.WILDFIRE: self._predict_wildfire,
        }
    
    async def predict(
        self, 
        latitude: float, 
        longitude: float, 
        disaster_type: DisasterType
    ) -> Dict[str, Any]:
        """
        Get prediction for specified disaster type.
        
        Args:
            latitude: Location latitude
            longitude: Location longitude
            disaster_type: Type of disaster to predict
        
        Returns:
            Prediction result with severity, confidence, and factors
        """
        predict_fn = self.models.get(disaster_type)
        
        if predict_fn is None:
            return {
                "severity": 0,
                "confidence": 0,
                "geohash": "",
                "factors": ["unsupported_disaster_type"],
                "disaster_type": disaster_type.value,
                "timestamp": datetime.utcnow()
            }
        
        result = await predict_fn(latitude, longitude)
        result["disaster_type"] = disaster_type
        result["timestamp"] = datetime.utcnow()
        
        return result
    
    async def _predict_flood(self, lat: float, lon: float) -> Dict[str, Any]:
        """Get flood risk prediction."""
        weather_data = await get_weather_data(lat, lon)
        prediction = flood_model.predict(weather_data, (lat, lon))
        return prediction
    
    async def _predict_earthquake(self, lat: float, lon: float) -> Dict[str, Any]:
        """Get earthquake risk prediction."""
        seismic_data = await get_seismic_data(lat, lon)
        prediction = earthquake_model.predict(seismic_data, (lat, lon))
        return prediction
    
    async def _predict_wildfire(self, lat: float, lon: float) -> Dict[str, Any]:
        """
        Get wildfire risk prediction.
        
        TODO: Implement WildfireRiskModel in Phase 5.
        For now, return a simplified weather-based score.
        """
        weather_data = await get_weather_data(lat, lon)
        
        # Simple wildfire scoring based on temperature and humidity
        temp = weather_data.get("temperature_c", 25)
        humidity = weather_data.get("humidity_percent", 70)
        
        # High temp + low humidity = high fire risk
        temp_score = min(100, max(0, (temp - 20) * 5))  # 20C=0, 40C=100
        humidity_score = max(0, 100 - humidity)  # 0%=100, 100%=0
        
        severity = int(temp_score * 0.5 + humidity_score * 0.5)
        
        factors = []
        if temp >= 35:
            factors.append("extreme_heat")
        if humidity <= 30:
            factors.append("low_humidity")
        if not factors:
            factors.append("normal_conditions")
        
        import pygeohash as geohash
        geo = geohash.encode(lat, lon, precision=6)
        
        return {
            "severity": severity,
            "confidence": 0.6,  # Lower confidence for MVP
            "geohash": geo,
            "factors": factors,
            "component_scores": {
                "temperature": temp_score,
                "humidity": humidity_score
            }
        }


# Singleton
ensemble_predictor = EnsemblePredictor()

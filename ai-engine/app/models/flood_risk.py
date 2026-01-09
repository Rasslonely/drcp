"""
Flood risk prediction model using rule-based scoring.

For MVP, we use a weighted scoring system instead of ML models.
Full ML (FloodLSTM) will be added in Phase 5.
"""
from typing import Dict, Any, List, Tuple
from dataclasses import dataclass
import pygeohash as geohash


@dataclass
class FloodRiskFactors:
    """Weights for flood risk calculation."""
    rainfall_7d_weight: float = 0.35
    rainfall_24h_weight: float = 0.15
    soil_moisture_weight: float = 0.25
    historical_weight: float = 0.15
    river_proximity_weight: float = 0.10


class FloodRiskModel:
    """
    Rule-based flood risk prediction model.
    
    Calculates risk score (0-100) based on:
    - 7-day cumulative rainfall
    - 24-hour rainfall intensity
    - Soil moisture saturation
    - Historical flood data (mock for MVP)
    - River proximity (mock for MVP)
    """
    
    def __init__(self):
        self.factors = FloodRiskFactors()
        
        # Thresholds for risk scoring
        self.rainfall_7d_thresholds = {
            "low": 50,      # mm
            "moderate": 100,
            "high": 200,
            "critical": 300
        }
        self.rainfall_24h_thresholds = {
            "low": 10,
            "moderate": 25,
            "high": 50,
            "critical": 100
        }
        self.soil_moisture_thresholds = {
            "low": 0.3,     # fraction
            "moderate": 0.5,
            "high": 0.7,
            "critical": 0.85
        }
    
    def predict(self, weather_data: Dict[str, Any], location: Tuple[float, float]) -> Dict[str, Any]:
        """
        Predict flood risk for a location.
        
        Args:
            weather_data: Weather metrics from weather service
            location: (latitude, longitude) tuple
        
        Returns:
            Risk prediction with severity, confidence, and factors
        """
        lat, lon = location
        
        # Calculate individual scores (0-100)
        rainfall_7d_score = self._calculate_rainfall_7d_score(
            weather_data.get("total_rainfall_7d_mm", 0)
        )
        rainfall_24h_score = self._calculate_rainfall_24h_score(
            weather_data.get("rainfall_24h_mm", 0)
        )
        soil_score = self._calculate_soil_moisture_score(
            weather_data.get("soil_moisture", 0.3)
        )
        historical_score = self._get_historical_score(lat, lon)
        river_score = self._get_river_proximity_score(lat, lon)
        
        # Weighted combination
        severity = int(
            rainfall_7d_score * self.factors.rainfall_7d_weight +
            rainfall_24h_score * self.factors.rainfall_24h_weight +
            soil_score * self.factors.soil_moisture_weight +
            historical_score * self.factors.historical_weight +
            river_score * self.factors.river_proximity_weight
        )
        
        # Clamp to 0-100
        severity = max(0, min(100, severity))
        
        # Identify contributing factors
        factors = self._identify_factors(
            rainfall_7d_score, rainfall_24h_score, soil_score
        )
        
        # Calculate confidence based on data quality
        confidence = self._calculate_confidence(weather_data)
        
        # Generate geohash
        geo = geohash.encode(lat, lon, precision=6)
        
        return {
            "severity": severity,
            "confidence": confidence,
            "geohash": geo,
            "factors": factors,
            "component_scores": {
                "rainfall_7d": rainfall_7d_score,
                "rainfall_24h": rainfall_24h_score,
                "soil_moisture": soil_score,
                "historical": historical_score,
                "river_proximity": river_score
            }
        }
    
    def _calculate_rainfall_7d_score(self, rainfall_mm: float) -> float:
        """Score based on 7-day cumulative rainfall."""
        if rainfall_mm >= self.rainfall_7d_thresholds["critical"]:
            return 100
        elif rainfall_mm >= self.rainfall_7d_thresholds["high"]:
            return 75 + 25 * (rainfall_mm - 200) / 100
        elif rainfall_mm >= self.rainfall_7d_thresholds["moderate"]:
            return 50 + 25 * (rainfall_mm - 100) / 100
        elif rainfall_mm >= self.rainfall_7d_thresholds["low"]:
            return 25 + 25 * (rainfall_mm - 50) / 50
        else:
            return rainfall_mm / 2
    
    def _calculate_rainfall_24h_score(self, rainfall_mm: float) -> float:
        """Score based on 24-hour rainfall intensity."""
        if rainfall_mm >= self.rainfall_24h_thresholds["critical"]:
            return 100
        elif rainfall_mm >= self.rainfall_24h_thresholds["high"]:
            return 75 + 25 * (rainfall_mm - 50) / 50
        elif rainfall_mm >= self.rainfall_24h_thresholds["moderate"]:
            return 50 + 25 * (rainfall_mm - 25) / 25
        elif rainfall_mm >= self.rainfall_24h_thresholds["low"]:
            return 25 + 25 * (rainfall_mm - 10) / 15
        else:
            return rainfall_mm * 2.5
    
    def _calculate_soil_moisture_score(self, moisture: float) -> float:
        """Score based on soil moisture saturation."""
        if moisture >= self.soil_moisture_thresholds["critical"]:
            return 100
        elif moisture >= self.soil_moisture_thresholds["high"]:
            return 75 + 25 * (moisture - 0.7) / 0.15
        elif moisture >= self.soil_moisture_thresholds["moderate"]:
            return 50 + 25 * (moisture - 0.5) / 0.2
        elif moisture >= self.soil_moisture_thresholds["low"]:
            return 25 + 25 * (moisture - 0.3) / 0.2
        else:
            return moisture * 83.33
    
    def _get_historical_score(self, lat: float, lon: float) -> float:
        """
        Get historical flood risk score.
        
        TODO: Integrate with EM-DAT or historical flood database.
        For MVP, return a moderate baseline.
        """
        # Known high-risk areas (simplified)
        high_risk_regions = [
            (-6.2, 106.8),  # Jakarta
            (13.7, 100.5),  # Bangkok
            (23.8, 90.4),   # Dhaka
        ]
        
        for region_lat, region_lon in high_risk_regions:
            if abs(lat - region_lat) < 1 and abs(lon - region_lon) < 1:
                return 70
        
        return 30  # Default moderate risk
    
    def _get_river_proximity_score(self, lat: float, lon: float) -> float:
        """
        Get river proximity risk score.
        
        TODO: Integrate with GIS river data.
        For MVP, return moderate baseline.
        """
        return 40  # Default moderate proximity
    
    def _identify_factors(
        self, 
        rainfall_7d: float, 
        rainfall_24h: float, 
        soil: float
    ) -> List[str]:
        """Identify the main contributing factors."""
        factors = []
        
        if rainfall_7d >= 60:
            factors.append("heavy_rainfall")
        if rainfall_24h >= 60:
            factors.append("intense_precipitation")
        if soil >= 60:
            factors.append("soil_saturation")
        if rainfall_7d >= 80 and soil >= 70:
            factors.append("flood_conditions")
        
        if not factors:
            factors.append("normal_conditions")
        
        return factors
    
    def _calculate_confidence(self, weather_data: Dict[str, Any]) -> float:
        """Calculate model confidence based on data quality."""
        if weather_data.get("data_source") == "default":
            return 0.3
        elif weather_data.get("data_source") == "open-meteo":
            return 0.85
        return 0.7


# Singleton instance
flood_model = FloodRiskModel()

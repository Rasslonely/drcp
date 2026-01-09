"""
Earthquake risk prediction model using rule-based scoring.

For MVP, we use a weighted scoring system.
Full ML (QuakeCNN) will be added in Phase 5.
"""
from typing import Dict, Any, List, Tuple
from dataclasses import dataclass
import pygeohash as geohash


@dataclass
class EarthquakeRiskFactors:
    """Weights for earthquake risk calculation."""
    recent_activity_weight: float = 0.40
    max_magnitude_weight: float = 0.30
    frequency_weight: float = 0.20
    historical_weight: float = 0.10


class EarthquakeRiskModel:
    """
    Rule-based earthquake risk prediction model.
    
    Calculates risk score (0-100) based on:
    - Recent seismic activity
    - Maximum magnitude in window
    - Earthquake frequency
    - Historical seismicity
    """
    
    def __init__(self):
        self.factors = EarthquakeRiskFactors()
        
        # Magnitude thresholds
        self.magnitude_thresholds = {
            "minor": 3.0,
            "light": 4.0,
            "moderate": 5.0,
            "strong": 6.0,
            "major": 7.0
        }
    
    def predict(self, seismic_data: Dict[str, Any], location: Tuple[float, float]) -> Dict[str, Any]:
        """
        Predict earthquake risk for a location.
        
        Args:
            seismic_data: Seismic metrics from seismic service
            location: (latitude, longitude) tuple
        
        Returns:
            Risk prediction with severity, confidence, and factors
        """
        lat, lon = location
        
        # Calculate individual scores
        max_mag = seismic_data.get("max_magnitude_7d", 0)
        count = seismic_data.get("earthquake_count_7d", 0)
        recent_mag = seismic_data.get("most_recent_magnitude", 0)
        
        activity_score = self._calculate_activity_score(recent_mag)
        magnitude_score = self._calculate_magnitude_score(max_mag)
        frequency_score = self._calculate_frequency_score(count)
        historical_score = self._get_historical_score(lat, lon)
        
        # Weighted combination
        severity = int(
            activity_score * self.factors.recent_activity_weight +
            magnitude_score * self.factors.max_magnitude_weight +
            frequency_score * self.factors.frequency_weight +
            historical_score * self.factors.historical_weight
        )
        
        severity = max(0, min(100, severity))
        
        # Identify factors
        factors = self._identify_factors(max_mag, count, recent_mag)
        
        # Confidence
        confidence = 0.8 if seismic_data.get("data_source") != "default" else 0.3
        
        geo = geohash.encode(lat, lon, precision=6)
        
        return {
            "severity": severity,
            "confidence": confidence,
            "geohash": geo,
            "factors": factors,
            "component_scores": {
                "recent_activity": activity_score,
                "max_magnitude": magnitude_score,
                "frequency": frequency_score,
                "historical": historical_score
            }
        }
    
    def _calculate_activity_score(self, recent_magnitude: float) -> float:
        """Score based on most recent earthquake magnitude."""
        if recent_magnitude >= 7.0:
            return 100
        elif recent_magnitude >= 6.0:
            return 80 + 20 * (recent_magnitude - 6.0)
        elif recent_magnitude >= 5.0:
            return 60 + 20 * (recent_magnitude - 5.0)
        elif recent_magnitude >= 4.0:
            return 40 + 20 * (recent_magnitude - 4.0)
        elif recent_magnitude >= 3.0:
            return 20 + 20 * (recent_magnitude - 3.0)
        else:
            return recent_magnitude * 6.67
    
    def _calculate_magnitude_score(self, max_magnitude: float) -> float:
        """Score based on maximum magnitude in 7 days."""
        return self._calculate_activity_score(max_magnitude)
    
    def _calculate_frequency_score(self, count: int) -> float:
        """Score based on earthquake frequency in 7 days."""
        if count >= 50:
            return 100
        elif count >= 20:
            return 70 + 30 * (count - 20) / 30
        elif count >= 10:
            return 50 + 20 * (count - 10) / 10
        elif count >= 5:
            return 30 + 20 * (count - 5) / 5
        else:
            return count * 6
    
    def _get_historical_score(self, lat: float, lon: float) -> float:
        """Get historical seismic risk score."""
        # Ring of Fire regions (simplified)
        high_risk_zones = [
            (35.6, 139.7, "Japan"),
            (14.6, 121.0, "Philippines"),
            (-8.5, 115.2, "Indonesia"),
            (19.4, -99.1, "Mexico"),
            (-33.4, -70.6, "Chile"),
        ]
        
        for zone_lat, zone_lon, _ in high_risk_zones:
            if abs(lat - zone_lat) < 5 and abs(lon - zone_lon) < 5:
                return 60
        
        return 20
    
    def _identify_factors(self, max_mag: float, count: int, recent_mag: float) -> List[str]:
        """Identify main contributing factors."""
        factors = []
        
        if recent_mag >= 5.0:
            factors.append("significant_recent_quake")
        if max_mag >= 5.0:
            factors.append("high_magnitude_activity")
        if count >= 10:
            factors.append("high_frequency")
        if recent_mag >= 4.0 and count >= 5:
            factors.append("active_region")
        
        if not factors:
            factors.append("low_activity")
        
        return factors


# Singleton
earthquake_model = EarthquakeRiskModel()

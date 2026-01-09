"""
Seismic data service - fetches earthquake data from USGS (free, no API key required).
"""
import httpx
from typing import Dict, Any, List
from datetime import datetime, timedelta
from cachetools import TTLCache

# Cache seismic data for 5 minutes
_seismic_cache: TTLCache = TTLCache(maxsize=100, ttl=300)


async def get_seismic_data(latitude: float, longitude: float, radius_km: float = 500) -> Dict[str, Any]:
    """
    Fetch recent earthquake data from USGS Earthquake API.
    
    Args:
        latitude: Center latitude
        longitude: Center longitude
        radius_km: Search radius in kilometers
    
    Returns:
        Dictionary with recent seismic activity metrics.
    """
    cache_key = f"{latitude:.2f},{longitude:.2f},{radius_km}"
    
    if cache_key in _seismic_cache:
        return _seismic_cache[cache_key]
    
    # Query past 7 days
    end_time = datetime.utcnow()
    start_time = end_time - timedelta(days=7)
    
    url = "https://earthquake.usgs.gov/fdsnws/event/1/query"
    params = {
        "format": "geojson",
        "latitude": latitude,
        "longitude": longitude,
        "maxradiuskm": radius_km,
        "starttime": start_time.strftime("%Y-%m-%d"),
        "endtime": end_time.strftime("%Y-%m-%d"),
        "minmagnitude": 2.0,  # Only significant quakes
        "orderby": "magnitude"
    }
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            result = _process_seismic_data(data)
            _seismic_cache[cache_key] = result
            return result
            
    except httpx.HTTPError:
        return _get_default_seismic_data()


def _process_seismic_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """Process raw USGS response into usable format."""
    features = data.get("features", [])
    
    if not features:
        return _get_default_seismic_data()
    
    # Extract magnitudes
    magnitudes = [
        f["properties"]["mag"] 
        for f in features 
        if f["properties"].get("mag") is not None
    ]
    
    # Calculate metrics
    max_magnitude = max(magnitudes) if magnitudes else 0
    avg_magnitude = sum(magnitudes) / len(magnitudes) if magnitudes else 0
    earthquake_count = len(magnitudes)
    
    # Get most recent significant quake
    recent_quake = features[0]["properties"] if features else {}
    
    return {
        "earthquake_count_7d": earthquake_count,
        "max_magnitude_7d": max_magnitude,
        "avg_magnitude_7d": avg_magnitude,
        "most_recent_magnitude": recent_quake.get("mag", 0),
        "most_recent_place": recent_quake.get("place", "Unknown"),
        "data_source": "usgs",
        "timestamp": datetime.utcnow().isoformat()
    }


def _get_default_seismic_data() -> Dict[str, Any]:
    """Return default values when API fails or no data."""
    return {
        "earthquake_count_7d": 0,
        "max_magnitude_7d": 0,
        "avg_magnitude_7d": 0,
        "most_recent_magnitude": 0,
        "most_recent_place": "None",
        "data_source": "default",
        "timestamp": datetime.utcnow().isoformat()
    }

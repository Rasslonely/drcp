"""
Weather data service - fetches data from Open-Meteo (free, no API key required).
"""
import httpx
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from cachetools import TTLCache

# Cache weather data for 10 minutes
_weather_cache: TTLCache = TTLCache(maxsize=100, ttl=600)


async def get_weather_data(latitude: float, longitude: float) -> Dict[str, Any]:
    """
    Fetch current and historical weather data from Open-Meteo.
    
    Returns:
        Dictionary with rainfall, temperature, humidity, and other metrics.
    """
    cache_key = f"{latitude:.2f},{longitude:.2f}"
    
    if cache_key in _weather_cache:
        return _weather_cache[cache_key]
    
    # Calculate date range (past 7 days)
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=7)
    
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "hourly": "precipitation,rain,soil_moisture_0_to_7cm,temperature_2m,relative_humidity_2m",
        "daily": "precipitation_sum,rain_sum",
        "past_days": 7,
        "forecast_days": 1,
        "timezone": "auto"
    }
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            # Process and aggregate data
            result = _process_weather_data(data)
            _weather_cache[cache_key] = result
            return result
            
    except httpx.HTTPError as e:
        # Return default values on error
        return _get_default_weather_data()


def _process_weather_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """Process raw Open-Meteo response into usable format."""
    daily = data.get("daily", {})
    hourly = data.get("hourly", {})
    
    # Calculate 7-day rainfall total
    precipitation_sum = daily.get("precipitation_sum", [0])
    total_rainfall_7d = sum(p for p in precipitation_sum if p is not None)
    
    # Get current soil moisture (average of recent readings)
    soil_moisture = hourly.get("soil_moisture_0_to_7cm", [])
    avg_soil_moisture = (
        sum(s for s in soil_moisture[-24:] if s is not None) / 24
        if soil_moisture else 0.3
    )
    
    # Get current temperature and humidity
    temps = hourly.get("temperature_2m", [])
    humidity = hourly.get("relative_humidity_2m", [])
    
    current_temp = temps[-1] if temps else 25.0
    current_humidity = humidity[-1] if humidity else 70.0
    
    # Calculate rainfall intensity (last 24 hours)
    rain = hourly.get("rain", [])
    rainfall_24h = sum(r for r in rain[-24:] if r is not None)
    
    return {
        "total_rainfall_7d_mm": total_rainfall_7d,
        "rainfall_24h_mm": rainfall_24h,
        "soil_moisture": avg_soil_moisture,
        "temperature_c": current_temp,
        "humidity_percent": current_humidity,
        "data_source": "open-meteo",
        "timestamp": datetime.utcnow().isoformat()
    }


def _get_default_weather_data() -> Dict[str, Any]:
    """Return default values when API fails."""
    return {
        "total_rainfall_7d_mm": 0,
        "rainfall_24h_mm": 0,
        "soil_moisture": 0.3,
        "temperature_c": 25.0,
        "humidity_percent": 70.0,
        "data_source": "default",
        "timestamp": datetime.utcnow().isoformat()
    }

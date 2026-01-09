"""
Application configuration using Pydantic Settings.
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True
    
    # External APIs
    noaa_api_token: str = ""
    open_meteo_api_key: str = ""
    
    # Chainlink
    chainlink_functions_router: str = ""
    
    # App Info
    app_name: str = "DRCP AI Engine"
    app_version: str = "1.0.0"
    
    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore"
    }


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()

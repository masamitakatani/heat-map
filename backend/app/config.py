"""
Application configuration settings
"""

from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://user:password@localhost:5432/heatmap_db"

    # API Configuration
    API_KEY: str = "your-secret-api-key-here"
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "Heatmap & Funnel Analysis API"
    VERSION: str = "1.0.0"

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
    ]

    # Rate Limiting (requests per minute)
    RATE_LIMIT_EVENTS: int = 100
    RATE_LIMIT_HEATMAPS: int = 60
    RATE_LIMIT_FUNNELS: int = 30
    RATE_LIMIT_GENERAL: int = 120

    # Connected One Integration
    CONNECTED_ONE_WEBHOOK_URL: str = ""
    CONNECTED_ONE_API_KEY: str = ""
    CONNECTED_ONE_API_URL: str = "https://api.connected-one.com"

    # Application Settings
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"

    # Batch Processing
    MAX_EVENTS_PER_BATCH: int = 100

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )


# Global settings instance
settings = Settings()

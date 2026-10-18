"""Environment configuration and settings for ApexCross backend."""
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    app_name: str = "ApexCross"
    app_env: str = "development"
    rp_id: str = "localhost"
    rp_name: str = "ApexCross Banking"
    cors_origins: List[str] = ["http://localhost:3000"]
    openai_api_key: str = ""
    sqlite_db_path: str = "audit_ledger.db"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()

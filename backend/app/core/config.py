"""
Centralized application configuration.
Loaded once via `settings` singleton, sourced from environment variables / .env
"""
import logging
from functools import lru_cache

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    # --- Groq LLM ---
    GROQ_API_KEY: str = ""
    GROQ_EXTRACTION_MODEL: str = "gemma2-9b-it"            # fast, cheap -> structured extraction
    GROQ_REASONING_MODEL: str = "llama-3.3-70b-versatile"  # heavier reasoning -> risk / CAPA / root cause
    GROQ_REQUEST_TIMEOUT_SECONDS: int = 30
    GROQ_MAX_RETRIES: int = 2

    # --- Database ---
    DATABASE_URL: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/complaint_db"
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10

    # --- App ---
    APP_ENV: str = "development"  # development | staging | production
    APP_NAME: str = "Pharma Complaint Management System API"
    CORS_ORIGINS: str = "http://localhost:5173"
    MAX_UPLOAD_MB: int = 10
    LOG_LEVEL: str = "INFO"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @field_validator("APP_ENV")
    @classmethod
    def _normalize_env(cls, v: str) -> str:
        v = v.lower().strip()
        if v not in {"development", "staging", "production"}:
            logger.warning("Unrecognized APP_ENV '%s', defaulting behavior to 'development'", v)
        return v

    @model_validator(mode="after")
    def _warn_on_missing_groq_key(self) -> "Settings":
        # Don't hard-fail import (breaks local tooling like `alembic revision --autogenerate`),
        # but make it loud - a missing key means every AI endpoint will fail at request time.
        if not self.GROQ_API_KEY:
            logger.warning(
                "GROQ_API_KEY is not set. AI extraction, chat, and risk-assessment "
                "endpoints will fail until it is configured in the environment or .env file."
            )
        return self

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"

    @property
    def max_upload_bytes(self) -> int:
        return self.MAX_UPLOAD_MB * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
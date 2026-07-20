from functools import lru_cache
from typing import Annotated

from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    DATABASE_URL: str = "sqlite:///./kanban.db"
    AUTH_SECRET: str = "change-me-in-production-please-use-a-long-secret"
    CORS_ORIGINS: Annotated[list[str], NoDecode] = ["http://localhost:3000"]
    SESSION_COOKIE_NAME: str = "kanban_session"
    SESSION_EXPIRES_DAYS: int = 7
    COOKIE_SECURE: bool = False
    ENVIRONMENT: str = "development"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def _split_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

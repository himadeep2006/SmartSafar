from functools import lru_cache
from pathlib import Path

from pydantic import Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent


class Settings(BaseSettings):
    jwt_secret: SecretStr
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    database_url: str = f"sqlite:///{(BACKEND_DIR / 'smartsafar.db').as_posix()}"
    cors_origins: str = "http://localhost:3000"
    translation_provider_url: str | None = None
    translation_provider_timeout_seconds: float = Field(default=10, ge=1, le=30)
    ai_provider: str = "groq"
    ai_api_key: SecretStr | None = None
    ai_model: str = "openai/gpt-oss-20b"
    ai_timeout_seconds: float = Field(default=30, ge=1, le=60)

    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    @field_validator("jwt_secret")
    @classmethod
    def validate_secret(cls, value: SecretStr) -> SecretStr:
        secret = value.get_secret_value()
        if len(secret) < 32 or secret.startswith("replace-with-a-random-secret"):
            raise ValueError("Set JWT_SECRET to a fresh random value containing at least 32 characters.")
        return value

    @field_validator("jwt_algorithm")
    @classmethod
    def validate_algorithm(cls, value: str) -> str:
        if value not in {"HS256", "HS384", "HS512"}:
            raise ValueError("JWT_ALGORITHM must be HS256, HS384, or HS512.")
        return value

    @field_validator("access_token_expire_minutes")
    @classmethod
    def validate_expiration(cls, value: int) -> int:
        if not 1 <= value <= 60 * 24 * 30:
            raise ValueError("ACCESS_TOKEN_EXPIRE_MINUTES must be between 1 and 43200.")
        return value

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()

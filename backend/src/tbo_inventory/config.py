from pathlib import Path
from typing import Literal

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    app_name: str = "TBO Inventory Intelligence"
    app_env: str = "local"
    log_level: str = "INFO"
    database_url: str = "postgresql+psycopg://tbo:tbo_local_password@localhost:5432/tbo_inventory"

    auth_secret_key: str = "local-development-only-change-this-secret-key"
    session_ttl_minutes: int = 720
    password_reset_ttl_minutes: int = 30
    session_cookie_name: str = "tbo_session"
    session_cookie_secure: bool = False
    session_cookie_samesite: Literal["lax", "strict", "none"] = "lax"
    frontend_url: str = "http://localhost:5173"

    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_sender_email: str | None = None
    smtp_use_tls: bool = True

    model_config = SettingsConfigDict(
        env_file=PROJECT_ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @model_validator(mode="after")
    def validate_auth_settings(self) -> "Settings":
        if self.session_ttl_minutes <= 0:
            raise ValueError("SESSION_TTL_MINUTES must be positive.")
        if self.password_reset_ttl_minutes <= 0:
            raise ValueError("PASSWORD_RESET_TTL_MINUTES must be positive.")

        if self.app_env.lower() in {"production", "prod"}:
            if (
                self.auth_secret_key == "local-development-only-change-this-secret-key"
                or len(self.auth_secret_key) < 32
            ):
                raise ValueError(
                    "AUTH_SECRET_KEY must be a unique secret of at least 32 characters "
                    "in production."
                )
            if not self.session_cookie_secure:
                raise ValueError(
                    "SESSION_COOKIE_SECURE must be enabled in production."
                )

        if self.session_cookie_samesite == "none" and not self.session_cookie_secure:
            raise ValueError(
                "SESSION_COOKIE_SECURE must be enabled when SameSite is 'none'."
            )

        return self


settings = Settings()

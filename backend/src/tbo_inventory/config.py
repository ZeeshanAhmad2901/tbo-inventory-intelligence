from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    app_name: str = "TBO Inventory Intelligence"
    app_env: str = "local"
    log_level: str = "INFO"
    database_url: str = "postgresql+psycopg://tbo:tbo_local_password@localhost:5432/tbo_inventory"

    model_config = SettingsConfigDict(
        env_file=PROJECT_ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()

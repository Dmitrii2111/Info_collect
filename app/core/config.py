from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "InfoCollect"
    app_version: str = "0.2.0"
    app_description: str = "Backend skeleton for offline-first equipment inventory and warehouse control."
    api_prefix: str = "/api"
    frontend_dev_server_url: str | None = None

    postgres_host: str = "127.0.0.1"
    postgres_port: int = 5432
    postgres_db: str = "infocollect"
    postgres_user: str = "infocollect"
    postgres_password: str = "infocollect"
    database_echo: bool = False

    secret_key: str = Field(default="change-me", min_length=8)

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+psycopg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

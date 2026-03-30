from pydantic_settings import BaseSettings
from typing import Literal


class Settings(BaseSettings):
    supabase_url: str = ""
    supabase_service_key: str = ""
    supabase_storage_bucket: str = "labflow-uploads"

    llm_provider: Literal["openai", "azure", "anthropic", "local"] = "openai"
    llm_base_url: str = "https://api.openai.com/v1"
    llm_api_key: str = ""
    llm_model: str = "gpt-4o"

    app_env: Literal["development", "production"] = "development"
    secret_key: str = "dev-secret-change-me"
    cors_origins: str = "http://localhost:3000"

    demo_mode: bool = True
    use_mock_db: bool = False  # Auto-enabled when Supabase credentials are absent

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    class Config:
        env_file = ".env"


settings = Settings()

from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Core app
    secret_key: str = "your-secret-key-here"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days

    # Database
    database_url: str = "sqlite:///./app.db"

    # Azure Cognitive Services
    azure_form_recognizer_endpoint: str = ""
    azure_form_recognizer_key: str = ""

    openai_api_key: str = ""
    openai_api_base: str = ""
    openai_deployment_name: str = "gpt-35-turbo"
    azure_openai_embedding_deployment_name: str = "text-embedding-ada-002"
    openai_api_version: str = "2024-02-15-preview"

    azure_language_endpoint: str = ""
    azure_language_key: str = ""
    azure_qna_project_name: str = "LearnFAQ"
    azure_qna_deployment_name: str = "production"

    azure_ai_vision_endpoint: str = ""
    azure_ai_vision_key: str = ""

    azure_search_endpoint: str = ""
    azure_search_key: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()


from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    llm_api_key: str
    llm_base_url: str = "https://api.openai.com/v1"
    llm_model: str = "gpt-3.5-turbo"
    pexels_api_key: str
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()

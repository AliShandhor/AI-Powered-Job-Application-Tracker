from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    DATABASE_URL: str
    REDIS_URL: str
    CLERK_JWT_PUBLIC_KEY: str
    OPENAI_API_KEY: str
    DEBUG: bool = False
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "case_sensitive": True}

settings = Settings()

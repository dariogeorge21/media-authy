import os
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv

# Load local .env from project root or current dir
load_dotenv()

class Settings(BaseSettings):
    # Server configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = False
    ENVIRONMENT: str = "production"

    # CORS configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*",
    ]

    # OpenAI API Key (support standard OPENAI_API_KEY and custom OPEN_AI_API_KEY)
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY") or os.getenv("OPEN_AI_API_KEY")
    OPENAI_MODEL: str = "gpt-4o"
    OPENAI_VISION_MODEL: str = "gpt-4o"
    OPENAI_TEMPERATURE: float = 0.1

    # Forensic Analysis Parameters
    MAX_FILE_SIZE_BYTES: int = 100 * 1024 * 1024  # 100 MB limit
    ELA_JPEG_QUALITY: int = 90
    ELA_SCALE_FACTOR: float = 15.0
    FFT_HIGH_FREQ_RADIUS_RATIO: float = 0.25
    NOISE_FILTER_KERNEL_SIZE: int = 3
    
    # Privacy and Data Retention Policies
    MEMORY_ONLY_PROCESSING: bool = True
    REDACT_SENSITIVE_METADATA: bool = True
    ALLOW_PERSISTENT_STORAGE: bool = False
    SCRUB_EXIF_GPS: bool = True
    SCRUB_CAMERA_SERIALS: bool = True

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()


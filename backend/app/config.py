import logging
import os
from pathlib import Path

from pydantic_settings import BaseSettings
from pydantic import Field

logger = logging.getLogger(__name__)

# Получаем путь к директории с .env файлом
BASE_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = BASE_DIR / ".env"

logger.info(f"Loading .env from: {ENV_FILE}")


class Settings(BaseSettings):
    BOT_TOKEN: str = Field(..., description="Telegram bot token")
    ADMIN_CHAT_ID: int = Field(..., description="Admin chat ID for notifications")
    DATABASE_URL: str = Field(..., description="Database URL")
    WEB_APP_URL: str = Field(..., description="Web App URL for Telegram")

    class Config:
        env_file = str(ENV_FILE)
        env_file_encoding = "utf-8"


try:
    settings = Settings()
    logger.info("✅ Settings loaded successfully")
    logger.info(f"DATABASE_URL: {settings.DATABASE_URL}")
except Exception as e:
    logger.error(f"❌ Settings loading error: {e}")
    raise

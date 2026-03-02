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
    BOT_TOKEN: str = Field(
        default="8606991774:AAGoHuOW3OCpN9n03U0gxKv5eDB27br60OQ",
        description="Telegram bot token"
    )
    ADMIN_CHAT_ID: int = Field(
        default=-5247892173,
        description="Admin chat ID for notifications"
    )
    DATABASE_URL: str = Field(
        default="sqlite+aiosqlite:///poehali.db",
        description="Database URL"
    )
    WEB_APP_URL: str = Field(
        default="https://poehali-psi.vercel.app",
        description="Web App URL for Telegram"
    )

    class Config:
        env_file = str(ENV_FILE)
        env_file_encoding = "utf-8"
        extra = "ignore"  # Игнорируем лишние переменные окружения


try:
    settings = Settings()
    logger.info("✅ Settings loaded successfully")
    logger.info(f"DATABASE_URL: {settings.DATABASE_URL}")
    logger.info(f"WEB_APP_URL: {settings.WEB_APP_URL}")
except Exception as e:
    logger.error(f"❌ Settings loading error: {e}")
    # Создаём settings с дефолтными значениями
    settings = Settings()

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
    # Telegram
    BOT_TOKEN: str = Field(
        default="8606991774:AAGoHuOW3OCpN9n03U0gxKv5eDB27br60OQ",
        description="Telegram bot token"
    )
    ADMIN_CHAT_ID: int = Field(
        default=-5247892173,
        description="Admin chat ID for notifications"
    )
    
    # Database
    DATABASE_URL: str = Field(
        default="",
        description="Database URL"
    )
    
    # Web App
    WEB_APP_URL: str = Field(
        default="https://poehali.vercel.app",
        description="Web App URL for Telegram"
    )
    
    # Click Payment
    CLICK_MERCHANT_ID: str = Field(
        default="",
        description="Click merchant ID"
    )
    CLICK_SECRET_KEY: str = Field(
        default="",
        description="Click secret key"
    )
    
    # Payme Payment
    PAYME_MERCHANT_ID: str = Field(
        default="",
        description="Payme merchant ID"
    )
    PAYME_SECRET_KEY: str = Field(
        default="",
        description="Payme secret key"
    )

    class Config:
        env_file = str(ENV_FILE)
        env_file_encoding = "utf-8"
        extra = "ignore"  # Игнорируем лишние переменные окружения


try:
    settings = Settings()
    logger.info("✅ Settings loaded successfully")

    # Если DATABASE_URL пустой, используем SQLite с абсолютным путём
    if not settings.DATABASE_URL:
        # Для Vercel serverless используем /tmp директорию
        if os.getenv("VERCEL"):
            settings.DATABASE_URL = "sqlite+aiosqlite:///tmp/poehali.db"
            logger.info("Using SQLite in /tmp for Vercel")
        else:
            db_path = BASE_DIR / "poehali.db"
            settings.DATABASE_URL = f"sqlite+aiosqlite:///{db_path}"
            logger.info(f"Using local SQLite: {db_path}")

    logger.info(f"DATABASE_URL: {settings.DATABASE_URL}")
    logger.info(f"WEB_APP_URL: {settings.WEB_APP_URL}")
    logger.info(f"CLICK_MERCHANT_ID: {settings.CLICK_MERCHANT_ID or 'не настроен'}")
    logger.info(f"PAYME_MERCHANT_ID: {settings.PAYME_MERCHANT_ID or 'не настроен'}")
except Exception as e:
    logger.error(f"❌ Settings loading error: {e}")
    # Создаём settings с дефолтными значениями
    if os.getenv("VERCEL"):
        _db_url = "sqlite+aiosqlite:///tmp/poehali.db"
    else:
        _db_url = f"sqlite+aiosqlite:///{BASE_DIR}/poehali.db"

    settings = Settings(
        DATABASE_URL=_db_url
    )

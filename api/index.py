"""
Vercel Serverless Function Entry Point
"""
import logging
import sys
from pathlib import Path

# Настройка логирования
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Добавляем текущую директорию в path
current_dir = Path(__file__).parent
if str(current_dir) not in sys.path:
    sys.path.insert(0, str(current_dir))

logger.debug(f"Current dir: {current_dir}")
logger.debug(f"Sys.path: {sys.path}")

try:
    from app.main import app
    logger.info("✅ App imported successfully")
except Exception as e:
    logger.error(f"❌ Import error: {e}")
    raise

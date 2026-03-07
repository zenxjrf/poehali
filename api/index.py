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
logger.debug(f"Files in current dir: {list(current_dir.iterdir())}")
logger.debug(f"Files in app dir: {list((current_dir / 'app').iterdir()) if (current_dir / 'app').exists() else 'app dir not found'}")

try:
    from app.main import app as _app
    logger.info("✅ App imported successfully")
    # Явно присваиваем app для Vercel
    app = _app
except Exception as e:
    logger.error(f"❌ Import error: {e}", exc_info=True)
    raise

# Явный экспорт для Vercel
__all__ = ['app']

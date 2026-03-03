"""
Vercel Serverless Backend for Poehali
Telegram Bot + API
"""
import sys
from pathlib import Path

# Добавляем backend в path
backend_path = Path(__file__).parent / "backend" / "app"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

# Импортируем FastAPI приложение
from backend.app.main import app

# Экспортируем для Vercel
__all__ = ['app']

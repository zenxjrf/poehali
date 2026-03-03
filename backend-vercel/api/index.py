"""
Vercel Serverless Backend for Poehali
Telegram Bot + API
"""
import sys
from pathlib import Path

# Добавляем app в path
app_path = Path(__file__).parent / ".." / "app"
if str(app_path) not in sys.path:
    sys.path.insert(0, str(app_path))

# Импортируем FastAPI приложение
from app.main import app

# Экспортируем для Vercel
__all__ = ['app']

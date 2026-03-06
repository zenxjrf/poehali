"""
Vercel Serverless Backend for Poehali
Telegram Bot + API
"""
import sys
from pathlib import Path

# Добавляем backend-vercel в path для импортов
backend_path = Path(__file__).parent.parent
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

# Импортируем FastAPI приложение
from app.main import app

# Экспортируем для Vercel
__version__ = "3.0"

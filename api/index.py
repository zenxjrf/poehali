"""
Vercel Serverless Function Entry Point
Этот файл позволяет запускать FastAPI приложение на Vercel
"""
import sys
from pathlib import Path

# Добавляем backend-vercel в path для импортов
root_path = Path(__file__).parent.parent
backend_path = root_path / "backend-vercel"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

# Импортируем FastAPI приложение используя абсолютные импорты
from app.main import app

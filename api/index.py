"""
Vercel Serverless Function Entry Point
Этот файл позволяет запускать FastAPI приложение на Vercel
"""
import sys
from pathlib import Path

# Добавляем backend-vercel/app в path для импортов
root_path = Path(__file__).parent.parent
backend_app_path = root_path / "backend-vercel" / "app"
if str(backend_app_path) not in sys.path:
    sys.path.insert(0, str(backend_app_path))

# Импортируем FastAPI приложение
from main import app

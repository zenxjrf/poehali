"""
Vercel Serverless Function Entry Point
Этот файл позволяет запускать FastAPI приложение на Vercel
"""
import sys
from pathlib import Path

# Добавляем backend в path для импортов
backend_path = Path(__file__).parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

# Также добавляем корень проекта для надёжности
root_path = Path(__file__).parent
if str(root_path) not in sys.path:
    sys.path.insert(0, str(root_path))

# Импортируем FastAPI приложение
from app.main import app

# Экспортируем app для Vercel
# Vercel автоматически распознаёт FastAPI приложения

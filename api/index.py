"""
Vercel Serverless Function Entry Point
Этот файл позволяет запускать FastAPI приложение на Vercel
"""
import sys
from pathlib import Path

# Добавляем корень проекта в path для импортов
root_path = Path(__file__).parent.parent
if str(root_path) not in sys.path:
    sys.path.insert(0, str(root_path))

# Добавляем backend в path
backend_path = root_path / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

# Импортируем FastAPI приложение
from backend.app.main import app

# Экспортируем app для Vercel
# Vercel автоматически распознаёт FastAPI приложения

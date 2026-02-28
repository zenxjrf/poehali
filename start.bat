@echo off
chcp 65001 >nul
echo ========================================
echo   Poehali - Проверка и запуск
echo ========================================
echo.

REM Проверка Python
echo [1/5] Проверка Python...
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ОШИБКА: Python не найден. Установите Python 3.11+
    echo    Скачать: https://www.python.org/downloads/
    pause
    exit /b 1
)
echo ✅ Python найден
python --version
echo.

REM Проверка Node.js
echo [2/5] Проверка Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ОШИБКА: Node.js не найден. Установите Node.js 18+
    echo    Скачать: https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js найден
node --version
echo.

REM Проверка .env файлов
echo [3/5] Проверка конфигурации...
if not exist backend\.env (
    echo ⚠️ Файл backend\.env не найден. Копируем из .env.example...
    copy backend\.env.example backend\.env
    echo ⚠️ ВНИМАНИЕ: Заполните backend\.env перед запуском!
    echo    - BOT_TOKEN (уже указан)
    echo    - ADMIN_CHAT_ID (узнайте у @userinfobot)
    echo    - DATABASE_URL (укажите пароль PostgreSQL)
)
if not exist frontend\.env (
    echo ⚠️ Файл frontend\.env не найден. Копируем из .env.example...
    copy frontend\.env.example frontend\.env
)
echo ✅ Конфигурация проверена
echo.

REM Проверка PostgreSQL
echo [4/5] Проверка PostgreSQL...
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ PostgreSQL не найден в PATH
    echo    Если PostgreSQL установлен, добавьте его в PATH
    echo    Или проверьте backend\.env (DATABASE_URL)
) else (
    echo ✅ PostgreSQL найден
    psql --version
)
echo.

REM Запуск backend
echo [5/5] Запуск сервисов...
cd backend
if not exist venv (
    echo Создание виртуального окружения...
    python -m venv venv
)
call venv\Scripts\activate.bat
echo Установка зависимостей...
pip install -r requirements.txt -q
echo Инициализация БД...
python seed_db.py
echo.
echo Запуск Backend на порту 8000...
start "Poehali Backend" cmd /k "uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
cd ..
echo ✅ Backend запущен
echo.

REM Запуск frontend
cd frontend
if not exist node_modules (
    echo Установка зависимостей npm...
    call npm install
)
echo Запуск Frontend на порту 5173...
start "Poehali Frontend" cmd /k "npm run dev"
cd ..
echo ✅ Frontend запущен
echo.

echo ========================================
echo   🎉 Завершено!
echo ========================================
echo.
echo 📱 URLs:
echo    Frontend: http://localhost:5173
echo    Backend API: http://localhost:8000
echo    API Docs: http://localhost:8000/docs
echo    Health Check: http://localhost:8000/health
echo.
echo 🔧 Telegram Bot:
echo    Токен: 8606991774:AAGoHuOW3OCpN9n03U0gxKv5eDB27br60OQ
echo    Узнайте ADMIN_CHAT_ID: https://t.me/userinfobot
echo.
echo 📋 Для остановки закройте окна терминалов
echo.
echo 📖 Полная документация: README.md
echo 📋 Отчёт о проверке: CHECK_REPORT.md
echo.
pause

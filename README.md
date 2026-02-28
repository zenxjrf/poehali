# 🚕 Poehali — Сервис поездок Ташкент ↔ Фергана

Telegram Web App для заказа междугородних поездок с фиксированной стоимостью.

## 📋 Функционал MVP

- **Главный экран** — стоимость поездки, выбор направления
- **Каталог водителей** — фото, авто, стаж, иконки удобств (❄️ кондиционер, 🧳 багажник, 🐾 животные)
- **Форма заявки** — имя, телефон, удобное время, количество пассажиров, комментарий
- **Telegram бот** — запуск Web App, уведомления менеджеру
- **Мультиязычность** — русский и узбекский языки (переключение с сохранением в localStorage)
- **Preloader** — анимация загрузки при старте приложения
- **Кнопки связи** — «Позвонить» и «Написать диспетчеру»

## 🛠 Технологический стек

**Backend:**
- Python 3.11+
- FastAPI — REST API
- Aiogram 3.x — Telegram бот
- SQLAlchemy (async) — работа с БД
- PostgreSQL — база данных

**Frontend:**
- React 18
- Vite — сборка
- Tailwind CSS — стилизация
- Telegram Web App SDK

## 📁 Структура проекта

```
Poehali/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── routes.py       # API endpoints
│   │   ├── bot/
│   │   │   ├── __init__.py
│   │   │   └── bot.py          # Telegram бот
│   │   ├── models/
│   │   │   └── __init__.py     # SQLAlchemy модели
│   │   ├── schemas/
│   │   │   └── __init__.py     # Pydantic схемы
│   │   ├── database.py         # Подключение к БД
│   │   ├── config.py           # Конфигурация
│   │   └── main.py             # Точка входа FastAPI
│   ├── seed_db.py              # Скрипт заполнения БД
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── locales/
│   │   │   ├── ru.json         # Русский язык
│   │   │   └── uz.json         # Узбекский язык
│   │   ├── components/
│   │   ├── App.jsx             # Главный компонент
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── .env
├── render.yaml                 # Конфигурация для Render
├── runtime.txt
└── README.md
```

## 🚀 Быстрый старт (локальное тестирование)

### 1. Подготовка

**Требуется:**
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+

### 2. Настройка базы данных

Создайте базу данных PostgreSQL:

```sql
CREATE DATABASE poehali_db;
```

### 3. Настройка Backend

```bash
cd backend

# Создание виртуального окружения
python -m venv venv

# Активация (Windows)
venv\Scripts\activate

# Активация (Linux/Mac)
# source venv/bin/activate

# Установка зависимостей
pip install -r requirements.txt

# Копирование .env (если нет)
copy .env.example .env  # Windows
# cp .env.example .env  # Linux/Mac
```

**Заполните `.env` в backend:**

```env
# Telegram Bot (токен уже указан)
BOT_TOKEN=8606991774:AAGoHuOW3OCpN9n03U0gxKv5eDB27br60OQ
ADMIN_CHAT_ID=ваш_chat_id  # Узнайте у @userinfobot

# Database
DATABASE_URL=postgresql+asyncpg://postgres:ваш_пароль@localhost:5432/poehali_db

# Web App URL
WEB_APP_URL=http://localhost:5173
```

**Заполнение БД тестовыми данными:**

```bash
python seed_db.py
```

**Запуск сервера:**

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API доступно по адресу: `http://localhost:8000`
Документация API: `http://localhost:8000/docs`

### 4. Настройка Frontend

Откройте **новый терминал**:

```bash
cd frontend

# Установка зависимостей
npm install

# Запуск dev-сервера
npm run dev
```

Web App доступно по адресу: `http://localhost:5173`

### 5. Настройка Telegram бота

1. Токен бота уже настроен в `.env`
2. Узнайте свой Chat ID через [@userinfobot](https://t.me/userinfobot)
3. Вставьте ADMIN_CHAT_ID в `backend/.env`
4. Перезапустите backend

**Проверка:**
- Откройте Telegram
- Найдите вашего бота (созданного с токеном)
- Нажмите `/start`
- Нажмите кнопку "🚕 Открыть меню"

## 🔌 API Endpoints

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/v1/drivers` | Список всех водителей |
| GET | `/api/v1/drivers/{id}` | Информация о водителе |
| GET | `/api/v1/trips` | Список направлений |
| GET | `/api/v1/trips/{direction}` | Информация о направлении |
| POST | `/api/v1/orders` | Создание заявки |
| GET | `/api/v1/orders` | Список всех заявок |
| PUT | `/api/v1/orders/{id}` | Обновление статуса заявки |

## 🌐 Деплой на Render

### Backend (Web Service)

1. Создайте новый **Web Service** на [Render](https://render.com)
2. Подключите ваш GitHub репозиторий
3. Настройки:
   - **Name:** `poehali-backend`
   - **Region:** Frankfurt
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

4. Добавьте переменные окружения:
   ```
   BOT_TOKEN=8606991774:AAGoHuOW3OCpN9n03U0gxKv5eDB27br60OQ
   ADMIN_CHAT_ID=ваш_chat_id
   DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/poehali
   WEB_APP_URL=https://your-frontend-url.onrender.com
   ```

5. Создайте PostgreSQL базу через Render (Database)
6. Скопируйте External Connection URL в DATABASE_URL

### Frontend (Static Site)

1. Создайте новый **Static Site** на Render
2. Подключите репозиторий
3. Настройки:
   - **Name:** `poehali-webapp`
   - **Branch:** `main`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`

4. Добавьте переменные окружения:
   ```
   VITE_API_URL=https://poehali-backend.onrender.com/api/v1
   VITE_DISPATCHER_USERNAME=admin
   ```

5. После деплоя обновите WEB_APP_URL в backend

## 📱 Как использовать

1. Пользователь открывает бота в Telegram
2. Нажимает кнопку "🚕 Открыть меню"
3. Выбирает направление (Ташкент → Фергана или обратно)
4. Смотрит доступных водителей с иконками удобств
5. Оставляет заявку (имя, телефон, время звонка, пассажиры)
6. Менеджер получает уведомление в Telegram
7. Менеджер звонит клиенту

## 🌙 Языки

- **Русский (ru)** — по умолчанию
- **Узбекский (uz)** — переключение кнопкой RU/UZ

Язык сохраняется в `localStorage` и восстанавливается при следующем запуске.

## 📝 Планы развития

- [ ] Онлайн-оплата (Click, Payme)
- [ ] Личный кабинет водителя
- [ ] Рейтинг и отзывы
- [ ] История поездок пользователя
- [ ] Геолокация и отслеживание
- [ ] Чат с водителем
- [ ] Автоматическое распределение заказов

## 🔧 Troubleshooting

**Ошибка подключения к БД:**
```bash
# Проверьте DATABASE_URL в .env
# Убедитесь, что PostgreSQL запущен
```

**Бот не отвечает:**
```bash
# Проверьте BOT_TOKEN в .env
# Проверьте ADMIN_CHAT_ID (должен быть числом)
```

**Frontend не загружается:**
```bash
cd frontend
npm install
npm run dev
```

## 📄 Лицензия

MIT

---

**Poehali** — быстро, комфортно, надёжно! 🚕

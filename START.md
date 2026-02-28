# 🚀 Poehali — Инструкция по запуску

## ✅ Реализованные функции

### MVP функционал:
- ✅ Фиксированная стоимость поездки (250 000 сум)
- ✅ Выбор направления (Ташкент ↔ Фергана)
- ✅ Каталог водителей с фото и описанием
- ✅ Форма заявки с автоподстановкой из Telegram

### Новые функции:
- ✅ **Автоподстановка телефона** из Telegram (если доступно)
- ✅ **Поле «Удобное время для звонка»**
- ✅ **Поле «Количество пассажиров»** (1-6)
- ✅ **Иконки удобств** в карточке водителя:
  - ❄️ Кондиционер
  - 🧳 Большой багажник
  - 🐾 Можно с животными
- ✅ **Кнопка «Позвонить»** — открывает набор номера
- ✅ **Кнопка «Написать»** — чат с диспетчером в Telegram
- ✅ **Preloader** — 1.5 секунды с анимацией
- ✅ **Переключатель языков** RU/UZ с сохранением в localStorage

---

## 📋 Быстрый старт (Windows)

### Вариант 1: Автоматический запуск

1. Установите **PostgreSQL** (см. `POSTGRES_SETUP.md`)
2. Запустите `start.bat`
3. Откройте браузер: `http://localhost:5173`

### Вариант 2: Ручной запуск

#### Шаг 1: База данных

```bash
# Создайте базу данных PostgreSQL
# Имя: poehali_db
# Пользователь: postgres
# Пароль: ваш_пароль
```

#### Шаг 2: Backend

```bash
cd backend

# Создание venv
python -m venv venv
venv\Scripts\activate

# Установка зависимостей
pip install -r requirements.txt

# Настройка .env
# Откройте backend/.env и укажите:
# - DATABASE_URL (ваш пароль PostgreSQL)
# - ADMIN_CHAT_ID (ваш chat_id из @userinfobot)

# Заполнение БД
python seed_db.py

# Запуск сервера
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Шаг 3: Frontend (новый терминал)

```bash
cd frontend

# Установка зависимостей
npm install

# Запуск dev-сервера
npm run dev
```

---

## 🔗 URLs после запуска

| Сервис | URL |
|--------|-----|
| Frontend (Web App) | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Документация | http://localhost:8000/docs |
| Health Check | http://localhost:8000/health |

---

## 📱 Проверка работы

### 1. Проверка Frontend

1. Откройте `http://localhost:5173`
2. Должен появиться preloader (1.5 сек)
3. Проверьте переключение языков (RU/UZ)
4. Выберите направление
5. Откройте каталог водителей
6. Проверьте иконки удобств (❄️🧳🐾)
7. Откройте форму заявки
8. Проверьте поля: имя, телефон, время, пассажиры

### 2. Проверка Backend

1. Откройте `http://localhost:8000/docs`
2. Проверьте GET `/api/v1/drivers` — должен вернуть 5 водителей
3. Проверьте GET `/api/v1/trips` — должен вернуть 2 направления

### 3. Проверка Telegram бота

1. Найдите бота в Telegram (создан с токеном)
2. Нажмите `/start`
3. Должны появиться кнопки:
   - 🚕 Открыть меню
   - 📞 Позвонить
   - 💬 Написать
4. Нажмите "Открыть меню" — должно открыться Web App

---

## 🔧 Деплой на Render

### Backend

1. Создайте **Web Service** на Render
2. Подключите репозиторий
3. Настройки:
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

4. Переменные окружения:
   ```
   BOT_TOKEN=8606991774:AAGoHuOW3OCpN9n03U0gxKv5eDB27br60OQ
   ADMIN_CHAT_ID=ваш_chat_id
   DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/poehali
   WEB_APP_URL=https://your-frontend-url.onrender.com
   ```

5. Создайте **PostgreSQL** базу на Render
6. Скопируйте External Connection URL в `DATABASE_URL`

### Frontend

1. Создайте **Static Site** на Render
2. Подключите репозиторий
3. Настройки:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`

4. Переменные окружения:
   ```
   VITE_API_URL=https://poehali-backend.onrender.com/api/v1
   VITE_DISPATCHER_USERNAME=admin
   ```

---

## 🐛 Troubleshooting

### Ошибка: "Python не найден"
- Установите Python 3.11+ с python.org
- Перезапустите терминал

### Ошибка: "Node.js не найден"
- Установите Node.js 18+ с nodejs.org
- Перезапустите терминал

### Ошибка подключения к БД
- Проверьте, что PostgreSQL запущен
- Проверьте пароль в `DATABASE_URL`
- Убедитесь, что база `poehali_db` существует

### Бот не отвечает
- Проверьте `BOT_TOKEN` в `.env`
- Проверьте `ADMIN_CHAT_ID` (должен быть числом)
- Узнайте chat_id через @userinfobot

### Frontend не загружается
```bash
cd frontend
rm -rf node_modules
npm install
npm run dev
```

---

## 📞 Контакты

- Токен бота: `8606991774:AAGoHuOW3OCpN9n03U0gxKv5eDB27br60OQ`
- Диспетчер: `@admin` (заменить на реальный)

---

**Готово к запуску! 🚕**

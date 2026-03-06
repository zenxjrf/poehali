# 🚀 Poehali Bot v2.3 — Changelog

## Что нового в версии 2.3

### 🔧 Исправления багов

| Баг | Статус | Описание |
|-----|--------|----------|
| Бот не отвечал на /start | ✅ Исправлено | Добавлена правильная инициализация бота через `get_bot()` + `init_bot()` |
| Ошибки импортов | ✅ Исправлено | Все импорты изменены на `backend.app.bot.bot` |
| Дублирование кода | ✅ Исправлено | Убрано дублирование в `run_bot.py` |

### ⚡ Оптимизации

1. **Кэширование клавиатур** — используется `@lru_cache(maxsize=1)`
2. **Фабрика клавиатур** — 3 метода для разных типов клавиатур
3. **Middleware** — логирование, throttling, проверка админа
4. **Специфичные исключения** — `TelegramAPIError` вместо общего `Exception`

### 🆕 Новые функции

| Команда | Описание |
|---------|----------|
| `/start` | Приветственное сообщение + главная клавиатура |
| `/help` | Справка по всем командам |
| `/faq` | Часто задаваемые вопросы |
| `/status` | Проверка статуса заказа |
| `/admin` | Админ-панель (только для админа) |

### 📁 Новые файлы

```
backend/app/bot/
├── states.py          # FSM состояния для форм
├── middleware.py      # Middleware (логирование, throttling, admin)
└── utils.py           # Утилиты (форматирование, валидация)
```

### 🔌 Новые API endpoints

| Endpoint | Метод | Описание |
|----------|-------|----------|
| `/webhook/setup` | POST | Установка Telegram webhook |
| `/webhook/info` | GET | Информация о текущем webhook |
| `/webhook/telegram` | POST | Обработка сообщений от Telegram |
| `/webhook/order` | POST | Получение заказов из Web App |

---

## 🛠 Как запустить

### Локальная разработка (polling)

```bash
cd backend

# Активация виртуального окружения
venv\Scripts\activate  # Windows
# source venv/bin/bin  # Linux/Mac

# Запуск бота
python run_bot.py
```

### Serverless (Vercel)

```bash
# 1. Установите webhook (один раз)
curl -X POST https://your-project.vercel.app/webhook/setup

# 2. Проверьте webhook
curl https://your-project.vercel.app/webhook/info
```

### Проверка бота

1. Откройте Telegram
2. Найдите вашего бота
3. Нажмите `/start`
4. Должно появиться приветственное сообщение с кнопками

---

## 📊 Структура проекта

```
Poehali/
├── backend/
│   ├── app/
│   │   ├── bot/
│   │   │   ├── __init__.py       # Экспорты
│   │   │   ├── bot.py            # Хендлеры бота (v2.3)
│   │   │   ├── states.py         # FSM состояния ✨
│   │   │   ├── middleware.py     # Middleware ✨
│   │   │   └── utils.py          # Утилиты ✨
│   │   ├── api/
│   │   │   └── routes.py         # API endpoints
│   │   ├── main.py               # FastAPI приложение
│   │   ├── config.py             # Настройки
│   │   ├── database.py           # База данных
│   │   └── models/               # SQLAlchemy модели
│   ├── run_bot.py                # Запуск polling
│   └── requirements.txt
├── frontend/                     # React Web App
├── IMPROVEMENTS.md              # Предложения по улучшению
└── README.md
```

---

## 🔐 Переменные окружения

```env
# Telegram Bot
BOT_TOKEN=8606991774:AAGoHuOW3OCpN9n03U0gxKv5eDB27br60OQ
ADMIN_CHAT_ID=-5247892173

# Database
DATABASE_URL=sqlite+aiosqlite:///poehali.db

# Web App
WEB_APP_URL=https://poehali.vercel.app

# Vercel (для serverless)
VERCEL_URL=your-project.vercel.app
WEBHOOK_URL=your-project.vercel.app
```

---

## 🧪 Тестирование

### Проверка команды /start

```bash
# Отправьте сообщение боту через API
curl -X POST "https://api.telegram.org/bot<TOKEN>/sendMessage" \
  -d "chat_id=<YOUR_CHAT_ID>&text=/start"
```

### Проверка webhook

```bash
# Получить информацию о webhook
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

---

## 📝 Changelog

### v2.3 (Март 2026)
- ✅ Исправлен баг с /start
- ✅ Добавлены команды /help, /faq, /status, /admin
- ✅ Оптимизировано кэширование клавиатур
- ✅ Добавлены middleware
- ✅ Добавлены утилиты
- ✅ Обработка геолокации

### v2.2 (Февраль 2026)
- Serverless режим для Vercel
- Webhook для Telegram
- FastAPI + Aiogram

### v2.1 (Январь 2026)
- Web App интеграция
- Форма заказа
- Уведомления админу

### v2.0 (Декабрь 2025)
- MVP версия
- Базовый функционал

---

## 🤝 Поддержка

По вопросам и предложениям:
- Telegram: @abdurasulovb
- Email: support@poehali.uz

---

**Poehali** — быстро, комфортно, надёжно! 🚕

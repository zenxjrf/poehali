# ⚡ Quick Start — Быстрый старт Poehali Bot v2.3

## 🚀 Запуск за 5 минут

### Шаг 1: Установка зависимостей

```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend (опционально)
cd ../frontend
npm install
```

### Шаг 2: Настройка переменных окружения

Создайте файл `backend/.env`:

```env
# Telegram Bot (уже настроен)
BOT_TOKEN=8606991774:AAGoHuOW3OCpN9n03U0gxKv5eDB27br60OQ
ADMIN_CHAT_ID=-5247892173

# Database
DATABASE_URL=sqlite+aiosqlite:///poehali.db

# Web App
WEB_APP_URL=https://poehali.vercel.app
```

### Шаг 3: Запуск бота (локально)

```bash
cd backend
python run_bot.py
```

### Шаг 4: Проверка

1. Откройте Telegram
2. Найдите вашего бота
3. Нажмите `/start`
4. Должно появиться приветственное сообщение

---

## 🌐 Деплой на Vercel

### Шаг 1: Подготовка

```bash
# Установите Vercel CLI
npm i -g vercel

# Авторизуйтесь
vercel login
```

### Шаг 2: Деплой

```bash
cd backend-vercel
vercel --prod
```

### Шаг 3: Установка webhook

```bash
# После деплоя установите webhook
curl -X POST https://your-project.vercel.app/webhook/setup
```

### Шаг 4: Проверка webhook

```bash
curl https://your-project.vercel.app/webhook/info
```

---

## 🧪 Тестирование

### Тест команды /start

```bash
# Откройте Telegram и отправьте боту:
/start

# Ожидаемый ответ:
# 👋 Здравствуйте!
# Я бот сервиса Поехали 🚕
# 💰 Стоимость поездки: 150 000 сум
# 📦 Посылки: от 60 000 сум
# [🚕 Открыть меню] [📞 Позвонить] [💬 Написать]
```

### Тест команды /help

```bash
/help

# Ожидаемый ответ:
# 📚 Команды бота:
# /start - Запустить бота
# /help - Показать эту справку
# /status - Статус вашего заказа
# /faq - Часто задаваемые вопросы
```

### Тест команды /faq

```bash
/faq

# Ожидаемый ответ:
# ❓ Часто задаваемые вопросы:
# 🚗 Как заказать такси?
# 💰 Как оплачивать?
# ...
```

---

## 🔧 Troubleshooting

### Бот не отвечает на /start

**Решение:**
```bash
# Проверьте BOT_TOKEN
echo $BOT_TOKEN

# Перезапустите бота
python run_bot.py

# Проверьте логи
# Должно быть: "📨 /start от <user_id>"
```

### Ошибка импорта

**Решение:**
```bash
# Убедитесь, что запускаете из корня проекта
cd C:\Users\PC 2\Downloads\PycharmProjects\Poehali

# Проверьте PYTHONPATH
export PYTHONPATH=$PYTHONPATH:$(pwd)
```

### Webhook не работает

**Решение:**
```bash
# Проверьте webhook
curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo

# Перенастройте webhook
curl -X POST https://your-project.vercel.app/webhook/setup
```

---

## 📚 Полезные команды

### Проверка статуса бота

```bash
# Логи бота
tail -f logs/bot.log

# Статус процесса
ps aux | grep python
```

### Перезапуск бота

```bash
# Остановить
pkill -f run_bot.py

# Запустить
cd backend && python run_bot.py
```

### Очистка кэша

```bash
# Очистить __pycache__
find . -type d -name __pycache__ -exec rm -rf {} +

# Очистить .pyc
find . -type f -name "*.pyc" -delete
```

---

## 📞 Поддержка

- Telegram: @abdurasulovb
- Email: support@poehali.uz
- Документация: [WORK_SUMMARY.md](WORK_SUMMARY.md)

---

**Poehali** — быстро, комфортно, надёжно! 🚕

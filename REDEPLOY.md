# 🔄 Редизлой на Vercel

## Автоматический деплой

Vercel автоматически обнаружит изменения в GitHub и запустит деплой.

### Статус деплоя

Проверить статус деплоя можно:
1. В [Vercel Dashboard](https://vercel.com/dashboard)
2. По ссылке: `https://vercel.com/your-project`

### Логи деплоя

```bash
# Установка Vercel CLI
npm i -g vercel

# Авторизация
vercel login

# Просмотр логов
vercel logs --follow
```

---

## Ручной триггер деплоя

Если автоматический деплой не сработал:

### Вариант 1: Через Vercel Dashboard

1. Откройте [Vercel Dashboard](https://vercel.com/dashboard)
2. Найдите ваш проект
3. Нажмите "Redeploy"

### Вариант 2: Через CLI

```bash
cd backend-vercel
vercel --prod
```

---

## После деплоя

### 1. Проверка API

```bash
# Главная страница
curl https://poehali-backend.vercel.app/

# Health check
curl https://poehali-backend.vercel.app/health

# Статистика
curl https://poehali-backend.vercel.app/api/v1/stats/dashboard
```

### 2. Проверка бота

Откройте бота в Telegram:
- `/start` — приветствие
- `/help` — справка
- `/myorders` — история заказов
- `/faq` — FAQ

### 3. Миграция БД

После деплоя выполните миграцию базы данных:

```bash
# Через API endpoint (добавьте в main.py временно)
curl -X POST https://poehali-backend.vercel.app/migrate
```

Или через Vercel Functions:

```bash
# Создайте файл backend-vercel/api/migrate.py
from app.migrate_db import migrate_db
import asyncio

async def main(request):
    asyncio.run(migrate_db())
    return {"status": "success"}
```

### 4. Проверка webhook

```bash
# Проверка текущего webhook
curl "https://api.telegram.org/bot8606991774:AAGoHuOW3OCpN9n03U0gxKv5eDB27br60OQ/getWebhookInfo"

# Если webhook не установлен или неверный
curl -X POST "https://api.telegram.org/bot8606991774:AAGoHuOW3OCpN9n03U0gxKv5eDB27br60OQ/setWebhook?url=https://poehali-backend.vercel.app/webhook/telegram"
```

---

## Переменные окружения

Убедитесь, что в Vercel настроены следующие переменные:

```
# Telegram
BOT_TOKEN=8606991774:AAGoHuOW3OCpN9n03U0gxKv5eDB27br60OQ
ADMIN_CHAT_ID=-5247892173

# Database
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/poehali
# или для SQLite:
DATABASE_URL=sqlite+aiosqlite:///tmp/poehali.db

# Web App
WEB_APP_URL=https://poehali.vercel.app

# Платежи (опционально)
CLICK_MERCHANT_ID=...
CLICK_SECRET_KEY=...
PAYME_MERCHANT_ID=...
PAYME_SECRET_KEY=...
```

---

## Troubleshooting

### Деплой не удался

1. Проверьте логи в Vercel Dashboard
2. Убедитесь, что все зависимости в requirements.txt
3. Проверьте переменные окружения

### Бот не отвечает

1. Проверьте webhook: `/webhook/info`
2. Проверьте BOT_TOKEN
3. Проверьте логи бота

### Ошибки базы данных

1. Выполните миграцию: `python migrate_db.py`
2. Проверьте DATABASE_URL
3. Убедитесь, что БД доступна

---

## Финальная проверка

- [ ] Деплой успешен
- [ ] API отвечает (`/health`)
- [ ] Бот отвечает на `/start`
- [ ] Миграция БД выполнена
- [ ] Webhook установлен
- [ ] История заказов работает (`/myorders`)
- [ ] Статистика доступна (`/api/v1/stats/dashboard`)

---

**Готово!** 🎉

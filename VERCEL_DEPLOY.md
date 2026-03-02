# 🚀 VERCEL DEPLOYMENT GUIDE

## ⚠️ Критические изменения для работы на Vercel

Этот проект был обновлён для работы в serverless-режиме на Vercel. Ниже описаны все изменения и инструкция по деплою.

---

## 📋 Изменения в коде

### 1. **Telegram бот переведён на webhook**
- ❌ Удалён `start_polling()` — не работает в serverless
- ✅ Добавлен `/webhook/telegram` endpoint для обработки обновлений
- ✅ Бот инициализируется только при получении запроса

### 2. **Оптимизация базы данных**
- ✅ SQLite по умолчанию для serverless
- ✅ PostgreSQL с уменьшенным pool (2 соединения) для Vercel
- ✅ Отключён `pool_pre_ping` для экономии ресурсов

### 3. **Конфигурация с fallback значениями**
- ✅ Все переменные окружения имеют дефолтные значения
- ✅ Приложение запускается даже без `.env` файла

### 4. **Vercel конфигурация**
- ✅ Обновлён `vercel.json` с маршрутизацией
- ✅ Создан `backend/api/index.py` как entry point

---

## 🔧 Инструкция по деплою на Vercel

### Шаг 1: Подготовка аккаунта Vercel

1. Перейдите на https://vercel.com
2. Войдите через GitHub
3. Установите Vercel CLI (опционально):
   ```bash
   npm install -g vercel
   ```

### Шаг 2: Настройка проекта

1. Импортируйте репозиторий в Vercel Dashboard
2. Выберите корневую директорию: **root** (не backend!)

### Шаг 3: Переменные окружения

Добавьте в Vercel → Settings → Environment Variables:

| Key | Value | Пример |
|-----|-------|--------|
| `BOT_TOKEN` | Токен Telegram бота | `8606991774:AAG...` |
| `ADMIN_CHAT_ID` | ID чата для уведомлений | `-5247892173` |
| `DATABASE_URL` | URL базы данных | `sqlite+aiosqlite:///poehali.db` |
| `WEB_APP_URL` | URL фронтенда | `https://poehali.vercel.app` |
| `VERCEL_URL` | Автоматически устанавливается Vercel | `poehali.vercel.app` |

### Шаг 4: Настройка базы данных

#### Вариант A: SQLite (рекомендуется для MVP)
```
DATABASE_URL=sqlite+aiosqlite:///poehali.db
```
✅ Преимущества:
- Работает сразу без настройки
- Бесплатно
- Не требует внешнего сервиса

❌ Ограничения:
- Данные хранятся локально на Vercel
- Могут быть потеряны при редиплое

#### Вариант B: PostgreSQL (для production)
1. Создайте PostgreSQL на https://neon.tech или https://supabase.com
2. Скопируйте connection string
3. Установите:
   ```
   DATABASE_URL=postgresql+asyncpg://user:pass@host/dbname
   ```

### Шаг 5: Деплой

```bash
# Через CLI
vercel --prod

# Или через Git
git push origin main
```

### Шаг 6: Настройка Telegram webhook

После деплоя установите webhook вручную:

```bash
# Замените YOUR_VERCEL_URL на ваш домен
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://YOUR_VERCEL_URL/webhook/telegram"
```

Проверьте установку:
```bash
curl "https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo"
```

---

## 🧪 Проверка работы

### 1. Проверка API
```bash
curl https://YOUR_VERCEL_URL/health
# Ожидаемый ответ: {"status":"healthy"}
```

### 2. Проверка webhook
```bash
curl https://YOUR_VERCEL_URL/webhook/telegram -X POST -H "Content-Type: application/json" -d '{"update_id":1}'
# Ожидаемый ответ: {"status":"ok"}
```

### 3. Проверка бота
1. Откройте Telegram
2. Найдите бота
3. Нажмите `/start`
4. Должна появиться кнопка "🚕 Открыть меню"

---

## 🐛 Troubleshooting

### Бот не отвечает на команды

**Проблема:** Webhook не установлен

**Решение:**
```bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://YOUR_VERCEL_URL/webhook/telegram"
```

### Ошибка "Settings loading error"

**Проблема:** Не настроены переменные окружения

**Решение:** Проверьте Vercel → Settings → Environment Variables

### База данных не подключается

**Проблема:** Неправильный DATABASE_URL

**Решение:** Используйте SQLite для тестирования:
```
DATABASE_URL=sqlite+aiosqlite:///poehali.db
```

### Ошибка импорта модулей

**Проблема:** Неправильная структура путей

**Решение:** Убедитесь, что `backend/api/index.py` существует

---

## 📁 Структура для Vercel

```
Poehali/
├── backend/
│   ├── api/
│   │   └── index.py          # Vercel entry point ⭐
│   ├── app/
│   │   ├── main.py           # FastAPI приложение
│   │   ├── bot/
│   │   │   └── bot.py        # Бот с webhook ⭐
│   │   ├── config.py         # Конфиг с fallback ⭐
│   │   └── database.py       # DB с serverless settings ⭐
│   └── requirements.txt
├── frontend/
│   └── ...
├── vercel.json               # Конфигурация маршрутов ⭐
└── ...
```

---

## 🔐 Безопасность

### Спрячьте токен бота
- ❌ Не коммитьте `.env` в Git
- ✅ Добавьте `.env` в `.gitignore`
- ✅ Используйте Vercel Environment Variables

### Обновите токен если утекл
1. @BotFather в Telegram
2. Revoke token
3. Обновите в Vercel

---

## 📊 Мониторинг

### Логи Vercel
```bash
vercel logs YOUR_VERCEL_URL
```

### Real-time логи
```bash
vercel logs --follow YOUR_VERCEL_URL
```

### Статус webhook
```bash
curl "https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo"
```

---

## 🔄 Автоматический деплой

После настройки:
1. Каждый `git push` в `main` запускает деплой
2. Vercel автоматически обновляет функции
3. Webhook остаётся активным

---

## ⚡ Serverless ограничения

| Параметр | Лимит |
|----------|-------|
| Макс. время выполнения | 10 сек (Hobby) |
| Макс. размер body | 6 MB |
| Память | 1024 MB |

**Важно:** Telegram webhook должен отвечать быстро. Если обработка занимает >10 сек, используйте фоновые задачи.

---

## 📞 Поддержка

- Vercel Docs: https://vercel.com/docs
- Aiogram Serverless: https://docs.aiogram.dev
- Telegram Bot API: https://core.telegram.org/bots/api

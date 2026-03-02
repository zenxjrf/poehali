# ✅ ЧЕКЛИСТ ПРОВЕРКИ VERCEL

## Быстрая проверка перед деплоем

### 1. Структура файлов
```bash
# Проверьте, что все файлы существуют
ls backend/api/index.py
ls backend/app/main.py
ls backend/app/bot/bot.py
ls backend/app/config.py
ls backend/app/database.py
ls vercel.json
```

### 2. Проверка синтаксиса Python
```bash
cd backend
python -m py_compile app/main.py
python -m py_compile app/bot/bot.py
python -m py_compile app/config.py
python -m py_compile app/database.py
python -m py_compile api/index.py
```

### 3. Локальное тестирование
```bash
# Запуск FastAPI (без бота)
cd backend
uvicorn app.main:app --reload

# Проверка endpoints
curl http://localhost:8000/health
curl http://localhost:8000/api/v1/trips
```

### 4. Проверка .gitignore
Убедитесь, что эти файлы НЕ в git:
- `.env`
- `*.pyc`
- `__pycache__/`
- `.venv/`
- `*.db` (SQLite файлы)

---

## 🚀 Деплой

### Команда для деплоя
```bash
vercel --prod
```

### После деплоя

1. **Проверьте логи:**
   ```bash
   vercel logs --follow
   ```

2. **Установите webhook:**
   ```bash
   curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://<YOUR_VERCEL_URL>/webhook/telegram"
   ```

3. **Проверьте webhook:**
   ```bash
   curl "https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo"
   ```

---

## 🧪 Тестирование

### API
```bash
# Health check
curl https://<YOUR_VERCEL_URL>/health

# API status
curl https://<YOUR_VERCEL_URL>/api/v1/status

# Webhook test
curl -X POST https://<YOUR_VERCEL_URL>/webhook/telegram \
  -H "Content-Type: application/json" \
  -d '{"update_id": 1}'
```

### Бот
1. Откройте бота в Telegram
2. Нажмите `/start`
3. Должна появиться кнопка "🚕 Открыть меню"

---

## ⚠️ Частые ошибки

### 1. "ModuleNotFoundError: No module named 'app'"
**Решение:** Проверьте, что `backend/api/index.py` правильно настроен

### 2. "Settings loading error"
**Решение:** Добавьте переменные окружения в Vercel Dashboard

### 3. Бот не отвечает
**Решение:** Установите webhook после деплоя

### 4. "DATABASE_URL is required"
**Решение:** Используйте SQLite для начала:
```
DATABASE_URL=sqlite+aiosqlite:///poehali.db
```

---

## 📊 Мониторинг

### Логи Vercel
```bash
vercel logs <YOUR_VERCEL_URL>
```

### Real-time логи
```bash
vercel logs --follow <YOUR_VERCEL_URL>
```

---

## 🔧 Переменные окружения

Обязательные переменные в Vercel Dashboard:

| Key | Required | Default |
|-----|----------|---------|
| `BOT_TOKEN` | ✅ | - |
| `ADMIN_CHAT_ID` | ✅ | -5247892173 |
| `DATABASE_URL` | ✅ | sqlite+aiosqlite:///poehali.db |
| `WEB_APP_URL` | ✅ | https://<your-vercel>.app |

---

## 📝 Заметки

- Vercel автоматически устанавливает `VERCEL_URL`
- Serverless функции имеют лимит 10 секунд
- SQLite работает, но данные могут сбрасываться
- Для production используйте PostgreSQL (Neon, Supabase)

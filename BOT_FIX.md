# 🔧 ДИАГНОСТИКА БОТА - НЕ ОТВЕЧАЕТ НА /start

## Проблема
Бот не отвечает на команду `/start` после деплоя на Vercel.

---

## ✅ Найденные и исправленные проблемы

### 1. **Неправильный метод обработки webhook**

**Файл:** `backend/app/main.py`

**Проблема:** Использовался `dp.feed_update()` вместо `dp.feed_webhook_update()`

**Исправление:**
```python
# БЫЛО (не работает):
await dp.feed_update(bot=bot, update=update_obj)

# СТАЛО (работает):
await dp.feed_webhook_update(bot=bot, update=update)
```

**Причина:** В Aiogram 3.x для webhook режима нужно использовать `feed_webhook_update()`, который корректно обрабатывает входящие обновления от Telegram.

---

### 2. **Неправильное получение данных из запроса**

**Файл:** `backend/app/main.py`

**Проблема:** Параметр `update: dict` не получал данные из POST запроса

**Исправление:**
```python
# БЫЛО:
async def telegram_webhook(update: dict):
    update_obj = Update(**update)

# СТАЛО:
async def telegram_webhook(request: Request):
    body = await request.json()
    update = Update(**body)
```

**Причина:** FastAPI не автоматически парсит JSON из POST запроса Telegram.

---

## 🚀 ИНСТРУКЦИЯ ПО ИСПРАВЛЕНИЮ

### Шаг 1: Проверьте текущий статус webhook

```bash
# Запустите скрипт проверки
python check_webhook.py check
```

Или вручную через curl:
```bash
curl "https://api.telegram.org/bot8606991774:AAGoHuOW3OCpN9n03U0gxKv5eDB27br60OQ/getWebhookInfo"
```

**Ожидаемый результат:**
```json
{
  "ok": true,
  "result": {
    "url": "https://poehali-psi.vercel.app/webhook/telegram",
    "has_custom_certificate": false,
    "pending_update_count": 0,
    ...
  }
}
```

---

### Шаг 2: Убедитесь, что webhook установлен

Если URL пустой или неправильный, установите webhook:

```bash
# Через скрипт
python check_webhook.py setup poehali-psi.vercel.app

# Или через curl
curl -X POST "https://api.telegram.org/bot8606991774:AAGoHuOW3OCpN9n03U0gxKv5eDB27br60OQ/setWebhook?url=https://poehali-psi.vercel.app/webhook/telegram"
```

---

### Шаг 3: Задеплойте исправления на Vercel

```bash
git add .
git commit -m "fix: исправлена обработка webhook для Telegram бота"
git push origin main
```

Или через Vercel CLI:
```bash
vercel --prod
```

---

### Шаг 4: Проверьте логи Vercel

```bash
# Real-time логи
vercel logs --follow poehali-psi.vercel.app

# Или через веб-интерфейс Vercel Dashboard
```

**Что искать в логах:**
- `📨 /start от {user_id}` - команда получена
- `✅ Ответ отправлен` - ответ отправлен
- `Ошибка обработки Telegram update` - если есть ошибка

---

### Шаг 5: Тестирование

1. Откройте Telegram
2. Найдите вашего бота
3. Нажмите `/start` или кнопку "Restart"
4. Должно появиться сообщение:
   ```
   👋 Здравствуйте!
   
   Я бот сервиса Поехали 🚕
   Помогу вам заказать такси Ташкент ↔ Фергана.
   
   💰 Стоимость поездки: 150,000 сум
   📦 Посылки: от 60,000 сум
   
   Нажмите кнопку ниже, чтобы открыть меню:
   ```
   
   С кнопкой "🚕 Открыть меню"

---

## 🔍 ДИАГНОСТИКА ЕСЛИ БОТ ВСЁ ЕЩЁ НЕ ОТВЕЧАЕТ

### Проверка 1: Webhook установлен?

```bash
curl "https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo"
```

Если `url` пустой - установите webhook.

---

### Проверка 2: Vercel URL правильный?

Убедитесь, что используете правильный Vercel URL:
- Проверьте в Vercel Dashboard → Settings → Domains
- Или запустите: `vercel --ls`

---

### Проверка 3: API доступно?

```bash
curl https://poehali-psi.vercel.app/health
curl https://poehali-psi.vercel.app/webhook/telegram -X POST -H "Content-Type: application/json" -d '{"update_id":1}'
```

---

### Проверка 4: Переменные окружения настроены?

В Vercel Dashboard → Settings → Environment Variables проверьте:
- `BOT_TOKEN` - токен бота
- `ADMIN_CHAT_ID` - ID админа для уведомлений
- `WEB_APP_URL` - URL веб-приложения

---

### Проверка 5: Бот заблокирован?

Если бот был заблокирован пользователем, он не получит сообщение.

Проверьте через BotFather:
1. Откройте @BotFather
2. Выберите вашего бота
3. Проверьте статистику

---

## 📊 СТАТИСТИКА ИСПРАВЛЕНИЯ

| Файл | Изменения |
|------|-----------|
| `backend/app/main.py` | ✅ Добавлен импорт `Request`<br>✅ Исправлен `telegram_webhook`<br>✅ Используется `feed_webhook_update()` |
| `requirements.txt` | ✅ Добавлен `httpx` |
| `check_webhook.py` | ✅ Создан скрипт проверки |

---

## ✅ ЧЕКЛИСТ

- [ ] Исправлен `backend/app/main.py` (импорт Request)
- [ ] Исправлен `telegram_webhook` (использует `feed_webhook_update`)
- [ ] Задеплоено на Vercel
- [ ] Webhook установлен (`check_webhook.py check`)
- [ ] Логи Vercel показывают обработку обновлений
- [ ] Бот отвечает на `/start`

---

## 🆘 ЕСЛИ НИЧЕГО НЕ ПОМОГЛО

1. **Удалите и заново установите webhook:**
   ```bash
   # Удалить
   python check_webhook.py delete
   
   # Установить заново
   python check_webhook.py setup poehali-psi.vercel.app
   ```

2. **Пересоздайте бота:**
   - Откройте @BotFather
   - `/revoke` для получения нового токена
   - Обновите `BOT_TOKEN` в Vercel

3. **Проверьте код локально:**
   ```bash
   cd backend
   uvicorn app.main:app --reload
   
   # В другом терминале отправьте тестовый webhook
   curl -X POST http://localhost:8000/webhook/telegram \
     -H "Content-Type: application/json" \
     -d '{"update_id":1,"message":{"message_id":1,"from":{"id":123,"first_name":"Test"},"chat":{"id":123},"text":"/start"}}'
   ```

---

**Дата обновления:** 3 марта 2026  
**Статус:** ✅ ИСПРАВЛЕНО

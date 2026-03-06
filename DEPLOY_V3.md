# 🚀 Poehali v3.0 — Инструкция по обновлению и деплою

## 📋 Обзор изменений v3.0

### Новые функции:
1. **Онлайн-оплата** — Click и Payme интеграция
2. **История заказов** — просмотр заказов пользователя по Telegram ID
3. **Статистика и аналитика** — дашборд с метриками
4. **Экспорт данных** — выгрузка заказов в CSV
5. **Рейтинг водителей** — система оценок
6. **Уведомления об оплате** — статусы платежей

### Обновлённые модели:
- `Driver` — добавлены rating, total_trips, total_reviews
- `Order` — добавлены user_telegram_id, total_price, payment_status, location_lat/lon, completed_at
- `Trip` — добавлено is_active
- `Review` — добавлены driver_id, order_id
- `Payment` — новая таблица для платежей

### Новые API endpoint:
```
POST   /api/v1/payment/click/create      — Создание платежа Click
POST   /api/v1/payment/payme/create      — Создание платежа Payme
POST   /api/v1/payment/click/callback    — Callback от Click
POST   /api/v1/payment/payme/callback    — Callback от Payme
GET    /api/v1/stats/dashboard           — Статистика дашборда
GET    /api/v1/stats/orders              — Статистика заказов
GET    /api/v1/stats/drivers             — Статистика водителей
GET    /api/v1/orders/history/{id}       — История заказов пользователя
GET    /api/v1/orders/export             — Экспорт заказов в CSV
PUT    /api/v1/drivers/{id}/rating       — Обновление рейтинга водителя
```

### Новые команды бота:
- `/myorders` — просмотр истории заказов

---

## 🔧 Локальное обновление

### Шаг 1: Обновление зависимостей

```bash
cd backend
pip install -r requirements.txt --upgrade
```

### Шаг 2: Обновление базы данных

```bash
# Запуск миграции
python migrate_db.py
```

### Шаг 3: Проверка работы

```bash
# Запуск сервера
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# В новом терминале запустите бота
python run_bot.py
```

### Шаг 4: Тестирование

```bash
# Запуск тестов
pytest tests/test_api.py -v
```

---

## 🌐 Деплой на Vercel

### Шаг 1: Подготовка переменных окружения

Добавьте в настройки Vercel новые переменные:

```bash
# Платежи (если используете)
CLICK_MERCHANT_ID=ваш_merchant_id
CLICK_SECRET_KEY=ваш_secret_key

PAYME_MERCHANT_ID=ваш_merchant_id
PAYME_SECRET_KEY=ваш_secret_key
```

### Шаг 2: Коммит и push

```bash
# В корне проекта
git add .
git commit -m "feat: v3.0 - оплата, статистика, история заказов

- Добавлена интеграция с Click и Payme
- История заказов пользователя (/myorders)
- Статистика и аналитика для админа
- Экспорт заказов в CSV
- Рейтинг водителей
- Новые модели: Payment
- Обновлены модели: Driver, Order, Review
- Новые API endpoint для платежей и статистики
- Миграция базы данных"
git push origin main
```

### Шаг 3: Автоматический деплой

Vercel автоматически обнаружит изменения и запустит деплой.

### Шаг 4: Обновление базы данных на продакшене

После деплоя выполните миграцию:

```bash
# Через SSH или консоль Vercel
cd /path/to/backend
python migrate_db.py
```

Или создайте отдельный endpoint для миграции:

```python
# В main.py добавьте:
@app.post("/migrate")
async def run_migration():
    from backend.migrate_db import migrate_db
    await migrate_db()
    return {"status": "success"}
```

### Шаг 5: Проверка webhook

```bash
# Проверка текущего webhook
curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo

# Если нужно, переустановите
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://your-project.vercel.app/webhook/telegram"
```

---

## 🧪 Тестирование после деплоя

### 1. Проверка API

```bash
# Главная страница
curl https://your-project.vercel.app/

# Health check
curl https://your-project.vercel.app/health

# Статистика
curl https://your-project.vercel.app/api/v1/stats/dashboard

# История заказов (замените 12345 на ваш Telegram ID)
curl https://your-project.vercel.app/api/v1/orders/history/12345
```

### 2. Проверка бота

Откройте бота в Telegram и проверьте команды:

```
/start — должно работать
/help — справка
/myorders — история заказов
/faq — FAQ
```

### 3. Проверка платежей

Если настроены платежные системы:

```bash
# Создание платежа Click
curl -X POST https://your-project.vercel.app/api/v1/payment/click/create \
  -H "Content-Type: application/json" \
  -d '{"order_id": 1, "provider": "click", "amount": 150000}'
```

---

## 📊 Мониторинг

### Логи Vercel

```bash
# Установка Vercel CLI
npm i -g vercel

# Просмотр логов
vercel logs your-project
```

### Отладка ошибок

Если что-то не работает:

1. Проверьте логи в Vercel Dashboard
2. Проверьте переменные окружения
3. Убедитесь, что миграция БД выполнена
4. Проверьте webhook через `/webhook/info`

---

## 🔙 Откат к предыдущей версии

Если что-то пошло не так:

```bash
# В Vercel Dashboard выберите предыдущий деплой
# Нажмите "Promote to Production"

# Или через CLI
vercel rollback
```

---

## 📝 Чек-лист перед деплоем

- [ ] Все зависимости обновлены
- [ ] Миграция БД протестирована локально
- [ ] Тесты проходят успешно
- [ ] Переменные окружения настроены
- [ ] Платежные ключи добавлены (если используются)
- [ ] Webhook проверен
- [ ] Логи мониторятся

---

## 🆘 Поддержка

При возникновении проблем:

1. Проверьте логи: `vercel logs`
2. Проверьте БД: `python migrate_db.py`
3. Перечитайте эту инструкцию
4. Обратитесь в поддержку Telegram: @abdurasulovb

---

**Poehali v3.0** — успешно развёрнут! 🎉

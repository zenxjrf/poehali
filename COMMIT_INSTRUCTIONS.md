# 📝 ИНСТРУКЦИЯ ПО КОММИТУ

## Git не найден в системе

Для выполнения коммита вам нужно:

### Вариант 1: Установить Git
1. Скачайте с https://git-scm.com/download/win
2. Установите
3. Перезапустите терминал
4. Выполните команды ниже

### Вариант 2: Использовать PyCharm
1. Откройте проект в PyCharm
2. VCS → Git → Add (или Ctrl+Alt+A)
3. VCS → Git → Commit (или Ctrl+K)
4. Вставьте сообщение коммита ниже

---

## 📋 Команды для коммита

```bash
# Перейдите в директорию проекта
cd "C:\Users\PC 2\Downloads\PycharmProjects\Poehali"

# Добавьте все изменения
git add .

# Или выборочно:
git add vercel.json
git add api/index.py
git add backend/app/main.py
git add backend/app/api/routes.py
git add backend/app/database.py
git add backend/app/config.py
git add backend/app/bot/bot.py
git add backend/app/models/__init__.py
git add backend/app/models/review.py
git add backend/app/schemas/__init__.py
git add frontend/.env
git add backend/.env
git add .gitignore
git add requirements.txt
git add check_webhook.py
git add BUGFIX_REPORT.md
git add BOT_FIX.md
```

---

## ✉️ Сообщение коммита

```
fix: исправлены критические баги для Vercel и Telegram бота

🔴 КРИТИЧЕСКИЕ ИСПРАВЛЕНИЯ:
- Исправлены импорты: заменено 'from app.*' на 'from backend.app.*'
- Исправлен telegram_webhook: используется feed_webhook_update() вместо feed_update()
- Исправлено получение JSON из POST запроса Telegram
- Исправлен vercel.json: buildCommand, maxDuration (60 сек)
- Исправлен DATABASE_URL: абсолютные пути для SQLite
- Удалён @on_event("startup"), создан endpoint /webhook/setup

🟡 ПРОЧИЕ ИСПРАВЛЕНИЯ:
- Добавлены .env файлы для frontend и backend
- Добавлено игнорирование *.db в .gitignore
- Добавлена ленивая инициализация бота (init_bot)
- Добавлен httpx в requirements.txt

📁 ИЗМЕНЕНО ФАЙЛОВ: 15
- vercel.json, api/index.py
- backend/app/main.py, database.py, config.py, routes.py
- backend/app/bot/bot.py
- backend/app/models/__init__.py, review.py
- backend/app/schemas/__init__.py
- frontend/.env (создан), backend/.env (обновлён)
- .gitignore, requirements.txt
- check_webhook.py (создан), BUGFIX_REPORT.md (создан), BOT_FIX.md (создан)

🚀 СЛЕДУЮЩИЕ ШАГИ:
1. Задеплоить на Vercel: git push origin main
2. Проверить webhook: python check_webhook.py check
3. Установить webhook: python check_webhook.py setup poehali-psi.vercel.app
4. Протестировать бота: нажать /start в Telegram
```

---

## 🚀 Деплой после коммита

```bash
# Push на GitHub
git push origin main

# Или через Vercel CLI
vercel --prod
```

---

## ✅ Проверка после деплоя

```bash
# Проверить webhook
python check_webhook.py check

# Протестировать бота
# Откройте Telegram и нажмите /start
```

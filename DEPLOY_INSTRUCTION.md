# 🚀 Poehali - Полная инструкция по деплою

## 📋 Шаг 1: Настройка Render (Backend)

### 1.1 Создайте аккаунт на Render
1. Перейдите на https://render.com
2. Нажмите **Sign Up** (через GitHub)
3. Войдите через ваш GitHub аккаунт

### 1.2 Создайте Web Service
1. Нажмите **New +** → **Web Service**
2. Выберите репозиторий `zenxjrf/poehali`
3. Настройте сервис:

```
Name: poehali-backend
Region: Frankfurt
Branch: main
Root Directory: backend
Runtime: Python
Build Command: pip install -r requirements.txt
Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

4. Выберите тариф **Starter** (бесплатный)

### 1.3 Добавьте переменные окружения
Нажмите **Advanced** → **Add Environment Variable**:

| Key | Value |
|-----|-------|
| `BOT_TOKEN` | `8606991774:AAGoHuOW3OCpN9n03U0gxKv5eDB27br60OQ` |
| `ADMIN_CHAT_ID` | `-5247892173` |
| `WEB_APP_URL` | `https://poehali-psi.vercel.app` |

Нажмите **Add Variable**

### 1.4 Создайте PostgreSQL базу
1. Нажмите **New +** → **PostgreSQL**
2. Name: `poehali-db`
3. Region: `Frankfurt`
4. Нажмите **Create Database**
5. После создания скопируйте **External Connection URL**
6. Добавьте в переменные окружения backend:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | `postgresql+asyncpg://...` (из Render) |

### 1.5 Запустите деплой
1. Нажмите **Create Web Service**
2. Дождитесь завершения деплоя (~5 минут)
3. Скопируйте URL сервиса (например: `https://poehali-backend.onrender.com`)

---

## 📋 Шаг 2: Настройка Vercel (Frontend)

### 2.1 Создайте аккаунт на Vercel
1. Перейдите на https://vercel.com
2. Нажмите **Sign Up** (через GitHub)
3. Войдите через ваш GitHub аккаунт

### 2.2 Импортируйте проект
1. Нажмите **Add New Project**
2. Выберите **Import Git Repository**
3. Найдите `zenxjrf/poehali`
4. Нажмите **Import**

### 2.3 Настройте проект
**Framework Preset:** Vite
**Root Directory:** `frontend`
**Build Command:** `npm run build`
**Output Directory:** `dist`

### 2.4 Добавьте переменные окружения
Нажмите **Environment Variables** → **Add New**:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://poehali-backend.onrender.com/api/v1` |
| `VITE_DISPATCHER_USERNAME` | `fakertop` |

### 2.5 Задеплойте
1. Нажмите **Deploy**
2. Дождитесь завершения (~2 минуты)
3. Скопируйте URL (например: `https://poehali-psi.vercel.app`)

---

## 📋 Шаг 3: Обновите переменные на Render

Вернитесь на Render и обновите переменную:

| Key | Value |
|-----|-------|
| `WEB_APP_URL` | `<URL из Vercel>` |

Нажмите **Save Changes** → Render автоматически задеплоит

---

## 📋 Шаг 4: Проверка работы

### 4.1 Проверьте Backend
```bash
curl https://poehali-backend.onrender.com/health
```
Должно вернуть: `{"status": "healthy"}`

### 4.2 Проверьте API
```bash
curl https://poehali-backend.onrender.com/api/v1/trips
```
Должно вернуть список направлений

### 4.3 Проверьте Frontend
Откройте в браузере: `https://poehali-psi.vercel.app`

### 4.4 Проверьте бота
1. Откройте Telegram
2. Найдите вашего бота
3. Нажмите `/start`
4. Должна появиться кнопка "🚕 Открыть меню"

---

## 🔧 Автоматический деплой

После настройки каждый `git push` в ветку `main` будет автоматически деплоить:

- ✅ **GitHub Actions** → Vercel (Frontend)
- ✅ **Render** → Backend (через webhook)

### Локальный деплой (скрипт)
```bash
# Windows (Git Bash)
./deploy.sh

# Linux/Mac
chmod +x deploy.sh
./deploy.sh
```

---

## ⚠️ Возможные проблемы

### Backend не деплоится
**Проблема:** Ошибка сборки на Render
**Решение:** Проверьте логи в Dashboard Render

### Frontend не грузится
**Проблема:** Неправильный VITE_API_URL
**Решение:** Проверьте переменную на Vercel

### Бот не отвечает
**Проблема:** Неправильный BOT_TOKEN или ADMIN_CHAT_ID
**Решение:** Проверьте переменные на Render

### База данных не подключается
**Проблема:** Неправильный DATABASE_URL
**Решение:** Скопируйте заново из Render PostgreSQL

---

## 📞 Поддержка

- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- GitHub Actions: https://docs.github.com/actions

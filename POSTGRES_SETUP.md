# Инструкция по установке PostgreSQL

## Windows

1. Скачайте PostgreSQL с официального сайта:
   https://www.postgresql.org/download/windows/

2. Рекомендуется версия: **PostgreSQL 15** или **16**

3. При установке:
   - Запомните пароль для пользователя `postgres`
   - Порт оставьте по умолчанию: **5432**

4. После установки откройте **pgAdmin 4** (устанавливается вместе с PostgreSQL)

5. Создайте базу данных:
   - Подключитесь к серверу (введите пароль postgres)
   - Правой кнопкой на "Databases" → "Create" → "Database"
   - Имя базы: `poehali_db`
   - Владелец: `postgres`

## Настройка .env

Откройте `backend/.env` и укажите:

```env
DATABASE_URL=postgresql+asyncpg://postgres:ВАШ_ПАРОЛЬ@localhost:5432/poehali_db
```

Замените `ВАШ_ПАРОЛЬ` на пароль, который вы задали при установке.

## Проверка подключения

Запустите скрипт заполнения БД:

```bash
cd backend
venv\Scripts\activate
python seed_db.py
```

Если видите:
```
✅ База данных успешно заполнена!
   - Добавлено направлений: 2
   - Добавлено водителей: 5
```

Значит всё настроено правильно!

## macOS

```bash
brew install postgresql@15
brew services start postgresql@15
createdb poehali_db
```

## Linux (Ubuntu)

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo -u postgres psql
CREATE DATABASE poehali_db;
\q
```

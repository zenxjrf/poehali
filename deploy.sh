#!/bin/bash
# Скрипт для деплоя Poehali на Render и Vercel

echo "========================================"
echo "  🚀 Poehali - Деплой на продакшен"
echo "========================================"
echo ""

# Проверка Git
echo "[1/4] Проверка Git..."
git status
if [ $? -ne 0 ]; then
    echo "❌ Ошибка: Git не настроен"
    exit 1
fi
echo "✅ Git OK"
echo ""

# Проверка изменений
echo "[2/4] Проверка изменений..."
git add .
git diff --cached --quiet
if [ $? -eq 0 ]; then
    echo "⚠️ Нет изменений для коммита"
else
    read -p "Введите сообщение для коммита: " message
    git commit -m "$message"
    echo "✅ Коммит создан"
fi
echo ""

# Пуш на GitHub
echo "[3/4] Пуш на GitHub..."
git push origin main
if [ $? -ne 0 ]; then
    echo "❌ Ошибка пуша"
    exit 1
fi
echo "✅ Пуш выполнен"
echo ""

# Информация о деплое
echo "[4/4] Деплой запущен автоматически!"
echo ""
echo "========================================"
echo "  📊 Статус деплоя:"
echo "========================================"
echo ""
echo "GitHub Actions:"
echo "  👉 https://github.com/zenxjrf/poehali/actions"
echo ""
echo "Render (Backend):"
echo "  👉 https://render.com"
echo ""
echo "Vercel (Frontend):"
echo "  👉 https://vercel.com"
echo ""
echo "========================================"
echo "  ✅ Деплой запущен!"
echo "========================================"

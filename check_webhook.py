#!/usr/bin/env python3
"""
Скрипт для проверки и настройки Telegram webhook
Использование: python check_webhook.py
"""

import os
import sys
from pathlib import Path

# Добавляем backend в path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

import asyncio
import httpx
from backend.app.config import settings


async def check_webhook():
    """Проверка текущего webhook"""
    print("=" * 50)
    print("🔍 ПРОВЕРКА TELEGRAM WEBHOOK")
    print("=" * 50)
    
    bot_token = settings.BOT_TOKEN
    base_url = f"https://api.telegram.org/bot{bot_token}"
    
    async with httpx.AsyncClient() as client:
        # Получаем информацию о webhook
        try:
            response = await client.get(f"{base_url}/getWebhookInfo", timeout=10)
            info = response.json()
            
            print(f"\n📊 Статус: {info.get('ok', False)}")
            if info.get('result'):
                result = info['result']
                print(f"   URL: {result.get('url', 'Не установлен')}")
                print(f"   Ожидает обновлений: {result.get('pending_update_count', 0)}")
                print(f"   Последняя ошибка: {result.get('last_error_message', 'Нет')}")
                
                if result.get('url'):
                    print("\n✅ Webhook установлен")
                else:
                    print("\n❌ Webhook НЕ установлен")
                    
        except Exception as e:
            print(f"❌ Ошибка проверки: {e}")
    
    # Проверка переменных окружения
    print("\n" + "=" * 50)
    print("📋 ПЕРЕМЕННЫЕ ОКРУЖЕНИЯ")
    print("=" * 50)
    print(f"   BOT_TOKEN: {bot_token[:20]}...")
    print(f"   ADMIN_CHAT_ID: {settings.ADMIN_CHAT_ID}")
    print(f"   WEB_APP_URL: {settings.WEB_APP_URL}")
    
    # Проверка доступности бота
    print("\n" + "=" * 50)
    print("🤖 ПРОВЕРКА БОТА")
    print("=" * 50)
    
    try:
        response = await client.get(f"{base_url}/getMe", timeout=10)
        bot_info = response.json()
        
        if bot_info.get('ok'):
            bot = bot_info['result']
            print(f"   Имя: {bot.get('first_name', 'N/A')}")
            print(f"   Username: @{bot.get('username', 'N/A')}")
            print(f"   ID: {bot.get('id', 'N/A')}")
            print("\n✅ Бот доступен")
        else:
            print("\n❌ Ошибка получения информации о боте")
    except Exception as e:
        print(f"❌ Ошибка проверки бота: {e}")


async def setup_webhook(vercel_url: str = None):
    """Установка webhook"""
    print("=" * 50)
    print("🔧 УСТАНОВКА WEBHOOK")
    print("=" * 50)
    
    if not vercel_url:
        # Пытаемся получить из окружения
        vercel_url = os.getenv("VERCEL_URL") or os.getenv("WEBHOOK_URL")
        
        if not vercel_url:
            print("\n❌ Не указан Vercel URL")
            print("\nИспользование:")
            print("  python check_webhook.py setup YOUR_VERCEL_URL")
            print("\nПример:")
            print("  python check_webhook.py setup poehali-psi.vercel.app")
            return
    
    bot_token = settings.BOT_TOKEN
    webhook_url = f"https://{vercel_url}/webhook/telegram"
    base_url = f"https://api.telegram.org/bot{bot_token}"
    
    print(f"\n📍 URL: {webhook_url}")
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{base_url}/setWebhook",
                json={"url": webhook_url},
                timeout=10
            )
            result = response.json()
            
            if result.get('ok'):
                print(f"\n✅ Webhook успешно установлен!")
                print(f"   Результат: {result.get('result', 'N/A')}")
                
                # Проверяем через 2 секунды
                await asyncio.sleep(2)
                info_response = await client.get(f"{base_url}/getWebhookInfo", timeout=10)
                info = info_response.json()
                
                if info.get('result'):
                    print(f"\n📊 Текущий статус:")
                    print(f"   URL: {info['result'].get('url', 'N/A')}")
                    print(f"   Ожидает обновлений: {info['result'].get('pending_update_count', 0)}")
            else:
                print(f"\n❌ Ошибка установки: {result.get('description', 'Unknown error')}")
                
        except Exception as e:
            print(f"❌ Ошибка: {e}")


async def delete_webhook():
    """Удаление webhook"""
    print("=" * 50)
    print("🗑️ УДАЛЕНИЕ WEBHOOK")
    print("=" * 50)
    
    bot_token = settings.BOT_TOKEN
    base_url = f"https://api.telegram.org/bot{bot_token}"
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(f"{base_url}/deleteWebhook", timeout=10)
            result = response.json()
            
            if result.get('ok'):
                print("\n✅ Webhook успешно удалён!")
            else:
                print(f"\n❌ Ошибка: {result.get('description', 'Unknown error')}")
                
        except Exception as e:
            print(f"❌ Ошибка: {e}")


async def main():
    command = sys.argv[1] if len(sys.argv) > 1 else "check"
    
    if command == "check":
        await check_webhook()
    elif command == "setup":
        vercel_url = sys.argv[2] if len(sys.argv) > 2 else None
        await setup_webhook(vercel_url)
    elif command == "delete":
        await delete_webhook()
    else:
        print("Использование:")
        print("  python check_webhook.py check    - Проверка webhook")
        print("  python check_webhook.py setup [URL] - Установка webhook")
        print("  python check_webhook.py delete   - Удаление webhook")


if __name__ == "__main__":
    asyncio.run(main())

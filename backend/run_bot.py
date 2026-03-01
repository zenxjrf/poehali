"""
Запуск Telegram бота отдельно от FastAPI
Используйте этот скрипт для запуска бота на отдельном сервере
"""
import asyncio
import logging
from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
from aiogram.types import WebAppInfo, InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.fsm.storage.memory import MemoryStorage
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Получаем настройки из переменных окружения
BOT_TOKEN = os.getenv('BOT_TOKEN', '8606991774:AAGoHuOW3OCpN9n03U0gxKv5eDB27br60OQ')
WEB_APP_URL = os.getenv('WEB_APP_URL', 'http://localhost:5173')
DISPATCHER_USERNAME = os.getenv('DISPATCHER_USERNAME', 'fakertop')

# Инициализация бота и диспетчера
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher(storage=MemoryStorage())


@dp.message(Command("start"))
async def cmd_start(message: types.Message):
    try:
        # Отправляем приветственное сообщение
        await message.answer(
            "👋 *Здравствуйте!*\n\n"
            "Я бот сервиса *Поехали* 🚕\n"
            "Помогу вам заказать такси из Ташкента в Фергану и обратно.\n\n"
            "Нажмите кнопку ниже, чтобы открыть меню:",
            parse_mode="Markdown"
        )
        
        keyboard = InlineKeyboardMarkup(
            inline_keyboard=[
                [
                    InlineKeyboardButton(
                        text="🚕 Открыть меню",
                        web_app=WebAppInfo(url=WEB_APP_URL)
                    )
                ],
                [
                    InlineKeyboardButton(
                        text="📞 Позвонить",
                        callback_data="call_dispatcher"
                    ),
                    InlineKeyboardButton(
                        text="💬 Написать",
                        url=f"https://t.me/{DISPATCHER_USERNAME}"
                    )
                ]
            ]
        )
        
        await message.answer(
            "🚕 *Поехали — Ваше такси Ташкент ↔ Фергана*\n\n"
            "📌 *Как заказать такси:*\n"
            "1️⃣ Нажмите кнопку «🚕 Открыть меню»\n"
            "2️⃣ Выберите направление поездки\n"
            "3️⃣ Заполните форму заявки\n"
            "4️⃣ Добавьте геолокацию (по желанию)\n"
            "5️⃣ Дождитесь звонка от диспетчера\n\n"
            "💰 *Стоимость:*\n"
            "• Поездка: 200 000 сум с человека\n"
            "• Посылки: от 60 000 сум\n\n"
            "⏱ *Время в пути:* ~4 часа\n"
            "🚗 *Комфорт:* Кондиционер, удобные сиденья\n\n"
            "✨ *Почему выбирают нас:*\n"
            "✓ Фиксированная цена\n"
            "✓ Проверенные водители\n"
            "✓ Подача в удобное время\n"
            "✓ Безопасность и комфорт\n\n"
            "Нажмите кнопку ниже, чтобы начать:",
            reply_markup=keyboard,
            parse_mode="Markdown"
        )
    except Exception as e:
        logger.error(f"Ошибка в cmd_start: {e}")
        await message.answer("❌ Произошла ошибка. Попробуйте позже.")


@dp.callback_query(lambda c: c.data == "call_dispatcher")
async def process_call(callback: types.CallbackQuery):
    try:
        await callback.answer("📞 +998 94 136 54 74", show_alert=True)
    except Exception as e:
        logger.error(f"Ошибка в process_call: {e}")


async def main():
    """Запуск бота"""
    logger.info("🤖 Запуск Telegram бота...")
    await bot.delete_webhook()
    await dp.start_polling(bot)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("👋 Бот остановлен")
    finally:
        await bot.session.close()

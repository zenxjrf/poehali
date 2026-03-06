"""
Запуск Telegram бота отдельно от FastAPI
Используйте этот скрипт для локальной разработки с polling
Для Vercel используется webhook через main.py
"""
import asyncio
import logging
import os

from aiogram import Bot, Dispatcher
from aiogram.filters import Command
from aiogram.types import WebAppInfo, InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.fsm.storage.memory import MemoryStorage

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Получаем настройки из переменных окружения
BOT_TOKEN = os.getenv('BOT_TOKEN', '8606991774:AAGoHuOW3OCpN9n03U0gxKv5eDB27br60OQ')
WEB_APP_URL = os.getenv('WEB_APP_URL', 'http://localhost:5173')
DISPATCHER_USERNAME = os.getenv('DISPATCHER_USERNAME', 'abdurasulovb')
DISPATCHER_PHONE = os.getenv('DISPATCHER_PHONE', '+998 94 136 54 74')

# Инициализация бота и диспетчера
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher(storage=MemoryStorage())

# Кэшированная клавиатура
_main_keyboard = None


def get_main_keyboard() -> InlineKeyboardMarkup:
    """Возвращает кэшированную главную клавиатуру"""
    global _main_keyboard
    if _main_keyboard is None:
        _main_keyboard = InlineKeyboardMarkup(
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
    return _main_keyboard


@dp.message(Command("start"))
async def cmd_start(message):
    try:
        keyboard = get_main_keyboard()
        await message.answer(
            "👋 *Здравствуйте!*\n\n"
            "Я бот сервиса *Поехали* 🚕\n"
            "Помогу вам заказать такси из Ташкента в Фергану и обратно.\n\n"
            "💰 *Стоимость поездки:* 150 000 сум\n"
            "📦 *Посылки:* от 60 000 сум\n\n"
            "Нажмите кнопку ниже, чтобы открыть меню:",
            reply_markup=keyboard,
            parse_mode="Markdown"
        )
    except Exception as e:
        logger.error(f"Ошибка в cmd_start: {e}")
        await message.answer("❌ Произошла ошибка. Попробуйте позже.")


@dp.callback_query(lambda c: c.data == "call_dispatcher")
async def process_call(callback):
    try:
        await callback.answer(f"📞 {DISPATCHER_PHONE}", show_alert=True)
    except Exception as e:
        logger.error(f"Ошибка в process_call: {e}")


async def main():
    """Запуск бота с polling (локальная разработка)"""
    logger.info("🤖 Запуск Telegram бота (polling режим)...")
    logger.info(f"WEB_APP_URL: {WEB_APP_URL}")
    logger.info(f"DISPATCHER_USERNAME: @{DISPATCHER_USERNAME}")

    # Для локальной разработки используем polling
    await bot.delete_webhook()
    await dp.start_polling(bot)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("👋 Бот остановлен")

"""
Тест бота - проверка что кнопки работают
"""
import asyncio
import logging
from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
from aiogram.types import WebAppInfo, InlineKeyboardMarkup, InlineKeyboardButton

BOT_TOKEN = "8606991774:AAGoHuOW3OCpN9n03U0gxKv5eDB27br60OQ"
WEB_APP_URL = "http://localhost:5173"

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()


@dp.message(Command("start"))
async def cmd_start(message: types.Message):
    logger.info(f"Получен /start от {message.from_user.id}")
    
    try:
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
                        url="https://t.me/fakertop"
                    )
                ]
            ]
        )
        
        logger.info(f"Отправка клавиатуры: {keyboard}")
        
        await message.answer(
            "👋 ТЕСТ: Кнопки должны появиться!",
            reply_markup=keyboard
        )
        
        logger.info("✅ Сообщение отправлено!")
        
    except Exception as e:
        logger.error(f"❌ ОШИБКА: {e}")
        logger.error(f"Тип: {type(e).__name__}")
        import traceback
        logger.error(traceback.format_exc())


async def main():
    logger.info("🚀 Запуск теста бота...")
    await bot.delete_webhook()
    await dp.start_polling(bot)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("👋 Остановлено")

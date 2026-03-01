import asyncio
import logging
import sys

from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
from aiogram.types import WebAppInfo, InlineKeyboardMarkup, InlineKeyboardButton, ReplyKeyboardMarkup, KeyboardButton
from aiogram.fsm.storage.memory import MemoryStorage

from app.config import settings

# Настраиваем логирование
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Счётчик заявок
order_counter = 0

# Инициализация бота и диспетчера
logger.info("=" * 50)
logger.info("🔧 Инициализация бота...")
logger.info(f"BOT_TOKEN: {settings.BOT_TOKEN[:20]}...")
logger.info(f"WEB_APP_URL: {settings.WEB_APP_URL}")
logger.info(f"ADMIN_CHAT_ID: {settings.ADMIN_CHAT_ID}")

try:
    bot = Bot(token=settings.BOT_TOKEN)
    dp = Dispatcher(storage=MemoryStorage())
    logger.info("✅ Бот успешно инициализирован!")
except Exception as e:
    logger.error(f"❌ Ошибка инициализации бота: {e}")
    raise


def get_main_keyboard():
    """Создаёт главную клавиатуру"""
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="🚕 Открыть меню",
                    web_app=WebAppInfo(url=settings.WEB_APP_URL)
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


@dp.message(Command("start"))
async def cmd_start(message: types.Message):
    """Обработчик команды /start"""
    user_id = message.from_user.id
    username = message.from_user.username or message.from_user.first_name
    logger.info("=" * 50)
    logger.info(f"📨 Команда /start от пользователя {user_id} (@{username})")
    
    try:
        keyboard = get_main_keyboard()
        
        logger.info(f"📤 Отправка сообщения с кнопками пользователю {user_id}")
        
        # Отправляем сообщение с кнопками
        response = await message.answer(
            text=(
                "👋 Здравствуйте!\n\n"
                "Я бот сервиса Поехали 🚕\n"
                "Помогу вам заказать такси из Ташкента в Фергану и обратно.\n\n"
                "Нажмите кнопку ниже, чтобы открыть меню:"
            ),
            reply_markup=keyboard
        )
        
        logger.info(f"✅ Сообщение успешно отправлено! Message ID: {response.message_id}")
        logger.info("=" * 50)
        
    except Exception as e:
        logger.error(f"❌ Ошибка в cmd_start: {e}", exc_info=True)
        logger.error(f"Тип ошибки: {type(e).__name__}")
        await message.answer("❌ Произошла ошибка. Попробуйте позже.")


@dp.callback_query(lambda c: c.data == "call_dispatcher")
async def process_call(callback: types.CallbackQuery):
    """Обработчик нажатия на кнопку 'Позвонить'"""
    try:
        logger.info(f"📞 Нажата кнопка 'Позвонить' от {callback.from_user.id}")
        await callback.answer("📞 +998 94 136 54 74", show_alert=True)
        logger.info("✅ Ответ отправлен")
    except Exception as e:
        logger.error(f"❌ Ошибка в process_call: {e}", exc_info=True)


async def send_review_notification(review_data: dict, review_id: int):
    """Отправка уведомления о новом отзыве в чат администратора"""
    try:
        # Звёзды
        stars = '⭐' * review_data.get('rating', 0)
        
        text = (
            f"⭐ <b>НОВЫЙ ОТЗЫВ №{review_id:03d}</b>\n\n"
            f"{'⭐⭐⭐⭐⭐' if review_data.get('rating') == 5 else '⭐⭐⭐⭐' if review_data.get('rating') == 4 else '⭐⭐⭐' if review_data.get('rating') == 3 else '⭐⭐' if review_data.get('rating') == 2 else '⭐'}\n\n"
            f"👤 <b>Клиент:</b> {review_data.get('customer_name', 'Не указано')}\n"
            f"📞 <b>Телефон:</b> <code>{review_data.get('customer_phone', 'Не указан')}</code>\n"
            f"💬 <b>Отзыв:</b>\n{review_data.get('comment', 'Нет')}\n\n"
            f"🕒 <b>Время:</b> {review_data.get('created_at', 'Только что')}"
        )
        
        # Кнопки действий
        keyboard = InlineKeyboardMarkup(
            inline_keyboard=[
                [
                    InlineKeyboardButton(
                        text="📞 Позвонить",
                        url=f"tel:{review_data.get('customer_phone', '')}"
                    )
                ],
                [
                    InlineKeyboardButton(
                        text="💬 Написать",
                        url=f"https://t.me/+{review_data.get('customer_phone', '').replace('+', '').replace(' ', '')}"
                    )
                ]
            ]
        )
        
        await bot.send_message(
            chat_id=settings.ADMIN_CHAT_ID,
            text=text,
            reply_markup=keyboard,
            parse_mode="HTML"
        )
        
        logger.info(f"✅ Отзыв №{review_id} отправлен администратору")
    except Exception as e:
        logger.error(f"❌ Ошибка отправки отзыва: {e}", exc_info=True)

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


async def send_order_notification(order_data: dict, order_id: int = None):
    """Отправка уведомления о новом заказе в чат администратора"""
    global order_counter
    
    try:
        # Увеличиваем счётчик
        order_counter += 1
        order_number = order_counter if order_id is None else order_id
        
        direction_labels = {
            'tashkent_fergana': 'Ташкент → Фергана',
            'fergana_tashkent': 'Фергана → Ташкент'
        }
        
        # Короткое уведомление
        short_text = (
            f"🔔 Поступила заявка №{order_number:03d}\n\n"
            f"👤 {order_data.get('customer_name', 'Клиент')}\n"
            f"📞 {order_data.get('customer_phone', '')}\n"
            f"🚕 {direction_labels.get(order_data.get('direction', ''), 'Направление')}\n"
            f"💰 {order_data.get('price', 0):,} сум"
        )
        
        # Полная информация
        full_text = (
            f"🔔 ПОСТУПИЛА ЗАЯВКА №{order_number:03d}\n\n"
            f"━━━━━━━━━━━━━━━━━━━━\n\n"
            f"👤 Клиент: {order_data.get('customer_name', 'Не указано')}\n"
            f"📞 Телефон: {order_data.get('customer_phone', 'Не указан')}\n"
            f"🚕 Направление: {direction_labels.get(order_data.get('direction', 'Не указано'))}\n"
            f"⏰ Удобное время: {order_data.get('preferred_call_time', 'Не указано')}\n"
            f"👥 Пассажиры: {order_data.get('passengers_count', 1)} чел.\n"
            f"💬 Комментарий: {order_data.get('comment', 'Нет') or 'Нет'}\n"
            f"💰 Цена: {order_data.get('price', 0):,} сум\n"
        )
        
        # Добавляем геолокацию если есть
        location = order_data.get('location')
        if location:
            full_text += f"\n📍 Геолокация: {location}"
        
        full_text += f"\n\n🕒 Время: {order_data.get('created_at', 'Только что')}"
        
        # Кнопки действий
        keyboard = InlineKeyboardMarkup(
            inline_keyboard=[
                [
                    InlineKeyboardButton(
                        text="📞 Позвонить",
                        url=f"tel:{order_data.get('customer_phone', '')}"
                    )
                ],
                [
                    InlineKeyboardButton(
                        text="💬 Написать",
                        url=f"https://t.me/+{order_data.get('customer_phone', '').replace('+', '').replace(' ', '')}"
                    )
                ]
            ]
        )
        
        # Отправляем уведомления
        await bot.send_message(
            chat_id=settings.ADMIN_CHAT_ID,
            text=short_text
        )
        
        await bot.send_message(
            chat_id=settings.ADMIN_CHAT_ID,
            text=full_text,
            reply_markup=keyboard
        )
        
        logger.info(f"✅ Уведомление №{order_number} отправлено")
    except Exception as e:
        logger.error(f"❌ Ошибка отправки уведомления: {e}", exc_info=True)

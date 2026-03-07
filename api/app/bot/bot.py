"""
Telegram бот для сервиса Poehali
Оптимизированная версия v2.2
"""
import asyncio
import logging
from contextlib import asynccontextmanager
from typing import Optional

from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command, StateFilter
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram.types import (
    WebAppInfo,
    InlineKeyboardMarkup,
    InlineKeyboardButton,
    LabeledPrice
)

from app.config import settings

# =============================================================================
# КОНФИГУРАЦИЯ И ЛОГИРОВАНИЕ
# =============================================================================

# Оптимизированное логирование
logging.basicConfig(
    level=logging.INFO,  # DEBUG только для отладки
    format='%(asctime)s | %(levelname)-8s | %(name)s | %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


# =============================================================================
# КОНСТАНТЫ
# =============================================================================

class Constants:
    """Константы бота для централизованного управления"""
    BOT_NAME = "Поехали"
    BOT_EMOJI = "🚕"
    ROUTE = "Ташкент ↔ Фергана"
    PRICE_PER_PERSON = 150_000
    MAIL_PRICE = 60_000
    DISPATCHER_PHONE = "+998 94 136 54 74"
    DISPATCHER_USERNAME = "abdurasulovb"
    SUPPORT_USERNAME = "abdurasulovb"

    # Тексты
    WELCOME_TEXT = (
        "👋 Здравствуйте!\n\n"
        f"Я бот сервиса {BOT_NAME} {BOT_EMOJI}\n"
        f"Помогу вам заказать такси {ROUTE}.\n\n"
        f"💰 *Стоимость поездки:* {PRICE_PER_PERSON:,} сум\n"
        f"📦 *Посылки:* от {MAIL_PRICE:,} сум\n\n"
        "Нажмите кнопку ниже, чтобы открыть меню:"
    )

    CALL_BACK_TEXT = f"📞 {DISPATCHER_PHONE}"


# =============================================================================
# КЛАВИША (КЭШИРОВАНИЕ)
# =============================================================================

class Keyboards:
    """Фабрика клавиатур с кэшированием"""
    
    _main_keyboard: Optional[InlineKeyboardMarkup] = None
    
    @classmethod
    def get_main_keyboard(cls) -> InlineKeyboardMarkup:
        """Возвращает кэшированную главную клавиатуру"""
        if cls._main_keyboard is None:
            cls._main_keyboard = InlineKeyboardMarkup(
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
                            url=f"https://t.me/{Constants.SUPPORT_USERNAME}"
                        )
                    ]
                ]
            )
            logger.debug("Главная клавиатура создана")
        return cls._main_keyboard
    
    @classmethod
    def get_review_keyboard(cls, review_id: int) -> InlineKeyboardMarkup:
        """Создаёт клавиатуру для отзыва (не кэшируется)"""
        return InlineKeyboardMarkup(
            inline_keyboard=[
                [
                    InlineKeyboardButton(
                        text="📞 Позвонить",
                        url=f"tel:{review_id}"
                    )
                ]
            ]
        )


# =============================================================================
# ИНИЦИАЛИЗАЦИЯ
# =============================================================================

# Глобальный объект бота (будет инициализирован при запуске)
bot: Optional[Bot] = None

storage = MemoryStorage()
dp = Dispatcher(storage=storage)


async def init_bot():
    """Инициализация бота для serverless (Vercel)"""
    global bot
    if bot is None:
        bot = Bot(token=settings.BOT_TOKEN)
        logger.info("✅ Бот инициализирован для serverless режима")
    return bot


async def close_bot():
    """Закрытие сессии бота"""
    global bot
    if bot:
        await bot.session.close()
        logger.info("👋 Сессия бота закрыта")


# =============================================================================
# ХЕНДЛЕРЫ
# =============================================================================

@dp.message(Command("start"))
async def cmd_start(message: types.Message) -> None:
    """
    Обработчик команды /start
    Оптимизация: кэшированная клавиатура, минимум логов
    """
    user_id = message.from_user.id
    username = message.from_user.username or message.from_user.first_name
    
    logger.info(f"📨 /start от {user_id} (@{username})")
    
    try:
        await message.answer(
            text=Constants.WELCOME_TEXT,
            reply_markup=Keyboards.get_main_keyboard()
        )
        logger.debug(f"✅ Ответ отправлен {user_id}")
        
    except Exception as e:
        logger.error(f"❌ /start error for {user_id}: {type(e).__name__} - {e}")
        await message.answer("❌ Произошла ошибка. Попробуйте позже.")


@dp.callback_query(lambda c: c.data == "call_dispatcher")
async def process_call(callback: types.CallbackQuery) -> None:
    """
    Обработчик кнопки 'Позвонить'
    Оптимизация: простой ответ без лишних логов
    """
    try:
        await callback.answer(Constants.CALL_BACK_TEXT, show_alert=True)
    except Exception as e:
        logger.error(f"❌ Callback error: {e}")


# =============================================================================
# УВЕДОМЛЕНИЯ
# =============================================================================

async def send_review_notification(
    bot: Bot,
    review_data: dict,
    review_id: int
) -> None:
    """
    Отправка уведомления о новом отзыве
    Оптимизация: один запрос вместо двух, валидация данных
    """
    try:
        rating = review_data.get('rating', 0)
        
        # Валидация
        if not 1 <= rating <= 5:
            logger.warning(f"Некорректный рейтинг: {rating}")
            rating = 5
        
        # Формирование текста
        stars_map = {
            5: '⭐⭐⭐⭐⭐ Отлично!',
            4: '⭐⭐⭐⭐ Хорошо',
            3: '⭐⭐⭐ Нормально',
            2: '⭐⭐ Плохо',
            1: '⭐ Ужасно'
        }
        
        text = (
            f"⭐ <b>НОВЫЙ ОТЗЫВ №{review_id:03d}</b>\n\n"
            f"{stars_map.get(rating, '⭐⭐⭐⭐⭐')}\n\n"
            f"👤 <b>Клиент:</b> {review_data.get('customer_name', 'Аноним')}\n"
            f"📞 <b>Телефон:</b> <code>{review_data.get('customer_phone', 'Не указан')}</code>\n"
            f"💬 <b>Отзыв:</b>\n<i>{review_data.get('comment', 'Нет')}</i>"
        )
        
        # Клавиатура
        phone = review_data.get('customer_phone', '').replace(' ', '').replace('+', '')
        keyboard = InlineKeyboardMarkup(
            inline_keyboard=[
                [
                    InlineKeyboardButton(
                        text="📞 Позвонить",
                        url=f"tel:{phone}"
                    ),
                    InlineKeyboardButton(
                        text="💬 Написать",
                        url=f"https://t.me/+{phone}"
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
        
        logger.info(f"✅ Отзыв #{review_id} отправлен")

    except Exception as e:
        logger.error(f"❌ send_review_notification error: {e}", exc_info=True)


async def send_order_notification(
    bot: Bot,
    order_data: dict,
    order_id: int
) -> None:
    """
    Отправка уведомления о новом заказе
    """
    try:
        text = (
            f"🚕 <b>НОВЫЙ ЗАКАЗ №{order_id:03d}</b>\n\n"
            f"📍 <b>Направление:</b> {order_data.get('direction', 'Не указано')}\n"
            f"💰 <b>Цена:</b> {order_data.get('price', 0):,} сум\n"
            f"👤 <b>Клиент:</b> {order_data.get('customer_name', 'Аноним')}\n"
            f"📞 <b>Телефон:</b> <code>{order_data.get('customer_phone', 'Не указан')}</code>\n"
            f"👥 <b>Пассажиров:</b> {order_data.get('passengers_count', 1)}\n"
            f"⏰ <b>Время звонка:</b> {order_data.get('preferred_call_time', 'Любое')}\n"
            f"💬 <b>Комментарий:</b>\n<i>{order_data.get('comment', 'Нет')}</i>"
        )

        # Клавиатура
        phone = order_data.get('customer_phone', '').replace(' ', '').replace('+', '')
        keyboard = InlineKeyboardMarkup(
            inline_keyboard=[
                [
                    InlineKeyboardButton(
                        text="📞 Позвонить",
                        url=f"tel:{phone}"
                    ),
                    InlineKeyboardButton(
                        text="💬 Написать",
                        url=f"https://t.me/+{phone}"
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

        logger.info(f"✅ Заказ #{order_id} отправлен")

    except Exception as e:
        logger.error(f"❌ send_order_notification error: {e}", exc_info=True)


# =============================================================================
# SERVERLESS EXPORTS
# =============================================================================

# Экспортируем функции для использования в main.py
__all__ = [
    'bot',
    'dp',
    'init_bot',
    'close_bot',
    'send_review_notification',
    'send_order_notification'
]

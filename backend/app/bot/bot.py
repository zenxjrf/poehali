"""
Telegram бот для сервиса Poehali
Оптимизированная версия v2.3
"""
import asyncio
import logging
from typing import Optional
from functools import lru_cache

from aiogram import Bot, Dispatcher, types
from aiogram.exceptions import TelegramAPIError
from aiogram.filters import Command, StateFilter
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram.types import (
    WebAppInfo,
    InlineKeyboardMarkup,
    InlineKeyboardButton,
    LabeledPrice
)

from backend.app.config import settings

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

    @staticmethod
    @lru_cache(maxsize=1)
    def get_main_keyboard() -> InlineKeyboardMarkup:
        """Возвращает кэшированную главную клавиатуру"""
        keyboard = InlineKeyboardMarkup(
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
        return keyboard

    @staticmethod
    def get_review_keyboard(phone: str) -> InlineKeyboardMarkup:
        """Создаёт клавиатуру для отзыва (не кэшируется)"""
        return InlineKeyboardMarkup(
            inline_keyboard=[
                [
                    InlineKeyboardButton(
                        text="📞 Позвонить",
                        url=f"tel:{phone}"
                    ),
                    InlineKeyboardButton(
                        text="💬 Telegram",
                        url=f"https://t.me/+{phone}"
                    )
                ]
            ]
        )

    @staticmethod
    def get_contact_keyboard(phone: str) -> InlineKeyboardMarkup:
        """Создаёт клавиатуру для связи с клиентом"""
        phone_clean = phone.replace(' ', '').replace('+', '')
        return InlineKeyboardMarkup(
            inline_keyboard=[
                [
                    InlineKeyboardButton(
                        text="📞 Позвонить",
                        url=f"tel:{phone_clean}"
                    ),
                    InlineKeyboardButton(
                        text="💬 Написать",
                        url=f"https://t.me/+{phone_clean}"
                    )
                ]
            ]
        )


# =============================================================================
# ИНИЦИАЛИЗАЦИЯ
# =============================================================================

# Глобальный объект бота (будет инициализирован при запуске)
_bot_instance: Optional[Bot] = None

storage = MemoryStorage()
dp = Dispatcher(storage=storage)


def get_bot() -> Optional[Bot]:
    """Получить текущий экземпляр бота"""
    return _bot_instance


async def init_bot() -> Bot:
    """Инициализация бота для serverless (Vercel)"""
    global _bot_instance
    if _bot_instance is None:
        _bot_instance = Bot(token=settings.BOT_TOKEN)
        logger.info("✅ Бот инициализирован для serverless режима")
    return _bot_instance


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

    except TelegramAPIError as e:
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
    except TelegramAPIError as e:
        logger.error(f"❌ Callback error: {e}")


@dp.message(Command("help"))
async def cmd_help(message: types.Message) -> None:
    """Обработчик команды /help"""
    help_text = (
        "📚 *Команды бота:*\n\n"
        "/start - Запустить бота\n"
        "/help - Показать эту справку\n"
        "/status - Статус вашего заказа\n"
        "/faq - Часто задаваемые вопросы\n\n"
        "🚕 *О сервисе:*\n"
        f"Маршрут: {Constants.ROUTE}\n"
        f"Цена: {Constants.PRICE_PER_PERSON:,} сум\n\n"
        "Нажмите кнопку ниже, чтобы открыть меню:"
    )
    
    try:
        await message.answer(
            text=help_text,
            reply_markup=Keyboards.get_main_keyboard(),
            parse_mode="Markdown"
        )
    except TelegramAPIError as e:
        logger.error(f"❌ /help error: {e}")


@dp.message(Command("faq"))
async def cmd_faq(message: types.Message) -> None:
    """Обработчик команды /faq с часто задаваемыми вопросами"""
    faq_text = (
        "❓ *Часто задаваемые вопросы:*\n\n"
        
        "🚗 *Как заказать такси?*\n"
        "Нажмите кнопку «🚕 Открыть меню» и заполните форму.\n\n"
        
        "💰 *Как оплачивать?*\n"
        "Оплата производится наличными водителю после поездки.\n\n"
        
        "⏰ *За сколько заказывать?*\n"
        "Рекомендуем заказывать минимум за 2-3 часа до поездки.\n\n"
        
        "🧳 *Можно ли с багажом?*\n"
        "Да, все автомобили имеют вместительный багажник.\n\n"
        
        "❄️ *Есть ли кондиционер?*\n"
        "Да, во всех автомобилях есть кондиционер.\n\n"
        
        "🐾 *Можно ли с животными?*\n"
        "Да, но уточняйте при заказе.\n\n"
        
        "👶 *Нужно ли детское кресло?*\n"
        "По запросу предоставим детское кресло.\n\n"
        
        "📞 *Как связаться с диспетчером?*\n"
        f"Нажмите кнопку «📞 Позвонить» или напишите @{Constants.SUPPORT_USERNAME}"
    )
    
    try:
        await message.answer(text=faq_text, parse_mode="Markdown")
    except TelegramAPIError as e:
        logger.error(f"❌ /faq error: {e}")


@dp.message(Command("status"))
async def cmd_status(message: types.Message) -> None:
    """Обработчик команды /status для проверки статуса заказа"""
    status_text = (
        "🔍 *Проверка статуса заказа*\n\n"
        "Для проверки статуса вашего заказа, пожалуйста, "
        "свяжитесь с диспетчером:\n\n"
        f"📞 {Constants.DISPATCHER_PHONE}\n"
        f"✈️ @{Constants.SUPPORT_USERNAME}"
    )
    
    try:
        await message.answer(text=status_text, parse_mode="Markdown")
    except TelegramAPIError as e:
        logger.error(f"❌ /status error: {e}")


@dp.message(Command("admin"))
async def cmd_admin(message: types.Message) -> None:
    """Обработчик команды /admin для администратора"""
    from backend.app.config import settings
    
    user_id = message.from_user.id
    if user_id != settings.ADMIN_CHAT_ID:
        logger.warning(f"⛔ Попытка доступа к админ-панели от {user_id}")
        return
    
    admin_text = (
        "🛠 *Админ-панель*\n\n"
        "Выберите действие:"
    )
    
    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="📊 Статистика",
                    callback_data="admin_stats"
                )
            ],
            [
                InlineKeyboardButton(
                    text="📢 Рассылка",
                    callback_data="admin_broadcast"
                )
            ],
            [
                InlineKeyboardButton(
                    text="💬 Отзывы",
                    callback_data="admin_reviews"
                )
            ]
        ]
    )
    
    try:
        await message.answer(text=admin_text, reply_markup=keyboard, parse_mode="Markdown")
    except TelegramAPIError as e:
        logger.error(f"❌ /admin error: {e}")


@dp.callback_query(lambda c: c.data.startswith("admin_"))
async def process_admin_callback(callback: types.CallbackQuery) -> None:
    """Обработчик кнопок админ-панели"""
    from backend.app.config import settings
    
    user_id = callback.from_user.id
    if user_id != settings.ADMIN_CHAT_ID:
        await callback.answer("❌ Нет доступа", show_alert=True)
        return
    
    action = callback.data.split("_")[1]
    
    try:
        if action == "stats":
            stats_text = (
                "📊 *Статистика:*\n\n"
                "Здесь будет статистика по заказам и отзывам."
            )
            await callback.message.answer(text=stats_text, parse_mode="Markdown")
        elif action == "broadcast":
            await callback.answer("Функция в разработке", show_alert=True)
        elif action == "reviews":
            await callback.answer("Функция в разработке", show_alert=True)
    except TelegramAPIError as e:
        logger.error(f"❌ Admin callback error: {e}")


@dp.message(lambda message: message.location)
async def handle_location(message: types.Message) -> None:
    """
    Обработчик геолокации
    Сохраняет местоположение пользователя
    """
    try:
        lat = message.location.latitude
        lon = message.location.longitude
        
        # Создаём ссылку на Google Maps
        maps_url = f"https://www.google.com/maps?q={lat},{lon}"
        
        location_text = (
            "📍 *Геолокация получена!*\n\n"
            f"Широта: {lat:.6f}\n"
            f"Долгота: {lon:.6f}\n\n"
            f"[Открыть в Google Maps]({maps_url})\n\n"
            "Теперь вы можете отправить эту точку диспетчеру."
        )
        
        keyboard = InlineKeyboardMarkup(
            inline_keyboard=[
                [
                    InlineKeyboardButton(
                        text="📞 Связаться с диспетчером",
                        url=f"tel:{Constants.DISPATCHER_PHONE.replace(' ', '')}"
                    )
                ]
            ]
        )
        
        await message.answer(
            text=location_text,
            reply_markup=keyboard,
            parse_mode="Markdown",
            disable_web_page_preview=False
        )
        
        logger.info(f"📍 Получена геолокация от {message.from_user.id}: {lat}, {lon}")
        
    except TelegramAPIError as e:
        logger.error(f"❌ Location error: {e}")
    except Exception as e:
        logger.error(f"❌ Location handling error: {e}")


@dp.message(Command("myorders"))
async def cmd_my_orders(message: types.Message) -> None:
    """Обработчик команды /myorders для просмотра истории заказов"""
    try:
        user_telegram_id = message.from_user.id
        
        # Запрос к API для получения истории
        import httpx
        from backend.app.config import settings
        
        # Получаем URL API из WEB_APP_URL или используем дефолтный
        api_url = settings.WEB_APP_URL.replace('poehali.vercel.app', 'poehali-backend.vercel.app')
        if not api_url.startswith('http'):
            api_url = f"https://{api_url}"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{api_url}/api/v1/orders/history/{user_telegram_id}",
                timeout=10.0
            )
            
            if response.status_code == 200:
                data = response.json()
                orders = data.get('orders', [])
                
                if not orders:
                    await message.answer(
                        "📋 *У вас пока нет заказов*\n\n"
                        "Нажмите кнопку ниже, чтобы сделать первый заказ:",
                        reply_markup=Keyboards.get_main_keyboard(),
                        parse_mode="Markdown"
                    )
                    return
                
                # Формируем сообщение с последними заказами
                text = "📋 *Ваши заказы:*\n\n"
                for order in orders[:5]:  # Показываем последние 5
                    status_emoji = {
                        'new': '🆕',
                        'progress': '⏳',
                        'confirmed': '✅',
                        'completed': '✔️',
                        'cancelled': '❌'
                    }.get(order['status'], '📝')
                    
                    text += (
                        f"{status_emoji} *Заказ #{order['id']}*\n"
                        f"📍 {order['trip_direction']}\n"
                        f"💰 {order['total_price']:,} сум\n"
                        f"📅 {order['created_at'][:16].replace('T', ' ')}\n"
                        f"💳 {'Оплачено' if order['payment_status'] == 'paid' else 'Не оплачено'}\n\n"
                    )
                
                await message.answer(text, parse_mode="Markdown")
            else:
                await message.answer(
                    "⚠️ Не удалось загрузить историю заказов.\n"
                    "Попробуйте позже или свяжитесь с поддержкой."
                )
                
    except httpx.RequestError as e:
        logger.error(f"❌ Ошибка запроса к API: {e}")
        await message.answer("⚠️ Сервис временно недоступен. Попробуйте позже.")
    except TelegramAPIError as e:
        logger.error(f"❌ /myorders error: {e}")
        await message.answer("❌ Произошла ошибка. Попробуйте позже.")


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
    Оптимизация: один запрос, валидация данных, кэширование клавиатуры
    """
    try:
        rating = review_data.get('rating', 0)

        # Валидация рейтинга
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
        phone = review_data.get('customer_phone', '')
        keyboard = Keyboards.get_contact_keyboard(phone)

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
    Оптимизация: кэширование клавиатуры, минимум логов
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
        phone = order_data.get('customer_phone', '')
        keyboard = Keyboards.get_contact_keyboard(phone)

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
    'get_bot',
    'init_bot',
    'close_bot',
    'send_review_notification',
    'send_order_notification'
]


# Для обратной совместимости создаём псевдоним
bot = _bot_instance

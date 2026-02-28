import asyncio
import logging

from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
from aiogram.types import WebAppInfo, InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.fsm.storage.memory import MemoryStorage

from app.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Инициализация бота и диспетчера
try:
    bot = Bot(token=settings.BOT_TOKEN)
    dp = Dispatcher(storage=MemoryStorage())
    logger.info("✅ Telegram бот инициализирован")
except Exception as e:
    logger.error(f"❌ Ошибка инициализации бота: {e}")
    raise


@dp.message(Command("start"))
async def cmd_start(message: types.Message):
    try:
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
                        url="https://t.me/fakertop"
                    )
                ]
            ]
        )
        
        await message.answer(
            "🚕 <b>Poehali — Ваше такси Ташкент ↔ Фергана</b>\n\n"
            "📌 <b>Как заказать такси:</b>\n"
            "1️⃣ Нажмите кнопку «🚕 Открыть меню»\n"
            "2️⃣ Выберите направление поездки\n"
            "3️⃣ Заполните форму заявки\n"
            "4️⃣ Дождитесь звонка от диспетчера\n\n"
            "💰 <b>Стоимость:</b>\n"
            "• Поездка: 150 000 сум с человека\n"
            "• Посылки: от 60 000 сум\n\n"
            "⏱ <b>Время в пути:</b> ~4 часа\n"
            "🚗 <b>Комфорт:</b> Кондиционер, удобные сиденья\n\n"
            "📞 <b>Связь с диспетчером:</b>\n"
            "• Кнопка «Позвонить» — быстрый звонок\n"
            "• Кнопка «Написать» — чат в Telegram\n\n"
            "✨ <b>Почему выбирают нас:</b>\n"
            "✓ Фиксированная цена\n"
            "✓ Проверенные водители\n"
            "✓ Подача в удобное время\n"
            "✓ Безопасность и комфорт\n\n"
            "Нажмите кнопку ниже, чтобы начать:",
            reply_markup=keyboard,
            parse_mode="HTML"
        )
    except Exception as e:
        logger.error(f"Ошибка в cmd_start: {e}")


@dp.callback_query(lambda c: c.data == "call_dispatcher")
async def process_call(callback: types.CallbackQuery):
    try:
        await callback.answer("📞 +998 94 136 54 74", show_alert=True)
    except Exception as e:
        logger.error(f"Ошибка в process_call: {e}")


async def send_order_notification(order_data: dict):
    """Отправка уведомления о новом заказе администратору"""
    try:
        direction_labels = {
            'tashkent_fergana': 'Ташкент → Фергана',
            'fergana_tashkent': 'Фергана → Ташкент'
        }
        
        text = (
            "🔔 <b>Новая заявка!</b>\n\n"
            f"👤 <b>Имя:</b> {order_data.get('customer_name', 'Не указано')}\n"
            f"📞 <b>Телефон:</b> {order_data.get('customer_phone', 'Не указан')}\n"
            f"🚕 <b>Направление:</b> {direction_labels.get(order_data.get('direction', 'Не указано'))}\n"
            f"⏰ <b>Удобное время:</b> {order_data.get('preferred_call_time', 'Не указано')}\n"
            f"👥 <b>Пассажиры:</b> {order_data.get('passengers_count', 1)} чел.\n"
            f"💬 <b>Комментарий:</b> {order_data.get('comment', 'Нет')}\n"
            f"💰 <b>Цена:</b> {order_data.get('price', 0):,} сум\n\n"
            f"🕒 <b>Время:</b> {order_data.get('created_at', 'Не указано')}"
        )
        
        keyboard = InlineKeyboardMarkup(
            inline_keyboard=[
                [
                    InlineKeyboardButton(
                        text="📞 Позвонить клиенту",
                        url=f"tel:{order_data.get('customer_phone', '')}"
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
        logger.info(f"✅ Уведомление отправлено администратору {settings.ADMIN_CHAT_ID}")
    except Exception as e:
        logger.error(f"❌ Ошибка отправки уведомления: {e}")

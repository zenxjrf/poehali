import asyncio
import logging

from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
from aiogram.types import WebAppInfo, InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram.types import LabeledPrice

from app.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Счётчик заявок
order_counter = 0

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
            "🚕 <b>Поехали — Ваше такси Ташкент ↔ Фергана</b>\n\n"
            "📌 <b>Как заказать такси:</b>\n"
            "1️⃣ Нажмите кнопку «🚕 Открыть меню»\n"
            "2️⃣ Выберите направление поездки\n"
            "3️⃣ Заполните форму заявки\n"
            "4️⃣ Добавьте геолокацию (по желанию)\n"
            "5️⃣ Дождитесь звонка от диспетчера\n\n"
            "💰 <b>Стоимость:</b>\n"
            "• Поездка: 200 000 сум с человека\n"
            "• Посылки: от 60 000 сум\n\n"
            "⏱ <b>Время в пути:</b> ~4 часа\n"
            "🚗 <b>Комфорт:</b> Кондиционер, удобные сиденья\n\n"
            "📍 <b>Геолокация:</b>\n"
            "Добавьте свою геолокацию при оформлении заявки — водитель найдёт вас быстрее!\n\n"
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


async def send_order_notification(order_data: dict, order_id: int = None):
    """
    Отправка уведомления о новом заказе в чат администратора
    Формат: 🔔 Поступила заявка №XXX
    """
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
            f"🔔 <b>Поступила заявка №{order_number:03d}</b>\n\n"
            f"👤 {order_data.get('customer_name', 'Клиент')}\n"
            f"📞 <code>{order_data.get('customer_phone', '')}</code>\n"
            f"🚕 {direction_labels.get(order_data.get('direction', ''), 'Направление')}\n"
            f"💰 {order_data.get('price', 0):,} сум"
        )
        
        # Полная информация
        full_text = (
            f"🔔 <b>ПОСТУПИЛА ЗАЯВКА №{order_number:03d}</b>\n\n"
            f"━━━━━━━━━━━━━━━━━━━━\n\n"
            f"👤 <b>Клиент:</b> {order_data.get('customer_name', 'Не указано')}\n"
            f"📞 <b>Телефон:</b> <code>{order_data.get('customer_phone', 'Не указан')}</code>\n"
            f"🚕 <b>Направление:</b> {direction_labels.get(order_data.get('direction', 'Не указано'))}\n"
            f"⏰ <b>Удобное время:</b> {order_data.get('preferred_call_time', 'Не указано')}\n"
            f"👥 <b>Пассажиры:</b> {order_data.get('passengers_count', 1)} чел.\n"
            f"💬 <b>Комментарий:</b> {order_data.get('comment', 'Нет') or 'Нет'}\n"
            f"💰 <b>Цена:</b> {order_data.get('price', 0):,} сум\n"
        )
        
        # Добавляем геолокацию если есть
        location = order_data.get('location')
        if location:
            full_text += f"\n📍 <b>Геолокация:</b> <a href='{location}'>Открыть на карте</a>\n"
        
        full_text += "\n━━━━━━━━━━━━━━━━━━━━\n"
        full_text += f"🕒 <b>Время:</b> {order_data.get('created_at', 'Только что')}"
        
        # Кнопки действий
        keyboard = InlineKeyboardMarkup(
            inline_keyboard=[
                [
                    InlineKeyboardButton(
                        text="📞 Позвонить",
                        url=f"tel:{order_data.get('customer_phone', '')}"
                    ),
                    InlineKeyboardButton(
                        text="💬 Написать",
                        url=f"https://t.me/+{order_data.get('customer_phone', '').replace('+', '').replace(' ', '')}"
                    )
                ],
                [
                    InlineKeyboardButton(
                        text="📍 Геолокация",
                        url=location if location else "https://maps.google.com"
                    )
                ]
            ]
        )
        
        # Отправляем короткое уведомление
        await bot.send_message(
            chat_id=settings.ADMIN_CHAT_ID,
            text=short_text,
            parse_mode="HTML"
        )
        
        # Отправляем полное уведомление с кнопками
        await bot.send_message(
            chat_id=settings.ADMIN_CHAT_ID,
            text=full_text,
            reply_markup=keyboard,
            parse_mode="HTML",
            disable_web_page_preview=True
        )
        
        logger.info(f"✅ Уведомление №{order_number} отправлено администратору {settings.ADMIN_CHAT_ID}")
    except Exception as e:
        logger.error(f"❌ Ошибка отправки уведомления: {e}")

from aiogram import Bot
from app.bot.bot import dp, send_review_notification, send_order_notification
from app.config import settings

# Инициализируем бота при импорте
bot = Bot(token=settings.BOT_TOKEN)

__all__ = ['bot', 'dp', 'send_review_notification', 'send_order_notification']

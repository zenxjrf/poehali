"""
Telegram бот для сервиса Poehali
Версия: 2.3
"""
from backend.app.bot.bot import (
    bot,
    dp,
    get_bot,
    init_bot,
    close_bot,
    send_review_notification,
    send_order_notification,
    Keyboards,
    Constants
)
from backend.app.bot.states import OrderForm, AdminForm, FeedbackForm
from backend.app.bot.middleware import LoggingMiddleware, ThrottlingMiddleware, AdminMiddleware
from backend.app.bot.utils import (
    format_phone,
    validate_phone,
    format_price,
    format_datetime,
    parse_call_time,
    sanitize_text,
    create_order_summary,
    get_direction_name,
    calculate_total_price
)
from backend.app.config import settings

__version__ = "2.3"

__all__ = [
    # Основные
    'bot',
    'dp',
    'get_bot',
    'init_bot',
    'close_bot',
    # Уведомления
    'send_review_notification',
    'send_order_notification',
    # Настройки
    'settings',
    # Клавиатуры
    'Keyboards',
    'Constants',
    # Состояния
    'OrderForm',
    'AdminForm',
    'FeedbackForm',
    # Middleware
    'LoggingMiddleware',
    'ThrottlingMiddleware',
    'AdminMiddleware',
    # Утилиты
    'format_phone',
    'validate_phone',
    'format_price',
    'format_datetime',
    'parse_call_time',
    'sanitize_text',
    'create_order_summary',
    'get_direction_name',
    'calculate_total_price',
    # Версия
    '__version__'
]

"""
Утилиты для бота
Вспомогательные функции для форматирования, валидации и т.д.
"""
import re
import logging
from typing import Optional, Tuple
from datetime import datetime

logger = logging.getLogger(__name__)


def format_phone(phone: str) -> str:
    """
    Форматирование номера телефона
    Пример: +998941365474 -> +998 94 136 54 74
    """
    # Удаляем всё кроме цифр и +
    cleaned = re.sub(r'[^\d+]', '', phone)
    
    # Добавляем + если нет
    if not cleaned.startswith('+'):
        cleaned = '+998' + cleaned.lstrip('8')
    
    # Форматируем
    if len(cleaned) == 13 and cleaned.startswith('+998'):
        return f"+998 {cleaned[4:6]} {cleaned[6:9]} {cleaned[9:11]} {cleaned[11:13]}"
    
    return phone


def validate_phone(phone: str) -> Tuple[bool, str]:
    """
    Валидация номера телефона
    Возвращает (успех, сообщение)
    """
    cleaned = re.sub(r'[^\d+]', '', phone)
    
    # Проверка для Узбекистана
    if len(cleaned) == 13 and cleaned.startswith('+998'):
        return True, cleaned
    elif len(cleaned) == 12 and cleaned.startswith('998'):
        return True, '+' + cleaned
    elif len(cleaned) == 9:
        return True, '+998' + cleaned
    
    return False, "Неверный формат номера. Используйте формат +998 XX XXX XX XX"


def format_price(price: int, currency: str = "сум") -> str:
    """
    Форматирование цены
    Пример: 150000 -> 150 000 сум
    """
    return f"{price:,} {currency}".replace(',', ' ')


def format_datetime(dt: datetime, format_str: str = "%d.%m.%Y %H:%M") -> str:
    """
    Форматирование даты и времени
    """
    return dt.strftime(format_str)


def parse_call_time(time_str: str) -> Optional[str]:
    """
    Парсинг предпочтительного времени звонка
    """
    time_options = {
        'morning': 'Утро (9:00 - 12:00)',
        'afternoon': 'День (12:00 - 17:00)',
        'evening': 'Вечер (17:00 - 21:00)',
        'any': 'Любое время'
    }
    return time_options.get(time_str.lower(), time_str)


def sanitize_text(text: str, max_length: int = 500) -> str:
    """
    Очистка текста от потенциально опасных символов
    """
    if not text:
        return ""
    
    # Удаляем HTML теги
    text = re.sub(r'<[^>]+>', '', text)
    
    # Ограничиваем длину
    if len(text) > max_length:
        text = text[:max_length] + "..."
    
    return text.strip()


def create_order_summary(order_data: dict) -> str:
    """
    Создание краткой сводки заказа
    """
    summary = (
        "📋 *Сводка заказа:*\n\n"
        f"📍 Направление: {order_data.get('direction', 'Не указано')}\n"
        f"👥 Пассажиры: {order_data.get('passengers_count', 1)}\n"
        f"👤 Имя: {order_data.get('customer_name', 'Не указано')}\n"
        f"📞 Телефон: {format_phone(order_data.get('customer_phone', ''))}\n"
        f"⏰ Время звонка: {parse_call_time(order_data.get('preferred_call_time', 'any')) or 'Любое'}\n"
    )
    
    if order_data.get('comment'):
        summary += f"💬 Комментарий: {sanitize_text(order_data['comment'], 100)}\n"
    
    return summary


def get_direction_name(direction_code: str) -> str:
    """
    Получение названия направления по коду
    """
    directions = {
        'tashkent_fergana': 'Ташкент → Фергана',
        'fergana_tashkent': 'Фергана → Ташкент'
    }
    return directions.get(direction_code, direction_code)


def calculate_total_price(base_price: int, passengers: int) -> int:
    """
    Расчёт общей стоимости поездки
    """
    return base_price * passengers

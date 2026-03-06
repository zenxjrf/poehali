"""
Middleware для бота
Логирование, проверка на бан, ограничение частоты запросов
"""
import logging
from time import time
from typing import Callable, Dict, Any

from aiogram import BaseMiddleware
from aiogram.types import Message, CallbackQuery

logger = logging.getLogger(__name__)


class LoggingMiddleware(BaseMiddleware):
    """Middleware для логирования всех событий"""

    async def __call__(
        self,
        handler: Callable,
        event: Message | CallbackQuery,
        data: Dict[str, Any]
    ) -> Any:
        user_id = getattr(event, 'from_user', None)
        if user_id:
            username = user_id.username or user_id.first_name
            logger.info(f"📨 Событие от {user_id} (@{username}): {type(event).__name__}")
        
        return await handler(event, data)


class ThrottlingMiddleware(BaseMiddleware):
    """
    Middleware для защиты от флуда
    Ограничивает частоту запросов от одного пользователя
    """

    def __init__(self, rate: float = 0.5):
        self.rate = rate
        self.last_request: Dict[int, float] = {}

    async def __call__(
        self,
        handler: Callable,
        event: Message | CallbackQuery,
        data: Dict[str, Any]
    ) -> Any:
        user_id = getattr(event, 'from_user', None)
        if not user_id:
            return await handler(event, data)

        user_id = user_id.id
        current_time = time()

        if user_id in self.last_request:
            elapsed = current_time - self.last_request[user_id]
            if elapsed < self.rate:
                logger.debug(f"⏱ Throttling user {user_id} (elapsed: {elapsed:.2f}s)")
                return None  # Игнорируем слишком частые запросы

        self.last_request[user_id] = current_time
        return await handler(event, data)


class AdminMiddleware(BaseMiddleware):
    """
    Middleware для проверки прав администратора
    """

    def __init__(self, admin_ids: list[int]):
        self.admin_ids = admin_ids

    async def __call__(
        self,
        handler: Callable,
        event: Message,
        data: Dict[str, Any]
    ) -> Any:
        user_id = event.from_user.id
        
        if user_id not in self.admin_ids:
            logger.warning(f"⛔ Доступ запрещён пользователю {user_id}")
            await event.answer("❌ У вас нет прав для выполнения этой команды")
            return None

        return await handler(event, data)

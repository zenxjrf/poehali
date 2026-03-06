import asyncio
import logging
import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from backend.app.database import engine, Base, async_session_maker
from backend.app.api import api_router
from backend.app.bot.bot import send_review_notification, send_order_notification, init_bot, get_bot, dp
from backend.app.bot.middleware import LoggingMiddleware, ThrottlingMiddleware
from backend.app.config import settings
from backend.app.schemas import OrderCreate

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        # Создание таблиц БД
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("✅ База данных инициализирована")
    except Exception as e:
        logger.error(f"❌ Ошибка инициализации БД: {e}")

    # Vercel serverless: не запускаем polling, только webhook
    # Бот работает через webhook, который обрабатывается в /webhook/telegram
    logger.info("✅ Serverless режим: бот работает через webhook")
    
    # Регистрируем middleware для бота
    dp.message.middleware(LoggingMiddleware())
    dp.message.middleware(ThrottlingMiddleware(rate=0.5))
    dp.callback_query.middleware(LoggingMiddleware())

    yield

    # Закрытие
    try:
        await engine.dispose()
        logger.info("✅ Соединения закрыты")
    except Exception as e:
        logger.error(f"Ошибка при закрытии соединений: {e}")


app = FastAPI(title="Poehali API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.post("/webhook/order")
async def order_webhook(order: OrderCreate):
    """Webhook для получения заказов из Web App"""
    try:
        # Создаём заказ в БД
        from sqlalchemy import select
        from backend.app.models import Trip, Order
        from backend.app.bot.bot import init_bot, get_bot

        # Инициализируем бота если нужно
        current_bot = get_bot()
        if current_bot is None:
            current_bot = await init_bot()

        # Работаем с БД через сессию
        async with async_session_maker() as db_session:
            try:
                # Проверка поездки
                trip_result = await db_session.execute(select(Trip).where(Trip.id == order.trip_id))
                trip = trip_result.scalar_one_or_none()
                if not trip:
                    return {"status": "error", "message": "Поездка не найдена"}

                # Создаём заказ
                db_order = Order(**order.model_dump())
                db_session.add(db_order)
                await db_session.commit()
                await db_session.refresh(db_order)

                # Отправляем уведомление с номером заказа
                order_data = order.model_dump()
                order_data['price'] = trip.price
                order_data['direction'] = order_data.get('direction', 'tashkent_fergana')

                asyncio.create_task(send_order_notification(current_bot, order_data, db_order.id))

                return {"status": "success", "message": "Заявка принята", "order_id": db_order.id}
            except Exception:
                await db_session.rollback()
                raise

    except Exception as e:
        logger.error(f"Ошибка обработки заявки: {e}")
        return {"status": "error", "message": str(e)}


@app.post("/webhook/telegram")
async def telegram_webhook(request: Request):
    """
    Webhook для Telegram бота (Vercel serverless)
    Установите webhook: https://api.telegram.org/bot<token>/setWebhook?url=<your-vercel-url>/webhook/telegram
    """
    from backend.app.bot.bot import bot, dp, init_bot, get_bot
    from aiogram.types import Update

    try:
        # Инициализируем бота если нужно
        current_bot = get_bot()
        if current_bot is None:
            current_bot = await init_bot()

        # Получаем JSON из запроса
        body = await request.json()
        logger.info(f"📨 Получен Telegram update: {body.get('update_id', 'unknown')}")

        # Преобразуем в Update
        update = Update(**body)

        # Обрабатываем через диспетчер
        await dp.feed_webhook_update(bot=current_bot, update=update)

        return {"status": "ok"}
    except Exception as e:
        logger.error(f"❌ Ошибка обработки Telegram update: {e}", exc_info=True)
        return {"status": "error", "message": str(e)}


@app.post("/webhook/setup")
async def setup_webhook_endpoint():
    """
    Endpoint для установки Telegram webhook
    Вызовите один раз после деплоя: POST /webhook/setup
    """
    from backend.app.bot.bot import init_bot, get_bot

    try:
        # Инициализируем бота
        current_bot = await init_bot()

        # Получаем URL из переменных окружения
        webhook_base = os.getenv("VERCEL_URL") or os.getenv("WEBHOOK_URL")

        if not webhook_base:
            return {"status": "error", "message": "VERCEL_URL или WEBHOOK_URL не найден"}

        telegram_webhook_url = f"https://{webhook_base}/webhook/telegram"
        await current_bot.set_webhook(webhook_url=telegram_webhook_url)
        logger.info(f"✅ Webhook установлен: {telegram_webhook_url}")

        return {"status": "success", "webhook_url": telegram_webhook_url}
    except Exception as e:
        logger.error(f"❌ Ошибка установки webhook: {e}")
        return {"status": "error", "message": str(e)}


@app.get("/webhook/info")
async def webhook_info():
    """Получить информацию о текущем webhook"""
    from backend.app.bot.bot import init_bot, get_bot

    try:
        current_bot = await init_bot()
        info = await current_bot.get_webhook_info()
        return {"status": "success", "url": info.url, "pending_updates": info.pending_update_count}
    except Exception as e:
        logger.error(f"Ошибка получения webhook info: {e}")
        return {"status": "error", "message": str(e)}


@app.get("/")
async def root():
    return {
        "message": "Poehali API is running",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Проверка здоровья приложения"""
    import time
    return {
        "status": "healthy",
        "timestamp": time.time()
    }


@app.get("/api/v1/status")
async def api_status():
    """Проверка доступности API"""
    return {
        "api": "available",
        "version": "1.0"
    }

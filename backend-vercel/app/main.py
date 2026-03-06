import asyncio
import logging
import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import engine, Base, async_session_maker
from app.api import api_router
from app.bot import send_review_notification, send_order_notification
from app.config import settings
from app.schemas import OrderCreate

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        # Создание таблиц БД
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("✅ Таблицы БД созданы")
        
        # Инициализация данных
        from sqlalchemy import select
        from app.models import Trip, Driver
        from app.database import async_session_maker
        
        async with async_session_maker() as session:
            # Проверка направлений
            result = await session.execute(select(Trip))
            trips = result.scalars().all()
            
            if not trips:
                logger.info("📍 Создаю направления...")
                trip1 = Trip(direction="tashkent_fergana", price=150000)
                trip2 = Trip(direction="fergana_tashkent", price=150000)
                session.add_all([trip1, trip2])
                
                # Создаю тестовых водителей
                drivers_data = [
                    Driver(name="Алишер", car_brand="Chevrolet", car_model="Malibu", car_year=2022, experience_years=5, description="Опытный водитель", has_air_conditioning=True, has_large_trunk=True, pets_allowed=False),
                    Driver(name="Рустам", car_brand="Chevrolet", car_model="Tracker", car_year=2023, experience_years=7, description="Комфортные поездки", has_air_conditioning=True, has_large_trunk=True, pets_allowed=True),
                    Driver(name="Сардор", car_brand="BYD", car_model="Han", car_year=2024, experience_years=4, description="Электромобиль", has_air_conditioning=True, has_large_trunk=True, pets_allowed=False),
                ]
                session.add_all(drivers_data)
                await session.commit()
                logger.info("✅ Данные инициализированы")
            else:
                logger.info("✅ Данные уже существуют")
                
    except Exception as e:
        logger.error(f"❌ Ошибка инициализации БД: {e}")

    # Vercel serverless: не запускаем polling, только webhook
    logger.info("✅ Serverless режим: бот работает через webhook")

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
        from app.models import Trip, Order
        from app.bot import bot, init_bot

        # Инициализируем бота если нужно
        if bot is None:
            await init_bot()

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

                asyncio.create_task(send_order_notification(bot, order_data, db_order.id))

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
    from app.bot import bot, dp, init_bot
    from aiogram.types import Update

    try:
        # Инициализируем бота если нужно
        if bot is None:
            await init_bot()

        # Получаем JSON из запроса
        body = await request.json()
        logger.info(f"📨 Получен Telegram update: {body.get('update_id', 'unknown')}")

        # Преобразуем в Update
        update = Update(**body)

        # Обрабатываем через диспетчер
        # feed_webhook_update автоматически отправляет результат через bot.session
        await dp.feed_webhook_update(bot=bot, update=update)

        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Ошибка обработки Telegram update: {e}", exc_info=True)
        return {"status": "error", "message": str(e)}


@app.post("/webhook/setup")
async def setup_webhook_endpoint():
    """
    Endpoint для установки Telegram webhook
    Вызовите один раз после деплоя: POST /webhook/setup
    """
    from app.bot import bot, init_bot

    try:
        # Инициализируем бота
        await init_bot()

        # Получаем URL из переменных окружения
        webhook_base = os.getenv("VERCEL_URL") or os.getenv("WEBHOOK_URL")
        
        if not webhook_base:
            return {"status": "error", "message": "VERCEL_URL или WEBHOOK_URL не найден"}

        telegram_webhook_url = f"https://{webhook_base}/webhook/telegram"
        await bot.set_webhook(webhook_url=telegram_webhook_url)
        logger.info(f"✅ Webhook установлен: {telegram_webhook_url}")
        
        return {"status": "success", "webhook_url": telegram_webhook_url}
    except Exception as e:
        logger.error(f"❌ Ошибка установки webhook: {e}")
        return {"status": "error", "message": str(e)}


@app.get("/webhook/info")
async def webhook_info():
    """Получить информацию о текущем webhook"""
    from app.bot import bot, init_bot
    
    try:
        await init_bot()
        info = await bot.get_webhook_info()
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

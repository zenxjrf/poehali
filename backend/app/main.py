import asyncio
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import engine, Base
from app.api import api_router
from app.bot import bot, dp, send_review_notification
from app.config import settings
from app.models import Driver, Trip, Order, Review
from app.schemas import ReviewCreate

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

    try:
        # Запуск бота
        await bot.delete_webhook()
        asyncio.create_task(dp.start_polling(bot))
        logger.info("✅ Telegram бот запущен")
    except Exception as e:
        logger.error(f"❌ Ошибка запуска бота: {e}")

    yield

    # Закрытие
    try:
        await bot.session.close()
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
        from app.database import get_db
        
        # Получаем сессию БД
        db_session = next(get_db())
        
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

            asyncio.create_task(send_review_notification(bot, order_data, db_order.id))
            
            return {"status": "success", "message": "Заявка принята", "order_id": db_order.id}
        finally:
            await db_session.close()
            
    except Exception as e:
        logger.error(f"Ошибка обработки заявки: {e}")
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
    return {
        "status": "healthy",
        "timestamp": asyncio.get_event_loop().time()
    }


@app.get("/api/v1/status")
async def api_status():
    """Проверка доступности API"""
    return {
        "api": "available",
        "version": "1.0"
    }

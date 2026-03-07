"""
Vercel Serverless Function Entry Point - Poehali API
"""
import asyncio
import logging
import os
import time

from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

# Импорты из локальных модулей
from database import engine, Base, async_session_maker
from routes_dir import api_router
from bot import send_order_notification, init_bot
from config import settings
from schemas import OrderCreate
from models import Trip, Driver, Order, Review

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Временные данные для serverless
TRIPS_DB = [
    {"id": 1, "direction": "tashkent_fergana", "price": 150000},
    {"id": 2, "direction": "fergana_tashkent", "price": 150000}
]

DRIVERS_DB = [
    {"id": 1, "name": "Алишер", "photo_url": None, "car_brand": "Chevrolet", "car_model": "Malibu", "car_year": 2022, "experience_years": 5, "description": "Опытный водитель", "is_active": True, "has_air_conditioning": True, "has_large_trunk": True, "pets_allowed": False},
    {"id": 2, "name": "Рустам", "photo_url": None, "car_brand": "Chevrolet", "car_model": "Tracker", "car_year": 2023, "experience_years": 7, "description": "Комфортные поездки", "is_active": True, "has_air_conditioning": True, "has_large_trunk": True, "pets_allowed": True},
    {"id": 3, "name": "Сардор", "photo_url": None, "car_brand": "BYD", "car_model": "Han", "car_year": 2024, "experience_years": 4, "description": "Электромобиль", "is_active": True, "has_air_conditioning": True, "has_large_trunk": True, "pets_allowed": False}
]

ORDERS_DB = []
REVIEWS_DB = []


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("✅ Таблицы БД созданы")
    except Exception as e:
        logger.error(f"❌ Ошибка инициализации БД: {e}")
    logger.info("✅ Serverless режим: бот работает через webhook")
    yield
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


@app.get("/")
async def root():
    return {"message": "Poehali API is running", "version": "1.0.0", "docs": "/docs"}


@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": time.time()}


@app.get("/api/v1/status")
async def api_status():
    return {"api": "available", "version": "1.0"}


@app.get("/api/drivers")
async def get_drivers():
    return DRIVERS_DB


@app.get("/api/trips")
async def get_trips():
    return TRIPS_DB


@app.post("/api/orders")
async def create_order(order: OrderCreate):
    try:
        trip = next((t for t in TRIPS_DB if t["id"] == order.trip_id), None)
        if not trip:
            raise HTTPException(status_code=404, detail="Поездка не найдена")

        order_data = order.model_dump()
        order_data["id"] = len(ORDERS_DB) + 1
        order_data["price"] = trip["price"]
        order_data["status"] = "new"
        ORDERS_DB.append(order_data)

        asyncio.create_task(send_order_notification(app, order_data, order_data["id"]))

        return {"status": "success", "message": "Заявка принята", "order_id": order_data["id"]}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка создания заказа: {e}")
        return {"status": "error", "message": str(e)}


@app.post("/webhook/telegram")
async def telegram_webhook(request: Request):
    from bot import bot, dp
    from aiogram.types import Update
    try:
        await init_bot()
        from bot import bot as current_bot
        if current_bot is None:
            return {"status": "error", "message": "Bot not initialized"}
        body = await request.json()
        update = Update(**body)
        await dp.feed_webhook_update(bot=current_bot, update=update)
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Ошибка Telegram webhook: {e}", exc_info=True)
        return {"status": "error", "message": str(e)}


@app.post("/webhook/setup")
async def setup_webhook():
    from bot import bot, init_bot
    try:
        await init_bot()
        webhook_base = os.getenv("VERCEL_URL") or os.getenv("WEBHOOK_URL")
        if not webhook_base:
            return {"status": "error", "message": "VERCEL_URL не найден"}
        telegram_webhook_url = f"https://{webhook_base}/webhook/telegram"
        await bot.set_webhook(webhook_url=telegram_webhook_url)
        return {"status": "success", "webhook_url": telegram_webhook_url}
    except Exception as e:
        return {"status": "error", "message": str(e)}

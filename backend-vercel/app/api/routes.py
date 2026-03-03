import logging
import asyncio

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.database import get_db
from app.models import Driver, Trip, Order, Review
from app.schemas import (
    DriverResponse, DriverCreate, DriverUpdate,
    TripResponse, TripCreate,
    OrderCreate, OrderResponse, OrderUpdate,
    ReviewCreate, ReviewResponse
)
from app.bot import bot, send_review_notification, init_bot

logger = logging.getLogger(__name__)

# Создаём router с префиксом
router = APIRouter(prefix="/api/v1")

# Временные данные для serverless (пока БД не работает стабильно)
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


# Drivers endpoints
@router.get("/drivers", response_model=List[DriverResponse])
async def get_drivers(db: AsyncSession = Depends(get_db)):
    try:
        # Временно используем фиктивные данные для serverless
        return DRIVERS_DB
    except Exception as e:
        logger.error(f"Ошибка получения водителей: {e}")
        raise HTTPException(status_code=500, detail="Ошибка сервера")


@router.get("/drivers/{driver_id}", response_model=DriverResponse)
async def get_driver(driver_id: int, db: AsyncSession = Depends(get_db)):
    try:
        driver = next((d for d in DRIVERS_DB if d["id"] == driver_id), None)
        if not driver:
            raise HTTPException(status_code=404, detail="Водитель не найден")
        return driver
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка получения водителя: {e}")
        raise HTTPException(status_code=500, detail="Ошибка сервера")


@router.get("/trips", response_model=List[TripResponse])
async def get_trips(db: AsyncSession = Depends(get_db)):
    try:
        # Временно используем фиктивные данные для serverless
        return TRIPS_DB
    except Exception as e:
        logger.error(f"Ошибка получения поездок: {e}")
        raise HTTPException(status_code=500, detail="Ошибка сервера")


@router.get("/trips/{direction}", response_model=TripResponse)
async def get_trip(direction: str, db: AsyncSession = Depends(get_db)):
    try:
        trip = next((t for t in TRIPS_DB if t["direction"] == direction), None)
        if not trip:
            raise HTTPException(status_code=404, detail="Направление не найдено")
        return trip
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка получения поездки: {e}")
        raise HTTPException(status_code=500, detail="Ошибка сервера")


@router.post("/drivers", response_model=DriverResponse)
async def create_driver(driver: DriverCreate, db: AsyncSession = Depends(get_db)):
    try:
        db_driver = Driver(**driver.model_dump())
        db.add(db_driver)
        await db.commit()
        await db.refresh(db_driver)
        return db_driver
    except Exception as e:
        logger.error(f"Ошибка создания водителя: {e}")
        raise HTTPException(status_code=500, detail="Ошибка сервера")


@router.put("/drivers/{driver_id}", response_model=DriverResponse)
async def update_driver(driver_id: int, driver: DriverUpdate, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(Driver).where(Driver.id == driver_id))
        db_driver = result.scalar_one_or_none()
        if not db_driver:
            raise HTTPException(status_code=404, detail="Водитель не найден")

        update_data = driver.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_driver, key, value)

        await db.commit()
        await db.refresh(db_driver)
        return db_driver
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка обновления водителя: {e}")
        raise HTTPException(status_code=500, detail="Ошибка сервера")


@router.delete("/drivers/{driver_id}")
async def delete_driver(driver_id: int, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(Driver).where(Driver.id == driver_id))
        db_driver = result.scalar_one_or_none()
        if not db_driver:
            raise HTTPException(status_code=404, detail="Водитель не найден")

        await db.delete(db_driver)
        await db.commit()
        return {"message": "Водитель удалён"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка удаления водителя: {e}")
        raise HTTPException(status_code=500, detail="Ошибка сервера")


# Trips endpoints
@router.get("/trips", response_model=List[TripResponse])
async def get_trips(db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(Trip))
        trips = result.scalars().all()
        return trips
    except Exception as e:
        logger.error(f"Ошибка получения поездок: {e}")
        raise HTTPException(status_code=500, detail="Ошибка сервера")


@router.get("/trips/{direction}", response_model=TripResponse)
async def get_trip(direction: str, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(Trip).where(Trip.direction == direction))
        trip = result.scalar_one_or_none()
        if not trip:
            raise HTTPException(status_code=404, detail="Направление не найдено")
        return trip
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка получения поездки: {e}")
        raise HTTPException(status_code=500, detail="Ошибка сервера")


@router.put("/trips/{trip_id}", response_model=TripResponse)
async def update_trip(trip_id: int, trip_data: TripCreate, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(Trip).where(Trip.id == trip_id))
        db_trip = result.scalar_one_or_none()
        if not db_trip:
            raise HTTPException(status_code=404, detail="Поездка не найдена")

        db_trip.price = trip_data.price
        await db.commit()
        await db.refresh(db_trip)
        return db_trip
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка обновления поездки: {e}")
        raise HTTPException(status_code=500, detail="Ошибка сервера")


# Orders endpoints
@router.post("/orders", response_model=OrderResponse)
async def create_order(order: OrderCreate, db: AsyncSession = Depends(get_db)):
    try:
        # Проверка существования поездки
        trip = next((t for t in TRIPS_DB if t["id"] == order.trip_id), None)
        if not trip:
            raise HTTPException(status_code=404, detail="Поездка не найдена")

        # Создаём заказ
        order_data = order.model_dump()
        order_data["id"] = len(ORDERS_DB) + 1
        order_data["trip_id"] = order.trip_id
        order_data["driver_id"] = order.driver_id
        order_data["status"] = "new"
        order_data["created_at"] = "2026-03-03T00:00:00"
        ORDERS_DB.append(order_data)

        # Отправляем уведомление с номером заказа
        order_data['price'] = trip['price']
        order_data['direction'] = order_data.get('direction', 'tashkent_fergana')

        asyncio.create_task(send_order_notification(bot, order_data, order_data["id"]))

        return order_data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка создания заказа: {e}")
        raise HTTPException(status_code=500, detail="Ошибка сервера")


@router.get("/orders", response_model=List[OrderResponse])
async def get_orders(db: AsyncSession = Depends(get_db)):
    try:
        return ORDERS_DB
    except Exception as e:
        logger.error(f"Ошибка получения заказов: {e}")
        raise HTTPException(status_code=500, detail="Ошибка сервера")


@router.get("/orders/{order_id}", response_model=OrderResponse)
async def get_order(order_id: int, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(Order).where(Order.id == order_id))
        order = result.scalar_one_or_none()
        if not order:
            raise HTTPException(status_code=404, detail="Заказ не найден")
        return order
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка получения заказа: {e}")
        raise HTTPException(status_code=500, detail="Ошибка сервера")


@router.put("/orders/{order_id}", response_model=OrderResponse)
async def update_order(order_id: int, order: OrderUpdate, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(Order).where(Order.id == order_id))
        db_order = result.scalar_one_or_none()
        if not db_order:
            raise HTTPException(status_code=404, detail="Заказ не найден")

        update_data = order.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_order, key, value)

        await db.commit()
        await db.refresh(db_order)
        return db_order
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка обновления заказа: {e}")
        raise HTTPException(status_code=500, detail="Ошибка сервера")


# Reviews endpoints
@router.post("/reviews", response_model=ReviewResponse)
async def create_review(review: ReviewCreate, db: AsyncSession = Depends(get_db)):
    try:
        # Создаём отзыв
        review_data = review.model_dump()
        review_data["id"] = len(REVIEWS_DB) + 1
        review_data["created_at"] = "2026-03-03T00:00:00"
        REVIEWS_DB.append(review_data)

        # Отправляем уведомление администратору
        # Инициализируем бота если нужно (для serverless)
        if bot is None:
            await init_bot()
        asyncio.create_task(send_review_notification(bot, review_data, review_data["id"]))

        return review_data
    except Exception as e:
        logger.error(f"Ошибка создания отзыва: {e}")
        raise HTTPException(status_code=500, detail="Ошибка сервера")


@router.get("/reviews", response_model=List[ReviewResponse])
async def get_reviews(db: AsyncSession = Depends(get_db)):
    try:
        return REVIEWS_DB
    except Exception as e:
        logger.error(f"Ошибка получения отзывов: {e}")
        raise HTTPException(status_code=500, detail="Ошибка сервера")

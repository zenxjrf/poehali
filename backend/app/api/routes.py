import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.database import get_db
from app.models import Driver, Trip, Order, Review
from app.schemas import (
    DriverResponse, DriverCreate, DriverUpdate,
    TripResponse,
    OrderCreate, OrderResponse, OrderUpdate,
    ReviewCreate, ReviewResponse
)

logger = logging.getLogger(__name__)

# Создаём router с префиксом
router = APIRouter(prefix="/api/v1")


# Drivers endpoints
@router.get("/drivers", response_model=List[DriverResponse])
async def get_drivers(db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(Driver).where(Driver.is_active == True))
        drivers = result.scalars().all()
        return drivers
    except Exception as e:
        logger.error(f"Ошибка получения водителей: {e}")
        raise HTTPException(status_code=500, detail="Ошибка сервера")


@router.get("/drivers/{driver_id}", response_model=DriverResponse)
async def get_driver(driver_id: int, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(Driver).where(Driver.id == driver_id))
        driver = result.scalar_one_or_none()
        if not driver:
            raise HTTPException(status_code=404, detail="Водитель не найден")
        return driver
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка получения водителя: {e}")
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


# Orders endpoints
@router.post("/orders", response_model=OrderResponse)
async def create_order(order: OrderCreate, db: AsyncSession = Depends(get_db)):
    try:
        # Проверка существования поездки
        trip_result = await db.execute(select(Trip).where(Trip.id == order.trip_id))
        trip = trip_result.scalar_one_or_none()
        if not trip:
            raise HTTPException(status_code=404, detail="Поездка не найдена")

        # Проверка водителя если указан
        if order.driver_id:
            driver_result = await db.execute(select(Driver).where(Driver.id == order.driver_id))
            driver = driver_result.scalar_one_or_none()
            if not driver:
                raise HTTPException(status_code=404, detail="Водитель не найден")

        db_order = Order(**order.model_dump())
        db.add(db_order)
        await db.commit()
        await db.refresh(db_order)
        return db_order
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка создания заказа: {e}")
        raise HTTPException(status_code=500, detail="Ошибка сервера")


@router.get("/orders", response_model=List[OrderResponse])
async def get_orders(db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(Order).order_by(Order.created_at.desc()))
        orders = result.scalars().all()
        return orders
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
        db_review = Review(**review.model_dump())
        db.add(db_review)
        await db.commit()
        await db.refresh(db_review)
        
        # Отправляем уведомление администратору
        from app.bot.bot import send_review_notification
        import asyncio
        asyncio.create_task(send_review_notification(review.model_dump(), db_review.id))
        
        return db_review
    except Exception as e:
        logger.error(f"Ошибка создания отзыва: {e}")
        raise HTTPException(status_code=500, detail="Ошибка сервера")


@router.get("/reviews", response_model=List[ReviewResponse])
async def get_reviews(db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(Review).order_by(Review.created_at.desc()))
        reviews = result.scalars().all()
        return reviews
    except Exception as e:
        logger.error(f"Ошибка получения отзывов: {e}")
        raise HTTPException(status_code=500, detail="Ошибка сервера")

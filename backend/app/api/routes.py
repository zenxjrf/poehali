import logging
import asyncio
import csv
from datetime import datetime
from typing import List, Optional
from io import StringIO

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.app.database import get_db
from backend.app.models import Driver, Trip, Order, Review, Payment, OrderStatus
from backend.app.schemas import (
    DriverResponse, DriverCreate, DriverUpdate,
    TripResponse, TripCreate,
    OrderCreate, OrderResponse, OrderUpdate,
    ReviewCreate, ReviewResponse,
    PaymentCreate, PaymentResponse,
    OrderHistoryResponse, ExportFormat
)
from backend.app.bot.bot import bot, send_review_notification, init_bot
from backend.app.services import click_service, payme_service, stats_service

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
        # Инициализируем бота если нужно (для serverless)
        from backend.app.bot.bot import get_bot
        current_bot = get_bot()
        if current_bot is None:
            current_bot = await init_bot()
        asyncio.create_task(send_review_notification(current_bot, review.model_dump(), db_review.id))

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


# =============================================================================
# PAYMENT ENDPOINTS (Click / Payme)
# =============================================================================


@router.post("/payment/click/create")
async def create_click_payment(payment: PaymentCreate, db: AsyncSession = Depends(get_db)):
    """Создание ссылки на оплату через Click"""
    try:
        # Проверка заказа
        order_result = await db.execute(select(Order).where(Order.id == payment.order_id))
        order = order_result.scalar_one_or_none()
        if not order:
            raise HTTPException(status_code=404, detail="Заказ не найден")
        
        # Создание ссылки на оплату
        payment_url = click_service.create_payment_url(payment.order_id, payment.amount)
        
        if not payment_url:
            raise HTTPException(status_code=500, detail="Ошибка создания ссылки на оплату")
        
        # Сохранение платежа в БД
        db_payment = Payment(
            order_id=payment.order_id,
            provider="click",
            amount=payment.amount,
            status="pending"
        )
        db.add(db_payment)
        await db.commit()
        await db.refresh(db_payment)
        
        return {
            "status": "success",
            "payment_url": payment_url,
            "payment_id": db_payment.id
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка создания Click платежа: {e}")
        raise HTTPException(status_code=500, detail="Ошибка сервера")


@router.post("/payment/payme/create")
async def create_payme_payment(payment: PaymentCreate, db: AsyncSession = Depends(get_db)):
    """Создание ссылки на оплату через Payme"""
    try:
        # Проверка заказа
        order_result = await db.execute(select(Order).where(Order.id == payment.order_id))
        order = order_result.scalar_one_or_none()
        if not order:
            raise HTTPException(status_code=404, detail="Заказ не найден")
        
        # Создание ссылки на оплату
        payment_url = payme_service.create_payment_url(payment.order_id, payment.amount)
        
        if not payment_url:
            raise HTTPException(status_code=500, detail="Ошибка создания ссылки на оплату")
        
        # Сохранение платежа в БД
        db_payment = Payment(
            order_id=payment.order_id,
            provider="payme",
            amount=payment.amount,
            status="pending"
        )
        db.add(db_payment)
        await db.commit()
        await db.refresh(db_payment)
        
        return {
            "status": "success",
            "payment_url": payment_url,
            "payment_id": db_payment.id
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка создания Payme платежа: {e}")
        raise HTTPException(status_code=500, detail="Ошибка сервера")


@router.post("/payment/click/callback")
async def click_callback(request: Request, db: AsyncSession = Depends(get_db)):
    """Callback от Click для обработки оплаты"""
    try:
        form_data = await request.form()
        data = dict(form_data)
        
        # Обработка callback
        result = click_service.handle_callback(data)
        
        if result['status'] == 'success':
            # Обновление статуса платежа в БД
            order_id = int(data.get('param1', 0))
            payment_result = await db.execute(
                select(Payment).where(Payment.order_id == order_id).order_by(Payment.created_at.desc())
            )
            payment = payment_result.scalar_one_or_none()
            
            if payment:
                payment.status = "success"
                payment.transaction_id = data.get('click_trans_id')
                payment.paid_at = datetime.now()
                
                # Обновление статуса заказа
                order_result = await db.execute(select(Order).where(Order.id == order_id))
                order = order_result.scalar_one_or_none()
                if order:
                    order.payment_status = "paid"
                
                await db.commit()
        
        return result
    except Exception as e:
        logger.error(f"Ошибка обработки Click callback: {e}")
        return {"status": "error", "error": 500, "error_note": str(e)}


@router.post("/payment/payme/callback")
async def payme_callback_endpoint(request: Request, db: AsyncSession = Depends(get_db)):
    """Callback от Payme для обработки оплаты"""
    try:
        body = await request.json()
        method = body.get('method', '')
        params = body.get('params', {})
        
        # Обработка callback
        result = payme_service.handle_callback(method, params)
        
        # Если успешно - обновляем БД
        if 'error' not in result and method == 'PerformTransaction':
            order_id = params.get('account', {}).get('order_id')
            if order_id:
                payment_result = await db.execute(
                    select(Payment).where(Payment.order_id == order_id).order_by(Payment.created_at.desc())
                )
                payment = payment_result.scalar_one_or_none()
                
                if payment:
                    payment.status = "success"
                    payment.transaction_id = str(params.get('id', ''))
                    payment.paid_at = datetime.now()
                    
                    order_result = await db.execute(select(Order).where(Order.id == order_id))
                    order = order_result.scalar_one_or_none()
                    if order:
                        order.payment_status = "paid"
                    
                    await db.commit()
        
        return result
    except Exception as e:
        logger.error(f"Ошибка обработки Payme callback: {e}")
        return {"error": {"code": -32603, "message": str(e)}}


# =============================================================================
# STATS & ANALYTICS ENDPOINTS
# =============================================================================


@router.get("/stats/dashboard")
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    """Получение статистики для дашборда"""
    try:
        stats = await stats_service.get_dashboard_stats(db)
        return {"status": "success", "data": stats}
    except Exception as e:
        logger.error(f"Ошибка получения статистики: {e}")
        raise HTTPException(status_code=500, detail="Ошибка сервера")


@router.get("/stats/orders")
async def get_order_stats(db: AsyncSession = Depends(get_db)):
    """Статистика по заказам"""
    try:
        stats = await stats_service.get_order_stats(db)
        return {"status": "success", "data": stats}
    except Exception as e:
        logger.error(f"Ошибка получения статистики заказов: {e}")
        raise HTTPException(status_code=500, detail="Ошибка сервера")


@router.get("/stats/drivers")
async def get_driver_stats(limit: int = 10, db: AsyncSession = Depends(get_db)):
    """Статистика по водителям"""
    try:
        stats = await stats_service.get_driver_stats(db, limit)
        return {"status": "success", "data": stats}
    except Exception as e:
        logger.error(f"Ошибка получения статистики водителей: {e}")
        raise HTTPException(status_code=500, detail="Ошибка сервера")


@router.get("/orders/history/{user_telegram_id}", response_model=OrderHistoryResponse)
async def get_user_order_history(user_telegram_id: int, db: AsyncSession = Depends(get_db)):
    """История заказов пользователя по Telegram ID"""
    try:
        history = await stats_service.get_user_order_history(db, user_telegram_id)
        return history
    except Exception as e:
        logger.error(f"Ошибка получения истории заказов: {e}")
        raise HTTPException(status_code=500, detail="Ошибка сервера")


@router.get("/orders/export")
async def export_orders(
    format: ExportFormat = ExportFormat.CSV,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Экспорт заказов в CSV или XLSX"""
    try:
        # Построение запроса
        query = select(Order).join(Trip)
        
        if start_date:
            query = query.where(Order.created_at >= start_date)
        if end_date:
            query = query.where(Order.created_at <= end_date)
        if status:
            query = query.where(Order.status == status)
        
        query = query.order_by(Order.created_at.desc())
        result = await db.execute(query)
        orders = result.scalars().all()
        
        if format == ExportFormat.CSV:
            # CSV экспорт
            output = StringIO()
            writer = csv.writer(output)
            writer.writerow(['ID', 'Дата', 'Клиент', 'Телефон', 'Направление', 'Статус', 'Сумма', 'Оплата'])
            
            for order in orders:
                writer.writerow([
                    order.id,
                    order.created_at.strftime('%Y-%m-%d %H:%M'),
                    order.customer_name,
                    order.customer_phone,
                    order.trip.direction if order.trip else 'N/A',
                    order.status,
                    order.total_price or 0,
                    order.payment_status
                ])
            
            return StreamingResponse(
                iter([output.getvalue()]),
                media_type="text/csv",
                headers={"Content-Disposition": "attachment; filename=orders.csv"}
            )
        else:
            # XLSX экспорт (требует openpyxl)
            raise HTTPException(status_code=501, detail="XLSX экспорт пока не реализован")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка экспорта заказов: {e}")
        raise HTTPException(status_code=500, detail="Ошибка сервера")


# =============================================================================
# DRIVER RATING ENDPOINTS
# =============================================================================

@router.put("/drivers/{driver_id}/rating")
async def update_driver_rating(
    driver_id: int,
    rating: float,
    db: AsyncSession = Depends(get_db)
):
    """Обновление рейтинга водителя"""
    try:
        result = await db.execute(select(Driver).where(Driver.id == driver_id))
        driver = result.scalar_one_or_none()
        if not driver:
            raise HTTPException(status_code=404, detail="Водитель не найден")
        
        # Обновление рейтинга (среднее значение)
        driver.rating = rating
        await db.commit()
        await db.refresh(driver)
        
        return driver
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка обновления рейтинга: {e}")
        raise HTTPException(status_code=500, detail="Ошибка сервера")

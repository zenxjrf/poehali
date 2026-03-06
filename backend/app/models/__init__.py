from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Float, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from backend.app.database import Base

from backend.app.models.review import Review

__all__ = ['Driver', 'Trip', 'Order', 'Review', 'Payment', 'OrderStatus', 'Base']


class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    photo_url = Column(String(500), nullable=True)
    car_brand = Column(String(50), nullable=False)
    car_model = Column(String(50), nullable=False)
    car_year = Column(Integer, nullable=False)
    experience_years = Column(Integer, default=0)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)

    # Удобства автомобиля
    has_air_conditioning = Column(Boolean, default=True)  # ❄️ Кондиционер
    has_large_trunk = Column(Boolean, default=True)        # 🧳 Большой багажник
    pets_allowed = Column(Boolean, default=False)          # 🐾 Можно с животными

    # Рейтинг водителя
    rating = Column(Float, default=5.0)
    total_trips = Column(Integer, default=0)
    total_reviews = Column(Integer, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    orders = relationship("Order", back_populates="driver", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="driver", cascade="all, delete-orphan")

    __table_args__ = (
        Index('ix_drivers_rating', 'rating', postgresql_using='btree'),
        Index('ix_drivers_is_active', 'is_active'),
    )


class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    direction = Column(String(50), nullable=False, index=True)  # "tashkent_fergana" или "fergana_tashkent"
    price = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True)

    orders = relationship("Order", back_populates="trip")


class OrderStatus:
    """Статусы заказа"""
    NEW = "new"              # Новый заказ
    IN_PROGRESS = "progress" # В работе
    CONFIRMED = "confirmed"  # Подтверждён
    COMPLETED = "completed"  # Завершён
    CANCELLED = "cancelled"  # Отменён
    PAID = "paid"            # Оплачен


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True)
    user_telegram_id = Column(Integer, nullable=True, index=True)  # Для истории заказов

    customer_name = Column(String(100), nullable=False)
    customer_phone = Column(String(20), nullable=False, index=True)
    preferred_call_time = Column(String(50), nullable=True)
    passengers_count = Column(Integer, default=1)
    comment = Column(Text, nullable=True)
    location = Column(String(500), nullable=True)  # Геолокация (Google Maps URL)
    location_lat = Column(Float, nullable=True)  # Широта
    location_lon = Column(Float, nullable=True)  # Долгота

    status = Column(String(20), default=OrderStatus.NEW, index=True)
    total_price = Column(Integer, nullable=True)  # Общая стоимость
    payment_status = Column(String(20), default="unpaid")  # unpaid, paid, refunded

    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    trip = relationship("Trip", back_populates="orders")
    driver = relationship("Driver", back_populates="orders")
    payment = relationship("Payment", back_populates="order", uselist=False, cascade="all, delete-orphan")

    __table_args__ = (
        Index('ix_orders_status_created', 'status', 'created_at'),
        Index('ix_orders_customer_phone', 'customer_phone'),
    )


class Payment(Base):
    """Модель платежей"""
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    
    provider = Column(String(20), nullable=False)  # click, payme
    transaction_id = Column(String(100), nullable=True)  # ID транзакции у провайдера
    amount = Column(Integer, nullable=False)  # Сумма в сумах
    
    status = Column(String(20), default="pending")  # pending, success, failed, refunded
    payment_data = Column(Text, nullable=True)  # JSON данные от провайдера
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    paid_at = Column(DateTime(timezone=True), nullable=True)

    order = relationship("Order", back_populates="payment")

    __table_args__ = (
        Index('ix_payments_order_id', 'order_id'),
        Index('ix_payments_transaction_id', 'transaction_id'),
    )

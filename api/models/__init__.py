from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base

from models.review import Review

__all__ = ['Driver', 'Trip', 'Order', 'Review', 'Base']


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
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    orders = relationship("Order", back_populates="driver", cascade="all, delete-orphan")


class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    direction = Column(String(50), nullable=False)  # "tashkent_fergana" или "fergana_tashkent"
    price = Column(Integer, nullable=False)  # цена в сумах

    orders = relationship("Order", back_populates="trip")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True)
    
    customer_name = Column(String(100), nullable=False)
    customer_phone = Column(String(20), nullable=False)
    preferred_call_time = Column(String(50), nullable=True)
    passengers_count = Column(Integer, default=1)
    comment = Column(Text, nullable=True)
    location = Column(String(500), nullable=True)  # Геолокация (Google Maps URL)
    
    status = Column(String(20), default="new")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    trip = relationship("Trip", back_populates="orders")
    driver = relationship("Driver", back_populates="orders")

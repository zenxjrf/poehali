from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from backend.app.schemas.review import ReviewBase, ReviewCreate, ReviewResponse
from backend.app.schemas.payment import (
    PaymentBase, PaymentCreate, PaymentUpdate, PaymentResponse,
    PaymentProvider, PaymentStatus,
    ClickCallback, ClickResponse,
    PaymeCallback, PaymeParams, PaymeResponse
)
from backend.app.schemas.stats import (
    OrderHistoryItem, OrderHistoryResponse,
    DriverStats, OrderStats, DailyStats, DashboardStats,
    ExportFormat, ExportRequest
)

__all__ = [
    # Driver
    'DriverBase', 'DriverCreate', 'DriverUpdate', 'DriverResponse',
    # Trip
    'TripBase', 'TripCreate', 'TripResponse',
    # Order
    'OrderBase', 'OrderCreate', 'OrderUpdate', 'OrderResponse',
    # Review
    'ReviewBase', 'ReviewCreate', 'ReviewResponse',
    # Payment
    'PaymentBase', 'PaymentCreate', 'PaymentUpdate', 'PaymentResponse',
    'PaymentProvider', 'PaymentStatus',
    'ClickCallback', 'ClickResponse',
    'PaymeCallback', 'PaymeParams', 'PaymeResponse',
    # Stats
    'OrderHistoryItem', 'OrderHistoryResponse',
    'DriverStats', 'OrderStats', 'DailyStats', 'DashboardStats',
    'ExportFormat', 'ExportRequest'
]


# Driver schemas
class DriverBase(BaseModel):
    name: str
    photo_url: Optional[str] = None
    car_brand: str
    car_model: str
    car_year: int
    experience_years: int = 0
    description: Optional[str] = None
    is_active: bool = True
    has_air_conditioning: bool = True
    has_large_trunk: bool = True
    pets_allowed: bool = False


class DriverCreate(DriverBase):
    pass


class DriverUpdate(BaseModel):
    name: Optional[str] = None
    photo_url: Optional[str] = None
    car_brand: Optional[str] = None
    car_model: Optional[str] = None
    car_year: Optional[int] = None
    experience_years: Optional[int] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    has_air_conditioning: Optional[bool] = None
    has_large_trunk: Optional[bool] = None
    pets_allowed: Optional[bool] = None


class DriverResponse(DriverBase):
    id: int
    rating: float = 5.0
    total_trips: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


# Trip schemas
class TripBase(BaseModel):
    direction: str
    price: int
    is_active: bool = True


class TripCreate(TripBase):
    pass


class TripResponse(TripBase):
    id: int

    class Config:
        from_attributes = True


# Order schemas
class OrderBase(BaseModel):
    customer_name: str
    customer_phone: str
    preferred_call_time: Optional[str] = None
    passengers_count: int = 1
    comment: Optional[str] = None
    location: Optional[str] = None


class OrderCreate(OrderBase):
    trip_id: int
    driver_id: Optional[int] = None


class OrderUpdate(BaseModel):
    status: Optional[str] = None
    driver_id: Optional[int] = None


class OrderResponse(OrderBase):
    id: int
    trip_id: int
    driver_id: Optional[int]
    user_telegram_id: Optional[int]
    status: str
    total_price: Optional[int]
    payment_status: str
    created_at: datetime
    updated_at: Optional[datetime]
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True

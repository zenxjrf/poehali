from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from backend.app.schemas.review import ReviewBase, ReviewCreate, ReviewResponse

__all__ = ['DriverBase', 'DriverCreate', 'DriverUpdate', 'DriverResponse',
           'TripBase', 'TripCreate', 'TripResponse',
           'OrderBase', 'OrderCreate', 'OrderUpdate', 'OrderResponse',
           'ReviewBase', 'ReviewCreate', 'ReviewResponse']


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
    created_at: datetime

    class Config:
        from_attributes = True


# Trip schemas
class TripBase(BaseModel):
    direction: str
    price: int


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
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

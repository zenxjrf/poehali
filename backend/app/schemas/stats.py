"""
Схемы для статистики и истории заказов
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class OrderHistoryItem(BaseModel):
    """Элемент истории заказа"""
    id: int
    trip_direction: str
    status: str
    total_price: int
    payment_status: str
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class OrderHistoryResponse(BaseModel):
    """Ответ с историей заказов пользователя"""
    orders: List[OrderHistoryItem]
    total_count: int
    active_count: int


class DriverStats(BaseModel):
    """Статистика водителя"""
    id: int
    name: str
    total_orders: int
    completed_orders: int
    rating: float
    total_reviews: int


class OrderStats(BaseModel):
    """Статистика по заказам"""
    total_orders: int
    new_orders: int
    in_progress_orders: int
    confirmed_orders: int
    completed_orders: int
    cancelled_orders: int
    total_revenue: int
    paid_orders: int
    unpaid_revenue: int


class DailyStats(BaseModel):
    """Дневная статистика"""
    date: str
    orders_count: int
    revenue: int
    avg_rating: float


class DashboardStats(BaseModel):
    """Статистика для дашборда"""
    order_stats: OrderStats
    driver_stats: List[DriverStats]
    daily_stats: List[DailyStats]
    top_drivers: List[DriverStats]


class ExportFormat(str, Enum):
    CSV = "csv"
    XLSX = "xlsx"


class ExportRequest(BaseModel):
    """Запрос на экспорт данных"""
    format: ExportFormat = ExportFormat.CSV
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: Optional[str] = None

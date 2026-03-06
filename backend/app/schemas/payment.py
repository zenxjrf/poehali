"""
Схемы для платежей
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class PaymentProvider(str, Enum):
    CLICK = "click"
    PAYME = "payme"


class PaymentStatus(str, Enum):
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"
    REFUNDED = "refunded"


class PaymentBase(BaseModel):
    order_id: int
    provider: PaymentProvider
    amount: int


class PaymentCreate(PaymentBase):
    transaction_id: Optional[str] = None
    payment_data: Optional[str] = None


class PaymentUpdate(BaseModel):
    status: Optional[PaymentStatus] = None
    transaction_id: Optional[str] = None
    payment_data: Optional[str] = None


class PaymentResponse(PaymentBase):
    id: int
    transaction_id: Optional[str]
    status: str
    payment_data: Optional[str]
    created_at: datetime
    paid_at: Optional[datetime]

    class Config:
        from_attributes = True


# Схемы для Click
class ClickCallback(BaseModel):
    click_trans_id: str
    merchant_prepare_id: str
    click_paydoc_id: str
    merchant_id: str
    amount: str
    action: int  # 0 - prepare, 1 - complete
    error: int
    error_note: Optional[str] = None


class ClickResponse(BaseModel):
    status: str
    merchant_id: Optional[int] = None
    click_trans_id: Optional[str] = None
    click_paydoc_id: Optional[str] = None
    error: int = 0
    error_note: Optional[str] = None


# Схемы для Payme
class PaymeCallback(BaseModel):
    id: int  # ID запроса
    method: str
    params: dict


class PaymeParams(BaseModel):
    amount: int  # В тийинах (1/100 сума)
    account: dict
    merchant_id: str
    lang: str = "ru"


class PaymeResponse(BaseModel):
    id: int
    result: Optional[dict] = None
    error: Optional[dict] = None

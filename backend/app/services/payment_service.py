"""
Сервис платежей для Click и Payme
"""
import logging
import hashlib
import json
from typing import Optional, Dict, Any
from datetime import datetime

from backend.app.config import settings

logger = logging.getLogger(__name__)


class ClickService:
    """Сервис для работы с Click API"""
    
    # Click API параметры
    CLICK_URL = "https://my.click.uz/api"
    
    def __init__(self):
        self.merchant_id = getattr(settings, 'CLICK_MERCHANT_ID', None)
        self.secret_key = getattr(settings, 'CLICK_SECRET_KEY', None)
    
    def generate_sign(self, params: Dict[str, Any]) -> str:
        """Генерация подписи для Click"""
        if not self.secret_key:
            logger.error("CLICK_SECRET_KEY не настроен")
            return ""
        
        # Параметры для подписи
        sign_string = f"{self.merchant_id}{params.get('click_trans_id', '')}{self.secret_key}"
        return hashlib.md5(sign_string.encode()).hexdigest().upper()
    
    def verify_callback(self, data: Dict[str, Any]) -> bool:
        """Проверка подписи от Click"""
        if not self.secret_key:
            return False
        
        # Ожидаемая подпись
        expected_sign = self.generate_sign(data)
        return data.get('sign_string', '').upper() == expected_sign
    
    def create_payment_url(self, order_id: int, amount: int) -> str:
        """Создание ссылки на оплату Click"""
        if not self.merchant_id:
            logger.error("CLICK_MERCHANT_ID не настроен")
            return ""
        
        params = {
            'merchant_id': self.merchant_id,
            'service_id': order_id,
            'merchant_trans_id': f"ORDER_{order_id}_{int(datetime.now().timestamp())}",
            'amount': amount / 100,  # Click принимает в сумах
            'param1': order_id,
        }
        
        # Генерируем подпись
        sign_string = f"{self.merchant_id}{params['merchant_trans_id']}{self.secret_key}"
        params['sign_string'] = hashlib.md5(sign_string.encode()).hexdigest().upper()
        
        # Создаём URL
        query = "&".join([f"{k}={v}" for k, v in params.items()])
        return f"{self.CLICK_URL}?{query}"
    
    def handle_callback(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Обработка callback от Click
        Возвращает статус оплаты
        """
        # Проверка подписи
        if not self.verify_callback(data):
            logger.error("Неверная подпись Click")
            return {
                'status': 'error',
                'error': 1,
                'error_note': 'Invalid signature'
            }
        
        # Проверка параметров
        if not all(k in data for k in ['click_trans_id', 'merchant_prepare_id', 'amount']):
            return {
                'status': 'error',
                'error': 2,
                'error_note': 'Invalid parameters'
            }
        
        return {
            'status': 'success',
            'click_trans_id': data['click_trans_id'],
            'merchant_prepare_id': data['merchant_prepare_id'],
            'amount': float(data['amount'])
        }


class PaymeService:
    """Сервис для работы с Payme API"""
    
    # Payme API параметры
    PAYME_URL = "https://checkout.paycom.uz"
    
    def __init__(self):
        self.merchant_id = getattr(settings, 'PAYME_MERCHANT_ID', None)
        self.secret_key = getattr(settings, 'PAYME_SECRET_KEY', None)
    
    def generate_sign(self, params: str) -> str:
        """Генерация подписи для Payme"""
        if not self.secret_key:
            logger.error("PAYME_SECRET_KEY не настроен")
            return ""
        
        return hashlib.sha256(f"{params}{self.secret_key}".encode()).hexdigest()
    
    def verify_callback(self, params: str, sign: str) -> bool:
        """Проверка подписи от Payme"""
        expected_sign = self.generate_sign(params)
        return sign == expected_sign
    
    def create_payment_url(self, order_id: int, amount: int) -> str:
        """Создание ссылки на оплату Payme"""
        if not self.merchant_id:
            logger.error("PAYME_MERCHANT_ID не настроен")
            return ""
        
        # Payme принимает amount в тийинах (1/100 сума)
        amount_in_tiyins = amount * 100
        
        params = {
            'merchant': self.merchant_id,
            'amount': amount_in_tiyins,
            'account.order_id': order_id,
            'lang': 'ru',
        }
        
        # Создаём URL
        query = "&".join([f"{k}={v}" for k, v in params.items()])
        return f"{self.PAYME_URL}?{query}"
    
    def handle_callback(self, method: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Обработка callback от Payme
        Возвращает результат выполнения метода
        """
        # Проверка подписи
        if not self.verify_callback(json.dumps(params), params.get('sign', '')):
            logger.error("Неверная подпись Payme")
            return {
                'error': {
                    'code': -32504,
                    'message': 'Invalid signature'
                }
            }
        
        # Обработка методов
        if method == 'CheckTransaction':
            return self._check_transaction(params)
        elif method == 'PerformTransaction':
            return self._perform_transaction(params)
        elif method == 'CancelTransaction':
            return self._cancel_transaction(params)
        else:
            return {
                'error': {
                    'code': -32601,
                    'message': 'Method not found'
                }
            }
    
    def _check_transaction(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Проверка транзакции"""
        order_id = params.get('account', {}).get('order_id')
        amount = params.get('amount', 0)
        
        # Здесь должна быть проверка заказа в БД
        return {
            'result': {
                'allow': True,
                'minimum': amount,
                'maximum': amount
            }
        }
    
    def _perform_transaction(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Выполнение транзакции"""
        order_id = params.get('account', {}).get('order_id')
        
        return {
            'result': {
                'transaction': params.get('id'),
                'state': 2,  # Успешно
                'create_time': int(datetime.now().timestamp() * 1000),
                'perform_time': int(datetime.now().timestamp() * 1000),
                'cancel_time': None,
                'transaction_time': int(datetime.now().timestamp() * 1000),
                'amount': params.get('amount', 0),
                'receiver': self.merchant_id,
                'order_id': order_id,
                'error': None
            }
        }
    
    def _cancel_transaction(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Отмена транзакции"""
        return {
            'result': {
                'transaction': params.get('id'),
                'cancel_time': int(datetime.now().timestamp() * 1000),
                'state': -2  # Отменено
            }
        }


# Глобальные экземпляры сервисов
click_service = ClickService()
payme_service = PaymeService()

"""
Сервисы для бизнес-логики
"""
from backend.app.services.payment_service import click_service, payme_service, ClickService, PaymeService
from backend.app.services.stats_service import stats_service, StatsService

__all__ = [
    'click_service',
    'payme_service',
    'ClickService',
    'PaymeService',
    'stats_service',
    'StatsService'
]

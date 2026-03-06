"""
Сервис статистики и аналитики
"""
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models import Order, Driver, Review, Trip, OrderStatus
from backend.app.schemas.stats import OrderStats, DriverStats, DailyStats

logger = logging.getLogger(__name__)


class StatsService:
    """Сервис для получения статистики"""
    
    @staticmethod
    async def get_order_stats(db: AsyncSession) -> OrderStats:
        """Получение статистики по заказам"""
        # Общий количество заказов
        total_query = select(func.count(Order.id))
        total_result = await db.execute(total_query)
        total_orders = total_result.scalar() or 0
        
        # Заказы по статусам
        status_queries = {
            'new': select(func.count(Order.id)).where(Order.status == OrderStatus.NEW),
            'progress': select(func.count(Order.id)).where(Order.status == OrderStatus.IN_PROGRESS),
            'confirmed': select(func.count(Order.id)).where(Order.status == OrderStatus.CONFIRMED),
            'completed': select(func.count(Order.id)).where(Order.status == OrderStatus.COMPLETED),
            'cancelled': select(func.count(Order.id)).where(Order.status == OrderStatus.CANCELLED),
        }
        
        new_orders = in_progress_orders = confirmed_orders = completed_orders = cancelled_orders = 0
        
        for status, query in status_queries.items():
            result = await db.execute(query)
            count = result.scalar() or 0
            if status == 'new':
                new_orders = count
            elif status == 'progress':
                in_progress_orders = count
            elif status == 'confirmed':
                confirmed_orders = count
            elif status == 'completed':
                completed_orders = count
            elif status == 'cancelled':
                cancelled_orders = count
        
        # Общая выручка (только завершённые заказы)
        revenue_query = select(func.sum(Order.total_price)).where(
            Order.status == OrderStatus.COMPLETED
        )
        revenue_result = await db.execute(revenue_query)
        total_revenue = revenue_result.scalar() or 0
        
        # Оплаченные заказы
        paid_query = select(func.count(Order.id)).where(Order.payment_status == 'paid')
        paid_result = await db.execute(paid_query)
        paid_orders = paid_result.scalar() or 0
        
        # Неоплаченная выручка
        unpaid_query = select(func.sum(Order.total_price)).where(
            and_(
                Order.status == OrderStatus.COMPLETED,
                Order.payment_status == 'unpaid'
            )
        )
        unpaid_result = await db.execute(unpaid_query)
        unpaid_revenue = unpaid_result.scalar() or 0
        
        return OrderStats(
            total_orders=total_orders,
            new_orders=new_orders,
            in_progress_orders=in_progress_orders,
            confirmed_orders=confirmed_orders,
            completed_orders=completed_orders,
            cancelled_orders=cancelled_orders,
            total_revenue=total_revenue,
            paid_orders=paid_orders,
            unpaid_revenue=unpaid_revenue or 0
        )
    
    @staticmethod
    async def get_driver_stats(db: AsyncSession, limit: int = 10) -> List[DriverStats]:
        """Получение статистики по водителям"""
        query = select(
            Driver.id,
            Driver.name,
            func.count(Order.id).label('total_orders'),
            func.sum(
                case(
                    (Order.status == OrderStatus.COMPLETED, 1),
                    else_=0
                )
            ).label('completed_orders'),
            Driver.rating,
            Driver.total_reviews
        ).join(Order, Driver.id == Order.driver_id, isouter=True).group_by(Driver.id).limit(limit)
        
        result = await db.execute(query)
        rows = result.fetchall()
        
        return [
            DriverStats(
                id=row.id,
                name=row.name,
                total_orders=row.total_orders or 0,
                completed_orders=row.completed_orders or 0,
                rating=float(row.rating) if row.rating else 5.0,
                total_reviews=row.total_reviews or 0
            )
            for row in rows
        ]
    
    @staticmethod
    async def get_daily_stats(db: AsyncSession, days: int = 7) -> List[DailyStats]:
        """Получение дневной статистики за последние N дней"""
        today = datetime.now().date()
        start_date = today - timedelta(days=days)
        
        # Заказы по дням
        query = select(
            func.date(Order.created_at).label('date'),
            func.count(Order.id).label('orders_count'),
            func.sum(Order.total_price).label('revenue')
        ).where(
            and_(
                Order.created_at >= start_date,
                Order.status == OrderStatus.COMPLETED
            )
        ).group_by(func.date(Order.created_at)).order_by(func.date(Order.created_at))
        
        result = await db.execute(query)
        rows = result.fetchall()
        
        # Средний рейтинг по дням
        rating_query = select(
            func.date(Review.created_at).label('date'),
            func.avg(Review.rating).label('avg_rating')
        ).where(
            Review.created_at >= start_date
        ).group_by(func.date(Review.created_at))
        
        rating_result = await db.execute(rating_query)
        rating_rows = rating_result.fetchall()
        
        # Создаём словарь с рейтингами
        rating_dict = {str(row.date): float(row.avg_rating) if row.avg_rating else 5.0 
                      for row in rating_rows}
        
        # Формируем результат
        daily_stats = []
        for row in rows:
            date_str = str(row.date)
            daily_stats.append(
                DailyStats(
                    date=date_str,
                    orders_count=row.orders_count or 0,
                    revenue=row.revenue or 0,
                    avg_rating=rating_dict.get(date_str, 5.0)
                )
            )
        
        return daily_stats
    
    @staticmethod
    async def get_dashboard_stats(db: AsyncSession) -> Dict[str, Any]:
        """Получение полной статистики для дашборда"""
        order_stats = await StatsService.get_order_stats(db)
        driver_stats = await StatsService.get_driver_stats(db)
        daily_stats = await StatsService.get_daily_stats(db)
        
        # Топ водителей по количеству заказов
        top_drivers = sorted(driver_stats, key=lambda x: x.total_orders, reverse=True)[:5]
        
        return {
            'order_stats': order_stats,
            'driver_stats': driver_stats,
            'daily_stats': daily_stats,
            'top_drivers': top_drivers
        }
    
    @staticmethod
    async def get_user_order_history(db: AsyncSession, user_telegram_id: int, limit: int = 20) -> Dict[str, Any]:
        """Получение истории заказов пользователя"""
        # Общее количество
        total_query = select(func.count(Order.id)).where(
            Order.user_telegram_id == user_telegram_id
        )
        total_result = await db.execute(total_query)
        total_count = total_result.scalar() or 0
        
        # Активные заказы
        active_query = select(func.count(Order.id)).where(
            and_(
                Order.user_telegram_id == user_telegram_id,
                Order.status.in_([OrderStatus.NEW, OrderStatus.IN_PROGRESS, OrderStatus.CONFIRMED])
            )
        )
        active_result = await db.execute(active_query)
        active_count = active_result.scalar() or 0
        
        # Заказы с информацией о поездке
        query = select(
            Order.id,
            Trip.direction,
            Order.status,
            Order.total_price,
            Order.payment_status,
            Order.created_at,
            Order.completed_at
        ).join(Trip, Order.trip_id == Trip.id).where(
            Order.user_telegram_id == user_telegram_id
        ).order_by(Order.created_at.desc()).limit(limit)
        
        result = await db.execute(query)
        rows = result.fetchall()
        
        orders = [
            {
                'id': row.id,
                'trip_direction': row.direction,
                'status': row.status,
                'total_price': row.total_price or 0,
                'payment_status': row.payment_status,
                'created_at': row.created_at,
                'completed_at': row.completed_at
            }
            for row in rows
        ]
        
        return {
            'orders': orders,
            'total_count': total_count,
            'active_count': active_count
        }


# Глобальный экземпляр сервиса
stats_service = StatsService()

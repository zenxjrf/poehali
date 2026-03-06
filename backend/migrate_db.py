"""
Скрипт для обновления базы данных
Добавляет новые поля в существующие таблицы
"""
import asyncio
import logging
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from backend.app.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def migrate_db():
    """Выполнение миграции базы данных"""
    
    logger.info(f"Подключение к базе данных: {settings.DATABASE_URL}")
    
    # Создаём движок
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    
    async with engine.begin() as conn:
        try:
            logger.info("Начало миграции...")
            
            # 1. Добавляем поля в таблицу drivers
            logger.info("Обновление таблицы drivers...")
            await conn.execute(text("""
                ALTER TABLE drivers ADD COLUMN IF NOT EXISTS rating FLOAT DEFAULT 5.0;
            """))
            await conn.execute(text("""
                ALTER TABLE drivers ADD COLUMN IF NOT EXISTS total_trips INTEGER DEFAULT 0;
            """))
            await conn.execute(text("""
                ALTER TABLE drivers ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;
            """))
            
            # 2. Добавляем поля в таблицу orders
            logger.info("Обновление таблицы orders...")
            await conn.execute(text("""
                ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_telegram_id INTEGER;
            """))
            await conn.execute(text("""
                ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_price INTEGER;
            """))
            await conn.execute(text("""
                ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'unpaid';
            """))
            await conn.execute(text("""
                ALTER TABLE orders ADD COLUMN IF NOT EXISTS location_lat FLOAT;
            """))
            await conn.execute(text("""
                ALTER TABLE orders ADD COLUMN IF NOT EXISTS location_lon FLOAT;
            """))
            await conn.execute(text("""
                ALTER TABLE orders ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
            """))
            
            # 3. Добавляем поле is_active в таблицу trips
            logger.info("Обновление таблицы trips...")
            await conn.execute(text("""
                ALTER TABLE trips ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
            """))
            
            # 4. Добавляем поля в таблицу reviews
            logger.info("Обновление таблицы reviews...")
            await conn.execute(text("""
                ALTER TABLE reviews ADD COLUMN IF NOT EXISTS driver_id INTEGER REFERENCES drivers(id);
            """))
            await conn.execute(text("""
                ALTER TABLE reviews ADD COLUMN IF NOT EXISTS order_id INTEGER;
            """))
            
            # 5. Создаём таблицу payments если не существует
            logger.info("Создание таблицы payments...")
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS payments (
                    id SERIAL PRIMARY KEY,
                    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
                    provider VARCHAR(20) NOT NULL,
                    transaction_id VARCHAR(100),
                    amount INTEGER NOT NULL,
                    status VARCHAR(20) DEFAULT 'pending',
                    payment_data TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    paid_at TIMESTAMP WITH TIME ZONE
                );
            """))
            
            # 6. Создаём индексы для ускорения поиска
            logger.info("Создание индексов...")
            await conn.execute(text("""
                CREATE INDEX IF NOT EXISTS ix_orders_user_telegram_id ON orders(user_telegram_id);
            """))
            await conn.execute(text("""
                CREATE INDEX IF NOT EXISTS ix_orders_status ON orders(status);
            """))
            await conn.execute(text("""
                CREATE INDEX IF NOT EXISTS ix_orders_customer_phone ON orders(customer_phone);
            """))
            await conn.execute(text("""
                CREATE INDEX IF NOT EXISTS ix_payments_order_id ON payments(order_id);
            """))
            await conn.execute(text("""
                CREATE INDEX IF NOT EXISTS ix_drivers_rating ON drivers(rating);
            """))
            
            await conn.commit()
            logger.info("✅ Миграция успешно завершена!")
            
        except Exception as e:
            logger.error(f"❌ Ошибка миграции: {e}")
            await conn.rollback()
            raise
        finally:
            await engine.dispose()


if __name__ == "__main__":
    logger.info("🚀 Запуск миграции базы данных...")
    asyncio.run(migrate_db())
    logger.info("👋 Миграция завершена!")

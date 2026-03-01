import asyncio
import logging

from sqlalchemy.ext.asyncio import create_async_engine

from app.database import Base, async_session_maker, engine
from app.models import Driver, Trip

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Данные для заполнения
DRIVERS_DATA = []

TRIPS_DATA = [
    {
        "direction": "tashkent_fergana",
        "price": 200000
    },
    {
        "direction": "fergana_tashkent",
        "price": 200000
    }
]


async def seed_db():
    try:
        # Создание таблиц
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)
        logger.info("✅ Таблицы созданы")

        async with async_session_maker() as session:
            # Добавление направлений
            for trip_data in TRIPS_DATA:
                trip = Trip(**trip_data)
                session.add(trip)

            await session.commit()
            logger.info("✅ База данных успешно заполнена!")
            logger.info(f"   - Добавлено направлений: {len(TRIPS_DATA)}")
    except Exception as e:
        logger.error(f"❌ Ошибка заполнения БД: {e}")
        raise


if __name__ == "__main__":
    asyncio.run(seed_db())

import asyncio
import logging

from sqlalchemy.ext.asyncio import create_async_engine

from app.database import Base, async_session_maker, engine
from app.models import Driver, Trip

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Данные для заполнения
DRIVERS_DATA = [
    {
        "name": "Алишер Каримов",
        "photo_url": None,
        "car_brand": "Chevrolet",
        "car_model": "Malibu",
        "car_year": 2022,
        "experience_years": 5,
        "description": "Езжу аккуратно, кондиционер, 3 места",
        "is_active": True,
        "has_air_conditioning": True,
        "has_large_trunk": True,
        "pets_allowed": False
    },
    {
        "name": "Рустам Абдуллаев",
        "photo_url": None,
        "car_brand": "Hyundai",
        "car_model": "Sonata",
        "car_year": 2021,
        "experience_years": 7,
        "description": "Комфортный салон, музыка, вода в подарок",
        "is_active": True,
        "has_air_conditioning": True,
        "has_large_trunk": True,
        "pets_allowed": True
    },
    {
        "name": "Фарход Усманов",
        "photo_url": None,
        "car_brand": "Kia",
        "car_model": "K5",
        "car_year": 2023,
        "experience_years": 4,
        "description": "Новый автомобиль, детский стульчик есть",
        "is_active": True,
        "has_air_conditioning": True,
        "has_large_trunk": False,
        "pets_allowed": False
    },
    {
        "name": "Бахром Рахмонов",
        "photo_url": None,
        "car_brand": "Chevrolet",
        "car_model": "Cobalt",
        "car_year": 2020,
        "experience_years": 8,
        "description": "Опытный водитель, знаю все маршруты",
        "is_active": True,
        "has_air_conditioning": True,
        "has_large_trunk": True,
        "pets_allowed": True
    },
    {
        "name": "Жасурбек Алимов",
        "photo_url": None,
        "car_brand": "Volkswagen",
        "car_model": "Passat",
        "car_year": 2019,
        "experience_years": 10,
        "description": "Бизнес класс, Wi-Fi в машине",
        "is_active": True,
        "has_air_conditioning": True,
        "has_large_trunk": True,
        "pets_allowed": False
    }
]

TRIPS_DATA = [
    {
        "direction": "tashkent_fergana",
        "price": 250000
    },
    {
        "direction": "fergana_tashkent",
        "price": 250000
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

            # Добавление водителей
            for driver_data in DRIVERS_DATA:
                driver = Driver(**driver_data)
                session.add(driver)

            await session.commit()
            logger.info("✅ База данных успешно заполнена!")
            logger.info(f"   - Добавлено направлений: {len(TRIPS_DATA)}")
            logger.info(f"   - Добавлено водителей: {len(DRIVERS_DATA)}")
    except Exception as e:
        logger.error(f"❌ Ошибка заполнения БД: {e}")
        raise


if __name__ == "__main__":
    asyncio.run(seed_db())

"""
Скрипт для инициализации базы данных
Создаёт направления и тестовых водителей
"""
import asyncio
import sys
from pathlib import Path

# Добавляем app в path
app_path = Path(__file__).parent / "app"
sys.path.insert(0, str(app_path))

from app.database import engine, Base, get_db
from app.models import Trip, Driver
from sqlalchemy import select


async def init_db():
    """Инициализация БД"""
    print("🔄 Инициализация базы данных...")
    
    # Создание таблиц
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Таблицы созданы")
    
    # Получаем сессию
    db_session = get_db()
    session = await db_session.__anext__()
    
    try:
        # Проверка направлений
        result = await session.execute(select(Trip))
        trips = result.scalars().all()
        
        if not trips:
            print("📍 Создаю направления...")
            # Создаю направления
            trip1 = Trip(direction="tashkent_fergana", price=150000)
            trip2 = Trip(direction="fergana_tashkent", price=150000)
            session.add_all([trip1, trip2])
            await session.commit()
            print("✅ Направления созданы")
        else:
            print("✅ Направления уже существуют")
        
        # Проверка водителей
        result = await session.execute(select(Driver))
        drivers = result.scalars().all()
        
        if not drivers:
            print("🚕 Создаю водителей...")
            # Создаю тестовых водителей
            drivers_data = [
                Driver(
                    name="Алишер",
                    car_brand="Chevrolet",
                    car_model="Malibu",
                    car_year=2022,
                    experience_years=5,
                    description="Опытный водитель. Вежливый и аккуратный.",
                    has_air_conditioning=True,
                    has_large_trunk=True,
                    pets_allowed=False
                ),
                Driver(
                    name="Рустам",
                    car_brand="Chevrolet",
                    car_model="Tracker",
                    car_year=2023,
                    experience_years=7,
                    description="Комфортные поездки. Кондиционер, багажник.",
                    has_air_conditioning=True,
                    has_large_trunk=True,
                    pets_allowed=True
                ),
                Driver(
                    name="Сардор",
                    car_brand="BYD",
                    car_model="Han",
                    car_year=2024,
                    experience_years=4,
                    description="Электромобиль. Тихо и комфортно.",
                    has_air_conditioning=True,
                    has_large_trunk=True,
                    pets_allowed=False
                ),
            ]
            session.add_all(drivers_data)
            await session.commit()
            print("✅ Водители созданы")
        else:
            print("✅ Водители уже существуют")
        
        print("\n🎉 База данных успешно инициализирована!")
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        await session.rollback()
    finally:
        await session.close()


if __name__ == "__main__":
    asyncio.run(init_db())

import logging

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

logger = logging.getLogger(__name__)

try:
    # Определение диалекта
    if settings.DATABASE_URL.startswith("sqlite"):
        engine = create_async_engine(
            settings.DATABASE_URL,
            echo=False,
            connect_args={"check_same_thread": False}
        )
    else:
        engine = create_async_engine(
            settings.DATABASE_URL,
            echo=False,
            pool_pre_ping=True,
            pool_size=5,
            max_overflow=10
        )
    logger.info("✅ Database engine created")
except Exception as e:
    logger.error(f"❌ Database engine error: {e}")
    raise

async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception as e:
            logger.error(f"Database session error: {e}")
            await session.rollback()
            raise
        finally:
            await session.close()

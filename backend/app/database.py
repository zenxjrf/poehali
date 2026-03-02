import logging
import os

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

logger = logging.getLogger(__name__)

try:
    # Определение диалекта
    if "sqlite" in settings.DATABASE_URL:
        # SQLite для serverless (Vercel)
        engine = create_async_engine(
            settings.DATABASE_URL,
            echo=False,
            connect_args={"check_same_thread": False}
        )
        logger.info("✅ SQLite engine created for serverless")
    elif "postgresql" in settings.DATABASE_URL:
        # PostgreSQL с оптимизацией для serverless
        engine = create_async_engine(
            settings.DATABASE_URL,
            echo=False,
            # Serverless: меньше соединений, нет pre_ping
            pool_size=2,
            max_overflow=2,
            pool_pre_ping=False,
            pool_recycle=300,
        )
        logger.info("✅ PostgreSQL engine created with serverless settings")
    else:
        # Другие БД
        engine = create_async_engine(
            settings.DATABASE_URL,
            echo=False
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

import logging
import os
from pathlib import Path

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool

from app.config import settings

logger = logging.getLogger(__name__)

try:
    # Определение диалекта
    db_url = settings.DATABASE_URL

    # Обработка относительных путей для SQLite
    if db_url.startswith("sqlite+aiosqlite:///") and not db_url.startswith("sqlite+aiosqlite:////"):
        # Относительный путь - преобразуем в абсолютный
        db_path = db_url.replace("sqlite+aiosqlite:///", "")
        if not os.path.isabs(db_path):
            # Для Vercel используем /tmp
            if os.getenv("VERCEL"):
                db_path = f"/tmp/poehali.db"
            else:
                # Локально используем директорию backend
                backend_dir = Path(__file__).parent.parent.parent
                db_path = str(backend_dir / db_path)
            db_url = f"sqlite+aiosqlite:///{db_path}"
            logger.info(f"Using absolute SQLite path: {db_path}")

    if "sqlite" in db_url:
        # SQLite для serverless (Vercel)
        engine = create_async_engine(
            db_url,
            echo=False,
            connect_args={"check_same_thread": False},
            # Serverless: используем NullPool для отключения пула соединений
            poolclass=NullPool,
        )
        logger.info("✅ SQLite engine created for serverless")
    elif "postgresql" in db_url:
        # PostgreSQL с оптимизацией для serverless
        engine = create_async_engine(
            db_url,
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
            db_url,
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

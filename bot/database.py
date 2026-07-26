"""Асинхронный движок SQLAlchemy, фабрика сессий и базовый класс моделей."""
from __future__ import annotations

import logging
from pathlib import Path
from typing import AsyncIterator

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from bot.config import settings

logger = logging.getLogger(__name__)


class Base(DeclarativeBase):
    """Базовый класс для всех ORM-моделей."""


def _ensure_sqlite_dir(database_url: str) -> None:
    """Создаёт директорию для файла SQLite, если её ещё нет."""
    if "sqlite" not in database_url:
        return
    # sqlite+aiosqlite:////abs/path.db  или  sqlite+aiosqlite:///./rel/path.db
    path_part = database_url.split("///", 1)[-1]
    if not path_part or path_part == ":memory:":
        return
    Path(path_part).parent.mkdir(parents=True, exist_ok=True)


_ensure_sqlite_dir(settings.DATABASE_URL)
Path(settings.BACKUPS_DIR).mkdir(parents=True, exist_ok=True)

engine: AsyncEngine = create_async_engine(settings.DATABASE_URL, echo=False, future=True)
async_session_factory = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def init_models() -> None:
    """Создаёт таблицы, если их ещё нет (удобно для первого запуска без Alembic).

    Для эволюции схемы в проде используйте `alembic upgrade head` — create_all
    не трогает уже существующие таблицы и безопасен для повторного вызова.
    """
    import bot.models  # noqa: F401  регистрируем модели в метаданных

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Схема БД проверена/создана")


async def get_session() -> AsyncIterator[AsyncSession]:
    """Асинхронный генератор сессии (используется мидлварью aiogram)."""
    async with async_session_factory() as session:
        yield session


async def dispose_engine() -> None:
    await engine.dispose()

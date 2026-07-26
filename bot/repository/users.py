"""Репозиторий пользователей и их персональных настроек (мультиарендность)."""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from bot.config import settings as app_settings
from bot.models import User


async def get_or_create(session: AsyncSession, user_id: int) -> User:
    user = (await session.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if user is None:
        user = User(
            id=user_id,
            is_owner=(user_id == app_settings.OWNER_ID),
            locale=app_settings.DEFAULT_LOCALE,
            page_size=app_settings.DEFAULT_PAGE_SIZE,
            video_of_day_enabled=app_settings.VIDEO_OF_DAY_ENABLED,
            video_of_day_hour=app_settings.VIDEO_OF_DAY_HOUR,
            backup_interval_days=app_settings.AUTO_BACKUP_DAYS,
        )
        session.add(user)
        await session.commit()
    return user


async def list_all(session: AsyncSession) -> list[User]:
    return list((await session.execute(select(User))).scalars().all())


async def update(session: AsyncSession, user: User, **fields) -> User:
    for key, value in fields.items():
        setattr(user, key, value)
    await session.commit()
    return user

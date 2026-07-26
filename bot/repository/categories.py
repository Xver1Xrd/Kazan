"""Репозиторий для работы с категориями."""
from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from bot.models import Category, video_category


async def create(
    session: AsyncSession, owner_id: int, name: str, emoji: str | None = None, parent_id: int | None = None
) -> Category:
    category = Category(owner_id=owner_id, name=name, emoji=emoji, parent_id=parent_id)
    session.add(category)
    await session.commit()
    return category


async def get(session: AsyncSession, owner_id: int, category_id: int) -> Category | None:
    stmt = select(Category).where(Category.owner_id == owner_id, Category.id == category_id)
    return (await session.execute(stmt)).scalar_one_or_none()


async def get_by_name(session: AsyncSession, owner_id: int, name: str) -> Category | None:
    stmt = select(Category).where(Category.owner_id == owner_id, func.lower(Category.name) == name.lower())
    return (await session.execute(stmt)).scalar_one_or_none()


async def list_all(session: AsyncSession, owner_id: int) -> list[Category]:
    stmt = select(Category).where(Category.owner_id == owner_id).order_by(Category.parent_id.is_(None).desc(), Category.name)
    return list((await session.execute(stmt)).scalars().all())


async def list_roots(session: AsyncSession, owner_id: int) -> list[Category]:
    stmt = select(Category).where(Category.owner_id == owner_id, Category.parent_id.is_(None)).order_by(Category.name)
    return list((await session.execute(stmt)).scalars().all())


async def list_with_counts(session: AsyncSession, owner_id: int) -> list[tuple[Category, int]]:
    stmt = (
        select(Category, func.count(video_category.c.video_id))
        .outerjoin(video_category, video_category.c.category_id == Category.id)
        .where(Category.owner_id == owner_id)
        .group_by(Category.id)
        .order_by(Category.name)
    )
    return [(cat, cnt) for cat, cnt in (await session.execute(stmt)).all()]


async def rename(session: AsyncSession, category: Category, new_name: str) -> Category:
    category.name = new_name
    await session.commit()
    return category


async def set_emoji(session: AsyncSession, category: Category, emoji: str | None) -> Category:
    category.emoji = emoji
    await session.commit()
    return category


async def delete_category(session: AsyncSession, category: Category) -> None:
    await session.delete(category)
    await session.commit()


async def merge(session: AsyncSession, source: Category, target: Category) -> int:
    """Переносит все связи видео из source в target и удаляет source."""
    stmt = select(video_category.c.video_id).where(video_category.c.category_id == source.id)
    video_ids = [row[0] for row in (await session.execute(stmt)).all()]
    from bot.models import Video

    moved = 0
    for vid in video_ids:
        video = (await session.execute(select(Video).options(selectinload(Video.categories)).where(Video.id == vid))).scalar_one()
        if target not in video.categories:
            video.categories.append(target)
            moved += 1
        if source in video.categories:
            video.categories.remove(source)
    await session.delete(source)
    await session.commit()
    return moved


async def children_of(session: AsyncSession, owner_id: int, parent_id: int) -> list[Category]:
    stmt = select(Category).where(Category.owner_id == owner_id, Category.parent_id == parent_id).order_by(Category.name)
    return list((await session.execute(stmt)).scalars().all())

"""Репозиторий для работы с тегами."""
from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from bot.models import Tag, video_tag


async def get_or_create(session: AsyncSession, owner_id: int, name: str) -> Tag:
    name = name.strip().lstrip("#").lower()
    stmt = select(Tag).where(Tag.owner_id == owner_id, func.lower(Tag.name) == name)
    tag = (await session.execute(stmt)).scalar_one_or_none()
    if tag is None:
        tag = Tag(owner_id=owner_id, name=name)
        session.add(tag)
        await session.commit()
    return tag


async def get(session: AsyncSession, owner_id: int, tag_id: int) -> Tag | None:
    stmt = select(Tag).where(Tag.owner_id == owner_id, Tag.id == tag_id)
    return (await session.execute(stmt)).scalar_one_or_none()


async def get_by_name(session: AsyncSession, owner_id: int, name: str) -> Tag | None:
    stmt = select(Tag).where(Tag.owner_id == owner_id, func.lower(Tag.name) == name.strip().lstrip("#").lower())
    return (await session.execute(stmt)).scalar_one_or_none()


async def list_all(session: AsyncSession, owner_id: int) -> list[Tag]:
    stmt = select(Tag).where(Tag.owner_id == owner_id).order_by(Tag.name)
    return list((await session.execute(stmt)).scalars().all())


async def list_with_counts(session: AsyncSession, owner_id: int) -> list[tuple[Tag, int]]:
    stmt = (
        select(Tag, func.count(video_tag.c.video_id))
        .outerjoin(video_tag, video_tag.c.tag_id == Tag.id)
        .where(Tag.owner_id == owner_id)
        .group_by(Tag.id)
        .order_by(Tag.name)
    )
    return [(tag, cnt) for tag, cnt in (await session.execute(stmt)).all()]


async def search_by_prefix(session: AsyncSession, owner_id: int, prefix: str, limit: int = 10) -> list[Tag]:
    stmt = (
        select(Tag)
        .where(Tag.owner_id == owner_id, Tag.name.ilike(f"{prefix.lower()}%"))
        .order_by(Tag.name)
        .limit(limit)
    )
    return list((await session.execute(stmt)).scalars().all())


async def top_used(session: AsyncSession, owner_id: int, limit: int = 15) -> list[Tag]:
    """Наиболее часто используемые теги — для авто-подсказки при вводе."""
    stmt = (
        select(Tag, func.count(video_tag.c.video_id).label("cnt"))
        .outerjoin(video_tag, video_tag.c.tag_id == Tag.id)
        .where(Tag.owner_id == owner_id)
        .group_by(Tag.id)
        .order_by(func.count(video_tag.c.video_id).desc())
        .limit(limit)
    )
    return [tag for tag, _cnt in (await session.execute(stmt)).all()]


async def rename(session: AsyncSession, tag: Tag, new_name: str) -> Tag:
    tag.name = new_name.strip().lstrip("#").lower()
    await session.commit()
    return tag


async def delete_tag(session: AsyncSession, tag: Tag) -> None:
    await session.delete(tag)
    await session.commit()

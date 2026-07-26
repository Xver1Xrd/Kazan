"""Репозиторий для работы с коллекциями/плейлистами."""
from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from bot.models import Collection, Video, VideoCollection


async def create(session: AsyncSession, owner_id: int, name: str) -> Collection:
    collection = Collection(owner_id=owner_id, name=name)
    session.add(collection)
    await session.commit()
    return collection


async def get(session: AsyncSession, owner_id: int, collection_id: int) -> Collection | None:
    stmt = select(Collection).where(Collection.owner_id == owner_id, Collection.id == collection_id)
    return (await session.execute(stmt)).scalar_one_or_none()


async def list_all(session: AsyncSession, owner_id: int) -> list[Collection]:
    stmt = select(Collection).where(Collection.owner_id == owner_id).order_by(Collection.created_at.desc())
    return list((await session.execute(stmt)).scalars().all())


async def list_with_counts(session: AsyncSession, owner_id: int) -> list[tuple[Collection, int]]:
    stmt = (
        select(Collection, func.count(VideoCollection.video_id))
        .outerjoin(VideoCollection, VideoCollection.collection_id == Collection.id)
        .where(Collection.owner_id == owner_id)
        .group_by(Collection.id)
        .order_by(Collection.created_at.desc())
    )
    return [(c, cnt) for c, cnt in (await session.execute(stmt)).all()]


async def rename(session: AsyncSession, collection: Collection, new_name: str) -> Collection:
    collection.name = new_name
    await session.commit()
    return collection


async def delete_collection(session: AsyncSession, collection: Collection) -> None:
    await session.delete(collection)
    await session.commit()


async def ordered_videos(session: AsyncSession, collection_id: int) -> list[Video]:
    stmt = (
        select(Video)
        .join(VideoCollection, VideoCollection.video_id == Video.id)
        .options(selectinload(Video.categories), selectinload(Video.tags))
        .where(VideoCollection.collection_id == collection_id, Video.is_deleted.is_(False))
        .order_by(VideoCollection.position)
    )
    return list((await session.execute(stmt)).scalars().unique().all())


async def add_video(session: AsyncSession, collection_id: int, video_id: int) -> bool:
    existing = (
        await session.execute(
            select(VideoCollection).where(
                VideoCollection.collection_id == collection_id, VideoCollection.video_id == video_id
            )
        )
    ).scalar_one_or_none()
    if existing:
        return False
    max_pos = (
        await session.execute(
            select(func.max(VideoCollection.position)).where(VideoCollection.collection_id == collection_id)
        )
    ).scalar_one()
    link = VideoCollection(collection_id=collection_id, video_id=video_id, position=(max_pos or 0) + 1)
    session.add(link)
    await session.commit()
    return True


async def remove_video(session: AsyncSession, collection_id: int, video_id: int) -> None:
    link = (
        await session.execute(
            select(VideoCollection).where(
                VideoCollection.collection_id == collection_id, VideoCollection.video_id == video_id
            )
        )
    ).scalar_one_or_none()
    if link:
        await session.delete(link)
        await session.commit()


async def move(session: AsyncSession, collection_id: int, video_id: int, direction: int) -> bool:
    """direction: -1 вверх, +1 вниз. Возвращает True, если перемещение произошло."""
    links = (
        (
            await session.execute(
                select(VideoCollection)
                .where(VideoCollection.collection_id == collection_id)
                .order_by(VideoCollection.position)
            )
        )
        .scalars()
        .all()
    )
    idx = next((i for i, l in enumerate(links) if l.video_id == video_id), None)
    if idx is None:
        return False
    new_idx = idx + direction
    if new_idx < 0 or new_idx >= len(links):
        return False
    links[idx].position, links[new_idx].position = links[new_idx].position, links[idx].position
    await session.commit()
    return True


async def next_in_collection(session: AsyncSession, collection_id: int, after_video_id: int | None) -> Video | None:
    videos = await ordered_videos(session, collection_id)
    if not videos:
        return None
    if after_video_id is None:
        return videos[0]
    for i, v in enumerate(videos):
        if v.id == after_video_id and i + 1 < len(videos):
            return videos[i + 1]
    return None

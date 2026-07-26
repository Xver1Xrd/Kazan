"""Репозиторий для работы с видео."""
from __future__ import annotations

import datetime as dt
from dataclasses import dataclass, field
from enum import Enum

from sqlalchemy import and_, delete, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from bot.models import Category, Tag, Video, VideoCollection, video_category, video_tag


class SortBy(str, Enum):
    NEW = "new"
    OLD = "old"
    RATING = "rating"
    VIEWS = "views"
    ALPHA = "alpha"
    RANDOM = "random"


class CategoryLogic(str, Enum):
    AND = "and"
    OR = "or"


@dataclass
class VideoFilter:
    """Набор фильтров для просмотра/поиска коллекции."""

    category_ids: list[int] = field(default_factory=list)
    category_logic: CategoryLogic = CategoryLogic.OR
    tag_ids: list[int] = field(default_factory=list)
    min_rating: int | None = None
    date_from: dt.datetime | None = None
    date_to: dt.datetime | None = None
    is_watched: bool | None = None
    is_favorite: bool | None = None
    is_broken: bool | None = None
    query_text: str | None = None
    include_deleted: bool = False
    only_deleted: bool = False
    only_uncategorized: bool = False
    only_never_opened: bool = False


def _video_loaded_stmt():
    return select(Video).options(selectinload(Video.categories), selectinload(Video.tags))


async def get_video(session: AsyncSession, owner_id: int, video_id: int) -> Video | None:
    stmt = _video_loaded_stmt().where(Video.owner_id == owner_id, Video.id == video_id)
    return (await session.execute(stmt)).scalar_one_or_none()


async def get_by_url(session: AsyncSession, owner_id: int, url: str) -> Video | None:
    stmt = _video_loaded_stmt().where(
        Video.owner_id == owner_id, Video.url == url, Video.is_deleted.is_(False)
    )
    return (await session.execute(stmt)).scalar_one_or_none()


async def create_video(
    session: AsyncSession,
    owner_id: int,
    url: str,
    title: str | None = None,
    source: str | None = None,
    duration: int | None = None,
    thumbnail_url: str | None = None,
) -> Video:
    video = Video(
        owner_id=owner_id,
        url=url,
        title=title,
        source=source,
        duration=duration,
        thumbnail_url=thumbnail_url,
        categories=[],
        tags=[],
    )
    session.add(video)
    await session.commit()
    return video


async def set_categories(session: AsyncSession, video: Video, category_ids: list[int]) -> None:
    stmt = select(Category).where(Category.owner_id == video.owner_id, Category.id.in_(category_ids))
    categories = (await session.execute(stmt)).scalars().all()
    video.categories = list(categories)
    await session.commit()


async def toggle_category(session: AsyncSession, video: Video, category: Category) -> bool:
    """Переключает категорию у видео. Возвращает True, если добавлена."""
    if category in video.categories:
        video.categories.remove(category)
        added = False
    else:
        video.categories.append(category)
        added = True
    await session.commit()
    return added


async def set_tags_by_names(session: AsyncSession, video: Video, names: list[str]) -> list[Tag]:
    from bot.repository import tags as tags_repo

    result = []
    for name in names:
        tag = await tags_repo.get_or_create(session, video.owner_id, name)
        result.append(tag)
    video.tags = result
    await session.commit()
    return result


async def update_fields(session: AsyncSession, video: Video, **fields) -> Video:
    for key, value in fields.items():
        setattr(video, key, value)
    await session.commit()
    return video


async def soft_delete(session: AsyncSession, video: Video) -> None:
    video.is_deleted = True
    video.deleted_at = dt.datetime.now(dt.timezone.utc)
    await session.commit()


async def restore(session: AsyncSession, video: Video) -> None:
    video.is_deleted = False
    video.deleted_at = None
    await session.commit()


async def permanent_delete(session: AsyncSession, video: Video) -> None:
    await session.delete(video)
    await session.commit()


async def purge_trash_older_than(session: AsyncSession, owner_id: int, days: int) -> int:
    threshold = dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=days)
    stmt = select(Video).where(
        Video.owner_id == owner_id, Video.is_deleted.is_(True), Video.deleted_at < threshold
    )
    videos = (await session.execute(stmt)).scalars().all()
    count = len(videos)
    for video in videos:
        await session.delete(video)
    await session.commit()
    return count


async def toggle_favorite(session: AsyncSession, video: Video) -> bool:
    video.is_favorite = not video.is_favorite
    await session.commit()
    return video.is_favorite


async def toggle_watched(session: AsyncSession, video: Video) -> bool:
    video.is_watched = not video.is_watched
    await session.commit()
    return video.is_watched


async def register_open(session: AsyncSession, video: Video) -> None:
    video.view_count += 1
    video.last_opened_at = dt.datetime.now(dt.timezone.utc)
    await session.commit()


def _apply_filters(stmt, owner_id: int, flt: VideoFilter):
    stmt = stmt.where(Video.owner_id == owner_id)
    if flt.only_deleted:
        stmt = stmt.where(Video.is_deleted.is_(True))
    elif not flt.include_deleted:
        stmt = stmt.where(Video.is_deleted.is_(False))

    if flt.min_rating is not None:
        stmt = stmt.where(Video.rating >= flt.min_rating)
    if flt.date_from is not None:
        stmt = stmt.where(Video.created_at >= flt.date_from)
    if flt.date_to is not None:
        stmt = stmt.where(Video.created_at <= flt.date_to)
    if flt.is_watched is not None:
        stmt = stmt.where(Video.is_watched.is_(flt.is_watched))
    if flt.is_favorite is not None:
        stmt = stmt.where(Video.is_favorite.is_(flt.is_favorite))
    if flt.is_broken is not None:
        stmt = stmt.where(Video.is_broken.is_(flt.is_broken))
    if flt.query_text:
        like = f"%{flt.query_text}%"
        stmt = stmt.where(
            or_(
                Video.title.ilike(like),
                Video.note.ilike(like),
                Video.id.in_(
                    select(video_tag.c.video_id).join(Tag, Tag.id == video_tag.c.tag_id).where(Tag.name.ilike(like))
                ),
            )
        )
    if flt.only_never_opened:
        stmt = stmt.where(Video.last_opened_at.is_(None))
    if flt.only_uncategorized:
        stmt = stmt.where(
            ~Video.id.in_(select(video_category.c.video_id))
        )
    if flt.tag_ids:
        stmt = stmt.where(
            Video.id.in_(select(video_tag.c.video_id).where(video_tag.c.tag_id.in_(flt.tag_ids)))
        )
    if flt.category_ids:
        if flt.category_logic == CategoryLogic.OR:
            stmt = stmt.where(
                Video.id.in_(
                    select(video_category.c.video_id).where(video_category.c.category_id.in_(flt.category_ids))
                )
            )
        else:  # AND — видео должно быть связано со всеми выбранными категориями
            sub = (
                select(video_category.c.video_id)
                .where(video_category.c.category_id.in_(flt.category_ids))
                .group_by(video_category.c.video_id)
                .having(func.count(func.distinct(video_category.c.category_id)) == len(flt.category_ids))
            )
            stmt = stmt.where(Video.id.in_(sub))
    return stmt


def _apply_sort(stmt, sort_by: SortBy):
    if sort_by == SortBy.NEW:
        return stmt.order_by(Video.created_at.desc())
    if sort_by == SortBy.OLD:
        return stmt.order_by(Video.created_at.asc())
    if sort_by == SortBy.RATING:
        return stmt.order_by(Video.rating.desc(), Video.created_at.desc())
    if sort_by == SortBy.VIEWS:
        return stmt.order_by(Video.view_count.desc())
    if sort_by == SortBy.ALPHA:
        return stmt.order_by(func.lower(Video.title).asc())
    if sort_by == SortBy.RANDOM:
        return stmt.order_by(func.random())
    return stmt


async def list_videos(
    session: AsyncSession,
    owner_id: int,
    flt: VideoFilter,
    sort_by: SortBy = SortBy.NEW,
    page: int = 0,
    page_size: int = 10,
) -> tuple[list[Video], int]:
    base = _apply_filters(_video_loaded_stmt(), owner_id, flt)
    count_stmt = _apply_filters(select(func.count(Video.id)), owner_id, flt)
    total = (await session.execute(count_stmt)).scalar_one()
    stmt = _apply_sort(base, sort_by).offset(page * page_size).limit(page_size)
    videos = (await session.execute(stmt)).scalars().unique().all()
    return list(videos), total


async def random_video(
    session: AsyncSession, owner_id: int, flt: VideoFilter | None = None
) -> Video | None:
    flt = flt or VideoFilter()
    stmt = _apply_filters(_video_loaded_stmt(), owner_id, flt).order_by(func.random()).limit(1)
    return (await session.execute(stmt)).scalar_one_or_none()


async def recently_opened(
    session: AsyncSession, owner_id: int, page: int = 0, page_size: int = 10
) -> tuple[list[Video], int]:
    base = _video_loaded_stmt().where(
        Video.owner_id == owner_id, Video.is_deleted.is_(False), Video.last_opened_at.isnot(None)
    )
    count_stmt = select(func.count(Video.id)).where(
        Video.owner_id == owner_id, Video.is_deleted.is_(False), Video.last_opened_at.isnot(None)
    )
    total = (await session.execute(count_stmt)).scalar_one()
    stmt = base.order_by(Video.last_opened_at.desc()).offset(page * page_size).limit(page_size)
    videos = (await session.execute(stmt)).scalars().unique().all()
    return list(videos), total


async def similar_videos(session: AsyncSession, video: Video, limit: int = 10) -> list[Video]:
    category_ids = [c.id for c in video.categories]
    if not category_ids:
        return []
    stmt = (
        _video_loaded_stmt()
        .where(
            Video.owner_id == video.owner_id,
            Video.id != video.id,
            Video.is_deleted.is_(False),
            Video.id.in_(select(video_category.c.video_id).where(video_category.c.category_id.in_(category_ids))),
        )
        .limit(limit)
    )
    return list((await session.execute(stmt)).scalars().unique().all())


async def count_total(session: AsyncSession, owner_id: int) -> dict[str, int]:
    total = (
        await session.execute(
            select(func.count(Video.id)).where(Video.owner_id == owner_id, Video.is_deleted.is_(False))
        )
    ).scalar_one()
    trashed = (
        await session.execute(
            select(func.count(Video.id)).where(Video.owner_id == owner_id, Video.is_deleted.is_(True))
        )
    ).scalar_one()
    never_opened = (
        await session.execute(
            select(func.count(Video.id)).where(
                Video.owner_id == owner_id, Video.is_deleted.is_(False), Video.last_opened_at.is_(None)
            )
        )
    ).scalar_one()
    return {"total": total, "trashed": trashed, "never_opened": never_opened}


async def find_duplicates(session: AsyncSession, owner_id: int) -> list[tuple[str, list[int]]]:
    stmt = (
        select(Video.url, func.group_concat(Video.id))
        .where(Video.owner_id == owner_id, Video.is_deleted.is_(False))
        .group_by(Video.url)
        .having(func.count(Video.id) > 1)
    )
    rows = (await session.execute(stmt)).all()
    return [(url, [int(i) for i in ids.split(",")]) for url, ids in rows]


async def all_active_urls(session: AsyncSession, owner_id: int) -> list[Video]:
    stmt = select(Video).where(Video.owner_id == owner_id, Video.is_deleted.is_(False))
    return list((await session.execute(stmt)).scalars().all())


async def mark_broken(session: AsyncSession, video_id: int, is_broken: bool) -> None:
    await session.execute(
        update(Video)
        .where(Video.id == video_id)
        .values(is_broken=is_broken, last_checked_at=dt.datetime.now(dt.timezone.utc))
    )
    await session.commit()


async def rating_distribution(session: AsyncSession, owner_id: int) -> dict[int, int]:
    stmt = (
        select(Video.rating, func.count(Video.id))
        .where(Video.owner_id == owner_id, Video.is_deleted.is_(False))
        .group_by(Video.rating)
    )
    rows = (await session.execute(stmt)).all()
    dist = {i: 0 for i in range(6)}
    for rating, cnt in rows:
        dist[rating] = cnt
    return dist


async def most_viewed(session: AsyncSession, owner_id: int, limit: int = 5) -> list[Video]:
    stmt = (
        _video_loaded_stmt()
        .where(Video.owner_id == owner_id, Video.is_deleted.is_(False))
        .order_by(Video.view_count.desc())
        .limit(limit)
    )
    return list((await session.execute(stmt)).scalars().unique().all())


async def added_per_day(session: AsyncSession, owner_id: int, days: int = 7) -> list[tuple[str, int]]:
    since = dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=days)
    videos = (
        (
            await session.execute(
                select(Video.created_at).where(Video.owner_id == owner_id, Video.created_at >= since)
            )
        )
        .scalars()
        .all()
    )
    buckets: dict[str, int] = {}
    for i in range(days):
        day = (dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=days - 1 - i)).strftime("%d.%m")
        buckets[day] = 0
    for created_at in videos:
        key = created_at.strftime("%d.%m")
        if key in buckets:
            buckets[key] += 1
    return list(buckets.items())

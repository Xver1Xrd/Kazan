"""Экспорт/импорт коллекции в JSON и CSV, обслуживание БД (дубликаты, VACUUM)."""
from __future__ import annotations

import csv
import datetime as dt
import io
import json
from pathlib import Path
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from bot.config import settings
from bot.models import Category, Collection, Tag, Video
from bot.repository import categories as categories_repo
from bot.repository import collections as collections_repo
from bot.repository import rules as rules_repo
from bot.repository import tags as tags_repo
from bot.repository import videos as videos_repo


async def build_export_dict(session: AsyncSession, owner_id: int) -> dict[str, Any]:
    """Собирает полный дамп коллекции пользователя в независимый от ID формат."""
    cats = await categories_repo.list_all(session, owner_id)
    cat_by_id = {c.id: c for c in cats}
    tags = await tags_repo.list_all(session, owner_id)
    collections = await collections_repo.list_all(session, owner_id)
    rules = await rules_repo.list_all(session, owner_id)
    videos, _ = await videos_repo.list_videos(
        session, owner_id, videos_repo.VideoFilter(include_deleted=True), page_size=1_000_000
    )

    data: dict[str, Any] = {
        "exported_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "categories": [
            {
                "name": c.name,
                "emoji": c.emoji,
                "parent": cat_by_id[c.parent_id].name if c.parent_id and c.parent_id in cat_by_id else None,
            }
            for c in cats
        ],
        "tags": [{"name": t.name} for t in tags],
        "rules": [{"keyword": r.keyword, "category": r.category.name} for r in rules],
        "videos": [
            {
                "url": v.url,
                "title": v.title,
                "note": v.note,
                "source": v.source,
                "duration": v.duration,
                "thumbnail_url": v.thumbnail_url,
                "rating": v.rating,
                "view_count": v.view_count,
                "is_favorite": v.is_favorite,
                "is_watched": v.is_watched,
                "is_deleted": v.is_deleted,
                "created_at": v.created_at.isoformat() if v.created_at else None,
                "last_opened_at": v.last_opened_at.isoformat() if v.last_opened_at else None,
                "categories": [c.name for c in v.categories],
                "tags": [t.name for t in v.tags],
            }
            for v in videos
        ],
        "collections": [
            {"name": c.name, "videos": [v.url for v in await collections_repo.ordered_videos(session, c.id)]}
            for c in collections
        ],
    }
    return data


def dict_to_json_bytes(data: dict[str, Any]) -> bytes:
    return json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8")


def dict_to_csv_bytes(data: dict[str, Any]) -> bytes:
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(
        ["title", "url", "categories", "tags", "rating", "duration_sec", "source", "created_at", "favorite", "watched"]
    )
    for v in data["videos"]:
        writer.writerow(
            [
                v["title"] or "",
                v["url"],
                ";".join(v["categories"]),
                ";".join(v["tags"]),
                v["rating"],
                v["duration"] or "",
                v["source"] or "",
                v["created_at"] or "",
                "yes" if v["is_favorite"] else "no",
                "yes" if v["is_watched"] else "no",
            ]
        )
    return buf.getvalue().encode("utf-8-sig")


async def export_to_files(session: AsyncSession, owner_id: int) -> tuple[Path, Path]:
    """Экспортирует коллекцию в JSON и CSV файлы, возвращает пути к ним."""
    data = await build_export_dict(session, owner_id)
    out_dir = Path(settings.BACKUPS_DIR)
    out_dir.mkdir(parents=True, exist_ok=True)
    stamp = dt.datetime.now(dt.timezone.utc).strftime("%Y%m%d_%H%M%S")
    json_path = out_dir / f"backup_{owner_id}_{stamp}.json"
    csv_path = out_dir / f"backup_{owner_id}_{stamp}.csv"
    json_path.write_bytes(dict_to_json_bytes(data))
    csv_path.write_bytes(dict_to_csv_bytes(data))
    return json_path, csv_path


async def import_from_dict(session: AsyncSession, owner_id: int, data: dict[str, Any]) -> dict[str, int]:
    """Импортирует бэкап с merge-логикой: существующие по имени/URL не дублируются."""
    stats = {"categories": 0, "tags": 0, "videos": 0, "collections": 0, "rules": 0, "skipped_videos": 0}

    # 1) категории — сначала без родителя, потом простановка parent_id
    name_to_category: dict[str, Category] = {}
    for cat in await categories_repo.list_all(session, owner_id):
        name_to_category[cat.name] = cat

    for entry in data.get("categories", []):
        name = entry["name"]
        if name not in name_to_category:
            created = await categories_repo.create(session, owner_id, name, entry.get("emoji"))
            name_to_category[name] = created
            stats["categories"] += 1

    for entry in data.get("categories", []):
        parent_name = entry.get("parent")
        if parent_name and parent_name in name_to_category:
            child = name_to_category[entry["name"]]
            parent = name_to_category[parent_name]
            if child.parent_id != parent.id and child.id != parent.id:
                child.parent_id = parent.id
    await session.commit()

    # 2) теги
    name_to_tag: dict[str, Tag] = {t.name: t for t in await tags_repo.list_all(session, owner_id)}
    for entry in data.get("tags", []):
        name = entry["name"].strip().lstrip("#").lower()
        if name not in name_to_tag:
            created = await tags_repo.get_or_create(session, owner_id, name)
            name_to_tag[name] = created
            stats["tags"] += 1

    # 3) правила авто-категоризации
    existing_rules = {(r.keyword, r.category_id) for r in await rules_repo.list_all(session, owner_id)}
    for entry in data.get("rules", []):
        cat = name_to_category.get(entry["category"])
        if cat and (entry["keyword"], cat.id) not in existing_rules:
            await rules_repo.create(session, owner_id, entry["keyword"], cat.id)
            stats["rules"] += 1

    # 4) видео — дедуп по URL
    url_to_video: dict[str, Video] = {}
    for v in await videos_repo.all_active_urls(session, owner_id):
        url_to_video[v.url] = v

    for entry in data.get("videos", []):
        if entry["url"] in url_to_video:
            stats["skipped_videos"] += 1
            continue
        video = await videos_repo.create_video(
            session,
            owner_id,
            entry["url"],
            title=entry.get("title"),
            source=entry.get("source"),
            duration=entry.get("duration"),
            thumbnail_url=entry.get("thumbnail_url"),
        )
        video.note = entry.get("note")
        video.rating = entry.get("rating", 0)
        video.view_count = entry.get("view_count", 0)
        video.is_favorite = entry.get("is_favorite", False)
        video.is_watched = entry.get("is_watched", False)
        video.is_deleted = entry.get("is_deleted", False)
        cat_objs = [name_to_category[n] for n in entry.get("categories", []) if n in name_to_category]
        tag_objs = [name_to_tag[n] for n in entry.get("tags", []) if n in name_to_tag]
        video.categories = cat_objs
        video.tags = tag_objs
        url_to_video[video.url] = video
        stats["videos"] += 1
    await session.commit()

    # 5) коллекции
    name_to_collection: dict[str, Collection] = {c.name: c for c in await collections_repo.list_all(session, owner_id)}
    for entry in data.get("collections", []):
        collection = name_to_collection.get(entry["name"])
        if collection is None:
            collection = await collections_repo.create(session, owner_id, entry["name"])
            name_to_collection[entry["name"]] = collection
            stats["collections"] += 1
        for url in entry.get("videos", []):
            video = url_to_video.get(url)
            if video:
                await collections_repo.add_video(session, collection.id, video.id)

    return stats


async def vacuum_and_dedup(session: AsyncSession, owner_id: int) -> dict[str, int]:
    """Находит дубликаты по URL (оставляет самое старое видео) и делает VACUUM."""
    duplicates = await videos_repo.find_duplicates(session, owner_id)
    removed = 0
    for _url, ids in duplicates:
        ids_sorted = sorted(ids)
        keep_id, *drop_ids = ids_sorted
        for drop_id in drop_ids:
            video = await videos_repo.get_video(session, owner_id, drop_id)
            if video:
                await session.delete(video)
                removed += 1
    await session.commit()
    try:
        from bot.database import engine

        async with engine.connect() as conn:
            autocommit_conn = await conn.execution_options(isolation_level="AUTOCOMMIT")
            await autocommit_conn.execute(text("VACUUM"))
    except Exception:  # noqa: BLE001 — VACUUM может быть недоступен (например, Postgres) — не критично
        pass
    return {"removed_duplicates": removed}

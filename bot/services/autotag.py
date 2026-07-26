"""Сервис авто-категоризации по ключевым словам."""
from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from bot.models import Category
from bot.repository import rules as rules_repo


async def suggest_categories(session: AsyncSession, owner_id: int, title: str | None) -> list[Category]:
    """Подбирает категории по правилам авто-категоризации для названия видео."""
    if not title:
        return []
    return await rules_repo.match_categories(session, owner_id, title)

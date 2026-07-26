"""Репозиторий для правил авто-категоризации."""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from bot.models import AutoTagRule, Category


async def create(session: AsyncSession, owner_id: int, keyword: str, category_id: int) -> AutoTagRule:
    rule = AutoTagRule(owner_id=owner_id, keyword=keyword.strip().lower(), category_id=category_id)
    session.add(rule)
    await session.commit()
    return rule


async def list_all(session: AsyncSession, owner_id: int) -> list[AutoTagRule]:
    stmt = (
        select(AutoTagRule)
        .options(selectinload(AutoTagRule.category))
        .where(AutoTagRule.owner_id == owner_id)
        .order_by(AutoTagRule.keyword)
    )
    return list((await session.execute(stmt)).scalars().all())


async def get(session: AsyncSession, owner_id: int, rule_id: int) -> AutoTagRule | None:
    stmt = select(AutoTagRule).where(AutoTagRule.owner_id == owner_id, AutoTagRule.id == rule_id)
    return (await session.execute(stmt)).scalar_one_or_none()


async def delete_rule(session: AsyncSession, rule: AutoTagRule) -> None:
    await session.delete(rule)
    await session.commit()


async def match_categories(session: AsyncSession, owner_id: int, title: str) -> list[Category]:
    """Возвращает категории, чьи ключевые слова встречаются в названии."""
    if not title:
        return []
    rules = await list_all(session, owner_id)
    title_lower = title.lower()
    matched: dict[int, Category] = {}
    for rule in rules:
        if rule.keyword in title_lower:
            matched[rule.category_id] = rule.category
    return list(matched.values())

"""Статистика коллекции: общие числа, топы, текстовый график, распределения."""
from __future__ import annotations

from aiogram import F, Router
from aiogram.filters import Command
from aiogram.types import Message
from sqlalchemy.ext.asyncio import AsyncSession

from bot.locales import t
from bot.models import User
from bot.repository import categories as categories_repo
from bot.repository import tags as tags_repo
from bot.repository import videos as videos_repo

router = Router(name="stats")

BAR_WIDTH = 20


def _bar(value: int, max_value: int) -> str:
    if max_value <= 0:
        return ""
    filled = round((value / max_value) * BAR_WIDTH)
    return "▓" * filled + "░" * (BAR_WIDTH - filled)


@router.message(Command("stats"))
@router.message(F.text.in_({"📊 Статистика", "📊 Stats"}))
async def cmd_stats(message: Message, session: AsyncSession, db_user: User, lang: str) -> None:
    totals = await videos_repo.count_total(session, db_user.id)

    text = t("stats.title", lang) + "\n"
    text += t("stats.total", lang, total=totals["total"]) + "\n"
    text += t("stats.trashed", lang, trashed=totals["trashed"]) + "\n"
    text += t("stats.never_opened", lang, never_opened=totals["never_opened"]) + "\n"

    cats = await categories_repo.list_with_counts(session, db_user.id)
    top_cats = sorted(cats, key=lambda pair: pair[1], reverse=True)[:5]
    if top_cats:
        lines = "\n".join(f"{c.emoji + ' ' if c.emoji else ''}{c.name}: {cnt}" for c, cnt in top_cats)
        text += t("stats.by_category", lang, n=5, lines=lines)

    tags = await tags_repo.list_with_counts(session, db_user.id)
    top_tags = sorted(tags, key=lambda pair: pair[1], reverse=True)[:5]
    if top_tags:
        lines = "\n".join(f"#{tag.name}: {cnt}" for tag, cnt in top_tags)
        text += t("stats.by_tag", lang, n=5, lines=lines)

    added = await videos_repo.added_per_day(session, db_user.id, days=7)
    if added:
        max_value = max(cnt for _day, cnt in added) or 1
        chart = "\n".join(f"{day} {_bar(cnt, max_value)} {cnt}" for day, cnt in added)
        text += t("stats.added_chart", lang, days=7, chart=chart)

    dist = await videos_repo.rating_distribution(session, db_user.id)
    max_dist = max(dist.values()) or 1
    lines = "\n".join(f"{'⭐' * i if i else '0'}: {_bar(dist[i], max_dist)} {dist[i]}" for i in range(6))
    text += t("stats.rating_dist", lang, lines=lines)

    most_viewed = await videos_repo.most_viewed(session, db_user.id, limit=5)
    if most_viewed:
        lines = "\n".join(f"{v.title or v.url} — {v.view_count}" for v in most_viewed)
        text += t("stats.most_viewed", lang, lines=lines)

    await message.answer(text)

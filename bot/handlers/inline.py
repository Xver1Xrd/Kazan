"""Inline-режим: поиск по коллекции и вставка результата в любой чат."""
from __future__ import annotations

import hashlib

from aiogram import Router
from aiogram.types import InlineQuery, InlineQueryResultArticle, InputTextMessageContent
from sqlalchemy.ext.asyncio import AsyncSession

from bot.models import User
from bot.repository.videos import VideoFilter, list_videos

router = Router(name="inline")


@router.inline_query()
async def inline_search(query: InlineQuery, session: AsyncSession, db_user: User) -> None:
    text = (query.query or "").strip()
    flt = VideoFilter(query_text=text or None)
    videos, _total = await list_videos(session, db_user.id, flt, page_size=20)

    results = []
    for video in videos:
        title = video.title or video.url
        description = video.url
        content = InputTextMessageContent(message_text=f"{title}\n{video.url}")
        result_id = hashlib.sha256(f"video-{video.id}".encode()).hexdigest()[:32]
        results.append(
            InlineQueryResultArticle(
                id=result_id,
                title=title[:100],
                description=description[:200],
                input_message_content=content,
                thumbnail_url=video.thumbnail_url or None,
            )
        )

    await query.answer(results, cache_time=5, is_personal=True)

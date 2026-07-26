"""Фоновые задачи APScheduler: бэкапы, проверка ссылок, «видео дня», очистка корзины."""
from __future__ import annotations

import logging

from aiogram import Bot
from aiogram.types import FSInputFile
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

from bot.config import settings
from bot.database import async_session_factory
from bot.repository import users as users_repo
from bot.repository import videos as videos_repo
from bot.services import backup as backup_service
from bot.services.metadata import check_link_alive

logger = logging.getLogger(__name__)


async def _job_auto_backup(bot: Bot) -> None:
    async with async_session_factory() as session:
        users = await users_repo.list_all(session)
        for user in users:
            if user.backup_interval_days <= 0:
                continue
            try:
                json_path, csv_path = await backup_service.export_to_files(session, user.id)
                caption = "🗂 Автоматический бэкап коллекции"
                await bot.send_document(user.id, FSInputFile(json_path), caption=caption)
                await bot.send_document(user.id, FSInputFile(csv_path))
                if settings.BACKUP_CHANNEL_ID:
                    await bot.send_document(settings.BACKUP_CHANNEL_ID, FSInputFile(json_path), caption=f"Бэкап пользователя {user.id}")
            except Exception:  # noqa: BLE001
                logger.exception("Не удалось выполнить авто-бэкап для %s", user.id)


async def _job_check_links(bot: Bot) -> None:
    async with async_session_factory() as session:
        users = await users_repo.list_all(session)
        for user in users:
            videos = await videos_repo.all_active_urls(session, user.id)
            for video in videos:
                alive = await check_link_alive(video.url)
                if video.is_broken and alive:
                    await videos_repo.mark_broken(session, video.id, False)
                elif not video.is_broken and not alive:
                    await videos_repo.mark_broken(session, video.id, True)


async def _job_video_of_day(bot: Bot) -> None:
    async with async_session_factory() as session:
        users = await users_repo.list_all(session)
        for user in users:
            if not user.video_of_day_enabled:
                continue
            flt = videos_repo.VideoFilter(is_favorite=True if user.video_of_day_favorites_only else None)
            video = await videos_repo.random_video(session, user.id, flt)
            if video is None:
                continue
            text = f"🎬 <b>Видео дня</b>\n\n{video.title or video.url}\n{video.url}"
            try:
                await bot.send_message(user.id, text)
            except Exception:  # noqa: BLE001
                logger.exception("Не удалось отправить видео дня пользователю %s", user.id)


async def _job_trash_autoclean(bot: Bot) -> None:
    async with async_session_factory() as session:
        users = await users_repo.list_all(session)
        for user in users:
            removed = await videos_repo.purge_trash_older_than(session, user.id, settings.TRASH_AUTOCLEAN_DAYS)
            if removed:
                logger.info("Авто-очистка корзины пользователя %s: удалено %s видео", user.id, removed)


async def _job_uncategorized_reminder(bot: Bot) -> None:
    async with async_session_factory() as session:
        users = await users_repo.list_all(session)
        for user in users:
            flt = videos_repo.VideoFilter(only_uncategorized=True)
            _videos, total = await videos_repo.list_videos(session, user.id, flt, page_size=1)
            if total >= settings.UNCATEGORIZED_REMINDER_THRESHOLD:
                try:
                    await bot.send_message(
                        user.id,
                        f"📥 В разделе «Без категории» накопилось {total} видео. "
                        f"Загляните в /browse, чтобы их разобрать.",
                    )
                except Exception:  # noqa: BLE001
                    logger.exception("Не удалось отправить напоминание пользователю %s", user.id)


def setup_scheduler(bot: Bot) -> AsyncIOScheduler:
    """Создаёт и запускает планировщик фоновых задач."""
    scheduler = AsyncIOScheduler(timezone=settings.TIMEZONE)

    if settings.AUTO_BACKUP_ENABLED:
        scheduler.add_job(
            _job_auto_backup,
            IntervalTrigger(days=settings.AUTO_BACKUP_DAYS),
            args=[bot],
            id="auto_backup",
            replace_existing=True,
        )

    if settings.LINK_CHECK_ENABLED:
        scheduler.add_job(
            _job_check_links,
            IntervalTrigger(hours=settings.LINK_CHECK_INTERVAL_HOURS),
            args=[bot],
            id="check_links",
            replace_existing=True,
        )

    scheduler.add_job(
        _job_video_of_day,
        CronTrigger(hour=settings.VIDEO_OF_DAY_HOUR, minute=0),
        args=[bot],
        id="video_of_day",
        replace_existing=True,
    )

    scheduler.add_job(
        _job_trash_autoclean,
        CronTrigger(hour=4, minute=0),
        args=[bot],
        id="trash_autoclean",
        replace_existing=True,
    )

    scheduler.add_job(
        _job_uncategorized_reminder,
        CronTrigger(day_of_week="mon", hour=11, minute=0),
        args=[bot],
        id="uncategorized_reminder",
        replace_existing=True,
    )

    scheduler.start()
    logger.info("Планировщик задач запущен")
    return scheduler

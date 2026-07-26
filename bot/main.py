"""Точка входа: инициализация бота, роутеров, планировщика и graceful shutdown."""
from __future__ import annotations

import asyncio
import logging
import signal

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.fsm.storage.memory import MemoryStorage

from bot.config import settings
from bot.database import dispose_engine, init_models
from bot.handlers import (
    add,
    backup,
    browse,
    bulk_ops,
    categories,
    collections,
    common,
    inline,
    manage,
    stats,
    tags,
)
from bot.middlewares import AccessMiddleware, DbSessionMiddleware, PinMiddleware
from bot.services.scheduler import setup_scheduler

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


def _build_storage():
    if settings.REDIS_URL:
        from aiogram.fsm.storage.redis import RedisStorage

        logger.info("Использую RedisStorage для FSM")
        return RedisStorage.from_url(settings.REDIS_URL)
    logger.info("Использую MemoryStorage для FSM")
    return MemoryStorage()


def _build_dispatcher() -> Dispatcher:
    dp = Dispatcher(storage=_build_storage())

    # Порядок важен: сначала доступ/PIN, затем сессия БД
    dp.update.outer_middleware(AccessMiddleware())
    dp.update.outer_middleware(PinMiddleware())
    dp.update.outer_middleware(DbSessionMiddleware())

    # Порядок роутеров важен: обработчики с более специфичными состояниями
    # регистрируются раньше более общих (например, add до manage для RatingPickCB)
    dp.include_router(common.router)
    dp.include_router(add.router)
    dp.include_router(categories.router)
    dp.include_router(tags.router)
    dp.include_router(collections.router)
    dp.include_router(bulk_ops.router)
    dp.include_router(browse.router)
    dp.include_router(manage.router)
    dp.include_router(stats.router)
    dp.include_router(backup.router)
    dp.include_router(inline.router)
    return dp


async def main() -> None:
    await init_models()

    bot = Bot(
        token=settings.BOT_TOKEN,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML),
    )
    dp = _build_dispatcher()

    scheduler = setup_scheduler(bot)

    stop_event = asyncio.Event()

    def _handle_signal() -> None:
        logger.info("Получен сигнал остановки, завершаю работу...")
        stop_event.set()

    loop = asyncio.get_running_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(sig, _handle_signal)
        except NotImplementedError:
            # Windows не поддерживает add_signal_handler для некоторых сигналов
            pass

    polling_task = asyncio.create_task(dp.start_polling(bot))
    stop_task = asyncio.create_task(stop_event.wait())

    try:
        await asyncio.wait({polling_task, stop_task}, return_when=asyncio.FIRST_COMPLETED)
    finally:
        logger.info("Останавливаю планировщик и закрываю соединения...")
        for task in (polling_task, stop_task):
            if not task.done():
                task.cancel()
        await asyncio.gather(polling_task, stop_task, return_exceptions=True)
        scheduler.shutdown(wait=False)
        await bot.session.close()
        await dispose_engine()
        logger.info("Бот остановлен.")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass

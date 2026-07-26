"""Мидлвари: доступ (whitelist), PIN-код на вход и сессия БД на каждый апдейт."""
from __future__ import annotations

import logging
from typing import Any, Awaitable, Callable

from aiogram import BaseMiddleware
from aiogram.types import CallbackQuery, InlineQuery, Message, TelegramObject

from bot.config import settings
from bot.database import async_session_factory
from bot.locales import t
from bot.repository import users as users_repo

logger = logging.getLogger(__name__)

# Сессии, прошедшие ввод PIN-кода (in-memory, сбрасывается при рестарте процесса)
_AUTHORIZED_USERS: set[int] = set()


def authorize(user_id: int) -> None:
    _AUTHORIZED_USERS.add(user_id)


def deauthorize(user_id: int) -> None:
    _AUTHORIZED_USERS.discard(user_id)


def is_authorized(user_id: int) -> bool:
    return not settings.PIN_CODE or user_id in _AUTHORIZED_USERS


class AccessMiddleware(BaseMiddleware):
    """Пропускает только владельца и пользователей из ALLOWED_USERS."""

    async def __call__(
        self,
        handler: Callable[[TelegramObject, dict[str, Any]], Awaitable[Any]],
        event: TelegramObject,
        data: dict[str, Any],
    ) -> Any:
        user = data.get("event_from_user")
        if user is None:
            return await handler(event, data)

        if user.id not in settings.allowed_user_ids:
            logger.warning("Отклонён доступ для пользователя %s", user.id)
            if isinstance(event, Message):
                await event.answer(t("access.denied"))
            elif isinstance(event, CallbackQuery):
                await event.answer(t("access.denied"), show_alert=True)
            elif isinstance(event, InlineQuery):
                await event.answer([], cache_time=1, is_personal=True)
            return None

        return await handler(event, data)


class PinMiddleware(BaseMiddleware):
    """Требует ввод PIN-кода (если он настроен) до обработки остальных апдейтов."""

    async def __call__(
        self,
        handler: Callable[[TelegramObject, dict[str, Any]], Awaitable[Any]],
        event: TelegramObject,
        data: dict[str, Any],
    ) -> Any:
        if not settings.PIN_CODE:
            return await handler(event, data)

        user = data.get("event_from_user")
        if user is None or is_authorized(user.id):
            return await handler(event, data)

        if isinstance(event, Message) and event.text and event.text.strip() == settings.PIN_CODE:
            authorize(user.id)
            await event.answer(t("access.pin_ok"))
            return await handler(event, data)

        if isinstance(event, Message):
            await event.answer(t("access.enter_pin"))
        elif isinstance(event, CallbackQuery):
            await event.answer(t("access.enter_pin"), show_alert=True)
        elif isinstance(event, InlineQuery):
            await event.answer([], cache_time=1)
        return None


class DbSessionMiddleware(BaseMiddleware):
    """Открывает сессию SQLAlchemy на апдейт и подставляет текущего пользователя БД."""

    async def __call__(
        self,
        handler: Callable[[TelegramObject, dict[str, Any]], Awaitable[Any]],
        event: TelegramObject,
        data: dict[str, Any],
    ) -> Any:
        user = data.get("event_from_user")
        async with async_session_factory() as session:
            data["session"] = session
            if user is not None:
                data["db_user"] = await users_repo.get_or_create(session, user.id)
                data["lang"] = data["db_user"].locale
            return await handler(event, data)

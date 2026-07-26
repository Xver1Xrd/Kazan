"""Хендлеры: /start, /help, /settings, /hide."""
from __future__ import annotations

from aiogram import F, Router
from aiogram.filters import Command, CommandStart
from aiogram.fsm.context import FSMContext
from aiogram.types import CallbackQuery, Message
from sqlalchemy.ext.asyncio import AsyncSession

from bot.callbacks import SettingsCB, SortPickCB
from bot.keyboards import main_menu_kb, settings_kb, sort_pick_kb
from bot.locales import t
from bot.middlewares import deauthorize
from bot.models import User
from bot.repository import users as users_repo
from bot.states import Settings

router = Router(name="common")


@router.message(CommandStart())
async def cmd_start(message: Message, db_user: User, lang: str) -> None:
    await message.answer(t("start.welcome", lang), reply_markup=main_menu_kb(lang))


@router.message(Command("help"))
async def cmd_help(message: Message, lang: str) -> None:
    await message.answer(t("help.text", lang))


@router.message(Command("hide"))
async def cmd_hide(message: Message, db_user: User) -> None:
    deauthorize(db_user.id)
    await message.answer(t("access.hidden", db_user.locale))


@router.message(Command("settings"))
@router.message(F.text.in_({"⚙️ Настройки", "⚙️ Settings"}))
async def cmd_settings(message: Message, db_user: User, lang: str) -> None:
    await message.answer(t("settings.title", lang), reply_markup=settings_kb(db_user, lang))


@router.callback_query(SettingsCB.filter(F.action == "page_size"))
async def settings_page_size(call: CallbackQuery, state: FSMContext, lang: str) -> None:
    await call.message.answer(t("settings.enter_page_size", lang))
    await state.set_state(Settings.editing_page_size)
    await call.answer()


@router.message(Settings.editing_page_size)
async def settings_page_size_apply(message: Message, session: AsyncSession, db_user: User, state: FSMContext, lang: str) -> None:
    try:
        size = int(message.text.strip())
        assert 1 <= size <= 50
    except (ValueError, AssertionError):
        await message.answer(t("settings.enter_page_size", lang))
        return
    await users_repo.update(session, db_user, page_size=size)
    await state.clear()
    await message.answer(t("settings.updated", lang), reply_markup=settings_kb(db_user, lang))


@router.callback_query(SettingsCB.filter(F.action == "sort"))
async def settings_sort(call: CallbackQuery, lang: str) -> None:
    await call.message.answer("↕️", reply_markup=sort_pick_kb())
    await call.answer()


@router.callback_query(SettingsCB.filter(F.action == "auto_meta"))
async def settings_auto_meta(call: CallbackQuery, session: AsyncSession, db_user: User, lang: str) -> None:
    await users_repo.update(session, db_user, auto_metadata=not db_user.auto_metadata)
    await call.message.edit_reply_markup(reply_markup=settings_kb(db_user, lang))
    await call.answer(t("settings.updated", lang))


@router.callback_query(SettingsCB.filter(F.action == "vod_toggle"))
async def settings_vod_toggle(call: CallbackQuery, session: AsyncSession, db_user: User, lang: str) -> None:
    await users_repo.update(session, db_user, video_of_day_enabled=not db_user.video_of_day_enabled)
    await call.message.edit_reply_markup(reply_markup=settings_kb(db_user, lang))
    await call.answer(t("settings.updated", lang))


@router.callback_query(SettingsCB.filter(F.action == "vod_hour"))
async def settings_vod_hour(call: CallbackQuery, state: FSMContext, lang: str) -> None:
    await call.message.answer(t("settings.enter_vod_hour", lang))
    await state.set_state(Settings.editing_video_of_day_hour)
    await call.answer()


@router.message(Settings.editing_video_of_day_hour)
async def settings_vod_hour_apply(message: Message, session: AsyncSession, db_user: User, state: FSMContext, lang: str) -> None:
    try:
        hour = int(message.text.strip())
        assert 0 <= hour <= 23
    except (ValueError, AssertionError):
        await message.answer(t("settings.enter_vod_hour", lang))
        return
    await users_repo.update(session, db_user, video_of_day_hour=hour)
    await state.clear()
    await message.answer(t("settings.updated", lang), reply_markup=settings_kb(db_user, lang))


@router.callback_query(SettingsCB.filter(F.action == "backup_days"))
async def settings_backup_days(call: CallbackQuery, state: FSMContext, lang: str) -> None:
    await call.message.answer(t("settings.enter_backup_days", lang))
    await state.set_state(Settings.editing_backup_days)
    await call.answer()


@router.message(Settings.editing_backup_days)
async def settings_backup_days_apply(message: Message, session: AsyncSession, db_user: User, state: FSMContext, lang: str) -> None:
    try:
        days = int(message.text.strip())
        assert days >= 0
    except (ValueError, AssertionError):
        await message.answer(t("settings.enter_backup_days", lang))
        return
    await users_repo.update(session, db_user, backup_interval_days=days)
    await state.clear()
    await message.answer(t("settings.updated", lang), reply_markup=settings_kb(db_user, lang))


@router.callback_query(SettingsCB.filter(F.action == "locale"))
async def settings_locale(call: CallbackQuery, session: AsyncSession, db_user: User) -> None:
    new_locale = "en" if db_user.locale == "ru" else "ru"
    await users_repo.update(session, db_user, locale=new_locale)
    await call.message.answer(t("settings.updated", new_locale), reply_markup=main_menu_kb(new_locale))
    await call.answer()


@router.callback_query(SortPickCB.filter())
async def settings_sort_pick(call: CallbackQuery, callback_data: SortPickCB, session: AsyncSession, db_user: User, lang: str) -> None:
    await users_repo.update(session, db_user, default_sort=callback_data.sort_by)
    await call.answer(t("settings.updated", lang))

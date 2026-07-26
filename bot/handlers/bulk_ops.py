"""Массовые операции: отметить несколько видео и применить действие сразу ко всем."""
from __future__ import annotations

from aiogram import F, Router
from aiogram.filters import Command, StateFilter
from aiogram.fsm.context import FSMContext
from aiogram.types import CallbackQuery, InlineKeyboardButton, InlineKeyboardMarkup, Message
from sqlalchemy.ext.asyncio import AsyncSession

from bot.callbacks import BulkModeCB, ConfirmCB, PageCB
from bot.keyboards import bulk_select_kb, confirm_kb
from bot.locales import t
from bot.models import User
from bot.repository import categories as categories_repo
from bot.repository import collections as collections_repo
from bot.repository import videos as videos_repo
from bot.repository.videos import VideoFilter
from bot.states import BulkOps

router = Router(name="bulk_ops")

_SELECTED: dict[int, set[int]] = {}
_LAST_LIST: dict[int, tuple[list[int], int, int]] = {}  # user_id -> (video_ids on page, page, total_pages)


async def _render(message_source, session: AsyncSession, db_user: User, lang: str, page: int = 0, edit: bool = False) -> None:
    videos, total = await videos_repo.list_videos(session, db_user.id, VideoFilter(), page_size=db_user.page_size, page=page)
    total_pages = max(1, (total + db_user.page_size - 1) // db_user.page_size)
    _LAST_LIST[db_user.id] = ([v.id for v in videos], page, total_pages)
    selected = _SELECTED.setdefault(db_user.id, set())
    kb = bulk_select_kb(videos, selected, "bulk", 0, page, total_pages)
    text = t("bulk.enter_mode", lang)
    if edit:
        await message_source.edit_text(text, reply_markup=kb)
    else:
        await message_source.answer(text, reply_markup=kb)


@router.message(Command("bulk_select"))
async def cmd_bulk_select(message: Message, session: AsyncSession, db_user: User, lang: str) -> None:
    _SELECTED[db_user.id] = set()
    await _render(message, session, db_user, lang)


@router.callback_query(BulkModeCB.filter(F.action == "toggle_select"))
async def toggle_select(call: CallbackQuery, callback_data: BulkModeCB, session: AsyncSession, db_user: User, lang: str) -> None:
    selected = _SELECTED.setdefault(db_user.id, set())
    if callback_data.video_id in selected:
        selected.discard(callback_data.video_id)
    else:
        selected.add(callback_data.video_id)
    _, page, _ = _LAST_LIST.get(db_user.id, ([], 0, 1))
    await _render(call.message, session, db_user, lang, page, edit=True)
    await call.answer()


@router.callback_query(PageCB.filter(F.scope == "bulk"))
async def bulk_paginate(call: CallbackQuery, callback_data: PageCB, session: AsyncSession, db_user: User, lang: str) -> None:
    await _render(call.message, session, db_user, lang, callback_data.page, edit=True)
    await call.answer()


@router.callback_query(BulkModeCB.filter(F.action == "cancel"))
async def cancel_bulk(call: CallbackQuery, db_user: User, lang: str) -> None:
    _SELECTED.pop(db_user.id, None)
    _LAST_LIST.pop(db_user.id, None)
    await call.message.edit_text(t("bulk.cancelled", lang))
    await call.answer()


@router.callback_query(BulkModeCB.filter(F.action == "category"))
async def bulk_pick_category(call: CallbackQuery, session: AsyncSession, db_user: User, lang: str) -> None:
    selected = _SELECTED.get(db_user.id, set())
    if not selected:
        await call.answer(t("bulk.none_selected", lang), show_alert=True)
        return
    cats = await categories_repo.list_all(session, db_user.id)
    rows = [[InlineKeyboardButton(text=c.name, callback_data=BulkModeCB(action="apply_category", value=c.id).pack())] for c in cats]
    await call.message.answer(t("bulk.pick_category", lang), reply_markup=InlineKeyboardMarkup(inline_keyboard=rows))
    await call.answer()


@router.callback_query(BulkModeCB.filter(F.action == "apply_category"))
async def bulk_apply_category(call: CallbackQuery, callback_data: BulkModeCB, session: AsyncSession, db_user: User, lang: str) -> None:
    selected = _SELECTED.get(db_user.id, set())
    category = await categories_repo.get(session, db_user.id, callback_data.value)
    if not selected or category is None:
        await call.answer(t("bulk.none_selected", lang), show_alert=True)
        return
    for video_id in selected:
        video = await videos_repo.get_video(session, db_user.id, video_id)
        if video and category not in video.categories:
            video.categories.append(category)
    await session.commit()
    await call.message.answer(t("bulk.done", lang, count=len(selected)))
    await call.answer()


@router.callback_query(BulkModeCB.filter(F.action == "rating"))
async def bulk_pick_rating(call: CallbackQuery, db_user: User, lang: str) -> None:
    selected = _SELECTED.get(db_user.id, set())
    if not selected:
        await call.answer(t("bulk.none_selected", lang), show_alert=True)
        return
    rows = [[InlineKeyboardButton(text="⭐" * i if i else "0", callback_data=BulkModeCB(action="apply_rating", value=i).pack()) for i in range(0, 6)]]
    await call.message.answer(t("bulk.pick_rating", lang), reply_markup=InlineKeyboardMarkup(inline_keyboard=rows))
    await call.answer()


@router.callback_query(BulkModeCB.filter(F.action == "apply_rating"))
async def bulk_apply_rating(call: CallbackQuery, callback_data: BulkModeCB, session: AsyncSession, db_user: User, lang: str) -> None:
    selected = _SELECTED.get(db_user.id, set())
    if not selected:
        await call.answer(t("bulk.none_selected", lang), show_alert=True)
        return
    for video_id in selected:
        video = await videos_repo.get_video(session, db_user.id, video_id)
        if video:
            video.rating = callback_data.value
    await session.commit()
    await call.message.answer(t("bulk.done", lang, count=len(selected)))
    await call.answer()


@router.callback_query(BulkModeCB.filter(F.action == "tag"))
async def bulk_ask_tags(call: CallbackQuery, db_user: User, state: FSMContext, lang: str) -> None:
    selected = _SELECTED.get(db_user.id, set())
    if not selected:
        await call.answer(t("bulk.none_selected", lang), show_alert=True)
        return
    await state.set_state(BulkOps.waiting_tags)
    await call.message.answer(t("bulk.enter_tags", lang))
    await call.answer()


@router.message(StateFilter(BulkOps.waiting_tags))
async def bulk_apply_tags(message: Message, session: AsyncSession, db_user: User, state: FSMContext, lang: str) -> None:
    await state.clear()
    names = [n.strip() for n in (message.text or "").split(",") if n.strip()]
    selected = _SELECTED.get(db_user.id, set())
    if not names or not selected:
        return
    for video_id in selected:
        video = await videos_repo.get_video(session, db_user.id, video_id)
        if video:
            await videos_repo.set_tags_by_names(session, video, list({tag.name for tag in video.tags} | set(names)))
    await message.answer(t("bulk.done", lang, count=len(selected)))


@router.callback_query(BulkModeCB.filter(F.action == "collection"))
async def bulk_pick_collection(call: CallbackQuery, session: AsyncSession, db_user: User, lang: str) -> None:
    selected = _SELECTED.get(db_user.id, set())
    if not selected:
        await call.answer(t("bulk.none_selected", lang), show_alert=True)
        return
    collections = await collections_repo.list_all(session, db_user.id)
    if not collections:
        await call.answer(t("collections.empty", lang), show_alert=True)
        return
    rows = [[InlineKeyboardButton(text=c.name, callback_data=BulkModeCB(action="apply_collection", value=c.id).pack())] for c in collections]
    await call.message.answer(t("bulk.pick_collection", lang), reply_markup=InlineKeyboardMarkup(inline_keyboard=rows))
    await call.answer()


@router.callback_query(BulkModeCB.filter(F.action == "apply_collection"))
async def bulk_apply_collection(call: CallbackQuery, callback_data: BulkModeCB, session: AsyncSession, db_user: User, lang: str) -> None:
    selected = _SELECTED.get(db_user.id, set())
    collection = await collections_repo.get(session, db_user.id, callback_data.value)
    if not selected or collection is None:
        await call.answer(t("bulk.none_selected", lang), show_alert=True)
        return
    for video_id in selected:
        await collections_repo.add_video(session, collection.id, video_id)
    await call.message.answer(t("bulk.done", lang, count=len(selected)))
    await call.answer()


@router.callback_query(BulkModeCB.filter(F.action == "delete"))
async def bulk_delete_ask(call: CallbackQuery, db_user: User, lang: str) -> None:
    selected = _SELECTED.get(db_user.id, set())
    if not selected:
        await call.answer(t("bulk.none_selected", lang), show_alert=True)
        return
    await call.message.answer(t("bulk.confirm_delete", lang, count=len(selected)), reply_markup=confirm_kb("bulk_delete", 0, lang))
    await call.answer()


@router.callback_query(ConfirmCB.filter(F.action == "bulk_delete"))
async def bulk_delete_confirm(call: CallbackQuery, callback_data: ConfirmCB, session: AsyncSession, db_user: User, lang: str) -> None:
    if callback_data.yes:
        selected = _SELECTED.pop(db_user.id, set())
        for video_id in selected:
            video = await videos_repo.get_video(session, db_user.id, video_id)
            if video:
                await videos_repo.soft_delete(session, video)
        await call.message.edit_text(t("bulk.done", lang, count=len(selected)))
    else:
        await call.message.edit_text(t("common.cancelled", lang))
    await call.answer()

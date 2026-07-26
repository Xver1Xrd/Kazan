"""Карточка видео, редактирование полей, избранное/просмотрено, корзина, undo."""
from __future__ import annotations

import datetime as dt

from aiogram import F, Router
from aiogram.filters import Command, StateFilter
from aiogram.fsm.context import FSMContext
from aiogram.types import CallbackQuery, Message
from sqlalchemy.ext.asyncio import AsyncSession

from bot.callbacks import (
    CategoryToggleCB,
    ConfirmCB,
    RatingPickCB,
    VideoActionCB,
    VideoOpenCB,
    WizardDoneCB,
)
from bot.keyboards import (
    categories_multiselect_kb,
    confirm_kb,
    edit_video_kb,
    rating_kb,
    video_card_kb,
    videos_list_kb,
)
from bot.locales import t
from bot.models import User, Video
from bot.repository import categories as categories_repo
from bot.repository import tags as tags_repo
from bot.repository import videos as videos_repo
from bot.states import EditVideo

router = Router(name="manage")

# Однократный стек последнего действия на пользователя (in-memory, для /undo)
_LAST_ACTION: dict[int, dict] = {}


def format_duration(seconds: int | None) -> str:
    if not seconds:
        return "—"
    m, s = divmod(int(seconds), 60)
    h, m = divmod(m, 60)
    if h:
        return f"{h}:{m:02d}:{s:02d}"
    return f"{m}:{s:02d}"


def format_video_card(video: Video, lang: str = "ru") -> str:
    categories = ", ".join(f"{c.emoji + ' ' if c.emoji else ''}{c.name}" for c in video.categories) or "—"
    tags = ", ".join(f"#{tag.name}" for tag in video.tags) or "—"
    created = video.created_at.strftime("%d.%m.%Y") if video.created_at else "—"
    return t(
        "video.card",
        lang,
        title=video.title or video.url,
        link=video.url,
        categories=categories,
        tags=tags,
        rating=video.rating,
        duration=format_duration(video.duration),
        views=video.view_count,
        created=created,
        note=video.note or "—",
    )


async def _render_card(message_or_call, video: Video, lang: str, scope: str = "browse", ref_id: int = 0, page: int = 0, edit: bool = False) -> None:
    text = format_video_card(video, lang)
    kb = video_card_kb(video, scope=scope, ref_id=ref_id, page=page, lang=lang)
    if edit:
        await message_or_call.edit_text(text, reply_markup=kb)
    else:
        await message_or_call.answer(text, reply_markup=kb)


@router.callback_query(VideoOpenCB.filter())
async def open_video(call: CallbackQuery, callback_data: VideoOpenCB, session: AsyncSession, db_user: User, lang: str) -> None:
    video = await videos_repo.get_video(session, db_user.id, callback_data.video_id)
    if video is None:
        await call.answer(t("video.not_found", lang), show_alert=True)
        return
    if not video.is_deleted:
        await videos_repo.register_open(session, video)
    await _render_card(call.message, video, lang, callback_data.scope, callback_data.ref_id, callback_data.page)
    await call.answer()


@router.callback_query(VideoActionCB.filter(F.action == "favorite"))
async def action_favorite(call: CallbackQuery, callback_data: VideoActionCB, session: AsyncSession, db_user: User, lang: str) -> None:
    video = await videos_repo.get_video(session, db_user.id, callback_data.video_id)
    if video is None:
        await call.answer(t("video.not_found", lang), show_alert=True)
        return
    prev = video.is_favorite
    await videos_repo.toggle_favorite(session, video)
    _LAST_ACTION[db_user.id] = {"type": "favorite", "video_id": video.id, "prev": prev}
    await _render_card(call.message, video, lang, callback_data.scope, callback_data.ref_id, callback_data.page, edit=True)
    await call.answer()


@router.callback_query(VideoActionCB.filter(F.action == "watched"))
async def action_watched(call: CallbackQuery, callback_data: VideoActionCB, session: AsyncSession, db_user: User, lang: str) -> None:
    video = await videos_repo.get_video(session, db_user.id, callback_data.video_id)
    if video is None:
        await call.answer(t("video.not_found", lang), show_alert=True)
        return
    prev = video.is_watched
    await videos_repo.toggle_watched(session, video)
    _LAST_ACTION[db_user.id] = {"type": "watched", "video_id": video.id, "prev": prev}
    await _render_card(call.message, video, lang, callback_data.scope, callback_data.ref_id, callback_data.page, edit=True)
    await call.answer()


@router.callback_query(VideoActionCB.filter(F.action == "delete"))
async def action_delete(call: CallbackQuery, callback_data: VideoActionCB, session: AsyncSession, db_user: User, lang: str) -> None:
    video = await videos_repo.get_video(session, db_user.id, callback_data.video_id)
    if video is None:
        await call.answer(t("video.not_found", lang), show_alert=True)
        return
    await videos_repo.soft_delete(session, video)
    _LAST_ACTION[db_user.id] = {"type": "delete", "video_id": video.id}
    await call.answer(t("video.deleted", lang) + " " + t("video.undo_available", lang), show_alert=True)
    await _render_card(call.message, video, lang, callback_data.scope, callback_data.ref_id, callback_data.page, edit=True)


@router.callback_query(VideoActionCB.filter(F.action == "restore"))
async def action_restore(call: CallbackQuery, callback_data: VideoActionCB, session: AsyncSession, db_user: User, lang: str) -> None:
    video = await videos_repo.get_video(session, db_user.id, callback_data.video_id)
    if video is None:
        await call.answer(t("video.not_found", lang), show_alert=True)
        return
    await videos_repo.restore(session, video)
    await call.answer(t("video.restored", lang), show_alert=True)
    await _render_card(call.message, video, lang, callback_data.scope, callback_data.ref_id, callback_data.page, edit=True)


@router.callback_query(VideoActionCB.filter(F.action == "purge"))
async def action_purge_ask(call: CallbackQuery, callback_data: VideoActionCB, lang: str) -> None:
    await call.message.answer(t("video.confirm_purge", lang), reply_markup=confirm_kb("purge_video", callback_data.video_id, lang))
    await call.answer()


@router.callback_query(ConfirmCB.filter(F.action == "purge_video"))
async def action_purge_confirm(call: CallbackQuery, callback_data: ConfirmCB, session: AsyncSession, db_user: User, lang: str) -> None:
    if callback_data.yes:
        video = await videos_repo.get_video(session, db_user.id, callback_data.entity_id)
        if video:
            await videos_repo.permanent_delete(session, video)
        await call.message.edit_text(t("video.purged", lang))
    else:
        await call.message.edit_text(t("common.cancelled", lang))
    await call.answer()


@router.callback_query(VideoActionCB.filter(F.action == "similar"))
async def action_similar(call: CallbackQuery, callback_data: VideoActionCB, session: AsyncSession, db_user: User, lang: str) -> None:
    video = await videos_repo.get_video(session, db_user.id, callback_data.video_id)
    if video is None:
        await call.answer(t("video.not_found", lang), show_alert=True)
        return
    similar = await videos_repo.similar_videos(session, video, limit=10)
    if not similar:
        await call.answer(t("browse.similar_none", lang), show_alert=True)
        return
    await call.message.answer(t("browse.similar_title", lang), reply_markup=videos_list_kb(similar, "similar", video.id, 0, 1, lang))
    await call.answer()


# --- Редактирование полей ---


@router.callback_query(VideoActionCB.filter(F.action == "edit"))
async def action_edit_menu(call: CallbackQuery, callback_data: VideoActionCB, lang: str) -> None:
    await call.message.edit_text(t("video.edit_menu", lang), reply_markup=edit_video_kb(callback_data.video_id, lang))
    await call.answer()


@router.callback_query(VideoActionCB.filter(F.action == "edit_title"))
async def action_edit_title(call: CallbackQuery, callback_data: VideoActionCB, state: FSMContext, lang: str) -> None:
    await state.set_state(EditVideo.editing_title)
    await state.update_data(video_id=callback_data.video_id)
    await call.message.answer(t("video.enter_title", lang))
    await call.answer()


@router.message(StateFilter(EditVideo.editing_title))
async def apply_edit_title(message: Message, session: AsyncSession, db_user: User, state: FSMContext, lang: str) -> None:
    data = await state.get_data()
    video = await videos_repo.get_video(session, db_user.id, data["video_id"])
    await state.clear()
    if video is None or not (message.text or "").strip():
        return
    await videos_repo.update_fields(session, video, title=message.text.strip())
    await message.answer(t("video.title_updated", lang))
    await _render_card(message, video, lang)


@router.callback_query(VideoActionCB.filter(F.action == "edit_note"))
async def action_edit_note(call: CallbackQuery, callback_data: VideoActionCB, state: FSMContext, lang: str) -> None:
    await state.set_state(EditVideo.editing_note)
    await state.update_data(video_id=callback_data.video_id)
    await call.message.answer(t("video.enter_note", lang))
    await call.answer()


@router.message(StateFilter(EditVideo.editing_note))
async def apply_edit_note(message: Message, session: AsyncSession, db_user: User, state: FSMContext, lang: str) -> None:
    data = await state.get_data()
    video = await videos_repo.get_video(session, db_user.id, data["video_id"])
    await state.clear()
    if video is None:
        return
    text = (message.text or "").strip()
    note = None if text == "/skip" else text
    await videos_repo.update_fields(session, video, note=note)
    await message.answer(t("video.note_updated", lang))
    await _render_card(message, video, lang)


@router.callback_query(VideoActionCB.filter(F.action == "edit_rating"))
async def action_edit_rating(call: CallbackQuery, callback_data: VideoActionCB, lang: str) -> None:
    await call.message.answer(t("add.enter_rating", lang), reply_markup=rating_kb("edit", callback_data.video_id, lang))
    await call.answer()


@router.callback_query(RatingPickCB.filter())
async def apply_rating_generic(call: CallbackQuery, callback_data: RatingPickCB, session: AsyncSession, db_user: User, lang: str) -> None:
    """Обработчик рейтинга вне мастера добавления (например, из карточки/редактирования)."""
    video = await videos_repo.get_video(session, db_user.id, callback_data.video_id)
    if video is None:
        await call.answer(t("video.not_found", lang), show_alert=True)
        return
    await videos_repo.update_fields(session, video, rating=callback_data.value)
    await call.answer(t("video.rating_updated", lang))
    await _render_card(call.message, video, lang)


@router.callback_query(VideoActionCB.filter(F.action == "edit_tags"))
async def action_edit_tags(call: CallbackQuery, callback_data: VideoActionCB, session: AsyncSession, db_user: User, state: FSMContext, lang: str) -> None:
    await state.set_state(EditVideo.editing_tags)
    await state.update_data(video_id=callback_data.video_id)
    top = await tags_repo.top_used(session, db_user.id)
    hint = ("\n\n" + ("Существующие" if lang == "ru" else "Existing") + ": " + ", ".join(f"#{tg.name}" for tg in top)) if top else ""
    await call.message.answer(t("video.enter_tags", lang) + hint)
    await call.answer()


@router.message(StateFilter(EditVideo.editing_tags))
async def apply_edit_tags(message: Message, session: AsyncSession, db_user: User, state: FSMContext, lang: str) -> None:
    data = await state.get_data()
    video = await videos_repo.get_video(session, db_user.id, data["video_id"])
    await state.clear()
    if video is None:
        return
    names = [n.strip() for n in (message.text or "").split(",") if n.strip()]
    await videos_repo.set_tags_by_names(session, video, names)
    await message.answer(t("video.tags_updated", lang))
    await _render_card(message, video, lang)


@router.callback_query(VideoActionCB.filter(F.action == "edit_categories"))
async def action_edit_categories(call: CallbackQuery, callback_data: VideoActionCB, session: AsyncSession, db_user: User, state: FSMContext, lang: str) -> None:
    video = await videos_repo.get_video(session, db_user.id, callback_data.video_id)
    if video is None:
        await call.answer(t("video.not_found", lang), show_alert=True)
        return
    await state.set_state(EditVideo.editing_categories)
    await state.update_data(video_id=video.id, selected_categories=[c.id for c in video.categories])
    cats = await categories_repo.list_all(session, db_user.id)
    await call.message.answer(
        t("add.choose_categories", lang), reply_markup=categories_multiselect_kb(cats, {c.id for c in video.categories}, lang)
    )
    await call.answer()


@router.callback_query(StateFilter(EditVideo.editing_categories), CategoryToggleCB.filter())
async def edit_toggle_category(call: CallbackQuery, callback_data: CategoryToggleCB, session: AsyncSession, db_user: User, state: FSMContext, lang: str) -> None:
    data = await state.get_data()
    selected = set(data.get("selected_categories", []))
    if callback_data.category_id in selected:
        selected.discard(callback_data.category_id)
    else:
        selected.add(callback_data.category_id)
    await state.update_data(selected_categories=list(selected))
    cats = await categories_repo.list_all(session, db_user.id)
    await call.message.edit_reply_markup(reply_markup=categories_multiselect_kb(cats, selected, lang))
    await call.answer()


@router.callback_query(StateFilter(EditVideo.editing_categories), WizardDoneCB.filter(F.step == "categories"))
async def edit_categories_done(call: CallbackQuery, session: AsyncSession, db_user: User, state: FSMContext, lang: str) -> None:
    data = await state.get_data()
    video = await videos_repo.get_video(session, db_user.id, data["video_id"])
    await state.clear()
    if video is None:
        await call.answer()
        return
    await videos_repo.set_categories(session, video, data.get("selected_categories", []))
    await call.message.answer(t("video.categories_updated", lang))
    await _render_card(call.message, video, lang)
    await call.answer()


# --- Undo ---


@router.message(Command("undo"))
async def cmd_undo(message: Message, session: AsyncSession, db_user: User, lang: str) -> None:
    action = _LAST_ACTION.pop(db_user.id, None)
    if not action:
        await message.answer(t("video.undo_nothing", lang))
        return
    video = await videos_repo.get_video(session, db_user.id, action["video_id"])
    if video is None:
        await message.answer(t("video.undo_nothing", lang))
        return
    if action["type"] == "delete":
        await videos_repo.restore(session, video)
    elif action["type"] == "favorite":
        await videos_repo.update_fields(session, video, is_favorite=action["prev"])
    elif action["type"] == "watched":
        await videos_repo.update_fields(session, video, is_watched=action["prev"])
    await message.answer(t("video.undo_done", lang))
    await _render_card(message, video, lang)

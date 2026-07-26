"""Добавление видео: одиночное, массовое, из пересланных сообщений, мастер категорий/тегов."""
from __future__ import annotations

import logging
import re

from aiogram import F, Router
from aiogram.filters import Command, StateFilter
from aiogram.fsm.context import FSMContext
from aiogram.types import CallbackQuery, Message
from sqlalchemy.ext.asyncio import AsyncSession

from bot.callbacks import (
    AutotagConfirmCB,
    CategoryNewCB,
    CategoryToggleCB,
    RatingPickCB,
    WizardDoneCB,
    WizardSkipCB,
)
from bot.keyboards import (
    autotag_confirm_kb,
    categories_multiselect_kb,
    main_menu_kb,
    rating_kb,
    skip_kb,
    video_card_kb,
)
from bot.locales import t
from bot.models import User, Video
from bot.repository import categories as categories_repo
from bot.repository import tags as tags_repo
from bot.repository import videos as videos_repo
from bot.services import metadata as metadata_service
from bot.services.autotag import suggest_categories
from bot.states import AddVideo, BulkAdd

logger = logging.getLogger(__name__)
router = Router(name="add")

URL_RE = re.compile(r"https?://\S+")


@router.message(Command("add"))
async def cmd_add(message: Message, lang: str) -> None:
    await message.answer(t("add.prompt_link", lang))


@router.message(Command("bulk"))
async def cmd_bulk(message: Message, state: FSMContext, lang: str) -> None:
    await state.set_state(BulkAdd.waiting_links)
    await message.answer(t("add.bulk_prompt", lang))


@router.message(StateFilter(BulkAdd.waiting_links))
async def bulk_links_received(message: Message, session: AsyncSession, db_user: User, state: FSMContext, lang: str) -> None:
    await state.clear()
    urls = URL_RE.findall(message.text or "")
    if not urls:
        await message.answer(t("add.invalid_url", lang))
        return
    await _bulk_add(message, session, db_user, lang, urls)


async def _bulk_add(message: Message, session: AsyncSession, db_user: User, lang: str, urls: list[str]) -> None:
    seen: set[str] = set()
    added = dup = errors = 0
    for url in urls:
        if url in seen:
            continue
        seen.add(url)
        try:
            existing = await videos_repo.get_by_url(session, db_user.id, url)
            if existing:
                dup += 1
                continue
            title = source = thumbnail = None
            duration = None
            if db_user.auto_metadata:
                meta = await metadata_service.fetch_metadata(url)
                title, duration, thumbnail, source = meta.title, meta.duration, meta.thumbnail_url, meta.source
            video = await videos_repo.create_video(session, db_user.id, url, title, source, duration, thumbnail)
            suggested = await suggest_categories(session, db_user.id, video.title)
            if suggested:
                await videos_repo.set_categories(session, video, [c.id for c in suggested])
            added += 1
        except Exception:  # noqa: BLE001
            logger.exception("Ошибка массового добавления для %s", url)
            errors += 1
    await message.answer(t("add.bulk_result", lang, added=added, dup=dup, errors=errors), reply_markup=main_menu_kb(lang))


@router.message(StateFilter(None), F.text.regexp(URL_RE.pattern))
async def incoming_link(message: Message, session: AsyncSession, db_user: User, state: FSMContext, lang: str) -> None:
    urls = URL_RE.findall(message.text or "")
    if not urls:
        return
    if len(urls) > 1:
        await _bulk_add(message, session, db_user, lang, urls)
        return
    await _start_single_add(message, session, db_user, state, lang, urls[0])


@router.message(StateFilter(None), F.forward_origin, F.caption.regexp(URL_RE.pattern))
async def forwarded_with_link(message: Message, session: AsyncSession, db_user: User, state: FSMContext, lang: str) -> None:
    urls = URL_RE.findall(message.caption or "")
    if not urls:
        await message.answer(t("add.forwarded_no_link", lang))
        return
    if len(urls) > 1:
        await _bulk_add(message, session, db_user, lang, urls)
        return
    await _start_single_add(message, session, db_user, state, lang, urls[0])


async def _start_single_add(
    message: Message, session: AsyncSession, db_user: User, state: FSMContext, lang: str, url: str
) -> None:
    existing = await videos_repo.get_by_url(session, db_user.id, url)
    if existing:
        from bot.handlers.manage import format_video_card

        await message.answer(t("add.duplicate", lang))
        await message.answer(format_video_card(existing, lang), reply_markup=video_card_kb(existing, lang=lang))
        return

    status = await message.answer(t("add.fetching", lang))
    title = source = thumbnail = None
    duration = None
    if db_user.auto_metadata:
        meta = await metadata_service.fetch_metadata(url)
        title, duration, thumbnail, source = meta.title, meta.duration, meta.thumbnail_url, meta.source
    video = await videos_repo.create_video(session, db_user.id, url, title, source, duration, thumbnail)
    try:
        await status.delete()
    except Exception:  # noqa: BLE001
        pass

    await state.update_data(video_id=video.id, selected_categories=[])

    suggested = await suggest_categories(session, db_user.id, video.title)
    if suggested:
        await state.update_data(suggested_categories=[c.id for c in suggested])
        names = ", ".join(c.name for c in suggested)
        await state.set_state(AddVideo.confirming_autotag)
        await message.answer(t("add.autotag_suggestion", lang, names=names), reply_markup=autotag_confirm_kb(lang))
        return

    await _show_category_step(message, session, db_user, state, lang, preselected=set())


async def _tags_prompt(session: AsyncSession, db_user: User, lang: str) -> str:
    top = await tags_repo.top_used(session, db_user.id)
    base = t("add.enter_tags", lang)
    if not top:
        return base
    hint = ", ".join(f"#{tag.name}" for tag in top)
    return f"{base}\n\n{'Существующие' if lang == 'ru' else 'Existing'}: {hint}"


async def _show_category_step(
    message: Message, session: AsyncSession, db_user: User, state: FSMContext, lang: str, preselected: set[int]
) -> None:
    cats = await categories_repo.list_all(session, db_user.id)
    await state.update_data(selected_categories=list(preselected))
    await state.set_state(AddVideo.choosing_categories)
    if not cats:
        await message.answer(t("add.no_categories_yet", lang))
        return
    await message.answer(t("add.choose_categories", lang), reply_markup=categories_multiselect_kb(cats, preselected, lang))


@router.callback_query(StateFilter(AddVideo.confirming_autotag), AutotagConfirmCB.filter())
async def autotag_confirm(
    call: CallbackQuery, callback_data: AutotagConfirmCB, session: AsyncSession, db_user: User, state: FSMContext, lang: str
) -> None:
    data = await state.get_data()
    preselected = set(data.get("suggested_categories", [])) if callback_data.apply else set()
    await call.message.delete()
    await _show_category_step(call.message, session, db_user, state, lang, preselected)
    await call.answer()


@router.callback_query(StateFilter(AddVideo.choosing_categories), CategoryToggleCB.filter())
async def wizard_toggle_category(
    call: CallbackQuery, callback_data: CategoryToggleCB, session: AsyncSession, db_user: User, state: FSMContext, lang: str
) -> None:
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


@router.callback_query(StateFilter(AddVideo.choosing_categories), CategoryNewCB.filter())
async def wizard_new_category(call: CallbackQuery, state: FSMContext, lang: str) -> None:
    await state.update_data(return_state="categories")
    await state.set_state(AddVideo.creating_category_inline)
    await call.message.answer(t("add.new_category_name", lang))
    await call.answer()


@router.message(StateFilter(AddVideo.creating_category_inline))
async def wizard_create_category(message: Message, session: AsyncSession, db_user: User, state: FSMContext, lang: str) -> None:
    name = (message.text or "").strip()
    if not name:
        return
    existing = await categories_repo.get_by_name(session, db_user.id, name)
    if existing:
        await message.answer(t("categories.already_exists", lang))
        category = existing
    else:
        category = await categories_repo.create(session, db_user.id, name)
        await message.answer(t("add.new_category_created", lang, name=name))

    data = await state.get_data()
    selected = set(data.get("selected_categories", []))
    selected.add(category.id)
    await state.update_data(selected_categories=list(selected))
    await state.set_state(AddVideo.choosing_categories)

    cats = await categories_repo.list_all(session, db_user.id)
    await message.answer(t("add.choose_categories", lang), reply_markup=categories_multiselect_kb(cats, selected, lang))


@router.callback_query(StateFilter(AddVideo.choosing_categories), WizardDoneCB.filter(F.step == "categories"))
async def wizard_categories_done(call: CallbackQuery, session: AsyncSession, db_user: User, state: FSMContext, lang: str) -> None:
    data = await state.get_data()
    video = await videos_repo.get_video(session, db_user.id, data["video_id"])
    if video is None:
        await call.answer(t("video.not_found", lang), show_alert=True)
        await state.clear()
        return
    await videos_repo.set_categories(session, video, data.get("selected_categories", []))
    await state.set_state(AddVideo.entering_tags)
    await call.message.answer(await _tags_prompt(session, db_user, lang), reply_markup=skip_kb("tags", lang))
    await call.answer()


@router.message(StateFilter(AddVideo.entering_tags))
async def wizard_enter_tags(message: Message, session: AsyncSession, db_user: User, state: FSMContext, lang: str) -> None:
    data = await state.get_data()
    video = await videos_repo.get_video(session, db_user.id, data["video_id"])
    if video is None:
        await state.clear()
        return
    names = [n.strip() for n in (message.text or "").split(",") if n.strip()]
    if names:
        await videos_repo.set_tags_by_names(session, video, names)
    await state.set_state(AddVideo.entering_rating)
    await message.answer(t("add.enter_rating", lang), reply_markup=rating_kb("wizard", video.id, lang))


@router.callback_query(StateFilter(AddVideo.entering_tags), WizardSkipCB.filter(F.step == "tags"))
async def wizard_skip_tags(call: CallbackQuery, session: AsyncSession, db_user: User, state: FSMContext, lang: str) -> None:
    data = await state.get_data()
    video = await videos_repo.get_video(session, db_user.id, data["video_id"])
    if video is None:
        await state.clear()
        await call.answer()
        return
    await state.set_state(AddVideo.entering_rating)
    await call.message.answer(t("add.enter_rating", lang), reply_markup=rating_kb("wizard", video.id, lang))
    await call.answer()


@router.callback_query(StateFilter(AddVideo.entering_rating), RatingPickCB.filter())
async def wizard_set_rating(
    call: CallbackQuery, callback_data: RatingPickCB, session: AsyncSession, db_user: User, state: FSMContext, lang: str
) -> None:
    video = await videos_repo.get_video(session, db_user.id, callback_data.video_id)
    if video is None:
        await state.clear()
        await call.answer()
        return
    await videos_repo.update_fields(session, video, rating=callback_data.value)
    await state.set_state(AddVideo.entering_note)
    await call.message.answer(t("add.enter_note", lang), reply_markup=skip_kb("note", lang))
    await call.answer()


@router.callback_query(StateFilter(AddVideo.entering_rating), WizardSkipCB.filter(F.step == "rating"))
async def wizard_skip_rating(call: CallbackQuery, state: FSMContext, lang: str) -> None:
    await state.set_state(AddVideo.entering_note)
    await call.message.answer(t("add.enter_note", lang), reply_markup=skip_kb("note", lang))
    await call.answer()


async def _finish_wizard(message: Message, session: AsyncSession, db_user: User, state: FSMContext, lang: str, video_id: int) -> None:
    from bot.handlers.manage import format_video_card

    video = await videos_repo.get_video(session, db_user.id, video_id)
    await state.clear()
    if video is None:
        return
    await message.answer(t("add.finished", lang), reply_markup=main_menu_kb(lang))
    await message.answer(format_video_card(video, lang), reply_markup=video_card_kb(video, lang=lang))


@router.message(StateFilter(AddVideo.entering_note))
async def wizard_enter_note(message: Message, session: AsyncSession, db_user: User, state: FSMContext, lang: str) -> None:
    data = await state.get_data()
    video = await videos_repo.get_video(session, db_user.id, data["video_id"])
    if video is None:
        await state.clear()
        return
    note = (message.text or "").strip()
    if note and note != "/skip":
        await videos_repo.update_fields(session, video, note=note)
    await _finish_wizard(message, session, db_user, state, lang, video.id)


@router.callback_query(StateFilter(AddVideo.entering_note), WizardSkipCB.filter(F.step == "note"))
async def wizard_skip_note(call: CallbackQuery, session: AsyncSession, db_user: User, state: FSMContext, lang: str) -> None:
    data = await state.get_data()
    await _finish_wizard(call.message, session, db_user, state, lang, data["video_id"])
    await call.answer()

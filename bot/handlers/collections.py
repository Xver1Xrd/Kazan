"""Коллекции/плейлисты: CRUD, добавление/удаление видео, порядок, воспроизведение, экспорт."""
from __future__ import annotations

from aiogram import F, Router
from aiogram.filters import Command, StateFilter
from aiogram.fsm.context import FSMContext
from aiogram.types import BufferedInputFile, CallbackQuery, Message
from sqlalchemy.ext.asyncio import AsyncSession

from bot.callbacks import CollectionManageCB, ConfirmCB, VideoActionCB
from bot.keyboards import (
    add_to_collection_kb,
    collection_actions_kb,
    collection_videos_kb,
    collections_manage_kb,
    confirm_kb,
    video_card_kb,
)
from bot.locales import t
from bot.models import User
from bot.repository import collections as collections_repo
from bot.repository import videos as videos_repo
from bot.states import CollectionForm

router = Router(name="collections")


@router.message(Command("collections"))
@router.message(F.text.in_({"📋 Коллекции", "📋 Collections"}))
async def cmd_collections(message: Message, session: AsyncSession, db_user: User, lang: str) -> None:
    collections = await collections_repo.list_with_counts(session, db_user.id)
    if not collections:
        await message.answer(t("collections.empty", lang), reply_markup=collections_manage_kb([], lang))
        return
    await message.answer(t("collections.title", lang), reply_markup=collections_manage_kb(collections, lang))


@router.callback_query(CollectionManageCB.filter(F.action == "create"))
async def create_collection_ask(call: CallbackQuery, state: FSMContext, lang: str) -> None:
    await state.set_state(CollectionForm.creating_name)
    await call.message.answer(t("collections.enter_name", lang))
    await call.answer()


@router.message(StateFilter(CollectionForm.creating_name))
async def create_collection_apply(message: Message, session: AsyncSession, db_user: User, state: FSMContext, lang: str) -> None:
    name = (message.text or "").strip()
    await state.clear()
    if not name:
        return
    await collections_repo.create(session, db_user.id, name)
    await message.answer(t("collections.created", lang, name=name))


@router.callback_query(CollectionManageCB.filter(F.action == "open"))
async def open_collection(call: CallbackQuery, callback_data: CollectionManageCB, session: AsyncSession, db_user: User, lang: str) -> None:
    collection = await collections_repo.get(session, db_user.id, callback_data.collection_id)
    if collection is None:
        await call.answer(t("common.not_found", lang), show_alert=True)
        return
    await call.message.answer(collection.name, reply_markup=collection_actions_kb(collection.id, lang))
    videos = await collections_repo.ordered_videos(session, collection.id)
    if videos:
        await call.message.answer(t("collections.title", lang), reply_markup=collection_videos_kb(videos, collection.id, lang))
    else:
        await call.message.answer(t("collections.empty_playlist", lang))
    await call.answer()


@router.callback_query(CollectionManageCB.filter(F.action == "back_to_list"))
async def back_to_collections(call: CallbackQuery, session: AsyncSession, db_user: User, lang: str) -> None:
    collections = await collections_repo.list_with_counts(session, db_user.id)
    await call.message.answer(t("collections.title", lang), reply_markup=collections_manage_kb(collections, lang))
    await call.answer()


@router.callback_query(CollectionManageCB.filter(F.action == "rename"))
async def rename_collection_ask(call: CallbackQuery, callback_data: CollectionManageCB, state: FSMContext, lang: str) -> None:
    await state.update_data(collection_id=callback_data.collection_id)
    await state.set_state(CollectionForm.renaming)
    await call.message.answer(t("collections.enter_name", lang))
    await call.answer()


@router.message(StateFilter(CollectionForm.renaming))
async def rename_collection_apply(message: Message, session: AsyncSession, db_user: User, state: FSMContext, lang: str) -> None:
    data = await state.get_data()
    collection = await collections_repo.get(session, db_user.id, data["collection_id"])
    await state.clear()
    name = (message.text or "").strip()
    if collection is None or not name:
        return
    await collections_repo.rename(session, collection, name)
    await message.answer(t("collections.renamed", lang, name=name))


@router.callback_query(CollectionManageCB.filter(F.action == "delete"))
async def delete_collection_ask(call: CallbackQuery, callback_data: CollectionManageCB, session: AsyncSession, db_user: User, lang: str) -> None:
    collection = await collections_repo.get(session, db_user.id, callback_data.collection_id)
    if collection is None:
        await call.answer(t("common.not_found", lang), show_alert=True)
        return
    await call.message.answer(
        t("collections.confirm_delete", lang, name=collection.name), reply_markup=confirm_kb("delete_collection", collection.id, lang)
    )
    await call.answer()


@router.callback_query(ConfirmCB.filter(F.action == "delete_collection"))
async def delete_collection_confirm(call: CallbackQuery, callback_data: ConfirmCB, session: AsyncSession, db_user: User, lang: str) -> None:
    if callback_data.yes:
        collection = await collections_repo.get(session, db_user.id, callback_data.entity_id)
        if collection:
            await collections_repo.delete_collection(session, collection)
        await call.message.edit_text(t("collections.deleted", lang))
    else:
        await call.message.edit_text(t("common.cancelled", lang))
    await call.answer()


@router.callback_query(CollectionManageCB.filter(F.action == "remove_video"))
async def remove_video_from_collection(call: CallbackQuery, callback_data: CollectionManageCB, session: AsyncSession, db_user: User, lang: str) -> None:
    await collections_repo.remove_video(session, callback_data.collection_id, callback_data.video_id)
    videos = await collections_repo.ordered_videos(session, callback_data.collection_id)
    await call.answer(t("collections.removed_video", lang))
    if videos:
        await call.message.edit_reply_markup(reply_markup=collection_videos_kb(videos, callback_data.collection_id, lang))
    else:
        await call.message.edit_text(t("collections.empty_playlist", lang))


@router.callback_query(CollectionManageCB.filter(F.action == "move_up"))
async def move_video_up(call: CallbackQuery, callback_data: CollectionManageCB, session: AsyncSession, db_user: User, lang: str) -> None:
    await collections_repo.move(session, callback_data.collection_id, callback_data.video_id, -1)
    videos = await collections_repo.ordered_videos(session, callback_data.collection_id)
    await call.message.edit_reply_markup(reply_markup=collection_videos_kb(videos, callback_data.collection_id, lang))
    await call.answer()


@router.callback_query(CollectionManageCB.filter(F.action == "move_down"))
async def move_video_down(call: CallbackQuery, callback_data: CollectionManageCB, session: AsyncSession, db_user: User, lang: str) -> None:
    await collections_repo.move(session, callback_data.collection_id, callback_data.video_id, 1)
    videos = await collections_repo.ordered_videos(session, callback_data.collection_id)
    await call.message.edit_reply_markup(reply_markup=collection_videos_kb(videos, callback_data.collection_id, lang))
    await call.answer()


async def _send_collection_video(message: Message, video, collection_id: int, lang: str) -> None:
    from aiogram.types import InlineKeyboardButton

    from bot.handlers.manage import format_video_card

    kb = video_card_kb(video, scope="collection", ref_id=collection_id, lang=lang)
    next_text = "▶️ " + ("Следующее" if lang == "ru" else "Next")
    kb.inline_keyboard.append(
        [InlineKeyboardButton(text=next_text, callback_data=CollectionManageCB(action="play_next", collection_id=collection_id, video_id=video.id).pack())]
    )
    await message.answer(format_video_card(video, lang), reply_markup=kb)


@router.callback_query(CollectionManageCB.filter(F.action == "play"))
async def play_collection(call: CallbackQuery, callback_data: CollectionManageCB, session: AsyncSession, db_user: User, lang: str) -> None:
    video = await collections_repo.next_in_collection(session, callback_data.collection_id, None)
    if video is None:
        await call.answer(t("collections.empty_playlist", lang), show_alert=True)
        return
    await videos_repo.register_open(session, video)
    await _send_collection_video(call.message, video, callback_data.collection_id, lang)
    await call.answer()


@router.callback_query(CollectionManageCB.filter(F.action == "play_next"))
async def play_next(call: CallbackQuery, callback_data: CollectionManageCB, session: AsyncSession, db_user: User, lang: str) -> None:
    video = await collections_repo.next_in_collection(session, callback_data.collection_id, callback_data.video_id)
    if video is None:
        await call.answer(t("collections.end_of_playlist", lang), show_alert=True)
        return
    await videos_repo.register_open(session, video)
    await _send_collection_video(call.message, video, callback_data.collection_id, lang)
    await call.answer()


@router.callback_query(CollectionManageCB.filter(F.action == "export"))
async def export_collection(call: CallbackQuery, callback_data: CollectionManageCB, session: AsyncSession, db_user: User, lang: str) -> None:
    collection = await collections_repo.get(session, db_user.id, callback_data.collection_id)
    if collection is None:
        await call.answer(t("common.not_found", lang), show_alert=True)
        return
    videos = await collections_repo.ordered_videos(session, collection.id)
    lines = [f"{i + 1}. {v.title or v.url}\n{v.url}" for i, v in enumerate(videos)]
    content = "\n\n".join(lines) or "—"
    file = BufferedInputFile(content.encode("utf-8"), filename=f"{collection.name}.txt")
    await call.message.answer_document(file, caption=t("collections.exported", lang, name=collection.name))
    await call.answer()


# --- Добавление видео в коллекцию из карточки видео ---


@router.callback_query(VideoActionCB.filter(F.action == "add_collection"))
async def add_to_collection_ask(call: CallbackQuery, callback_data: VideoActionCB, session: AsyncSession, db_user: User, lang: str) -> None:
    collections = await collections_repo.list_all(session, db_user.id)
    if not collections:
        await call.answer(t("collections.empty", lang), show_alert=True)
        return
    await call.message.answer(t("collections.pick_for_video", lang), reply_markup=add_to_collection_kb(collections, callback_data.video_id))
    await call.answer()


@router.callback_query(CollectionManageCB.filter(F.action == "add_video"))
async def add_video_to_collection(call: CallbackQuery, callback_data: CollectionManageCB, session: AsyncSession, db_user: User, lang: str) -> None:
    collection = await collections_repo.get(session, db_user.id, callback_data.collection_id)
    if collection is None:
        await call.answer(t("common.not_found", lang), show_alert=True)
        return
    added = await collections_repo.add_video(session, collection.id, callback_data.video_id)
    if added:
        await call.answer(t("collections.added_video", lang, name=collection.name), show_alert=True)
    else:
        await call.answer(t("collections.already_in", lang), show_alert=True)

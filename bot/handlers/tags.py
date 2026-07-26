"""Теги: CRUD и просмотр."""
from __future__ import annotations

from aiogram import F, Router
from aiogram.filters import Command, StateFilter
from aiogram.fsm.context import FSMContext
from aiogram.types import CallbackQuery, Message
from sqlalchemy.ext.asyncio import AsyncSession

from bot.callbacks import ConfirmCB, TagManageCB
from bot.keyboards import confirm_kb, tag_actions_kb, tags_manage_kb
from bot.locales import t
from bot.models import User
from bot.repository import tags as tags_repo
from bot.states import TagForm

router = Router(name="tags")


@router.message(Command("tags"))
@router.message(F.text.in_({"🏷 Теги", "🏷 Tags"}))
async def cmd_tags(message: Message, session: AsyncSession, db_user: User, lang: str) -> None:
    tags = await tags_repo.list_with_counts(session, db_user.id)
    if not tags:
        await message.answer(t("tags.empty", lang))
        return
    await message.answer(t("tags.title", lang), reply_markup=tags_manage_kb(tags))


@router.callback_query(TagManageCB.filter(F.action == "open"))
async def open_tag(call: CallbackQuery, callback_data: TagManageCB, session: AsyncSession, db_user: User, lang: str) -> None:
    tag = await tags_repo.get(session, db_user.id, callback_data.tag_id)
    if tag is None:
        await call.answer(t("common.not_found", lang), show_alert=True)
        return
    await call.message.answer(f"#{tag.name}", reply_markup=tag_actions_kb(tag, lang))
    await call.answer()


@router.callback_query(TagManageCB.filter(F.action == "rename"))
async def rename_tag_ask(call: CallbackQuery, callback_data: TagManageCB, state: FSMContext, lang: str) -> None:
    await state.update_data(tag_id=callback_data.tag_id)
    await state.set_state(TagForm.renaming)
    await call.message.answer(t("tags.enter_new_name", lang))
    await call.answer()


@router.message(StateFilter(TagForm.renaming))
async def rename_tag_apply(message: Message, session: AsyncSession, db_user: User, state: FSMContext, lang: str) -> None:
    data = await state.get_data()
    tag = await tags_repo.get(session, db_user.id, data["tag_id"])
    await state.clear()
    name = (message.text or "").strip()
    if tag is None or not name:
        return
    await tags_repo.rename(session, tag, name)
    await message.answer(t("tags.renamed", lang, name=tag.name))


@router.callback_query(TagManageCB.filter(F.action == "delete"))
async def delete_tag_ask(call: CallbackQuery, callback_data: TagManageCB, session: AsyncSession, db_user: User, lang: str) -> None:
    tag = await tags_repo.get(session, db_user.id, callback_data.tag_id)
    if tag is None:
        await call.answer(t("common.not_found", lang), show_alert=True)
        return
    await call.message.answer(t("tags.confirm_delete", lang, name=tag.name), reply_markup=confirm_kb("delete_tag", tag.id, lang))
    await call.answer()


@router.callback_query(ConfirmCB.filter(F.action == "delete_tag"))
async def delete_tag_confirm(call: CallbackQuery, callback_data: ConfirmCB, session: AsyncSession, db_user: User, lang: str) -> None:
    if callback_data.yes:
        tag = await tags_repo.get(session, db_user.id, callback_data.entity_id)
        if tag:
            await tags_repo.delete_tag(session, tag)
        await call.message.edit_text(t("tags.deleted", lang))
    else:
        await call.message.edit_text(t("common.cancelled", lang))
    await call.answer()

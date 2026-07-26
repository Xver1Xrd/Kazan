"""Категории: CRUD, иерархия, слияние; правила авто-категоризации."""
from __future__ import annotations

from aiogram import F, Router
from aiogram.filters import Command, StateFilter
from aiogram.fsm.context import FSMContext
from aiogram.types import CallbackQuery, Message
from sqlalchemy.ext.asyncio import AsyncSession

from bot.callbacks import CategoryManageCB, CategoryNewCB, ConfirmCB, RuleManageCB
from bot.keyboards import (
    categories_manage_kb,
    category_actions_kb,
    category_pick_kb,
    confirm_kb,
    merge_target_kb,
    rules_manage_kb,
)
from bot.locales import t
from bot.models import User
from bot.repository import categories as categories_repo
from bot.repository import rules as rules_repo
from bot.states import CategoryForm, RuleForm

router = Router(name="categories")


@router.message(Command("categories"))
@router.message(F.text.in_({"🗂 Категории", "🗂 Categories"}))
async def cmd_categories(message: Message, session: AsyncSession, db_user: User, lang: str) -> None:
    cats = await categories_repo.list_with_counts(session, db_user.id)
    if not cats:
        await message.answer(t("categories.empty", lang))
        return
    await message.answer(t("categories.title", lang), reply_markup=categories_manage_kb(cats, lang))


@router.callback_query(StateFilter(None), CategoryNewCB.filter())
async def new_category_standalone(call: CallbackQuery, state: FSMContext, lang: str) -> None:
    await state.set_state(CategoryForm.creating_name)
    await call.message.answer(t("add.new_category_name", lang))
    await call.answer()


@router.message(StateFilter(CategoryForm.creating_name))
async def create_category_name(message: Message, session: AsyncSession, db_user: User, state: FSMContext, lang: str) -> None:
    name = (message.text or "").strip()
    if not name:
        return
    existing = await categories_repo.get_by_name(session, db_user.id, name)
    if existing:
        await message.answer(t("categories.already_exists", lang))
        await state.clear()
        return
    category = await categories_repo.create(session, db_user.id, name)
    await state.update_data(category_id=category.id)
    await state.set_state(CategoryForm.creating_emoji)
    await message.answer(t("categories.enter_emoji", lang))


@router.message(StateFilter(CategoryForm.creating_emoji))
async def create_category_emoji(message: Message, session: AsyncSession, db_user: User, state: FSMContext, lang: str) -> None:
    data = await state.get_data()
    category = await categories_repo.get(session, db_user.id, data["category_id"])
    await state.clear()
    if category is None:
        return
    text = (message.text or "").strip()
    if text and text != "/skip":
        await categories_repo.set_emoji(session, category, text[:8])
    await message.answer(t("add.new_category_created", lang, name=category.name))
    cats = await categories_repo.list_with_counts(session, db_user.id)
    await message.answer(t("categories.title", lang), reply_markup=categories_manage_kb(cats, lang))


@router.callback_query(CategoryManageCB.filter(F.action == "open"))
async def open_category(call: CallbackQuery, callback_data: CategoryManageCB, session: AsyncSession, db_user: User, lang: str) -> None:
    category = await categories_repo.get(session, db_user.id, callback_data.category_id)
    if category is None:
        await call.answer(t("common.not_found", lang), show_alert=True)
        return
    label = f"{category.emoji + ' ' if category.emoji else ''}{category.name}"
    await call.message.answer(label, reply_markup=category_actions_kb(category, lang))
    await call.answer()


@router.callback_query(CategoryManageCB.filter(F.action == "rename"))
async def rename_category_ask(call: CallbackQuery, callback_data: CategoryManageCB, state: FSMContext, lang: str) -> None:
    await state.update_data(category_id=callback_data.category_id)
    await state.set_state(CategoryForm.renaming)
    await call.message.answer(t("categories.enter_new_name", lang))
    await call.answer()


@router.message(StateFilter(CategoryForm.renaming))
async def rename_category_apply(message: Message, session: AsyncSession, db_user: User, state: FSMContext, lang: str) -> None:
    data = await state.get_data()
    category = await categories_repo.get(session, db_user.id, data["category_id"])
    await state.clear()
    name = (message.text or "").strip()
    if category is None or not name:
        return
    await categories_repo.rename(session, category, name)
    await message.answer(t("categories.renamed", lang, name=name))


@router.callback_query(CategoryManageCB.filter(F.action == "emoji"))
async def set_emoji_ask(call: CallbackQuery, callback_data: CategoryManageCB, state: FSMContext, lang: str) -> None:
    await state.update_data(category_id=callback_data.category_id)
    await state.set_state(CategoryForm.setting_emoji)
    await call.message.answer(t("categories.enter_emoji", lang))
    await call.answer()


@router.message(StateFilter(CategoryForm.setting_emoji))
async def set_emoji_apply(message: Message, session: AsyncSession, db_user: User, state: FSMContext, lang: str) -> None:
    data = await state.get_data()
    category = await categories_repo.get(session, db_user.id, data["category_id"])
    await state.clear()
    if category is None:
        return
    text = (message.text or "").strip()
    await categories_repo.set_emoji(session, category, None if text == "/skip" else text[:8])
    await message.answer(t("categories.renamed", lang, name=category.name))


@router.callback_query(CategoryManageCB.filter(F.action == "add_sub"))
async def add_subcategory_ask(call: CallbackQuery, callback_data: CategoryManageCB, session: AsyncSession, db_user: User, state: FSMContext, lang: str) -> None:
    parent = await categories_repo.get(session, db_user.id, callback_data.category_id)
    if parent is None:
        await call.answer(t("common.not_found", lang), show_alert=True)
        return
    await state.update_data(parent_id=parent.id)
    await state.set_state(CategoryForm.choosing_parent)
    await call.message.answer(t("categories.pick_parent_name", lang, parent=parent.name))
    await call.answer()


@router.message(StateFilter(CategoryForm.choosing_parent))
async def add_subcategory_apply(message: Message, session: AsyncSession, db_user: User, state: FSMContext, lang: str) -> None:
    data = await state.get_data()
    name = (message.text or "").strip()
    await state.clear()
    if not name:
        return
    existing = await categories_repo.get_by_name(session, db_user.id, name)
    if existing:
        await message.answer(t("categories.already_exists", lang))
        return
    await categories_repo.create(session, db_user.id, name, parent_id=data["parent_id"])
    await message.answer(t("add.new_category_created", lang, name=name))


@router.callback_query(CategoryManageCB.filter(F.action == "merge"))
async def merge_category_ask(call: CallbackQuery, callback_data: CategoryManageCB, session: AsyncSession, db_user: User, state: FSMContext, lang: str) -> None:
    source = await categories_repo.get(session, db_user.id, callback_data.category_id)
    if source is None:
        await call.answer(t("common.not_found", lang), show_alert=True)
        return
    all_cats = await categories_repo.list_all(session, db_user.id)
    if len(all_cats) < 2:
        await call.answer(t("categories.empty", lang), show_alert=True)
        return
    await state.update_data(merge_source_id=source.id)
    await state.set_state(CategoryForm.confirming_merge_target)
    await call.message.answer(t("categories.pick_merge_target", lang, name=source.name), reply_markup=merge_target_kb(all_cats, source.id, lang))
    await call.answer()


@router.callback_query(StateFilter(CategoryForm.confirming_merge_target), CategoryManageCB.filter(F.action == "merge_into"))
async def merge_category_apply(call: CallbackQuery, callback_data: CategoryManageCB, session: AsyncSession, db_user: User, state: FSMContext, lang: str) -> None:
    data = await state.get_data()
    source = await categories_repo.get(session, db_user.id, data["merge_source_id"])
    target = await categories_repo.get(session, db_user.id, callback_data.category_id)
    await state.clear()
    if source is None or target is None:
        await call.answer(t("common.not_found", lang), show_alert=True)
        return
    moved = await categories_repo.merge(session, source, target)
    await call.message.answer(t("categories.merged", lang, count=moved))
    await call.answer()


@router.callback_query(CategoryManageCB.filter(F.action == "delete"))
async def delete_category_ask(call: CallbackQuery, callback_data: CategoryManageCB, session: AsyncSession, db_user: User, lang: str) -> None:
    category = await categories_repo.get(session, db_user.id, callback_data.category_id)
    if category is None:
        await call.answer(t("common.not_found", lang), show_alert=True)
        return
    await call.message.answer(t("categories.confirm_delete", lang, name=category.name), reply_markup=confirm_kb("delete_category", category.id, lang))
    await call.answer()


@router.callback_query(ConfirmCB.filter(F.action == "delete_category"))
async def delete_category_confirm(call: CallbackQuery, callback_data: ConfirmCB, session: AsyncSession, db_user: User, lang: str) -> None:
    if callback_data.yes:
        category = await categories_repo.get(session, db_user.id, callback_data.entity_id)
        if category:
            await categories_repo.delete_category(session, category)
        await call.message.edit_text(t("categories.deleted", lang))
    else:
        await call.message.edit_text(t("common.cancelled", lang))
    await call.answer()


# --- Правила авто-категоризации (/rules) ---


@router.message(Command("rules"))
async def cmd_rules(message: Message, session: AsyncSession, db_user: User, lang: str) -> None:
    rules = await rules_repo.list_all(session, db_user.id)
    if not rules:
        await message.answer(t("rules.empty", lang))
        return
    await message.answer(t("rules.title", lang) + "\n" + t("rules.tap_to_delete", lang), reply_markup=rules_manage_kb(rules, lang))


@router.message(Command("rules_add"))
async def cmd_rules_add(message: Message, state: FSMContext, lang: str) -> None:
    await state.set_state(RuleForm.waiting_keyword)
    await message.answer(t("rules.enter_keyword", lang))


@router.message(StateFilter(RuleForm.waiting_keyword))
async def rule_keyword_received(message: Message, session: AsyncSession, db_user: User, state: FSMContext, lang: str) -> None:
    keyword = (message.text or "").strip().lower()
    if not keyword:
        return
    cats = await categories_repo.list_all(session, db_user.id)
    if not cats:
        await message.answer(t("categories.empty", lang))
        await state.clear()
        return
    await state.update_data(keyword=keyword)
    await state.set_state(RuleForm.choosing_category)
    await message.answer(t("rules.pick_category", lang, keyword=keyword), reply_markup=category_pick_kb(cats))


@router.callback_query(StateFilter(RuleForm.choosing_category), RuleManageCB.filter(F.action == "pick_category"))
async def rule_category_picked(call: CallbackQuery, callback_data: RuleManageCB, session: AsyncSession, db_user: User, state: FSMContext, lang: str) -> None:
    data = await state.get_data()
    category = await categories_repo.get(session, db_user.id, callback_data.category_id)
    await state.clear()
    if category is None:
        await call.answer(t("common.not_found", lang), show_alert=True)
        return
    await rules_repo.create(session, db_user.id, data["keyword"], category.id)
    await call.message.answer(t("rules.created", lang, keyword=data["keyword"], category=category.name))
    await call.answer()


@router.callback_query(RuleManageCB.filter(F.action == "delete"))
async def rule_delete(call: CallbackQuery, callback_data: RuleManageCB, session: AsyncSession, db_user: User, lang: str) -> None:
    rule = await rules_repo.get(session, db_user.id, callback_data.rule_id)
    if rule:
        await rules_repo.delete_rule(session, rule)
    await call.answer(t("rules.deleted", lang))
    rules = await rules_repo.list_all(session, db_user.id)
    if rules:
        await call.message.edit_reply_markup(reply_markup=rules_manage_kb(rules, lang))
    else:
        await call.message.edit_text(t("rules.empty", lang))

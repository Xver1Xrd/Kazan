"""Просмотр коллекции: обзор, фильтры, поиск, сортировка, случайное, похожие."""
from __future__ import annotations

from dataclasses import dataclass, field

from aiogram import F, Router
from aiogram.filters import Command, CommandObject, StateFilter
from aiogram.fsm.context import FSMContext
from aiogram.types import CallbackQuery, InlineKeyboardButton, InlineKeyboardMarkup, Message
from sqlalchemy.ext.asyncio import AsyncSession

from bot.callbacks import FilterToggleCB, PageCB, RandomPickCB
from bot.keyboards import filter_kb, main_menu_kb, videos_list_kb
from bot.locales import t
from bot.models import User
from bot.repository import categories as categories_repo
from bot.repository import videos as videos_repo
from bot.repository.videos import CategoryLogic, SortBy, VideoFilter
from bot.states import SearchForm

router = Router(name="browse")

BROWSE_SCOPES = {
    "browse",
    "category",
    "tag",
    "search",
    "favorites",
    "trash",
    "recent_added",
    "never_opened",
    "broken",
    "uncategorized",
}


@dataclass
class BrowseContext:
    flt: VideoFilter
    sort: SortBy
    title_key: str
    title_kwargs: dict = field(default_factory=dict)


_LAST_CONTEXT: dict[int, BrowseContext] = {}
_FILTER_DRAFT: dict[int, dict] = {}


def _default_draft() -> dict:
    return {"categories": set(), "logic": "or", "favorite": None, "watched": None, "min_rating": None, "date_days": 0}


async def _show_page(
    message: Message, session: AsyncSession, db_user: User, lang: str, scope: str, ref_id: int, page: int, ctx: BrowseContext
) -> None:
    _LAST_CONTEXT[db_user.id] = ctx
    videos, total = await videos_repo.list_videos(session, db_user.id, ctx.flt, ctx.sort, page, db_user.page_size)
    title = t(ctx.title_key, lang, **ctx.title_kwargs)
    if not videos:
        await message.answer(f"{title}\n\n{t('browse.empty', lang)}", reply_markup=main_menu_kb(lang))
        return
    total_pages = max(1, (total + db_user.page_size - 1) // db_user.page_size)
    await message.answer(
        f"{title} ({total})", reply_markup=videos_list_kb(videos, scope, ref_id, page, total_pages, lang)
    )


@router.message(Command("browse"))
@router.message(F.text.in_({"📂 Обзор", "📂 Browse"}))
async def cmd_browse(message: Message, session: AsyncSession, db_user: User, lang: str) -> None:
    ctx = BrowseContext(VideoFilter(), SortBy(db_user.default_sort), "browse.title")
    await _show_page(message, session, db_user, lang, "browse", 0, 0, ctx)


@router.message(Command("favorites"))
@router.message(F.text.in_({"⭐ Избранное", "⭐ Favorites"}))
async def cmd_favorites(message: Message, session: AsyncSession, db_user: User, lang: str) -> None:
    ctx = BrowseContext(VideoFilter(is_favorite=True), SortBy(db_user.default_sort), "browse.favorites_title")
    await _show_page(message, session, db_user, lang, "favorites", 0, 0, ctx)


@router.message(Command("trash"))
@router.message(F.text.in_({"🗑 Корзина", "🗑 Trash"}))
async def cmd_trash(message: Message, session: AsyncSession, db_user: User, lang: str) -> None:
    ctx = BrowseContext(VideoFilter(only_deleted=True), SortBy.NEW, "menu.trash")
    await _show_page(message, session, db_user, lang, "trash", 0, 0, ctx)


@router.message(Command("recent_added"))
async def cmd_recent_added(message: Message, session: AsyncSession, db_user: User, lang: str) -> None:
    ctx = BrowseContext(VideoFilter(), SortBy.NEW, "browse.recent_added_title")
    await _show_page(message, session, db_user, lang, "recent_added", 0, 0, ctx)


@router.message(Command("never_opened"))
async def cmd_never_opened(message: Message, session: AsyncSession, db_user: User, lang: str) -> None:
    ctx = BrowseContext(VideoFilter(only_never_opened=True), SortBy.NEW, "browse.never_opened_title")
    await _show_page(message, session, db_user, lang, "never_opened", 0, 0, ctx)


@router.message(Command("broken_links"))
async def cmd_broken(message: Message, session: AsyncSession, db_user: User, lang: str) -> None:
    ctx = BrowseContext(VideoFilter(is_broken=True), SortBy.NEW, "browse.broken_title")
    await _show_page(message, session, db_user, lang, "broken", 0, 0, ctx)


@router.message(Command("uncategorized"))
async def cmd_uncategorized(message: Message, session: AsyncSession, db_user: User, lang: str) -> None:
    ctx = BrowseContext(VideoFilter(only_uncategorized=True), SortBy.NEW, "browse.uncategorized_title")
    await _show_page(message, session, db_user, lang, "uncategorized", 0, 0, ctx)


@router.message(Command("recent_opened"))
async def cmd_recent_opened(message: Message, session: AsyncSession, db_user: User, lang: str) -> None:
    videos, total = await videos_repo.recently_opened(session, db_user.id, 0, db_user.page_size)
    if not videos:
        await message.answer(f"{t('browse.recent_opened_title', lang)}\n\n{t('browse.empty', lang)}")
        return
    total_pages = max(1, (total + db_user.page_size - 1) // db_user.page_size)
    await message.answer(
        f"{t('browse.recent_opened_title', lang)} ({total})",
        reply_markup=videos_list_kb(videos, "recent_opened", 0, 0, total_pages, lang),
    )


@router.message(Command("search"))
async def cmd_search(message: Message, command: CommandObject, session: AsyncSession, db_user: User, state: FSMContext, lang: str) -> None:
    query = (command.args or "").strip()
    if not query:
        await state.set_state(SearchForm.waiting_query)
        await message.answer(t("browse.search_prompt", lang))
        return
    ctx = BrowseContext(VideoFilter(query_text=query), SortBy(db_user.default_sort), "browse.search_results", {"query": query})
    await _show_page(message, session, db_user, lang, "search", 0, 0, ctx)


@router.message(F.text.in_({"🔎 Поиск", "🔎 Search"}))
async def search_button(message: Message, state: FSMContext, lang: str) -> None:
    await state.set_state(SearchForm.waiting_query)
    await message.answer(t("browse.search_prompt", lang))


@router.message(StateFilter(SearchForm.waiting_query))
async def search_query_received(message: Message, session: AsyncSession, db_user: User, state: FSMContext, lang: str) -> None:
    await state.clear()
    query = (message.text or "").strip()
    if not query:
        return
    ctx = BrowseContext(VideoFilter(query_text=query), SortBy(db_user.default_sort), "browse.search_results", {"query": query})
    await _show_page(message, session, db_user, lang, "search", 0, 0, ctx)


@router.message(Command("random"))
@router.message(F.text.in_({"🎲 Случайное", "🎲 Random"}))
async def cmd_random(message: Message, lang: str) -> None:
    rows = [
        [InlineKeyboardButton(text="🎲 Из всей коллекции" if lang == "ru" else "🎲 From whole collection", callback_data=RandomPickCB(kind="all").pack())],
        [InlineKeyboardButton(text="⭐ Из избранного" if lang == "ru" else "⭐ From favorites", callback_data=RandomPickCB(kind="favorite").pack())],
    ]
    await message.answer("🎲", reply_markup=InlineKeyboardMarkup(inline_keyboard=rows))


@router.callback_query(RandomPickCB.filter(F.kind == "all"))
async def random_all(call: CallbackQuery, session: AsyncSession, db_user: User, lang: str) -> None:
    video = await videos_repo.random_video(session, db_user.id)
    await _answer_random(call, video, lang)


@router.callback_query(RandomPickCB.filter(F.kind == "favorite"))
async def random_favorite(call: CallbackQuery, session: AsyncSession, db_user: User, lang: str) -> None:
    video = await videos_repo.random_video(session, db_user.id, VideoFilter(is_favorite=True))
    await _answer_random(call, video, lang)


async def _answer_random(call: CallbackQuery, video, lang: str) -> None:
    from bot.handlers.manage import format_video_card
    from bot.keyboards import video_card_kb

    if video is None:
        await call.answer(t("browse.random_none", lang), show_alert=True)
        return
    await call.message.answer(format_video_card(video, lang), reply_markup=video_card_kb(video, lang=lang))
    await call.answer()


# --- Комбинированный фильтр ---


@router.message(Command("filter"))
@router.message(F.text.in_({"🎛 Фильтр", "🎛 Filter"}))
async def cmd_filter(message: Message, session: AsyncSession, db_user: User, lang: str) -> None:
    draft = _FILTER_DRAFT.setdefault(db_user.id, _default_draft())
    cats = await categories_repo.list_roots(session, db_user.id)
    await message.answer(t("browse.filter_title", lang), reply_markup=filter_kb(cats, draft, lang))


@router.callback_query(FilterToggleCB.filter(F.kind == "category"))
async def filter_toggle_category(call: CallbackQuery, callback_data: FilterToggleCB, session: AsyncSession, db_user: User, lang: str) -> None:
    draft = _FILTER_DRAFT.setdefault(db_user.id, _default_draft())
    cats_selected: set[int] = draft["categories"]
    if callback_data.value in cats_selected:
        cats_selected.discard(callback_data.value)
    else:
        cats_selected.add(callback_data.value)
    cats = await categories_repo.list_roots(session, db_user.id)
    await call.message.edit_reply_markup(reply_markup=filter_kb(cats, draft, lang))
    await call.answer()


@router.callback_query(FilterToggleCB.filter(F.kind == "logic"))
async def filter_toggle_logic(call: CallbackQuery, session: AsyncSession, db_user: User, lang: str) -> None:
    draft = _FILTER_DRAFT.setdefault(db_user.id, _default_draft())
    draft["logic"] = "and" if draft["logic"] == "or" else "or"
    cats = await categories_repo.list_roots(session, db_user.id)
    await call.message.edit_reply_markup(reply_markup=filter_kb(cats, draft, lang))
    await call.answer()


@router.callback_query(FilterToggleCB.filter(F.kind == "favorite"))
async def filter_toggle_favorite(call: CallbackQuery, session: AsyncSession, db_user: User, lang: str) -> None:
    draft = _FILTER_DRAFT.setdefault(db_user.id, _default_draft())
    draft["favorite"] = None if draft["favorite"] is True else True
    cats = await categories_repo.list_roots(session, db_user.id)
    await call.message.edit_reply_markup(reply_markup=filter_kb(cats, draft, lang))
    await call.answer()


@router.callback_query(FilterToggleCB.filter(F.kind == "watched"))
async def filter_toggle_watched(call: CallbackQuery, session: AsyncSession, db_user: User, lang: str) -> None:
    draft = _FILTER_DRAFT.setdefault(db_user.id, _default_draft())
    order = [None, True, False]
    draft["watched"] = order[(order.index(draft["watched"]) + 1) % len(order)]
    cats = await categories_repo.list_roots(session, db_user.id)
    await call.message.edit_reply_markup(reply_markup=filter_kb(cats, draft, lang))
    await call.answer()


@router.callback_query(FilterToggleCB.filter(F.kind == "min_rating"))
async def filter_toggle_rating(call: CallbackQuery, session: AsyncSession, db_user: User, lang: str) -> None:
    draft = _FILTER_DRAFT.setdefault(db_user.id, _default_draft())
    order = [None, 1, 2, 3, 4, 5]
    draft["min_rating"] = order[(order.index(draft["min_rating"]) + 1) % len(order)]
    cats = await categories_repo.list_roots(session, db_user.id)
    await call.message.edit_reply_markup(reply_markup=filter_kb(cats, draft, lang))
    await call.answer()


@router.callback_query(FilterToggleCB.filter(F.kind == "date_preset"))
async def filter_toggle_date(call: CallbackQuery, session: AsyncSession, db_user: User, lang: str) -> None:
    draft = _FILTER_DRAFT.setdefault(db_user.id, _default_draft())
    order = [0, 7, 30, 90]
    draft["date_days"] = order[(order.index(draft["date_days"]) + 1) % len(order)]
    cats = await categories_repo.list_roots(session, db_user.id)
    await call.message.edit_reply_markup(reply_markup=filter_kb(cats, draft, lang))
    await call.answer()


@router.callback_query(FilterToggleCB.filter(F.kind == "reset"))
async def filter_reset(call: CallbackQuery, session: AsyncSession, db_user: User, lang: str) -> None:
    _FILTER_DRAFT[db_user.id] = _default_draft()
    cats = await categories_repo.list_roots(session, db_user.id)
    await call.message.edit_reply_markup(reply_markup=filter_kb(cats, _FILTER_DRAFT[db_user.id], lang))
    await call.answer(t("common.cancelled", lang))


@router.callback_query(FilterToggleCB.filter(F.kind == "apply"))
async def filter_apply(call: CallbackQuery, session: AsyncSession, db_user: User, lang: str) -> None:
    import datetime as dt

    draft = _FILTER_DRAFT.setdefault(db_user.id, _default_draft())
    date_from = None
    if draft["date_days"]:
        date_from = dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=draft["date_days"])
    flt = VideoFilter(
        category_ids=list(draft["categories"]),
        category_logic=CategoryLogic(draft["logic"]),
        min_rating=draft["min_rating"],
        date_from=date_from,
        is_watched=draft["watched"],
        is_favorite=draft["favorite"],
    )
    ctx = BrowseContext(flt, SortBy(db_user.default_sort), "browse.filter_title")
    await call.message.answer(t("btn.apply_filter", lang))
    await _show_page(call.message, session, db_user, lang, "browse", 0, 0, ctx)
    await call.answer()


# --- Пагинация и категории/теги как отдельные списки ---


@router.callback_query(PageCB.filter(F.scope.in_(BROWSE_SCOPES)))
async def paginate(call: CallbackQuery, callback_data: PageCB, session: AsyncSession, db_user: User, lang: str) -> None:
    scope, ref_id, page = callback_data.scope, callback_data.ref_id, callback_data.page

    if scope == "category":
        category = await categories_repo.get(session, db_user.id, ref_id)
        title = category.name if category else "?"
        ctx = BrowseContext(VideoFilter(category_ids=[ref_id]), SortBy(db_user.default_sort), "browse.category_title", {"name": title})
    elif scope == "tag":
        from bot.repository import tags as tags_repo

        tag = await tags_repo.get(session, db_user.id, ref_id)
        title = tag.name if tag else "?"
        ctx = BrowseContext(VideoFilter(tag_ids=[ref_id]), SortBy(db_user.default_sort), "browse.tag_title", {"name": title})
    elif scope in ("browse", "search"):
        ctx = _LAST_CONTEXT.get(db_user.id) or BrowseContext(VideoFilter(), SortBy(db_user.default_sort), "browse.title")
    elif scope == "favorites":
        ctx = BrowseContext(VideoFilter(is_favorite=True), SortBy(db_user.default_sort), "browse.favorites_title")
    elif scope == "trash":
        ctx = BrowseContext(VideoFilter(only_deleted=True), SortBy.NEW, "menu.trash")
    elif scope == "recent_added":
        ctx = BrowseContext(VideoFilter(), SortBy.NEW, "browse.recent_added_title")
    elif scope == "never_opened":
        ctx = BrowseContext(VideoFilter(only_never_opened=True), SortBy.NEW, "browse.never_opened_title")
    elif scope == "broken":
        ctx = BrowseContext(VideoFilter(is_broken=True), SortBy.NEW, "browse.broken_title")
    elif scope == "uncategorized":
        ctx = BrowseContext(VideoFilter(only_uncategorized=True), SortBy.NEW, "browse.uncategorized_title")
    else:
        await call.answer()
        return

    await _show_page(call.message, session, db_user, lang, scope, ref_id, page, ctx)
    await call.answer()


@router.callback_query(PageCB.filter(F.scope == "recent_opened"))
async def paginate_recent_opened(call: CallbackQuery, callback_data: PageCB, session: AsyncSession, db_user: User, lang: str) -> None:
    videos, total = await videos_repo.recently_opened(session, db_user.id, callback_data.page, db_user.page_size)
    total_pages = max(1, (total + db_user.page_size - 1) // db_user.page_size)
    await call.message.answer(
        f"{t('browse.recent_opened_title', lang)} ({total})",
        reply_markup=videos_list_kb(videos, "recent_opened", 0, callback_data.page, total_pages, lang),
    )
    await call.answer()


@router.callback_query(PageCB.filter(F.scope == "similar"))
async def paginate_similar(call: CallbackQuery, callback_data: PageCB, session: AsyncSession, db_user: User, lang: str) -> None:
    video = await videos_repo.get_video(session, db_user.id, callback_data.ref_id)
    if video is None:
        await call.answer(t("video.not_found", lang), show_alert=True)
        return
    similar = await videos_repo.similar_videos(session, video, limit=10)
    await call.message.answer(t("browse.similar_title", lang), reply_markup=videos_list_kb(similar, "similar", video.id, 0, 1, lang))
    await call.answer()

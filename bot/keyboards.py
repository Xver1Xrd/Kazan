"""Построение inline- и reply-клавиатур, включая пагинацию."""
from __future__ import annotations

from aiogram.types import (
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    KeyboardButton,
    ReplyKeyboardMarkup,
)

from bot.callbacks import (
    AutotagConfirmCB,
    BulkModeCB,
    CategoryManageCB,
    CategoryNewCB,
    CategoryToggleCB,
    CollectionManageCB,
    ConfirmCB,
    FilterToggleCB,
    NavCB,
    PageCB,
    RatingPickCB,
    RuleManageCB,
    SettingsCB,
    SortPickCB,
    TagManageCB,
    VideoActionCB,
    VideoOpenCB,
    WizardDoneCB,
    WizardSkipCB,
)
from bot.locales import t
from bot.models import AutoTagRule, Category, Collection, Tag, Video


def main_menu_kb(lang: str = "ru") -> ReplyKeyboardMarkup:
    rows = [
        [KeyboardButton(text=t("menu.browse", lang)), KeyboardButton(text=t("menu.search", lang))],
        [KeyboardButton(text=t("menu.categories", lang)), KeyboardButton(text=t("menu.tags", lang))],
        [KeyboardButton(text=t("menu.collections", lang)), KeyboardButton(text=t("menu.random", lang))],
        [KeyboardButton(text=t("menu.favorites", lang)), KeyboardButton(text=t("menu.trash", lang))],
        [KeyboardButton(text=t("menu.stats", lang)), KeyboardButton(text=t("menu.settings", lang))],
    ]
    return ReplyKeyboardMarkup(keyboard=rows, resize_keyboard=True)


def categories_multiselect_kb(categories: list[Category], selected: set[int], lang: str = "ru") -> InlineKeyboardMarkup:
    rows: list[list[InlineKeyboardButton]] = []
    for cat in categories:
        mark = "✅ " if cat.id in selected else ""
        prefix = "— " if cat.parent_id else ""
        label = f"{mark}{prefix}{cat.emoji + ' ' if cat.emoji else ''}{cat.name}"
        rows.append([InlineKeyboardButton(text=label, callback_data=CategoryToggleCB(category_id=cat.id).pack())])
    rows.append([InlineKeyboardButton(text=t("btn.new_category", lang), callback_data=CategoryNewCB().pack())])
    rows.append([InlineKeyboardButton(text=t("btn.done", lang), callback_data=WizardDoneCB(step="categories").pack())])
    return InlineKeyboardMarkup(inline_keyboard=rows)


def autotag_confirm_kb(lang: str = "ru") -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text=t("btn.yes", lang), callback_data=AutotagConfirmCB(apply=True).pack()),
                InlineKeyboardButton(text=t("btn.skip", lang), callback_data=AutotagConfirmCB(apply=False).pack()),
            ]
        ]
    )


def skip_kb(step: str, lang: str = "ru") -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[[InlineKeyboardButton(text=t("btn.skip", lang), callback_data=WizardSkipCB(step=step).pack())]]
    )


def rating_kb(step: str = "wizard", video_id: int = 0, lang: str = "ru") -> InlineKeyboardMarkup:
    stars = [InlineKeyboardButton(text="⭐" * i if i else t("btn.no_rating", lang), callback_data=RatingPickCB(video_id=video_id, value=i).pack()) for i in range(0, 6)]
    rows = [stars[i : i + 3] for i in range(0, len(stars), 3)]
    if step == "wizard":
        rows.append([InlineKeyboardButton(text=t("btn.skip", lang), callback_data=WizardSkipCB(step="rating").pack())])
    return InlineKeyboardMarkup(inline_keyboard=rows)


def confirm_kb(action: str, entity_id: int, lang: str = "ru") -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text=t("btn.confirm", lang), callback_data=ConfirmCB(action=action, entity_id=entity_id, yes=True).pack()),
                InlineKeyboardButton(text=t("btn.cancel", lang), callback_data=ConfirmCB(action=action, entity_id=entity_id, yes=False).pack()),
            ]
        ]
    )


def pagination_row(scope: str, ref_id: int, page: int, total_pages: int) -> list[InlineKeyboardButton]:
    row = []
    if page > 0:
        row.append(InlineKeyboardButton(text="⬅️", callback_data=PageCB(scope=scope, ref_id=ref_id, page=page - 1).pack()))
    row.append(InlineKeyboardButton(text=f"{page + 1}/{max(total_pages, 1)}", callback_data=PageCB(scope=scope, ref_id=ref_id, page=page).pack()))
    if page + 1 < total_pages:
        row.append(InlineKeyboardButton(text="➡️", callback_data=PageCB(scope=scope, ref_id=ref_id, page=page + 1).pack()))
    return row


def videos_list_kb(
    videos: list[Video], scope: str, ref_id: int, page: int, total_pages: int, lang: str = "ru"
) -> InlineKeyboardMarkup:
    rows: list[list[InlineKeyboardButton]] = []
    for v in videos:
        star = "⭐" if v.is_favorite else ""
        watched = "👁" if v.is_watched else ""
        title = (v.title or v.url)[:45]
        rows.append(
            [
                InlineKeyboardButton(
                    text=f"{star}{watched} {title}".strip(),
                    callback_data=VideoOpenCB(video_id=v.id, scope=scope, ref_id=ref_id, page=page).pack(),
                )
            ]
        )
    if total_pages > 1:
        rows.append(pagination_row(scope, ref_id, page, total_pages))
    return InlineKeyboardMarkup(inline_keyboard=rows)


def video_card_kb(video: Video, scope: str = "browse", ref_id: int = 0, page: int = 0, lang: str = "ru") -> InlineKeyboardMarkup:
    fav_text = t("btn.unfavorite", lang) if video.is_favorite else t("btn.favorite", lang)
    watched_text = t("btn.unwatched", lang) if video.is_watched else t("btn.watched", lang)
    kwargs = dict(scope=scope, ref_id=ref_id, page=page)
    rows = [
        [InlineKeyboardButton(text="🔗 " + t("btn.open_link", lang), url=video.url)],
        [
            InlineKeyboardButton(text=fav_text, callback_data=VideoActionCB(action="favorite", video_id=video.id, **kwargs).pack()),
            InlineKeyboardButton(text=watched_text, callback_data=VideoActionCB(action="watched", video_id=video.id, **kwargs).pack()),
        ],
        [
            InlineKeyboardButton(text="✏️ " + t("btn.edit", lang), callback_data=VideoActionCB(action="edit", video_id=video.id, **kwargs).pack()),
            InlineKeyboardButton(text="🎲 " + t("btn.similar", lang), callback_data=VideoActionCB(action="similar", video_id=video.id, **kwargs).pack()),
        ],
        [InlineKeyboardButton(text="📋 " + t("btn.add_to_collection", lang), callback_data=VideoActionCB(action="add_collection", video_id=video.id, **kwargs).pack())],
    ]
    if video.is_deleted:
        rows.append(
            [
                InlineKeyboardButton(text="♻️ " + t("btn.restore", lang), callback_data=VideoActionCB(action="restore", video_id=video.id, **kwargs).pack()),
                InlineKeyboardButton(text="🗑 " + t("btn.purge", lang), callback_data=VideoActionCB(action="purge", video_id=video.id, **kwargs).pack()),
            ]
        )
    else:
        rows.append([InlineKeyboardButton(text="🗑 " + t("btn.delete", lang), callback_data=VideoActionCB(action="delete", video_id=video.id, **kwargs).pack())])
    rows.append([InlineKeyboardButton(text="⬅️ " + t("btn.back", lang), callback_data=PageCB(scope=scope, ref_id=ref_id, page=page).pack())])
    return InlineKeyboardMarkup(inline_keyboard=rows)


def edit_video_kb(video_id: int, lang: str = "ru") -> InlineKeyboardMarkup:
    rows = [
        [InlineKeyboardButton(text=t("btn.edit_title", lang), callback_data=VideoActionCB(action="edit_title", video_id=video_id).pack())],
        [InlineKeyboardButton(text=t("btn.edit_note", lang), callback_data=VideoActionCB(action="edit_note", video_id=video_id).pack())],
        [InlineKeyboardButton(text=t("btn.edit_rating", lang), callback_data=VideoActionCB(action="edit_rating", video_id=video_id).pack())],
        [InlineKeyboardButton(text=t("btn.edit_tags", lang), callback_data=VideoActionCB(action="edit_tags", video_id=video_id).pack())],
        [InlineKeyboardButton(text=t("btn.edit_categories", lang), callback_data=VideoActionCB(action="edit_categories", video_id=video_id).pack())],
        [InlineKeyboardButton(text="⬅️ " + t("btn.back", lang), callback_data=VideoOpenCB(video_id=video_id).pack())],
    ]
    return InlineKeyboardMarkup(inline_keyboard=rows)


def categories_manage_kb(cats_with_counts: list[tuple[Category, int]], lang: str = "ru") -> InlineKeyboardMarkup:
    rows = []
    for cat, cnt in cats_with_counts:
        prefix = "— " if cat.parent_id else ""
        label = f"{prefix}{cat.emoji + ' ' if cat.emoji else ''}{cat.name} ({cnt})"
        rows.append([InlineKeyboardButton(text=label, callback_data=CategoryManageCB(action="open", category_id=cat.id).pack())])
    rows.append([InlineKeyboardButton(text=t("btn.new_category", lang), callback_data=CategoryNewCB().pack())])
    return InlineKeyboardMarkup(inline_keyboard=rows)


def category_actions_kb(category: Category, lang: str = "ru") -> InlineKeyboardMarkup:
    rows = [
        [InlineKeyboardButton(text=t("btn.rename", lang), callback_data=CategoryManageCB(action="rename", category_id=category.id).pack())],
        [InlineKeyboardButton(text=t("btn.set_emoji", lang), callback_data=CategoryManageCB(action="emoji", category_id=category.id).pack())],
        [InlineKeyboardButton(text=t("btn.add_subcategory", lang), callback_data=CategoryManageCB(action="add_sub", category_id=category.id).pack())],
        [InlineKeyboardButton(text=t("btn.merge", lang), callback_data=CategoryManageCB(action="merge", category_id=category.id).pack())],
        [InlineKeyboardButton(text="🗑 " + t("btn.delete", lang), callback_data=CategoryManageCB(action="delete", category_id=category.id).pack())],
        [InlineKeyboardButton(text="📂 " + t("btn.view_videos", lang), callback_data=PageCB(scope="category", ref_id=category.id, page=0).pack())],
    ]
    return InlineKeyboardMarkup(inline_keyboard=rows)


def merge_target_kb(categories: list[Category], exclude_id: int, lang: str = "ru") -> InlineKeyboardMarkup:
    rows = [
        [InlineKeyboardButton(text=c.name, callback_data=CategoryManageCB(action="merge_into", category_id=c.id).pack())]
        for c in categories
        if c.id != exclude_id
    ]
    return InlineKeyboardMarkup(inline_keyboard=rows)


def tags_manage_kb(tags_with_counts: list[tuple[Tag, int]]) -> InlineKeyboardMarkup:
    rows = [
        [InlineKeyboardButton(text=f"#{tag.name} ({cnt})", callback_data=TagManageCB(action="open", tag_id=tag.id).pack())]
        for tag, cnt in tags_with_counts
    ]
    return InlineKeyboardMarkup(inline_keyboard=rows)


def tag_actions_kb(tag: Tag, lang: str = "ru") -> InlineKeyboardMarkup:
    rows = [
        [InlineKeyboardButton(text=t("btn.rename", lang), callback_data=TagManageCB(action="rename", tag_id=tag.id).pack())],
        [InlineKeyboardButton(text="🗑 " + t("btn.delete", lang), callback_data=TagManageCB(action="delete", tag_id=tag.id).pack())],
        [InlineKeyboardButton(text="📂 " + t("btn.view_videos", lang), callback_data=PageCB(scope="tag", ref_id=tag.id, page=0).pack())],
    ]
    return InlineKeyboardMarkup(inline_keyboard=rows)


def collections_manage_kb(collections_with_counts: list[tuple[Collection, int]], lang: str = "ru") -> InlineKeyboardMarkup:
    rows = [
        [InlineKeyboardButton(text=f"{c.name} ({cnt})", callback_data=CollectionManageCB(action="open", collection_id=c.id).pack())]
        for c, cnt in collections_with_counts
    ]
    rows.append([InlineKeyboardButton(text=t("btn.new_collection", lang), callback_data=CollectionManageCB(action="create", collection_id=0).pack())])
    return InlineKeyboardMarkup(inline_keyboard=rows)


def collection_actions_kb(collection_id: int, lang: str = "ru") -> InlineKeyboardMarkup:
    rows = [
        [InlineKeyboardButton(text=t("btn.rename", lang), callback_data=CollectionManageCB(action="rename", collection_id=collection_id).pack())],
        [InlineKeyboardButton(text="▶️ " + t("btn.play", lang), callback_data=CollectionManageCB(action="play", collection_id=collection_id).pack())],
        [InlineKeyboardButton(text="📤 " + t("btn.export", lang), callback_data=CollectionManageCB(action="export", collection_id=collection_id).pack())],
        [InlineKeyboardButton(text="🗑 " + t("btn.delete", lang), callback_data=CollectionManageCB(action="delete", collection_id=collection_id).pack())],
    ]
    return InlineKeyboardMarkup(inline_keyboard=rows)


def collection_videos_kb(videos: list[Video], collection_id: int, lang: str = "ru") -> InlineKeyboardMarkup:
    rows = []
    for v in videos:
        title = (v.title or v.url)[:35]
        rows.append(
            [
                InlineKeyboardButton(text=title, callback_data=VideoOpenCB(video_id=v.id, scope="collection", ref_id=collection_id).pack()),
                InlineKeyboardButton(text="⬆️", callback_data=CollectionManageCB(action="move_up", collection_id=collection_id, video_id=v.id).pack()),
                InlineKeyboardButton(text="⬇️", callback_data=CollectionManageCB(action="move_down", collection_id=collection_id, video_id=v.id).pack()),
                InlineKeyboardButton(text="➖", callback_data=CollectionManageCB(action="remove_video", collection_id=collection_id, video_id=v.id).pack()),
            ]
        )
    rows.append([InlineKeyboardButton(text="⬅️ " + t("btn.back", lang), callback_data=CollectionManageCB(action="back_to_list", collection_id=collection_id).pack())])
    return InlineKeyboardMarkup(inline_keyboard=rows)


def add_to_collection_kb(collections: list[Collection], video_id: int) -> InlineKeyboardMarkup:
    rows = [
        [InlineKeyboardButton(text=c.name, callback_data=CollectionManageCB(action="add_video", collection_id=c.id, video_id=video_id).pack())]
        for c in collections
    ]
    return InlineKeyboardMarkup(inline_keyboard=rows)


def filter_kb(categories: list[Category], draft: dict, lang: str = "ru") -> InlineKeyboardMarkup:
    rows: list[list[InlineKeyboardButton]] = []
    selected_cats: set[int] = draft.get("categories", set())
    for cat in categories:
        mark = "✅ " if cat.id in selected_cats else ""
        rows.append([InlineKeyboardButton(text=f"{mark}{cat.name}", callback_data=FilterToggleCB(kind="category", value=cat.id).pack())])

    logic_label = "И (все выбранные)" if draft.get("logic") == "and" else "ИЛИ (любая из выбранных)"
    rows.append([InlineKeyboardButton(text=f"🔗 Логика: {logic_label}", callback_data=FilterToggleCB(kind="logic").pack())])

    fav_label = "только избранное" if draft.get("favorite") is True else "не важно"
    watched = draft.get("watched")
    watched_label = {True: "только просмотренные", False: "только непросмотренные"}.get(watched, "не важно")
    rows.append(
        [
            InlineKeyboardButton(text=f"⭐ Избранное: {fav_label}", callback_data=FilterToggleCB(kind="favorite").pack()),
        ]
    )
    rows.append(
        [
            InlineKeyboardButton(text=f"👁 Просмотрено: {watched_label}", callback_data=FilterToggleCB(kind="watched").pack()),
        ]
    )
    min_rating = draft.get("min_rating")
    rows.append(
        [InlineKeyboardButton(text=f"⭐ Рейтинг ≥ {min_rating if min_rating is not None else 'любой'}", callback_data=FilterToggleCB(kind="min_rating").pack())]
    )
    date_days = draft.get("date_days", 0)
    date_label = {0: "за всё время", 7: "за неделю", 30: "за месяц", 90: "за 3 месяца"}.get(date_days, "за всё время")
    rows.append([InlineKeyboardButton(text=f"📅 Период: {date_label}", callback_data=FilterToggleCB(kind="date_preset").pack())])

    rows.append([InlineKeyboardButton(text=t("btn.apply_filter", lang), callback_data=FilterToggleCB(kind="apply").pack())])
    rows.append([InlineKeyboardButton(text=t("btn.reset_filter", lang), callback_data=FilterToggleCB(kind="reset").pack())])
    return InlineKeyboardMarkup(inline_keyboard=rows)


def rules_manage_kb(rules: list[AutoTagRule], lang: str = "ru") -> InlineKeyboardMarkup:
    rows = [
        [InlineKeyboardButton(text=f"{r.keyword} → {r.category.name}", callback_data=RuleManageCB(action="delete", rule_id=r.id).pack())]
        for r in rules
    ]
    return InlineKeyboardMarkup(inline_keyboard=rows)


def category_pick_kb(categories: list[Category], action_prefix: str = "rulemgr") -> InlineKeyboardMarkup:
    rows = [
        [InlineKeyboardButton(text=c.name, callback_data=RuleManageCB(action="pick_category", category_id=c.id).pack())]
        for c in categories
    ]
    return InlineKeyboardMarkup(inline_keyboard=rows)


def bulk_select_kb(videos: list[Video], selected: set[int], scope: str, ref_id: int, page: int, total_pages: int) -> InlineKeyboardMarkup:
    rows = []
    for v in videos:
        mark = "✅ " if v.id in selected else "⬜️ "
        title = (v.title or v.url)[:40]
        rows.append([InlineKeyboardButton(text=f"{mark}{title}", callback_data=BulkModeCB(action="toggle_select", video_id=v.id).pack())])
    if total_pages > 1:
        rows.append(pagination_row(scope, ref_id, page, total_pages))
    rows.append(
        [
            InlineKeyboardButton(text="📁 Категория", callback_data=BulkModeCB(action="category").pack()),
            InlineKeyboardButton(text="🏷 Теги", callback_data=BulkModeCB(action="tag").pack()),
        ]
    )
    rows.append(
        [
            InlineKeyboardButton(text="⭐ Рейтинг", callback_data=BulkModeCB(action="rating").pack()),
            InlineKeyboardButton(text="📋 В коллекцию", callback_data=BulkModeCB(action="collection").pack()),
        ]
    )
    rows.append(
        [
            InlineKeyboardButton(text="🗑 Удалить", callback_data=BulkModeCB(action="delete").pack()),
            InlineKeyboardButton(text="❌ Отмена", callback_data=BulkModeCB(action="cancel").pack()),
        ]
    )
    return InlineKeyboardMarkup(inline_keyboard=rows)


def settings_kb(user, lang: str = "ru") -> InlineKeyboardMarkup:
    rows = [
        [InlineKeyboardButton(text=f"📄 Размер страницы: {user.page_size}", callback_data=SettingsCB(action="page_size").pack())],
        [InlineKeyboardButton(text=f"↕️ Сортировка по умолчанию: {user.default_sort}", callback_data=SettingsCB(action="sort").pack())],
        [InlineKeyboardButton(text=f"🛈 Авто-метаданные: {'вкл' if user.auto_metadata else 'выкл'}", callback_data=SettingsCB(action="auto_meta").pack())],
        [InlineKeyboardButton(text=f"🎬 Видео дня: {'вкл' if user.video_of_day_enabled else 'выкл'}", callback_data=SettingsCB(action="vod_toggle").pack())],
        [InlineKeyboardButton(text=f"⏰ Час видео дня: {user.video_of_day_hour}:00", callback_data=SettingsCB(action="vod_hour").pack())],
        [InlineKeyboardButton(text=f"🌍 Язык: {user.locale}", callback_data=SettingsCB(action="locale").pack())],
        [InlineKeyboardButton(text=f"💾 Бэкап раз в {user.backup_interval_days} дн.", callback_data=SettingsCB(action="backup_days").pack())],
    ]
    return InlineKeyboardMarkup(inline_keyboard=rows)


def sort_pick_kb() -> InlineKeyboardMarkup:
    options = [("new", "🆕 Новые"), ("old", "⏳ Старые"), ("rating", "⭐ По рейтингу"), ("views", "👁 По просмотрам"), ("alpha", "🔤 По алфавиту"), ("random", "🎲 Случайно")]
    rows = [[InlineKeyboardButton(text=label, callback_data=SortPickCB(sort_by=key).pack())] for key, label in options]
    return InlineKeyboardMarkup(inline_keyboard=rows)

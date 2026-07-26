"""CallbackData-фабрики aiogram для всех inline-клавиатур бота."""
from __future__ import annotations

from aiogram.filters.callback_data import CallbackData


class CategoryToggleCB(CallbackData, prefix="cattgl"):
    """Переключить категорию в мастере добавления видео."""

    category_id: int


class CategoryNewCB(CallbackData, prefix="catnew"):
    """Создать новую категорию прямо из мастера добавления."""


class WizardDoneCB(CallbackData, prefix="wizdone"):
    step: str  # categories | tags | rating | note


class WizardSkipCB(CallbackData, prefix="wizskip"):
    step: str


class AutotagConfirmCB(CallbackData, prefix="autotag"):
    apply: bool  # True — применить предложенные категории


class RatingPickCB(CallbackData, prefix="rate"):
    video_id: int
    value: int


class PageCB(CallbackData, prefix="page"):
    scope: str  # browse | category | tag | search | collection | trash | favorites | rules | ...
    ref_id: int = 0
    page: int = 0


class VideoOpenCB(CallbackData, prefix="vopen"):
    video_id: int
    scope: str = "browse"
    ref_id: int = 0
    page: int = 0


class VideoActionCB(CallbackData, prefix="vact"):
    action: str  # favorite | watched | edit | delete | restore | purge | similar | undo
    video_id: int
    scope: str = "browse"
    ref_id: int = 0
    page: int = 0


class ConfirmCB(CallbackData, prefix="confirm"):
    action: str  # delete_category | delete_tag | delete_collection | purge_video | merge_category | import
    entity_id: int
    yes: bool


class CategoryManageCB(CallbackData, prefix="catmgr"):
    action: str  # open | rename | emoji | delete | merge | add_sub | tree
    category_id: int


class TagManageCB(CallbackData, prefix="tagmgr"):
    action: str  # open | rename | delete
    tag_id: int


class CollectionManageCB(CallbackData, prefix="colmgr"):
    action: str  # open | rename | delete | add_video | remove_video | play | export | move_up | move_down
    collection_id: int
    video_id: int = 0


class SortPickCB(CallbackData, prefix="sortpick"):
    sort_by: str


class FilterToggleCB(CallbackData, prefix="flt"):
    kind: str  # category | tag | rating | watched | favorite | logic | sort | apply | reset
    value: int = 0


class RuleManageCB(CallbackData, prefix="rulemgr"):
    action: str  # delete | pick_category
    rule_id: int = 0
    category_id: int = 0


class BulkModeCB(CallbackData, prefix="bulk"):
    action: str  # toggle_select | category | tag | rating | collection | delete | cancel | confirm
    video_id: int = 0
    value: int = 0


class SettingsCB(CallbackData, prefix="settings"):
    action: str  # page_size | sort | auto_meta | vod_toggle | vod_hour | locale | backup_days


class RandomPickCB(CallbackData, prefix="rndpick"):
    kind: str  # all | favorite | category
    category_id: int = 0


class NavCB(CallbackData, prefix="nav"):
    """Универсальная навигация: назад / в главное меню / закрыть."""

    target: str  # back | main_menu | close

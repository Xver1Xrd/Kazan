"""Группы состояний FSM для многошаговых сценариев."""
from aiogram.fsm.state import State, StatesGroup


class AddVideo(StatesGroup):
    """Мастер добавления одного видео."""

    choosing_categories = State()
    confirming_autotag = State()
    entering_tags = State()
    entering_rating = State()
    entering_note = State()
    creating_category_inline = State()


class BulkAdd(StatesGroup):
    waiting_links = State()


class CategoryForm(StatesGroup):
    creating_name = State()
    creating_emoji = State()
    renaming = State()
    setting_emoji = State()
    choosing_parent = State()
    confirming_delete = State()
    confirming_merge_target = State()


class TagForm(StatesGroup):
    creating_name = State()
    renaming = State()
    confirming_delete = State()


class CollectionForm(StatesGroup):
    creating_name = State()
    renaming = State()
    confirming_delete = State()


class SearchForm(StatesGroup):
    waiting_query = State()


class RuleForm(StatesGroup):
    waiting_keyword = State()
    choosing_category = State()


class EditVideo(StatesGroup):
    editing_title = State()
    editing_note = State()
    editing_rating = State()
    editing_tags = State()
    editing_categories = State()


class ImportData(StatesGroup):
    waiting_file = State()


class Settings(StatesGroup):
    editing_page_size = State()
    editing_video_of_day_hour = State()
    editing_backup_days = State()


class PinAuth(StatesGroup):
    waiting_pin = State()


class BulkOps(StatesGroup):
    waiting_tags = State()

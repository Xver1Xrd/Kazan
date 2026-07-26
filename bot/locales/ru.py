"""Русские строки интерфейса."""

STRINGS: dict[str, str] = {
    # Главное меню
    "menu.browse": "📂 Обзор",
    "menu.search": "🔎 Поиск",
    "menu.categories": "🗂 Категории",
    "menu.tags": "🏷 Теги",
    "menu.collections": "📋 Коллекции",
    "menu.random": "🎲 Случайное",
    "menu.favorites": "⭐ Избранное",
    "menu.trash": "🗑 Корзина",
    "menu.stats": "📊 Статистика",
    "menu.settings": "⚙️ Настройки",
    # Общие кнопки
    "btn.done": "✅ Готово",
    "btn.skip": "⏭ Пропустить",
    "btn.yes": "✅ Да",
    "btn.no": "❌ Нет",
    "btn.cancel": "❌ Отмена",
    "btn.confirm": "✅ Подтвердить",
    "btn.back": "Назад",
    "btn.close": "Закрыть",
    "btn.no_rating": "Без рейтинга",
    "btn.new_category": "➕ Новая категория",
    "btn.new_collection": "➕ Новая коллекция",
    "btn.open_link": "Открыть ссылку",
    "btn.edit": "Редактировать",
    "btn.similar": "Похожие",
    "btn.favorite": "⭐ В избранное",
    "btn.unfavorite": "⭐ Убрать из избранного",
    "btn.watched": "👁 Просмотрено",
    "btn.unwatched": "👁 Не просмотрено",
    "btn.delete": "Удалить",
    "btn.restore": "Восстановить",
    "btn.purge": "Удалить навсегда",
    "btn.edit_title": "✏️ Название",
    "btn.edit_note": "📝 Заметка",
    "btn.edit_rating": "⭐ Рейтинг",
    "btn.edit_tags": "🏷 Теги",
    "btn.edit_categories": "🗂 Категории",
    "btn.rename": "✏️ Переименовать",
    "btn.set_emoji": "😀 Задать эмодзи",
    "btn.add_subcategory": "➕ Добавить подкатегорию",
    "btn.merge": "🔗 Слить с другой",
    "btn.view_videos": "Смотреть видео",
    "btn.add_to_collection": "В коллекцию",
    "btn.play": "Смотреть по порядку",
    "btn.export": "Экспорт",
    "btn.apply_filter": "✅ Применить фильтр",
    "btn.reset_filter": "♻️ Сбросить фильтр",
    # Добавление видео
    "add.prompt_link": "🔗 Пришлите ссылку на видео (или несколько ссылок, каждая на новой строке).",
    "add.duplicate": "⚠️ Такое видео уже есть в коллекции:",
    "add.fetching": "🔍 Извлекаю метаданные…",
    "add.saved_draft": "💾 Видео сохранено как черновик (без категорий).",
    "add.choose_categories": "Выберите одну или несколько категорий для видео:",
    "add.no_categories_yet": "У вас пока нет категорий. Создайте первую:",
    "add.autotag_suggestion": "🤖 По правилам авто-категоризации подобраны категории: {names}\nПрименить?",
    "add.enter_tags": "Введите теги через запятую (или /skip):",
    "add.enter_rating": "Оцените видео от 0 до 5:",
    "add.enter_note": "Добавьте заметку (или /skip):",
    "add.finished": "✅ Видео добавлено в коллекцию!",
    "add.new_category_name": "Введите название новой категории:",
    "add.new_category_created": "Категория «{name}» создана.",
    "add.bulk_prompt": "Отправьте несколько ссылок, каждая на отдельной строке.",
    "add.bulk_result": "Готово! Добавлено: {added}. Дубликатов пропущено: {dup}. Ошибок: {errors}.",
    "add.invalid_url": "Не удалось распознать ссылку в сообщении.",
    "add.forwarded_no_link": "В пересланном сообщении не найдено ссылок.",
    # Категории
    "categories.title": "🗂 Ваши категории:",
    "categories.empty": "Категорий пока нет. Добавьте первую при добавлении видео или через /categories.",
    "categories.confirm_delete": "Удалить категорию «{name}»? Связи с видео будут удалены (видео останутся).",
    "categories.deleted": "Категория удалена.",
    "categories.renamed": "Категория переименована в «{name}».",
    "categories.enter_new_name": "Введите новое название категории:",
    "categories.enter_emoji": "Отправьте эмодзи для категории (или /skip):",
    "categories.pick_merge_target": "С какой категорией слить «{name}»?",
    "categories.merged": "Категории объединены. Перенесено видео: {count}.",
    "categories.pick_parent_name": "Введите название новой подкатегории для «{parent}»:",
    "categories.already_exists": "Категория с таким названием уже существует.",
    # Теги
    "tags.title": "🏷 Ваши теги:",
    "tags.empty": "Тегов пока нет.",
    "tags.confirm_delete": "Удалить тег «#{name}»?",
    "tags.deleted": "Тег удалён.",
    "tags.renamed": "Тег переименован в «#{name}».",
    "tags.enter_new_name": "Введите новое имя тега:",
    # Коллекции
    "collections.title": "📋 Ваши коллекции:",
    "collections.empty": "Коллекций пока нет.",
    "collections.enter_name": "Введите название новой коллекции:",
    "collections.created": "Коллекция «{name}» создана.",
    "collections.renamed": "Коллекция переименована в «{name}».",
    "collections.confirm_delete": "Удалить коллекцию «{name}»? Видео при этом не удаляются.",
    "collections.deleted": "Коллекция удалена.",
    "collections.empty_playlist": "В этой коллекции пока нет видео.",
    "collections.added_video": "Видео добавлено в коллекцию «{name}».",
    "collections.already_in": "Видео уже есть в этой коллекции.",
    "collections.removed_video": "Видео убрано из коллекции.",
    "collections.end_of_playlist": "🏁 Это было последнее видео в плейлисте.",
    "collections.pick_for_video": "В какую коллекцию добавить видео?",
    "collections.exported": "Экспорт коллекции «{name}»:",
    # Просмотр/поиск/фильтры
    "browse.title": "📂 Обзор коллекции",
    "browse.empty": "Ничего не найдено.",
    "browse.category_title": "🗂 Категория «{name}»",
    "browse.tag_title": "🏷 Тег «#{name}»",
    "browse.search_prompt": "Введите текст для поиска (по названию/заметке/тегам):",
    "browse.search_results": "🔎 Результаты поиска «{query}»:",
    "browse.filter_title": "🎛 Настройте фильтр и нажмите «Применить»:",
    "browse.random_none": "Подходящих видео не найдено.",
    "browse.favorites_title": "⭐ Избранное",
    "browse.recent_added_title": "🆕 Недавно добавленные",
    "browse.recent_opened_title": "🕓 Недавно открытые",
    "browse.never_opened_title": "🙈 Ни разу не открытые",
    "browse.similar_title": "🎲 Похожие видео",
    "browse.similar_none": "Похожих видео не найдено (нет общих категорий).",
    "browse.broken_title": "💔 Битые ссылки",
    "browse.uncategorized_title": "📥 Без категории",
    # Карточка видео
    "video.card": (
        "🎬 <b>{title}</b>\n"
        "{link}\n\n"
        "📁 Категории: {categories}\n"
        "🏷 Теги: {tags}\n"
        "⭐ Рейтинг: {rating}/5\n"
        "⏱ Длительность: {duration}\n"
        "👁 Просмотров: {views}\n"
        "📅 Добавлено: {created}\n"
        "📝 Заметка: {note}"
    ),
    "video.not_found": "Видео не найдено или было удалено.",
    "video.confirm_purge": "🗑❓ Удалить видео навсегда? Это действие необратимо.",
    "video.deleted": "🗑 Видео перемещено в корзину.",
    "video.restored": "♻️ Видео восстановлено из корзины.",
    "video.purged": "Видео удалено окончательно.",
    "video.edit_menu": "Что редактировать?",
    "video.enter_title": "Введите новое название:",
    "video.enter_note": "Введите новую заметку (или /skip чтобы очистить):",
    "video.enter_tags": "Введите новые теги через запятую:",
    "video.title_updated": "Название обновлено.",
    "video.note_updated": "Заметка обновлена.",
    "video.tags_updated": "Теги обновлены.",
    "video.rating_updated": "Рейтинг обновлён.",
    "video.categories_updated": "Категории обновлены.",
    "video.undo_available": "↩️ Отменить последнее действие можно командой /undo",
    "video.undo_done": "↩️ Последнее действие отменено.",
    "video.undo_nothing": "Нечего отменять.",
    # Массовые операции
    "bulk.enter_mode": "☑️ Режим множественного выбора. Отметьте видео, затем выберите действие.",
    "bulk.none_selected": "Сначала отметьте хотя бы одно видео.",
    "bulk.pick_category": "Выберите категорию для отмеченных видео:",
    "bulk.pick_rating": "Выберите рейтинг для отмеченных видео:",
    "bulk.enter_tags": "Введите теги через запятую для отмеченных видео:",
    "bulk.pick_collection": "Выберите коллекцию для отмеченных видео:",
    "bulk.confirm_delete": "Удалить {count} отмеченных видео (в корзину)?",
    "bulk.done": "✅ Операция применена к {count} видео.",
    "bulk.cancelled": "Режим массовых операций отменён.",
    # Статистика
    "stats.title": "📊 <b>Статистика коллекции</b>",
    "stats.total": "Всего видео: {total}",
    "stats.trashed": "В корзине: {trashed}",
    "stats.never_opened": "Ни разу не открыто: {never_opened}",
    "stats.by_category": "\n🗂 <b>По категориям (топ-{n}):</b>\n{lines}",
    "stats.by_tag": "\n🏷 <b>По тегам (топ-{n}):</b>\n{lines}",
    "stats.added_chart": "\n📈 <b>Добавлено за {days} дн.:</b>\n{chart}",
    "stats.rating_dist": "\n⭐ <b>Распределение рейтингов:</b>\n{lines}",
    "stats.most_viewed": "\n👁 <b>Самые просматриваемые:</b>\n{lines}",
    # Бэкапы
    "backup.exporting": "⏳ Формирую экспорт…",
    "backup.export_caption": "🗂 Экспорт коллекции ({count} видео)",
    "backup.import_prompt": "Отправьте JSON-файл бэкапа для импорта.",
    "backup.import_invalid": "Не удалось прочитать файл. Убедитесь, что это корректный JSON-бэкап.",
    "backup.import_done": "✅ Импорт завершён: категорий +{categories}, тегов +{tags}, видео +{videos} (пропущено дублей: {skipped_videos}), коллекций +{collections}, правил +{rules}.",
    "backup.maintenance_done": "🧹 Обслуживание БД выполнено. Удалено дублей: {removed_duplicates}.",
    # Правила авто-категоризации
    "rules.title": "🤖 Правила авто-категоризации (ключевое слово → категория):",
    "rules.empty": "Правил пока нет. Добавьте: /rules_add",
    "rules.enter_keyword": "Введите ключевое слово:",
    "rules.pick_category": "К какой категории привязать слово «{keyword}»?",
    "rules.created": "Правило создано: «{keyword}» → {category}.",
    "rules.deleted": "Правило удалено.",
    "rules.tap_to_delete": "Нажмите на правило, чтобы удалить его.",
    # Настройки
    "settings.title": "⚙️ Настройки",
    "settings.enter_page_size": "Введите размер страницы (1-50):",
    "settings.enter_vod_hour": "Введите час отправки «видео дня» (0-23):",
    "settings.enter_backup_days": "Введите периодичность бэкапа в днях (0 — выключить):",
    "settings.updated": "Настройки обновлены.",
    # Доступ / PIN
    "access.denied": "⛔️ Доступ запрещён.",
    "access.enter_pin": "🔒 Введите PIN-код для доступа к боту:",
    "access.pin_wrong": "❌ Неверный PIN. Попробуйте снова.",
    "access.pin_ok": "✅ Доступ разрешён.",
    "access.hidden": "🙈 Сессия скрыта. Для повторного входа отправьте /start и PIN-код.",
    # Общие
    "common.error": "⚠️ Произошла ошибка: {error}",
    "common.not_found": "Не найдено.",
    "common.cancelled": "Отменено.",
    "common.page_info": "Страница {page}/{total}",
    "help.text": (
        "🎬 <b>Личная коллекция видео</b>\n\n"
        "Просто пришлите ссылку на видео (или несколько ссылок, каждая на новой строке) — я сохраню её "
        "и предложу разложить по категориям.\n\n"
        "<b>Команды:</b>\n"
        "/add — добавить видео\n"
        "/bulk — массовое добавление ссылок\n"
        "/categories — категории\n"
        "/tags — теги\n"
        "/collections — коллекции/плейлисты\n"
        "/browse — обзор коллекции\n"
        "/filter — комбинированный фильтр\n"
        "/search текст — полнотекстовый поиск\n"
        "/random — случайное видео\n"
        "/favorites — избранное\n"
        "/trash — корзина\n"
        "/stats — статистика\n"
        "/rules — правила авто-категоризации\n"
        "/export — экспорт базы (JSON+CSV)\n"
        "/import — импорт бэкапа\n"
        "/settings — настройки\n"
        "/undo — отменить последнее действие\n"
        "/bulk_select — режим массовых операций\n"
        "/hide — скрыть сессию (если включён PIN)\n"
        "/help — эта справка"
    ),
    "start.welcome": "👋 Добро пожаловать в вашу личную коллекцию видео! Используйте меню ниже или /help.",
}

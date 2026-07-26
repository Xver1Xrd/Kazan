"""English interface strings."""

STRINGS: dict[str, str] = {
    # Main menu
    "menu.browse": "📂 Browse",
    "menu.search": "🔎 Search",
    "menu.categories": "🗂 Categories",
    "menu.tags": "🏷 Tags",
    "menu.collections": "📋 Collections",
    "menu.random": "🎲 Random",
    "menu.favorites": "⭐ Favorites",
    "menu.trash": "🗑 Trash",
    "menu.stats": "📊 Stats",
    "menu.settings": "⚙️ Settings",
    # Common buttons
    "btn.done": "✅ Done",
    "btn.skip": "⏭ Skip",
    "btn.yes": "✅ Yes",
    "btn.no": "❌ No",
    "btn.cancel": "❌ Cancel",
    "btn.confirm": "✅ Confirm",
    "btn.back": "Back",
    "btn.close": "Close",
    "btn.no_rating": "No rating",
    "btn.new_category": "➕ New category",
    "btn.new_collection": "➕ New collection",
    "btn.open_link": "Open link",
    "btn.edit": "Edit",
    "btn.similar": "Similar",
    "btn.favorite": "⭐ Add to favorites",
    "btn.unfavorite": "⭐ Remove from favorites",
    "btn.watched": "👁 Watched",
    "btn.unwatched": "👁 Not watched",
    "btn.delete": "Delete",
    "btn.restore": "Restore",
    "btn.purge": "Delete forever",
    "btn.edit_title": "✏️ Title",
    "btn.edit_note": "📝 Note",
    "btn.edit_rating": "⭐ Rating",
    "btn.edit_tags": "🏷 Tags",
    "btn.edit_categories": "🗂 Categories",
    "btn.rename": "✏️ Rename",
    "btn.set_emoji": "😀 Set emoji",
    "btn.add_subcategory": "➕ Add subcategory",
    "btn.merge": "🔗 Merge with",
    "btn.view_videos": "View videos",
    "btn.add_to_collection": "Add to collection",
    "btn.play": "Play in order",
    "btn.export": "Export",
    "btn.apply_filter": "✅ Apply filter",
    "btn.reset_filter": "♻️ Reset filter",
    # Adding videos
    "add.prompt_link": "🔗 Send me a video link (or several, one per line).",
    "add.duplicate": "⚠️ This video is already in your collection:",
    "add.fetching": "🔍 Fetching metadata…",
    "add.saved_draft": "💾 Video saved as a draft (no categories).",
    "add.choose_categories": "Pick one or more categories for this video:",
    "add.no_categories_yet": "You have no categories yet. Create the first one:",
    "add.autotag_suggestion": "🤖 Auto-tag rules suggest: {names}\nApply them?",
    "add.enter_tags": "Enter tags separated by commas (or /skip):",
    "add.enter_rating": "Rate the video from 0 to 5:",
    "add.enter_note": "Add a note (or /skip):",
    "add.finished": "✅ Video added to your collection!",
    "add.new_category_name": "Enter the new category name:",
    "add.new_category_created": "Category \"{name}\" created.",
    "add.bulk_prompt": "Send several links, one per line.",
    "add.bulk_result": "Done! Added: {added}. Duplicates skipped: {dup}. Errors: {errors}.",
    "add.invalid_url": "Could not find a link in the message.",
    "add.forwarded_no_link": "No link found in the forwarded message.",
    # Categories
    "categories.title": "🗂 Your categories:",
    "categories.empty": "No categories yet. Add one while adding a video or via /categories.",
    "categories.confirm_delete": "Delete category \"{name}\"? Links to videos will be removed (videos stay).",
    "categories.deleted": "Category deleted.",
    "categories.renamed": "Category renamed to \"{name}\".",
    "categories.enter_new_name": "Enter the new category name:",
    "categories.enter_emoji": "Send an emoji for the category (or /skip):",
    "categories.pick_merge_target": "Merge \"{name}\" into which category?",
    "categories.merged": "Categories merged. Videos moved: {count}.",
    "categories.pick_parent_name": "Enter the name of the new subcategory of \"{parent}\":",
    "categories.already_exists": "A category with that name already exists.",
    # Tags
    "tags.title": "🏷 Your tags:",
    "tags.empty": "No tags yet.",
    "tags.confirm_delete": "Delete tag \"#{name}\"?",
    "tags.deleted": "Tag deleted.",
    "tags.renamed": "Tag renamed to \"#{name}\".",
    "tags.enter_new_name": "Enter the new tag name:",
    # Collections
    "collections.title": "📋 Your collections:",
    "collections.empty": "No collections yet.",
    "collections.enter_name": "Enter the new collection name:",
    "collections.created": "Collection \"{name}\" created.",
    "collections.renamed": "Collection renamed to \"{name}\".",
    "collections.confirm_delete": "Delete collection \"{name}\"? Videos themselves are not removed.",
    "collections.deleted": "Collection deleted.",
    "collections.empty_playlist": "This collection has no videos yet.",
    "collections.added_video": "Video added to collection \"{name}\".",
    "collections.already_in": "This video is already in this collection.",
    "collections.removed_video": "Video removed from the collection.",
    "collections.end_of_playlist": "🏁 That was the last video in the playlist.",
    "collections.pick_for_video": "Which collection should this video be added to?",
    "collections.exported": "Export of collection \"{name}\":",
    # Browse/search/filters
    "browse.title": "📂 Browse collection",
    "browse.empty": "Nothing found.",
    "browse.category_title": "🗂 Category \"{name}\"",
    "browse.tag_title": "🏷 Tag \"#{name}\"",
    "browse.search_prompt": "Enter search text (title/note/tags):",
    "browse.search_results": "🔎 Results for \"{query}\":",
    "browse.filter_title": "🎛 Configure the filter and press \"Apply\":",
    "browse.random_none": "No matching videos found.",
    "browse.favorites_title": "⭐ Favorites",
    "browse.recent_added_title": "🆕 Recently added",
    "browse.recent_opened_title": "🕓 Recently opened",
    "browse.never_opened_title": "🙈 Never opened",
    "browse.similar_title": "🎲 Similar videos",
    "browse.similar_none": "No similar videos found (no shared categories).",
    "browse.broken_title": "💔 Broken links",
    "browse.uncategorized_title": "📥 Uncategorized",
    # Video card
    "video.card": (
        "🎬 <b>{title}</b>\n"
        "{link}\n\n"
        "📁 Categories: {categories}\n"
        "🏷 Tags: {tags}\n"
        "⭐ Rating: {rating}/5\n"
        "⏱ Duration: {duration}\n"
        "👁 Views: {views}\n"
        "📅 Added: {created}\n"
        "📝 Note: {note}"
    ),
    "video.not_found": "Video not found or was removed.",
    "video.confirm_purge": "🗑❓ Delete this video forever? This cannot be undone.",
    "video.deleted": "🗑 Video moved to trash.",
    "video.restored": "♻️ Video restored from trash.",
    "video.purged": "Video permanently deleted.",
    "video.edit_menu": "What do you want to edit?",
    "video.enter_title": "Enter the new title:",
    "video.enter_note": "Enter the new note (or /skip to clear it):",
    "video.enter_tags": "Enter new tags separated by commas:",
    "video.title_updated": "Title updated.",
    "video.note_updated": "Note updated.",
    "video.tags_updated": "Tags updated.",
    "video.rating_updated": "Rating updated.",
    "video.categories_updated": "Categories updated.",
    "video.undo_available": "↩️ Use /undo to revert the last action.",
    "video.undo_done": "↩️ Last action undone.",
    "video.undo_nothing": "Nothing to undo.",
    # Bulk operations
    "bulk.enter_mode": "☑️ Multi-select mode. Tick videos, then choose an action.",
    "bulk.none_selected": "Select at least one video first.",
    "bulk.pick_category": "Pick a category for the selected videos:",
    "bulk.pick_rating": "Pick a rating for the selected videos:",
    "bulk.enter_tags": "Enter tags separated by commas for the selected videos:",
    "bulk.pick_collection": "Pick a collection for the selected videos:",
    "bulk.confirm_delete": "Delete {count} selected videos (to trash)?",
    "bulk.done": "✅ Action applied to {count} videos.",
    "bulk.cancelled": "Bulk operation mode cancelled.",
    # Stats
    "stats.title": "📊 <b>Collection stats</b>",
    "stats.total": "Total videos: {total}",
    "stats.trashed": "In trash: {trashed}",
    "stats.never_opened": "Never opened: {never_opened}",
    "stats.by_category": "\n🗂 <b>By category (top {n}):</b>\n{lines}",
    "stats.by_tag": "\n🏷 <b>By tag (top {n}):</b>\n{lines}",
    "stats.added_chart": "\n📈 <b>Added over last {days} days:</b>\n{chart}",
    "stats.rating_dist": "\n⭐ <b>Rating distribution:</b>\n{lines}",
    "stats.most_viewed": "\n👁 <b>Most viewed:</b>\n{lines}",
    # Backups
    "backup.exporting": "⏳ Building export…",
    "backup.export_caption": "🗂 Collection export ({count} videos)",
    "backup.import_prompt": "Send the JSON backup file to import.",
    "backup.import_invalid": "Could not read the file. Make sure it's a valid JSON backup.",
    "backup.import_done": "✅ Import finished: +{categories} categories, +{tags} tags, +{videos} videos (skipped duplicates: {skipped_videos}), +{collections} collections, +{rules} rules.",
    "backup.maintenance_done": "🧹 DB maintenance done. Duplicates removed: {removed_duplicates}.",
    # Auto-tag rules
    "rules.title": "🤖 Auto-tag rules (keyword → category):",
    "rules.empty": "No rules yet. Add one: /rules_add",
    "rules.enter_keyword": "Enter the keyword:",
    "rules.pick_category": "Which category should \"{keyword}\" map to?",
    "rules.created": "Rule created: \"{keyword}\" → {category}.",
    "rules.deleted": "Rule deleted.",
    "rules.tap_to_delete": "Tap a rule to delete it.",
    # Settings
    "settings.title": "⚙️ Settings",
    "settings.enter_page_size": "Enter page size (1-50):",
    "settings.enter_vod_hour": "Enter the hour to send \"video of the day\" (0-23):",
    "settings.enter_backup_days": "Enter backup interval in days (0 to disable):",
    "settings.updated": "Settings updated.",
    # Access / PIN
    "access.denied": "⛔️ Access denied.",
    "access.enter_pin": "🔒 Enter the PIN code to access the bot:",
    "access.pin_wrong": "❌ Wrong PIN. Try again.",
    "access.pin_ok": "✅ Access granted.",
    "access.hidden": "🙈 Session hidden. Send /start and the PIN again to log back in.",
    # Common
    "common.error": "⚠️ An error occurred: {error}",
    "common.not_found": "Not found.",
    "common.cancelled": "Cancelled.",
    "common.page_info": "Page {page}/{total}",
    "help.text": (
        "🎬 <b>Personal video collection</b>\n\n"
        "Just send a video link (or several, one per line) — I'll save it and offer to sort it into "
        "categories.\n\n"
        "<b>Commands:</b>\n"
        "/add — add a video\n"
        "/bulk — bulk add links\n"
        "/categories — categories\n"
        "/tags — tags\n"
        "/collections — collections/playlists\n"
        "/browse — browse the collection\n"
        "/filter — combined filter\n"
        "/search text — full-text search\n"
        "/random — random video\n"
        "/favorites — favorites\n"
        "/trash — trash\n"
        "/stats — statistics\n"
        "/rules — auto-tag rules\n"
        "/export — export DB (JSON+CSV)\n"
        "/import — import a backup\n"
        "/settings — settings\n"
        "/undo — undo the last action\n"
        "/bulk_select — bulk operation mode\n"
        "/hide — hide the session (if PIN is enabled)\n"
        "/help — this help"
    ),
    "start.welcome": "👋 Welcome to your personal video collection! Use the menu below or /help.",
}

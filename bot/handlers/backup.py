"""Экспорт/импорт коллекции и обслуживание БД."""
from __future__ import annotations

import json
import logging

from aiogram import Router
from aiogram.filters import Command, StateFilter
from aiogram.fsm.context import FSMContext
from aiogram.types import FSInputFile, Message
from sqlalchemy.ext.asyncio import AsyncSession

from bot.locales import t
from bot.models import User
from bot.repository import videos as videos_repo
from bot.services import backup as backup_service
from bot.states import ImportData

logger = logging.getLogger(__name__)
router = Router(name="backup")


@router.message(Command("export"))
async def cmd_export(message: Message, session: AsyncSession, db_user: User, lang: str) -> None:
    status = await message.answer(t("backup.exporting", lang))
    json_path, csv_path = await backup_service.export_to_files(session, db_user.id)
    totals = await videos_repo.count_total(session, db_user.id)
    caption = t("backup.export_caption", lang, count=totals["total"])
    await message.answer_document(FSInputFile(json_path), caption=caption)
    await message.answer_document(FSInputFile(csv_path))
    try:
        await status.delete()
    except Exception:  # noqa: BLE001
        pass


@router.message(Command("import"))
async def cmd_import(message: Message, state: FSMContext, lang: str) -> None:
    await state.set_state(ImportData.waiting_file)
    await message.answer(t("backup.import_prompt", lang))


@router.message(StateFilter(ImportData.waiting_file))
async def receive_import_file(message: Message, session: AsyncSession, db_user: User, state: FSMContext, lang: str) -> None:
    await state.clear()
    if not message.document:
        await message.answer(t("backup.import_invalid", lang))
        return
    try:
        buffer = await message.bot.download(message.document.file_id)
        data = json.loads(buffer.read().decode("utf-8"))
    except Exception:  # noqa: BLE001
        logger.exception("Не удалось прочитать файл импорта")
        await message.answer(t("backup.import_invalid", lang))
        return

    stats = await backup_service.import_from_dict(session, db_user.id, data)
    await message.answer(t("backup.import_done", lang, **stats))


@router.message(Command("maintenance"))
async def cmd_maintenance(message: Message, session: AsyncSession, db_user: User, lang: str) -> None:
    result = await backup_service.vacuum_and_dedup(session, db_user.id)
    await message.answer(t("backup.maintenance_done", lang, **result))

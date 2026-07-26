"""Конфигурация бота: загрузка настроек из .env."""
from __future__ import annotations

from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    """Настройки приложения, читаются из переменных окружения / .env."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # --- Telegram ---
    BOT_TOKEN: str
    OWNER_ID: int
    ALLOWED_USERS: str = ""  # "111,222,333"

    # --- База данных ---
    DATABASE_URL: str = f"sqlite+aiosqlite:///{BASE_DIR / 'data' / 'bot.db'}"

    # --- Redis (для FSM-хранилища и опционально кэша) ---
    REDIS_URL: str | None = None

    # --- Резервный приватный канал для дублирования бэкапов (необязательно) ---
    BACKUP_CHANNEL_ID: int | None = None

    # --- Безопасность ---
    PIN_CODE: str | None = None  # если задан - требуется ввод PIN при входе

    # --- Автоматизация ---
    AUTO_BACKUP_ENABLED: bool = True
    AUTO_BACKUP_DAYS: int = 3
    LINK_CHECK_ENABLED: bool = True
    LINK_CHECK_INTERVAL_HOURS: int = 24
    VIDEO_OF_DAY_ENABLED: bool = False
    VIDEO_OF_DAY_HOUR: int = 10
    TRASH_AUTOCLEAN_DAYS: int = 30
    UNCATEGORIZED_REMINDER_THRESHOLD: int = 15

    # --- Общие ---
    DEFAULT_LOCALE: str = "ru"
    DEFAULT_PAGE_SIZE: int = 10
    TIMEZONE: str = "UTC"
    LOG_LEVEL: str = "INFO"
    BACKUPS_DIR: str = str(BASE_DIR / "data" / "backups")

    @field_validator("ALLOWED_USERS")
    @classmethod
    def _normalize_allowed(cls, v: str) -> str:
        return v or ""

    @property
    def allowed_user_ids(self) -> set[int]:
        ids = {self.OWNER_ID}
        for chunk in self.ALLOWED_USERS.split(","):
            chunk = chunk.strip()
            if chunk:
                ids.add(int(chunk))
        return ids


settings = Settings()  # type: ignore[call-arg]

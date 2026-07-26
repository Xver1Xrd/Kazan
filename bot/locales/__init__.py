"""Простая локализация RU/EN: словари строк + функция подстановки."""
from __future__ import annotations

from bot.locales import en, ru

_CATALOGS = {"ru": ru.STRINGS, "en": en.STRINGS}
DEFAULT_LOCALE = "ru"


def t(key: str, lang: str | None = None, **kwargs) -> str:
    """Возвращает локализованную строку по ключу с подстановкой параметров."""
    lang = lang or DEFAULT_LOCALE
    catalog = _CATALOGS.get(lang, _CATALOGS[DEFAULT_LOCALE])
    template = catalog.get(key) or _CATALOGS[DEFAULT_LOCALE].get(key) or key
    if kwargs:
        try:
            return template.format(**kwargs)
        except (KeyError, IndexError):
            return template
    return template

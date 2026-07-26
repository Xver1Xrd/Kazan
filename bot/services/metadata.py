"""Извлечение метаданных видео по ссылке через yt-dlp (без скачивания файла)."""
from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

YDL_OPTS = {
    "quiet": True,
    "no_warnings": True,
    "skip_download": True,
    "extract_flat": False,
    "noplaylist": True,
    "socket_timeout": 15,
}


@dataclass
class VideoMetadata:
    title: str | None
    duration: int | None
    thumbnail_url: str | None
    source: str


def _domain_as_source(url: str) -> str:
    try:
        netloc = urlparse(url).netloc.lower()
        return netloc.removeprefix("www.") or "unknown"
    except Exception:  # noqa: BLE001
        return "unknown"


def _extract_sync(url: str) -> VideoMetadata:
    import yt_dlp

    source = _domain_as_source(url)
    try:
        with yt_dlp.YoutubeDL(YDL_OPTS) as ydl:
            info = ydl.extract_info(url, download=False)
            if info is None:
                raise ValueError("empty info")
            return VideoMetadata(
                title=info.get("title"),
                duration=info.get("duration"),
                thumbnail_url=info.get("thumbnail"),
                source=info.get("extractor_key", source),
            )
    except Exception as exc:  # noqa: BLE001 — платформа не поддерживается или сеть недоступна
        logger.info("Не удалось извлечь метаданные для %s: %s", url, exc)
        return VideoMetadata(title=None, duration=None, thumbnail_url=None, source=source)


async def fetch_metadata(url: str) -> VideoMetadata:
    """Асинхронно достаёт метаданные, выполняя блокирующий yt-dlp в отдельном потоке.

    Если платформа не поддерживается yt-dlp или сеть недоступна — возвращает
    заглушку с доменом в качестве источника (ссылка всё равно сохраняется).
    """
    return await asyncio.to_thread(_extract_sync, url)


async def check_link_alive(url: str, timeout: float = 10.0) -> bool:
    """Проверяет доступность ссылки простым HTTP-запросом (без скачивания тела)."""
    import aiohttp

    try:
        async with aiohttp.ClientSession() as http:
            try:
                async with http.head(url, timeout=aiohttp.ClientTimeout(total=timeout), allow_redirects=True) as resp:
                    if resp.status < 400:
                        return True
            except aiohttp.ClientError:
                pass
            # Некоторые сайты не поддерживают HEAD — пробуем GET
            async with http.get(url, timeout=aiohttp.ClientTimeout(total=timeout), allow_redirects=True) as resp:
                return resp.status < 400
    except Exception:  # noqa: BLE001
        return False

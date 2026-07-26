"""Модели данных SQLAlchemy 2.x (async, Mapped-стиль)."""
from __future__ import annotations

import datetime as dt

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Table,
    Text,
    UniqueConstraint,
    Column,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from bot.database import Base


def utcnow() -> dt.datetime:
    return dt.datetime.now(dt.timezone.utc)


# --- Связующие таблицы many-to-many без дополнительных полей ---

video_category = Table(
    "video_category",
    Base.metadata,
    Column("video_id", ForeignKey("videos.id", ondelete="CASCADE"), primary_key=True),
    Column("category_id", ForeignKey("categories.id", ondelete="CASCADE"), primary_key=True),
)

video_tag = Table(
    "video_tag",
    Base.metadata,
    Column("video_id", ForeignKey("videos.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


class User(Base):
    """Пользователь бота (владелец или из ALLOWED_USERS) — своя коллекция и настройки."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=False)
    is_owner: Mapped[bool] = mapped_column(Boolean, default=False)
    locale: Mapped[str] = mapped_column(String(2), default="ru")
    page_size: Mapped[int] = mapped_column(Integer, default=10)
    default_sort: Mapped[str] = mapped_column(String(20), default="new")
    auto_metadata: Mapped[bool] = mapped_column(Boolean, default=True)
    video_of_day_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    video_of_day_hour: Mapped[int] = mapped_column(Integer, default=10)
    video_of_day_favorites_only: Mapped[bool] = mapped_column(Boolean, default=False)
    backup_interval_days: Mapped[int] = mapped_column(Integer, default=3)
    pin_code: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Category(Base):
    """Категория/подкатегория для классификации видео."""

    __tablename__ = "categories"
    __table_args__ = (UniqueConstraint("owner_id", "name", name="uq_category_owner_name"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    owner_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(100))
    emoji: Mapped[str | None] = mapped_column(String(8), nullable=True)
    parent_id: Mapped[int | None] = mapped_column(ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)

    parent: Mapped["Category | None"] = relationship(remote_side=[id], back_populates="children")
    children: Mapped[list["Category"]] = relationship(back_populates="parent")
    videos: Mapped[list["Video"]] = relationship(secondary=video_category, back_populates="categories")
    rules: Mapped[list["AutoTagRule"]] = relationship(back_populates="category", cascade="all, delete-orphan")


class Tag(Base):
    """Свободная метка (тег)."""

    __tablename__ = "tags"
    __table_args__ = (UniqueConstraint("owner_id", "name", name="uq_tag_owner_name"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    owner_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(50))

    videos: Mapped[list["Video"]] = relationship(secondary=video_tag, back_populates="tags")


class Collection(Base):
    """Именованная подборка / плейлист."""

    __tablename__ = "collections"
    __table_args__ = (UniqueConstraint("owner_id", "name", name="uq_collection_owner_name"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    owner_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(100))
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    video_links: Mapped[list["VideoCollection"]] = relationship(
        back_populates="collection",
        cascade="all, delete-orphan",
        order_by="VideoCollection.position",
    )


class VideoCollection(Base):
    """Связь видео-коллекция с позицией для упорядоченных плейлистов."""

    __tablename__ = "video_collection"

    video_id: Mapped[int] = mapped_column(ForeignKey("videos.id", ondelete="CASCADE"), primary_key=True)
    collection_id: Mapped[int] = mapped_column(ForeignKey("collections.id", ondelete="CASCADE"), primary_key=True)
    position: Mapped[int] = mapped_column(Integer, default=0)

    video: Mapped["Video"] = relationship(back_populates="collection_links")
    collection: Mapped["Collection"] = relationship(back_populates="video_links")


class AutoTagRule(Base):
    """Правило авто-категоризации: если ключевое слово встречается в названии."""

    __tablename__ = "auto_tag_rules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    owner_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    keyword: Mapped[str] = mapped_column(String(100))
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id", ondelete="CASCADE"))

    category: Mapped["Category"] = relationship(back_populates="rules")


class Video(Base):
    """Видео из коллекции."""

    __tablename__ = "videos"
    __table_args__ = (UniqueConstraint("owner_id", "url", name="uq_video_owner_url"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    owner_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    url: Mapped[str] = mapped_column(Text)
    title: Mapped[str | None] = mapped_column(String(500), nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    source: Mapped[str | None] = mapped_column(String(100), nullable=True)
    duration: Mapped[int | None] = mapped_column(Integer, nullable=True)  # секунды
    thumbnail_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    rating: Mapped[int] = mapped_column(Integer, default=0)  # 0..5
    view_count: Mapped[int] = mapped_column(Integer, default=0)
    is_favorite: Mapped[bool] = mapped_column(Boolean, default=False)
    is_watched: Mapped[bool] = mapped_column(Boolean, default=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    deleted_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_broken: Mapped[bool] = mapped_column(Boolean, default=False)
    last_checked_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)
    last_opened_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    categories: Mapped[list["Category"]] = relationship(secondary=video_category, back_populates="videos")
    tags: Mapped[list["Tag"]] = relationship(secondary=video_tag, back_populates="videos")
    collection_links: Mapped[list["VideoCollection"]] = relationship(
        back_populates="video", cascade="all, delete-orphan"
    )

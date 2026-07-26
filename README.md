# Kazan — личный Telegram-бот для коллекции видео

Продвинутый Telegram-бот на **aiogram 3** для личной (или мультипользовательской)
коллекции видео по ссылкам: категории с иерархией, теги, коллекции/плейлисты,
авто-категоризация, поиск и фильтры, статистика, бэкапы и фоновые задачи.

Весь код бота находится в каталоге [`bot/`](bot/). Остальные файлы в корне
репозитория относятся к отдельному веб-проекту и с ботом не связаны.

## Возможности

- Добавление видео по ссылке (одиночное, массовое, из пересланных сообщений)
  с автоматическим извлечением метаданных через `yt-dlp`.
- Категории с подкатегориями, теги, именованные коллекции/плейлисты с
  ручной сортировкой.
- Правила авто-категоризации (ключевое слово → категория).
- Поиск, фильтры (категории И/ИЛИ, теги, рейтинг, дата, просмотрено/нет),
  сортировки, случайное видео, похожие видео.
- Избранное, отметка «просмотрено», корзина с восстановлением, undo.
- Массовые операции над отмеченными видео.
- Статистика с текстовыми графиками.
- Экспорт/импорт коллекции (JSON + CSV) с merge-логикой без дублей.
- Фоновые задачи (APScheduler): авто-бэкапы, проверка битых ссылок,
  «видео дня», очистка корзины, напоминание разобрать «Без категории».
- Мультиарендность (владелец + `ALLOWED_USERS`, у каждого своя коллекция),
  опциональный PIN-код на вход.
- Inline-режим (`@bot запрос`).
- Локализация RU/EN.

## Стек

Python 3.11+, aiogram 3.x, SQLAlchemy 2.x (async) + SQLite/PostgreSQL,
Alembic, yt-dlp, APScheduler, Redis (опционально для FSM).

## Быстрый старт

### 1. Создание бота через @BotFather

1. Откройте [@BotFather](https://t.me/BotFather) в Telegram.
2. Отправьте `/newbot` и следуйте инструкциям — получите `BOT_TOKEN`.
3. Узнайте свой Telegram `user_id`, например через [@userinfobot](https://t.me/userinfobot) —
   это будет `OWNER_ID`.
4. (Опционально) Включите inline-режим: `/setinline` → укажите текст-заглушку.

### 2. Установка

Все команды выполняются из корня репозитория (там, где лежат `requirements.txt`
и `alembic.ini`):

```bash
python3.11 -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Конфигурация

```bash
cp .env.example .env
```

Заполните как минимум `BOT_TOKEN` и `OWNER_ID` в `.env`. Остальные параметры
описаны прямо в `.env.example` с комментариями.

**Никогда не публикуйте `.env` с реальным токеном в git** — файл уже добавлен
в `.gitignore`.

### 4. Миграции базы данных (Alembic)

Для SQLite директория `data/` создастся автоматически.

```bash
# из корня репозитория (там, где лежит alembic.ini)
alembic upgrade head
```

При изменении моделей (`bot/models.py`) создавайте новую миграцию:

```bash
alembic revision --autogenerate -m "описание изменений"
alembic upgrade head
```

> Если запустить бота без миграций, `bot/main.py` при старте вызовет
> `Base.metadata.create_all(...)` и создаст недостающие таблицы автоматически —
> это удобно для первого локального запуска, но в проде используйте Alembic.

### 5. Запуск

```bash
# из корня репозитория
python -m bot.main
```

Бот запустится в режиме long polling, поднимет планировщик фоновых задач и
будет корректно завершать работу по `Ctrl+C` / `SIGTERM` (graceful shutdown:
дожидается остановки поллинга, закрывает сессии бота и соединения с БД).

## PostgreSQL вместо SQLite (опционально)

1. Установите PostgreSQL и создайте базу данных.
2. В `.env` укажите:
   ```
   DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/kazan_bot
   ```
3. Примените миграции: `alembic upgrade head`.

Код репозиториев не завязан на конкретную СУБД (используется чистый
SQLAlchemy Core/ORM), поэтому переключение — это только смена `DATABASE_URL`
и прогон миграций.

## Redis вместо памяти для FSM (опционально)

По умолчанию состояния диалогов (FSM) хранятся в памяти процесса и
сбрасываются при перезапуске. Чтобы использовать Redis:

1. Поднимите Redis (`docker run -p 6379:6379 redis:7`).
2. В `.env`: `REDIS_URL=redis://localhost:6379/0`.

`bot/main.py` сам выберет `RedisStorage`, если `REDIS_URL` задан.

## Команды бота

`/start`, `/add`, `/bulk`, `/categories`, `/tags`, `/collections`, `/browse`,
`/filter`, `/search <текст>`, `/random`, `/favorites`, `/trash`, `/stats`,
`/rules`, `/rules_add`, `/export`, `/import`, `/maintenance`, `/settings`,
`/undo`, `/bulk_select`, `/hide`, `/help`.

Также поддерживаются: `/recent_added`, `/recent_opened`, `/never_opened`,
`/broken_links`, `/uncategorized` для быстрых срезов коллекции.

## Обработка ошибок

- Некорректная ссылка / отсутствие ссылки в сообщении — бот сообщает об этом,
  не создавая пустую запись.
- Платформа не поддерживается `yt-dlp` или недоступна сеть — видео всё равно
  сохраняется, но без метаданных (заголовком становится сама ссылка).
- Несуществующая категория/тег/коллекция (например, удалены другим действием
  в параллельном апдейте) — бот отвечает "не найдено", не падая.
- Пустая коллекция/плейлист — бот сообщает, что смотреть нечего, вместо ошибки.
- Сбой сети при бэкапе/проверке ссылок — соответствующий фоновый job логирует
  ошибку и продолжает работу для остальных пользователей/видео.
- Все необратимые действия (окончательное удаление, удаление категории/тега/
  коллекции, слияние категорий) требуют подтверждения инлайн-кнопкой.

## Структура проекта

```
bot/
  main.py                # запуск, роутеры, планировщик, graceful shutdown
  config.py               # .env
  database.py              # async engine, session, Base
  models.py                # все модели
  states.py                # FSM
  keyboards.py             # inline/reply + пагинация
  callbacks.py             # CallbackData-фабрики
  middlewares.py           # доступ/PIN/сессия БД на апдейт
  locales/                 # ru.py, en.py
  services/
    metadata.py            # yt-dlp
    scheduler.py            # APScheduler: бэкапы, проверка ссылок, видео дня
    autotag.py              # правила авто-категоризации
    backup.py               # export/import/maintenance
  repository/
    videos.py
    categories.py
    tags.py
    collections.py
    rules.py
    users.py
  handlers/
    common.py               # start/help/меню/settings
    add.py                   # добавление, bulk, forward
    categories.py
    tags.py
    collections.py
    browse.py                # просмотр/фильтр/поиск/sort/random/similar
    manage.py                # карточка, edit, favorite, watched, trash, undo
    bulk_ops.py              # массовые операции
    stats.py
    backup.py
    inline.py                # inline-режим
requirements.txt
.env.example
alembic/                    # миграции
```

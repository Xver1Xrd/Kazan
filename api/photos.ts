/**
 * API галереи: список загруженных фото и приём новых снимков с телефона.
 *
 *   GET  /api/photos  -> { photos: UploadedPhoto[] }
 *   POST /api/photos  -> { photo: UploadedPhoto }
 *
 * Тело POST — JSON: { data: base64, contentType: string, caption?: string }.
 * JSON вместо multipart намеренно: тело одинаково разбирается и в дев-сервере
 * Vite, и в serverless-функции Vercel, без зависимости от парсера форм.
 *
 * Хранилище выбирается автоматически:
 *   • есть BLOB_READ_WRITE_TOKEN — файлы уходят в Vercel Blob (прод);
 *   • иначе — на диск в public/uploads (локальная разработка и свой сервер).
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { randomBytes } from 'node:crypto';
import { mkdir, readdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

export type UploadedPhoto = {
  id: string;
  url: string;
  caption: string;
  uploadedAt: number;
};

/** Лимит на один снимок после сжатия в браузере. */
export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
/** Запас на base64 (+33%) и служебные поля JSON. */
const MAX_BODY_BYTES = Math.ceil(MAX_IMAGE_BYTES * 1.4) + 4096;
const MAX_CAPTION_LENGTH = 120;
/** Префикс в Blob-хранилище и имя папки на диске. */
const PREFIX = 'uploads';

const EXTENSION_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

const TYPE_BY_EXTENSION: Record<string, string> = Object.fromEntries(
  Object.entries(EXTENSION_BY_TYPE).map(([type, ext]) => [ext, type]),
);

class HttpError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

/* ------------------------------------------------------------------ */
/* Имя файла хранит подпись, чтобы не заводить отдельную базу данных.  */
/* Формат: <id>__<caption в base64url>.<ext>                          */
/* ------------------------------------------------------------------ */

function buildFileName(caption: string, ext: string): string {
  const id = `${Date.now().toString(36)}-${randomBytes(4).toString('hex')}`;
  return `${id}__${Buffer.from(caption, 'utf8').toString('base64url')}.${ext}`;
}

function parseFileName(fileName: string): { id: string; caption: string; uploadedAt: number } | null {
  const match = /^([0-9a-z]+-[0-9a-f]+)__([A-Za-z0-9_-]*)\.[a-z0-9]+$/.exec(fileName);
  if (!match) return null;
  const [, id, encodedCaption] = match;
  const uploadedAt = parseInt(id.split('-')[0], 36);
  return {
    id,
    caption: encodedCaption ? Buffer.from(encodedCaption, 'base64url').toString('utf8') : '',
    uploadedAt: Number.isFinite(uploadedAt) ? uploadedAt : 0,
  };
}

/* ------------------------------- хранилища ------------------------------- */

const useBlobStore = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

function localUploadsDir(): string {
  return process.env.UPLOADS_DIR ?? path.join(process.cwd(), 'public', PREFIX);
}

function assertStorageConfigured(): void {
  if (useBlobStore) return;
  if (process.env.VERCEL) {
    throw new HttpError(
      503,
      'Хранилище фото не настроено: на Vercel файловая система только для чтения. ' +
        'Подключите Vercel Blob и добавьте переменную окружения BLOB_READ_WRITE_TOKEN.',
    );
  }
}

async function listPhotos(): Promise<UploadedPhoto[]> {
  const photos: UploadedPhoto[] = [];

  if (useBlobStore) {
    const { list } = await import('@vercel/blob');
    let cursor: string | undefined;
    do {
      const page = await list({ prefix: `${PREFIX}/`, limit: 1000, cursor });
      for (const blob of page.blobs) {
        const meta = parseFileName(blob.pathname.slice(PREFIX.length + 1));
        if (meta) photos.push({ ...meta, url: blob.url });
      }
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
  } else {
    let fileNames: string[];
    try {
      fileNames = await readdir(localUploadsDir());
    } catch {
      return []; // папки ещё нет — значит, и фото нет
    }
    for (const fileName of fileNames) {
      const meta = parseFileName(fileName);
      if (meta) photos.push({ ...meta, url: `/${PREFIX}/${fileName}` });
    }
  }

  return photos.sort((a, b) => b.uploadedAt - a.uploadedAt);
}

async function savePhoto(data: Buffer, contentType: string, caption: string): Promise<UploadedPhoto> {
  assertStorageConfigured();

  const ext = EXTENSION_BY_TYPE[contentType];
  const fileName = buildFileName(caption, ext);
  const meta = parseFileName(fileName)!;

  if (useBlobStore) {
    const { put } = await import('@vercel/blob');
    const blob = await put(`${PREFIX}/${fileName}`, data, {
      access: 'public',
      contentType,
      addRandomSuffix: false,
      cacheControlMaxAge: 31_536_000,
    });
    return { ...meta, url: blob.url };
  }

  const dir = localUploadsDir();
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, fileName), data);
  return { ...meta, url: `/${PREFIX}/${fileName}` };
}

/**
 * Удаляет снимок по id. По id восстанавливаем точное имя файла: ищем по
 * (захешированным) именам в хранилище, чтобы не дырявить имена произвольными
 * путями и не вырезать чужие файлы.
 */
async function deletePhoto(id: string): Promise<boolean> {
  assertStorageConfigured();

  if (useBlobStore) {
    const { list, del } = await import('@vercel/blob');
    const matches: string[] = [];
    let cursor: string | undefined;
    do {
      const page = await list({ prefix: `${PREFIX}/`, limit: 1000, cursor });
      for (const blob of page.blobs) {
        const meta = parseFileName(blob.pathname.slice(PREFIX.length + 1));
        if (meta && meta.id === id) matches.push(blob.pathname);
      }
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);

    if (matches.length === 0) return false;
    await del(matches);
    return true;
  }

  const dir = localUploadsDir();
  let fileNames: string[];
  try {
    fileNames = await readdir(dir);
  } catch {
    return false; // папки нет — удалять нечего
  }
  const match = fileNames.find((name) => parseFileName(name)?.id === id);
  if (!match) return false;
  await unlink(path.join(dir, match));
  return true;
}

/* -------------------------------- разбор -------------------------------- */

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  // На Vercel тело может быть уже разобрано рантаймом — тогда поток пуст.
  const parsed = (req as { body?: unknown }).body;
  if (parsed && typeof parsed === 'object' && !Buffer.isBuffer(parsed)) return parsed;

  const raw = Buffer.isBuffer(parsed) ? parsed : await readStream(req);
  if (raw.length === 0) throw new HttpError(400, 'Пустой запрос.');
  try {
    return JSON.parse(raw.toString('utf8'));
  } catch {
    throw new HttpError(400, 'Не удалось разобрать запрос.');
  }
}

async function readStream(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new HttpError(413, 'Файл слишком большой.');
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks);
}

function sanitizeCaption(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\p{Cc}\p{Cf}]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_CAPTION_LENGTH);
}

function normalizeContentType(value: unknown, caption: string): string {
  const raw = typeof value === 'string' ? value.toLowerCase().split(';')[0].trim() : '';
  if (EXTENSION_BY_TYPE[raw]) return raw;

  // Некоторые телефоны отдают файл без MIME-типа — пробуем угадать по имени.
  const ext = /\.([a-z0-9]+)$/i.exec(caption)?.[1]?.toLowerCase();
  const guessed = ext === 'jpeg' ? 'image/jpeg' : ext ? TYPE_BY_EXTENSION[ext] : undefined;
  if (guessed) return guessed;

  throw new HttpError(415, 'Такой формат не поддерживается — нужен JPEG, PNG, WebP или HEIC.');
}

function decodeImage(value: unknown): Buffer {
  if (typeof value !== 'string' || value.length === 0) throw new HttpError(400, 'Файл не передан.');
  // Принимаем как «сырой» base64, так и data:image/...;base64,....
  const base64 = value.includes(',') ? value.slice(value.indexOf(',') + 1) : value;
  const data = Buffer.from(base64, 'base64');
  if (data.length === 0) throw new HttpError(400, 'Файл повреждён.');
  if (data.length > MAX_IMAGE_BYTES) {
    throw new HttpError(413, `Файл слишком большой — максимум ${Math.round(MAX_IMAGE_BYTES / 1024 / 1024)} МБ.`);
  }
  return data;
}

/* -------------------------------- handler -------------------------------- */

function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  const body = JSON.stringify(payload);
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.end(body);
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const idMatch = /^\/api\/photos\/([0-9a-z]+-[0-9a-f]+)$/.exec(url.pathname);
    if (idMatch) {
      if (req.method !== 'DELETE') {
        res.setHeader('allow', 'DELETE');
        sendJson(res, 405, { error: 'Метод не поддерживается.' });
        return;
      }
      const removed = await deletePhoto(idMatch[1]);
      if (!removed) throw new HttpError(404, 'Фото не найдено.');
      sendJson(res, 200, { ok: true });
      return;
    }

    if (url.pathname !== '/api/photos') {
      res.statusCode = 404;
      res.end();
      return;
    }

    if (req.method === 'GET') {
      sendJson(res, 200, { photos: await listPhotos() });
      return;
    }

    if (req.method === 'POST') {
      const body = (await readJsonBody(req)) as Record<string, unknown>;
      const caption = sanitizeCaption(body.caption);
      const data = decodeImage(body.data);
      const contentType = normalizeContentType(body.contentType, caption);
      const photo = await savePhoto(data, contentType, stripExtension(caption));
      sendJson(res, 201, { photo });
      return;
    }

    res.setHeader('allow', 'GET, POST');
    sendJson(res, 405, { error: 'Метод не поддерживается.' });
  } catch (error) {
    if (error instanceof HttpError) {
      sendJson(res, error.status, { error: error.message });
      return;
    }
    console.error('[api/photos]', error);
    sendJson(res, 500, { error: 'Не удалось сохранить фото. Попробуйте ещё раз.' });
  }
}

function stripExtension(caption: string): string {
  return caption.replace(/\.[a-z0-9]{2,5}$/i, '').trim();
}

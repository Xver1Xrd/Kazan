// Клиент галереи: отдаёт фото, загруженные с телефона, и принимает новые.
// Снимки с камеры весят 5–12 МБ, поэтому перед отправкой каждый кадр
// уменьшается и пережимается прямо в браузере — так загрузка по мобильному
// интернету занимает секунды, а не минуты.
import type { Photo } from './photos';

export type UploadedPhoto = Photo & {
  id: string;
  uploadedAt: number;
};

const ENDPOINT = '/api/photos';

/** Столько же принимает сервер (см. MAX_IMAGE_BYTES в api/photos.ts). */
const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;
/** Длинная сторона после сжатия: хватает и для полноэкранного просмотра. */
const MAX_DIMENSION = 2560;
const QUALITY_STEPS = [0.82, 0.7, 0.58, 0.45];

export const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp,image/heic,image/heif,image/avif,image/*';

export class UploadError extends Error {}

function captionFromFileName(name: string): string {
  return name
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .trim();
}

/** Загруженные фото, свежие — первыми. */
export async function fetchUploadedPhotos(signal?: AbortSignal): Promise<UploadedPhoto[]> {
  const response = await fetch(ENDPOINT, { signal });
  if (!response.ok) throw new UploadError('Не удалось загрузить галерею.');
  const payload = (await response.json()) as { photos?: UploadedPhoto[] };
  return payload.photos ?? [];
}

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  // imageOrientation учитывает EXIF — иначе портретные снимки лежат на боку.
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      // Формат не по зубам этому браузеру (например, HEIC вне Safari).
    }
  }

  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new UploadError('Не удалось прочитать изображение.'));
      image.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
}

/**
 * Уменьшает снимок до MAX_DIMENSION и подбирает качество JPEG, пока результат
 * не уложится в лимит. Если декодировать не вышло (HEIC в Chrome) — отдаёт
 * исходный файл, и решение остаётся за сервером.
 */
async function compress(file: File): Promise<{ blob: Blob; contentType: string }> {
  let source: ImageBitmap | HTMLImageElement;
  try {
    source = await decode(file);
  } catch {
    return { blob: file, contentType: file.type };
  }

  const width = 'naturalWidth' in source ? source.naturalWidth : source.width;
  const height = 'naturalHeight' in source ? source.naturalHeight : source.height;
  if (!width || !height) return { blob: file, contentType: file.type };

  const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);

  const context = canvas.getContext('2d');
  if (!context) return { blob: file, contentType: file.type };
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  if ('close' in source) source.close();

  let smallest: Blob | null = null;
  for (const quality of QUALITY_STEPS) {
    const blob = await toBlob(canvas, quality);
    if (!blob) break;
    smallest = blob;
    if (blob.size <= MAX_UPLOAD_BYTES) break;
  }

  if (!smallest) return { blob: file, contentType: file.type };
  // Для маленьких картинок оригинал может оказаться легче пережатого JPEG.
  if (file.size <= smallest.size && file.size <= MAX_UPLOAD_BYTES) {
    return { blob: file, contentType: file.type };
  }
  return { blob: smallest, contentType: 'image/jpeg' };
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.slice(result.indexOf(',') + 1));
    };
    reader.onerror = () => reject(new UploadError('Не удалось прочитать файл.'));
    reader.readAsDataURL(blob);
  });
}

/** Отправляет тело через XHR — только он умеет отдавать прогресс загрузки. */
function send(body: string, onProgress?: (fraction: number) => void): Promise<UploadedPhoto> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('POST', ENDPOINT);
    request.setRequestHeader('content-type', 'application/json');

    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(event.loaded / event.total);
    };
    request.onerror = () => reject(new UploadError('Нет связи с сервером. Проверьте интернет.'));
    request.onload = () => {
      let payload: { photo?: UploadedPhoto; error?: string } = {};
      try {
        payload = JSON.parse(request.responseText);
      } catch {
        // Тело не JSON — ниже отдадим общую ошибку.
      }
      if (request.status >= 200 && request.status < 300 && payload.photo) {
        onProgress?.(1);
        resolve(payload.photo);
      } else {
        reject(new UploadError(payload.error ?? 'Не удалось сохранить фото. Попробуйте ещё раз.'));
      }
    };

    request.send(body);
  });
}

/** Сжимает файл и сохраняет его на сервере. */
export async function uploadPhoto(
  file: File,
  options: { caption?: string; onProgress?: (fraction: number) => void } = {},
): Promise<UploadedPhoto> {
  if (file.size === 0) throw new UploadError('Файл пустой.');

  const { blob, contentType } = await compress(file);
  if (blob.size > MAX_UPLOAD_BYTES) {
    throw new UploadError('Файл слишком большой — попробуйте другой снимок.');
  }

  const caption = (options.caption ?? captionFromFileName(file.name)).slice(0, 120);
  const data = await blobToBase64(blob);

  return send(JSON.stringify({ data, contentType: contentType || file.type, caption }), options.onProgress);
}

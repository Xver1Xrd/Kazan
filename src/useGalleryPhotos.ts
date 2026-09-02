// Общий источник фото для галереи: снимки из репозитория (src/photos) плюс
// загруженные с телефона и сохранённые на сервере. Список кэшируется в модуле
// и в localStorage, поэтому переход между главной и /gallery не дёргает сеть,
// а на повторном заходе галерея рисуется сразу, без пустого экрана.
import { useEffect, useState } from 'react';
import { PHOTOS, type Photo } from './photos';
import { fetchUploadedPhotos, type UploadedPhoto } from './uploads';

const STORAGE_KEY = 'kazan:uploaded-photos';

const listeners = new Set<(photos: UploadedPhoto[]) => void>();
let cache = restore();
let pending: Promise<void> | null = null;
let revalidated = false;

function restore(): UploadedPhoto[] | null {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (!Array.isArray(raw)) return null;
    return raw.filter(
      (item): item is UploadedPhoto =>
        typeof item?.id === 'string' && typeof item?.url === 'string' && typeof item?.caption === 'string',
    );
  } catch {
    return null; // приватный режим или испорченное значение — просто сходим в сеть
  }
}

function publish(next: UploadedPhoto[]): void {
  cache = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Кэш — приятный бонус, а не обязательство.
  }
  listeners.forEach((listener) => listener(next));
}

/** Показывает только что загруженный снимок, не дожидаясь повторного запроса. */
export function addUploadedPhoto(photo: UploadedPhoto): void {
  publish([photo, ...(cache ?? []).filter((item) => item.id !== photo.id)]);
}

/** Убирает удалённый снимок из списка сразу, без перезагрузки. */
export function removeUploadedPhoto(id: string): void {
  publish((cache ?? []).filter((item) => item.id !== id));
}

function load(): Promise<void> {
  pending ??= fetchUploadedPhotos()
    .then(publish)
    .catch(() => {
      // Сервер недоступен — остаёмся с тем, что уже показано.
    })
    .finally(() => {
      pending = null;
      revalidated = true;
    });
  return pending;
}

export type GalleryPhotos = {
  /** Загруженные фото впереди локальных: свежие кадры сверху. */
  photos: Photo[];
  uploaded: UploadedPhoto[];
  /** Список ещё ни разу не приезжал с сервера — состав галереи неизвестен. */
  loading: boolean;
};

export function useGalleryPhotos(): GalleryPhotos {
  const [uploaded, setUploaded] = useState<UploadedPhoto[]>(() => cache ?? []);
  const [loading, setLoading] = useState(cache === null);

  useEffect(() => {
    listeners.add(setUploaded);
    let active = true;
    if (!revalidated) {
      void load().then(() => {
        if (active) setLoading(false);
      });
    } else {
      setLoading(false);
    }
    return () => {
      active = false;
      listeners.delete(setUploaded);
    };
  }, []);

  return { photos: [...uploaded, ...PHOTOS], uploaded, loading };
}

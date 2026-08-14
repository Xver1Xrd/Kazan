import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Camera, Check, ImagePlus, Loader2 } from 'lucide-react';
import { ACCEPTED_TYPES, UploadError, uploadPhoto } from '../uploads';
import { addUploadedPhoto } from '../useGalleryPhotos';

type Status = 'waiting' | 'compressing' | 'uploading' | 'done' | 'error';

type QueueItem = {
  key: string;
  name: string;
  preview: string;
  status: Status;
  progress: number;
  error?: string;
};

const STATUS_LABEL: Record<Status, string> = {
  waiting: 'в очереди',
  compressing: 'сжимаем',
  uploading: 'загружаем',
  done: 'сохранено',
  error: 'ошибка',
};

export default function PhotoUploader() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [onPhone, setOnPhone] = useState(false);
  const cameraInput = useRef<HTMLInputElement>(null);
  const libraryInput = useRef<HTMLInputElement>(null);
  const busy = useRef(false);
  const previews = useRef<string[]>([]);

  useEffect(() => {
    // Кнопку камеры показываем там, где она есть под рукой: телефоны и планшеты.
    setOnPhone(window.matchMedia('(pointer: coarse)').matches);
    const urls = previews.current;
    return () => urls.forEach(URL.revokeObjectURL);
  }, []);

  const update = useCallback((key: string, patch: Partial<QueueItem>) => {
    setQueue((items) => items.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  }, []);

  const enqueue = useCallback(
    async (files: File[]) => {
      const images = files.filter((file) => file.type.startsWith('image/') || /\.(jpe?g|png|webp|heic|heif|avif)$/i.test(file.name));
      if (images.length === 0) return;

      const items: QueueItem[] = images.map((file, i) => {
        const preview = URL.createObjectURL(file);
        previews.current.push(preview);
        return {
          key: `${Date.now()}-${i}-${file.name}`,
          name: file.name,
          preview,
          status: 'waiting',
          progress: 0,
        };
      });
      setQueue((current) => [...items, ...current]);

      if (busy.current) return;
      busy.current = true;
      try {
        // По одному файлу за раз: мобильная сеть не любит параллельных отправок.
        for (let i = 0; i < images.length; i += 1) {
          const item = items[i];
          update(item.key, { status: 'compressing' });
          try {
            const photo = await uploadPhoto(images[i], {
              onProgress: (fraction) => update(item.key, { status: 'uploading', progress: fraction }),
            });
            addUploadedPhoto(photo);
            update(item.key, { status: 'done', progress: 1 });
          } catch (error) {
            update(item.key, {
              status: 'error',
              error: error instanceof UploadError ? error.message : 'Не удалось сохранить фото.',
            });
          }
        }
      } finally {
        busy.current = false;
      }
    },
    [update],
  );

  const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    void enqueue(Array.from(event.target.files ?? []));
    event.target.value = ''; // тот же файл можно выбрать повторно
  };

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragging(false);
    void enqueue(Array.from(event.dataTransfer.files));
  };

  return (
    <section
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`mt-10 rounded-3xl border-2 border-dashed p-5 sm:p-7 transition-colors ${
        dragging
          ? 'border-[#4b7a5a] bg-[#4b7a5a]/5'
          : 'border-[#1f2a1d]/15 dark:border-white/15 bg-[#f7f5ef]/60 dark:bg-white/[0.03]'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-[#1f2a1d] dark:text-white">Добавить фото с телефона</h2>
          <p className="mt-1 text-sm text-[#4b5b47] dark:text-white/60 max-w-md">
            Снимите кадр прямо сейчас или выберите готовый из галереи телефона — он сожмётся и сохранится на сервере,
            рядом с остальными нашими фото.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 shrink-0">
          {onPhone && (
            <button
              type="button"
              onClick={() => cameraInput.current?.click()}
              className="inline-flex items-center gap-2 rounded-full bg-[#1f2a1d] dark:bg-white px-5 py-3 text-sm font-semibold text-white dark:text-[#1f2a1d] hover:opacity-90 transition-opacity"
            >
              <Camera className="w-4 h-4" />
              Снять фото
            </button>
          )}
          <button
            type="button"
            onClick={() => libraryInput.current?.click()}
            className="inline-flex items-center gap-2 rounded-full border border-[#1f2a1d]/20 dark:border-white/25 px-5 py-3 text-sm font-semibold text-[#1f2a1d] dark:text-white hover:bg-[#1f2a1d]/5 dark:hover:bg-white/10 transition-colors"
          >
            <ImagePlus className="w-4 h-4" />
            {onPhone ? 'Из галереи' : 'Выбрать фото'}
          </button>
        </div>
      </div>

      <input
        ref={cameraInput}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onInputChange}
        className="sr-only"
        aria-label="Снять фото камерой"
      />
      <input
        ref={libraryInput}
        type="file"
        accept={ACCEPTED_TYPES}
        multiple
        onChange={onInputChange}
        className="sr-only"
        aria-label="Выбрать фото из галереи"
      />

      <AnimatePresence initial={false}>
        {queue.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 flex flex-col gap-3 overflow-hidden"
            aria-live="polite"
          >
            {queue.map((item) => (
              <motion.li
                key={item.key}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 rounded-2xl bg-white dark:bg-white/5 border border-[#1f2a1d]/10 dark:border-white/10 p-2.5"
              >
                <img src={item.preview} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[#1f2a1d] dark:text-white">{item.name}</p>
                  <p className={`text-xs ${item.status === 'error' ? 'text-[#c9573f]' : 'text-[#4b5b47] dark:text-white/50'}`}>
                    {item.error ?? STATUS_LABEL[item.status]}
                  </p>
                  {(item.status === 'uploading' || item.status === 'compressing') && (
                    <div className="mt-1.5 h-1 rounded-full bg-[#1f2a1d]/10 dark:bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#4b7a5a] transition-[width] duration-200"
                        style={{ width: `${Math.max(8, Math.round(item.progress * 100))}%` }}
                      />
                    </div>
                  )}
                </div>
                <span className="shrink-0 pr-1">
                  {item.status === 'done' && <Check className="w-5 h-5 text-[#4b7a5a] dark:text-[#a9cbad]" />}
                  {item.status === 'error' && <AlertCircle className="w-5 h-5 text-[#c9573f]" />}
                  {(item.status === 'waiting' || item.status === 'compressing' || item.status === 'uploading') && (
                    <Loader2 className="w-5 h-5 animate-spin text-[#4b5b47] dark:text-white/40" />
                  )}
                </span>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </section>
  );
}

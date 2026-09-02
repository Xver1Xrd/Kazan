import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Photo } from '../photos';

type Props = {
  photos: Photo[];
  index: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
  /** Можно ли удалять фото по индексу (true для загруженных снимков). */
  deletable?: boolean[];
  onDelete?: (index: number, photo: Photo) => void | Promise<void>;
};

export default function Lightbox({ photos, index, onClose, onNavigate, deletable, onDelete }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const prev = useCallback(() => {
    if (index === null) return;
    onNavigate((index - 1 + photos.length) % photos.length);
  }, [index, photos.length, onNavigate]);

  const next = useCallback(() => {
    if (index === null) return;
    onNavigate((index + 1) % photos.length);
  }, [index, photos.length, onNavigate]);

  const close = useCallback(() => {
    setConfirming(false);
    setDeleting(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [index, onClose, prev, next, close]);

  const photo = index !== null ? photos[index] : null;
  const canDelete = index !== null && !!(deletable?.[index] && onDelete);

  const handleDelete = useCallback(async () => {
    if (index === null || !photo || !onDelete) return;
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setDeleting(true);
    try {
      await onDelete(index, photo);
      close();
    } finally {
      setConfirming(false);
      setDeleting(false);
    }
  }, [index, photo, onDelete, confirming, close]);

  return (
    <AnimatePresence>
      {photo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label={photo.caption}
        >
          <button
            onClick={close}
            aria-label="Закрыть"
            className="absolute top-4 right-4 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {canDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                void handleDelete();
              }}
              aria-label={confirming ? 'Подтвердить удаление' : 'Удалить фото'}
              className={`absolute top-4 left-4 z-10 flex items-center gap-2 rounded-full px-4 h-10 text-sm font-medium transition-colors ${
                confirming
                  ? 'bg-[#c9573f] text-white hover:bg-[#a8432f]'
                  : 'bg-white/10 text-white hover:bg-[#c9573f]'
              }`}
            >
              {deleting ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              {confirming ? 'Точно удалить?' : 'Удалить'}
            </button>
          )}

          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                aria-label="Предыдущее фото"
                className="absolute left-3 sm:left-6 z-10 flex items-center justify-center w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                aria-label="Следующее фото"
                className="absolute right-3 sm:right-6 z-10 flex items-center justify-center w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          <motion.figure
            key={photo.url}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-[92vw] max-h-[86vh] flex flex-col items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={photo.url} alt={photo.caption} className="max-w-full max-h-[78vh] rounded-2xl object-contain" />
            <figcaption className="text-white/80 text-sm text-center">{photo.caption}</figcaption>
          </motion.figure>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

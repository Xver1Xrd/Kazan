import { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, ImagePlus } from 'lucide-react';
import { GALLERY_IDEAS } from '../data';
import type { Photo } from '../photos';
import { useGalleryPhotos } from '../useGalleryPhotos';
import Reveal from '../components/Reveal';
import Lightbox from '../components/Lightbox';
import PhotoUploader from '../components/PhotoUploader';

const TONE_CLASSES: Record<string, string> = {
  sunset: 'from-[#f4a26a] to-[#c9573f]',
  green: 'from-[#8fbf94] to-[#3d5638]',
  gold: 'from-[#e8c76a] to-[#a9772f]',
  night: 'from-[#2d3a52] to-[#12141f]',
  water: 'from-[#7fb6c9] to-[#2f5266]',
  stone: 'from-[#a8a396] to-[#4b473d]',
};

function RealGallery({ photos }: { photos: Photo[] }) {
  const [lightbox, setLightbox] = useState<number | null>(null);

  return (
    <>
      <div className="mt-12 columns-2 md:columns-3 gap-4 [&>*]:mb-4 [&>*]:break-inside-avoid">
        {photos.map((photo, i) => (
          <Reveal key={photo.url} delay={(i % 6) * 0.05}>
            <button
              onClick={() => setLightbox(i)}
              className="group relative block w-full overflow-hidden rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4b7a5a]"
            >
              <img
                src={photo.url}
                alt={photo.caption}
                loading="lazy"
                className="w-full transition-transform duration-500 group-hover:scale-[1.04]"
              />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-4 pt-8 pb-3 text-left text-white text-xs sm:text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                {photo.caption}
              </span>
            </button>
          </Reveal>
        ))}
      </div>
      <Lightbox photos={photos} index={lightbox} onClose={() => setLightbox(null)} onNavigate={setLightbox} />
    </>
  );
}

/** Пока список фото не приехал с сервера — спокойные заглушки вместо прыжка вёрстки. */
function GallerySkeleton() {
  return (
    <div className="mt-12 columns-2 md:columns-3 gap-4 [&>*]:mb-4 [&>*]:break-inside-avoid" aria-hidden>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="rounded-2xl bg-[#1f2a1d]/5 dark:bg-white/5 animate-pulse"
          style={{ aspectRatio: i % 3 === 0 ? '3 / 4' : i % 3 === 1 ? '1 / 1' : '4 / 5' }}
        />
      ))}
    </div>
  );
}

function PlaceholderGallery() {
  return (
    <div className="mt-12 columns-2 md:columns-3 gap-4 [&>*]:mb-4 [&>*]:break-inside-avoid">
      {GALLERY_IDEAS.map((idea, i) => (
        <Reveal key={idea.caption} delay={(i % 6) * 0.05}>
          <div
            className={`rounded-2xl bg-gradient-to-br ${TONE_CLASSES[idea.tone]} flex items-end p-4 relative overflow-hidden`}
            style={{ aspectRatio: i % 3 === 0 ? '3 / 4' : i % 3 === 1 ? '1 / 1' : '4 / 5' }}
          >
            <Camera className="absolute top-4 left-4 w-4 h-4 text-white/70" />
            <p className="text-white text-sm font-medium leading-snug">{idea.caption}</p>
          </div>
        </Reveal>
      ))}

      <Reveal delay={0.3}>
        <div className="aspect-square rounded-2xl border-2 border-dashed border-[#1f2a1d]/15 dark:border-white/15 flex flex-col items-center justify-center text-center gap-2 p-4">
          <ImagePlus className="w-6 h-6 text-[#4b7a5a] dark:text-[#a9cbad]" />
          <p className="text-xs text-[#4b5b47] dark:text-white/50">Здесь будет наше фото</p>
        </div>
      </Reveal>
    </div>
  );
}

export default function GalleryPage() {
  const { photos, loading } = useGalleryPhotos();
  const hasPhotos = photos.length > 0;

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen pt-28 sm:pt-32 pb-20 sm:pb-28 px-4 sm:px-6 md:px-10 bg-white dark:bg-[#0e1712]"
    >
      <div className="max-w-5xl mx-auto">
        <span className="text-sm font-semibold text-[#4b7a5a] dark:text-[#a9cbad] uppercase tracking-wide">
          Галерея
        </span>
        <h1
          className="mt-3 text-3xl sm:text-4xl md:text-5xl font-normal text-[#1f2a1d] dark:text-white max-w-2xl"
          style={{ letterSpacing: '-0.02em' }}
        >
          {hasPhotos ? 'Наши кадры из Казани' : 'Кадры, которые мы ещё сделаем'}
        </h1>
        <p className="mt-4 text-[#4b5b47] dark:text-white/60 max-w-xl">
          {hasPhotos
            ? 'Собрано за пять дней вдвоём — клик по фото открывает его на весь экран.'
            : 'Поездка ещё впереди, настоящих фото пока нет — это список моментов, которые точно стоит поймать в кадр. После возвращения сюда встанут наши реальные снимки.'}
        </p>

        <PhotoUploader />

        {hasPhotos ? <RealGallery photos={photos} /> : loading ? <GallerySkeleton /> : <PlaceholderGallery />}
      </div>
    </motion.main>
  );
}

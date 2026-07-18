import { Link } from 'react-router-dom';
import { ArrowRight, Camera } from 'lucide-react';
import { GALLERY_IDEAS } from '../data';
import { PHOTOS } from '../photos';
import Reveal from './Reveal';
import SectionHeading from './SectionHeading';
import TiltCard from './TiltCard';

const TONE_CLASSES: Record<string, string> = {
  sunset: 'from-[#f4a26a] to-[#c9573f]',
  green: 'from-[#8fbf94] to-[#3d5638]',
  gold: 'from-[#e8c76a] to-[#a9772f]',
  night: 'from-[#2d3a52] to-[#12141f]',
  water: 'from-[#7fb6c9] to-[#2f5266]',
  stone: 'from-[#a8a396] to-[#4b473d]',
};

export default function GalleryTeaser() {
  const hasPhotos = PHOTOS.length > 0;
  const preview = GALLERY_IDEAS.slice(0, 4);

  return (
    <section className="relative px-4 sm:px-6 md:px-10 py-20 sm:py-28 bg-white dark:bg-[#0e1712]">
      <div className="max-w-6xl mx-auto">
        <SectionHeading
          number="04"
          label="Галерея"
          title={
            hasPhotos ? (
              <>
                Наши <span className="font-accent font-semibold text-[#4b7a5a] dark:text-[#a9cbad]">кадры</span> из Казани
              </>
            ) : (
              <>
                Кадры, которые мы <span className="font-accent font-semibold text-[#4b7a5a] dark:text-[#a9cbad]">ещё сделаем</span>
              </>
            )
          }
          text={
            hasPhotos
              ? 'Немного из того, что мы привезли с собой, — остальное в полной галерее.'
              : 'Поездка ещё впереди — здесь будут наши настоящие фото. А пока — список моментов, которые точно стоит поймать в кадр.'
          }
        />

        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          {hasPhotos
            ? PHOTOS.slice(0, 4).map((photo, i) => (
                <Reveal key={photo.url} delay={i * 0.06}>
                  <TiltCard max={10} glare>
                    <div className="aspect-[3/4] rounded-3xl relative overflow-hidden">
                      <img src={photo.url} alt={photo.caption} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                    </div>
                  </TiltCard>
                </Reveal>
              ))
            : preview.map((idea, i) => (
                <Reveal key={idea.caption} delay={i * 0.06}>
                  <TiltCard max={10} glare>
                    <div
                      className={`group aspect-[3/4] rounded-3xl bg-gradient-to-br ${TONE_CLASSES[idea.tone]} flex items-end p-4 relative overflow-hidden`}
                    >
                      <Camera className="absolute top-4 left-4 w-4 h-4 text-white/70" />
                      <p className="relative text-white text-xs sm:text-sm font-medium leading-snug">{idea.caption}</p>
                    </div>
                  </TiltCard>
                </Reveal>
              ))}
        </div>

        <Reveal delay={0.2}>
          <Link
            to="/gallery"
            className="mt-10 inline-flex items-center gap-2 text-[#1f2a1d] dark:text-white text-sm font-semibold hover:gap-3 transition-all"
          >
            Смотреть всю галерею
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

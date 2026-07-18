import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronDown, Play, Sparkles } from 'lucide-react';
import BoomerangVideoBg from '../BoomerangVideoBg';
import Countdown from './Countdown';
import TiltCard from './TiltCard';
import TodayCard from './TodayCard';
import FlightProgressCard from './FlightProgressCard';
import { getTripState } from '../trip';

const BG_VIDEO =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260511_131941_d136af49-e243-493a-be14-6ff3f24e09e6.mp4';

const easeOut = [0.22, 1, 0.36, 1] as const;

const TITLE_WORDS: { text: string; accent?: boolean; italic?: boolean }[] = [
  { text: 'Наше' },
  { text: 'маленькое' },
  { text: 'путешествие', accent: true, italic: true },
  { text: 'в', accent: true },
  { text: 'сердце', accent: true },
  { text: 'Казани', accent: true },
];

export default function Hero() {
  const { scrollY } = useScroll();
  const bgScale = useTransform(scrollY, [0, 700], [1, 1.12]);
  const copyY = useTransform(scrollY, [0, 600], [0, 120]);
  const copyOpacity = useTransform(scrollY, [0, 450], [1, 0]);
  const trip = getTripState();

  return (
    <section id="top" className="relative w-full min-h-screen overflow-hidden scroll-mt-16">
      <motion.div className="absolute inset-0" style={{ scale: bgScale }}>
        <BoomerangVideoBg src={BG_VIDEO} className="absolute inset-0 w-full h-full" />
      </motion.div>
      {/* Scrim: guarantees text legibility whether or not the video has loaded */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/15 to-black/60" />

      {/* Hero copy */}
      <motion.div
        style={{ y: copyY, opacity: copyOpacity }}
        className="relative z-10 flex flex-col items-center text-center pt-28 sm:pt-32 md:pt-36 px-4 sm:px-6 pb-56 sm:pb-64"
      >
        <h1
          className="font-normal leading-[1.02] text-white text-[2rem] sm:text-4xl md:text-5xl lg:text-[4.5rem] xl:text-[5rem] max-w-5xl"
          style={{ letterSpacing: '-0.03em' }}
        >
          {TITLE_WORDS.map((word, i) => (
            <motion.span
              key={word.text}
              initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.7, delay: 0.08 * i, ease: easeOut }}
              className={`inline-block mr-[0.28em] ${word.accent ? 'text-[#c7e0cb]' : ''} ${
                word.italic ? 'font-accent font-semibold pr-[0.06em]' : ''
              }`}
            >
              {word.text}
            </motion.span>
          ))}
        </h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.55, ease: easeOut }}
          className="mt-6 sm:mt-8 text-white/90 text-sm sm:text-base md:text-lg leading-relaxed max-w-md px-2"
        >
          {trip.phase === 'before' &&
            'Кремль и Кул-Шариф, прогулки по Баумана, чак-чак и закаты над Волгой — всё это мы увидим вместе.'}
          {trip.phase === 'flight' && 'Уже летим. Через пару часов — Казань.'}
          {trip.phase === 'during' && 'Мы здесь. Кремль, Баумана и чак-чак — всё происходит прямо сейчас.'}
          {trip.phase === 'after' &&
            'Это было прекрасно. Кремль, Баумана, закаты над Казанкой — теперь это наши общие воспоминания.'}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.7, ease: easeOut }}
          className="mt-9 sm:mt-12"
        >
          {trip.phase === 'before' && (
            <TiltCard max={6} glare>
              <Countdown />
            </TiltCard>
          )}
          {trip.phase === 'flight' && (
            <TiltCard max={6} glare>
              <FlightProgressCard />
            </TiltCard>
          )}
          {trip.phase === 'during' && (
            <TiltCard max={6} glare>
              <TodayCard day={trip.day} />
            </TiltCard>
          )}
          {trip.phase === 'after' && (
            <Link
              to="/gallery"
              className="inline-flex items-center gap-2 bg-white hover:bg-white/90 text-[#1f2a1d] text-sm font-semibold px-7 py-3.5 rounded-full transition-all hover:scale-[1.03] active:scale-[0.98] shadow-lg"
            >
              Смотреть наши фото ♥
            </Link>
          )}
        </motion.div>
      </motion.div>

      {/* Bottom-left CTA block */}
      <div className="absolute left-4 right-4 sm:right-auto sm:left-6 md:left-10 bottom-6 sm:bottom-8 md:bottom-10 z-10 max-w-sm">
        <div className="flex items-center gap-2 text-white/95 mb-3">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">
            Только ты и я<sup className="text-[10px]">♥</sup>
          </span>
        </div>
        <p className="text-white/85 text-xs leading-relaxed mb-6 max-w-xs">
          Пять дней вдвоём, 24–28 июля: старый город, набережная Казанки, татарская кухня и места, которые запомнятся
          только нам.
        </p>
        <div className="flex items-center gap-4 flex-wrap">
          <Link
            to="/#route"
            className="bg-white hover:bg-white/90 text-[#1f2a1d] text-sm font-semibold px-6 py-3 rounded-full transition-all hover:scale-[1.03] active:scale-[0.98] shadow-sm"
          >
            Смотреть план
          </Link>
          <Link to="/#food" className="text-white text-sm font-medium hover:opacity-80 transition-opacity">
            Где поесть?
          </Link>
        </div>
      </div>

      {/* Scroll hint */}
      <motion.div
        style={{ opacity: copyOpacity }}
        className="hidden sm:flex absolute left-1/2 -translate-x-1/2 bottom-8 z-10 flex-col items-center gap-1 text-white/60"
      >
        <span className="text-[10px] uppercase tracking-[0.25em]">листай</span>
        <motion.span animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}>
          <ChevronDown className="w-4 h-4" />
        </motion.span>
      </motion.div>

      {/* Bottom-right video link */}
      <Link
        to="/#memories"
        className="hidden sm:flex absolute right-6 md:right-10 bottom-8 md:bottom-10 z-10 items-center gap-2 text-white/90 text-sm hover:text-white transition-colors"
      >
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm">
          <Play className="w-3 h-3 fill-white text-white ml-0.5" />
        </span>
        <span className="font-medium">Что нас ждёт?</span>
      </Link>
    </section>
  );
}

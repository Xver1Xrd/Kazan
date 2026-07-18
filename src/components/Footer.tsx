import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Plane } from 'lucide-react';
import { TRIP } from '../data';

export default function Footer() {
  const navigate = useNavigate();
  const taps = useRef<number[]>([]);

  // Тройной тап по сердечку в течение секунды открывает секретную страницу.
  const onHeartClick = () => {
    const now = Date.now();
    taps.current = [...taps.current.filter((t) => now - t < 1000), now];
    if (taps.current.length >= 3) {
      taps.current = [];
      navigate('/secret');
    }
  };

  return (
    <footer className="relative px-4 sm:px-6 md:px-10 pt-16 pb-10 bg-[#141f17] text-white overflow-hidden">
      <div
        aria-hidden
        className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[36rem] h-[36rem] rounded-full bg-[#4b7a5a]/20 blur-3xl pointer-events-none"
      />
      <div className="relative max-w-4xl mx-auto text-center">
        <p className="text-3xl sm:text-5xl font-normal" style={{ letterSpacing: '-0.02em' }}>
          До встречи, <span className="font-accent font-semibold text-[#c7e0cb]">Казань</span>
        </p>

        <div className="mt-8 flex items-center justify-center gap-4 text-white/70 text-sm font-semibold">
          <span>LED</span>
          <span className="relative w-24 sm:w-40 pass-tear">
            <Plane className="plane-drift w-3.5 h-3.5 text-white/80 absolute -translate-x-1/2 -translate-y-1/2 top-1/2" />
          </span>
          <span>KZN</span>
        </div>
        <p className="mt-3 text-xs text-white/50">
          {new Date(TRIP.departISO).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', timeZone: 'Europe/Moscow' })}
          {' — '}
          {new Date(TRIP.returnISO).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', timeZone: 'Europe/Moscow' })}
        </p>

        <p className="mt-10 flex items-center justify-center gap-1.5 text-xs text-white/40">
          Казань, 2026 — маленькое путешествие вдвоём
          <span onClick={onHeartClick} className="inline-flex select-none">
            <Heart className="w-3 h-3 fill-[#a9cbad] text-[#a9cbad]" />
          </span>
        </p>
      </div>
    </footer>
  );
}

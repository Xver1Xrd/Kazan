import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { MoveRight, Plane, Timer } from 'lucide-react';
import Reveal from './Reveal';
import FloatingDecor from './FloatingDecor';

const FlightGlobe = lazy(() => import('./FlightGlobe'));

const STATS = [
  { icon: Plane, label: 'вылет — посадка', value: '12:25 → 14:30' },
  { icon: Timer, label: 'в воздухе', value: '≈ 2 ч 05 мин' },
  { icon: MoveRight, label: 'по прямой', value: '≈ 1200 км' },
];

export default function FlightSection() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [showGlobe, setShowGlobe] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShowGlobe(true);
          io.disconnect();
        }
      },
      { rootMargin: '300px' }
    );
    io.observe(host);
    return () => io.disconnect();
  }, []);

  return (
    <section className="relative px-4 sm:px-6 md:px-10 py-20 sm:py-28 bg-[#101c14] text-white overflow-hidden">
      <FloatingDecor emoji="☁️" className="top-24 left-[6%]" speed={60} />
      <FloatingDecor emoji="✈️" className="bottom-32 right-[7%]" speed={80} />
      <span
        aria-hidden
        className="absolute top-8 right-4 sm:right-10 text-[6rem] sm:text-[9rem] font-extrabold leading-none text-white/[0.04] select-none pointer-events-none"
        style={{ fontFamily: "'Manrope', sans-serif" }}
      >
        00
      </span>

      <div className="relative max-w-6xl mx-auto">
        <Reveal>
          <span className="text-sm font-semibold text-[#a9cbad] uppercase tracking-[0.18em]">Перелёт</span>
          <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-normal max-w-2xl" style={{ letterSpacing: '-0.02em' }}>
            Сначала — <span className="font-accent font-semibold text-[#c7e0cb]">небо</span>
          </h2>
          <p className="mt-4 text-white/60 max-w-xl">
            Два часа над Волгой — и мы на месте. Глобус можно покрутить мышкой: маленькая точка уже летит наш маршрут.
          </p>
        </Reveal>

        <div ref={hostRef} className="mt-6 h-[380px] sm:h-[480px] cursor-grab active:cursor-grabbing">
          {showGlobe && (
            <Suspense fallback={<div className="w-full h-full" />}>
              <FlightGlobe />
            </Suspense>
          )}
        </div>

        <Reveal>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-5 py-4"
              >
                <stat.icon className="w-4 h-4 text-[#a9cbad] flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold">{stat.value}</p>
                  <p className="text-[11px] uppercase tracking-wider text-white/50 mt-0.5">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

import { Link } from 'react-router-dom';
import { MapPin, ArrowRight } from 'lucide-react';
import { MAP_LOCATIONS } from '../data';
import Reveal from './Reveal';

export default function MapTeaser() {
  return (
    <section className="relative px-4 sm:px-6 md:px-10 py-20 sm:py-28 bg-[#f6f8f5] dark:bg-[#14231a]">
      <div className="max-w-5xl mx-auto">
        <Reveal>
          <span className="text-sm font-semibold text-[#4b7a5a] dark:text-[#a9cbad] uppercase tracking-wide">Карта</span>
          <h2
            className="mt-3 text-3xl sm:text-4xl md:text-5xl font-normal text-[#1f2a1d] dark:text-white max-w-2xl"
            style={{ letterSpacing: '-0.02em' }}
          >
            Где всё это находится
          </h2>
          <p className="mt-4 text-[#4b5b47] dark:text-white/60 max-w-xl">
            Все ключевые точки маршрута — центр компактный, большую часть можно обойти пешком. Открой интерактивную карту,
            чтобы увидеть их вместе.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {MAP_LOCATIONS.slice(0, 4).map((location, i) => (
            <Reveal key={location.name} delay={i * 0.06}>
              <div className="flex items-start gap-3 bg-white dark:bg-white/5 rounded-2xl p-5 shadow-sm border border-black/5 dark:border-white/10">
                <MapPin className="w-5 h-5 text-[#4b7a5a] dark:text-[#a9cbad] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-[#1f2a1d] dark:text-white">{location.name}</p>
                  <p className="text-xs text-[#4b5b47] dark:text-white/50 mt-1">{location.area}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2}>
          <Link
            to="/map"
            className="mt-10 inline-flex items-center gap-2 bg-[#1f2a1d] hover:bg-[#2a3827] dark:bg-white dark:text-[#1f2a1d] text-white text-sm font-semibold px-6 py-3 rounded-full transition-colors"
          >
            Открыть интерактивную карту
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

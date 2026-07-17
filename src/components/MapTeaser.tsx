import { Link } from 'react-router-dom';
import { MapPin, ArrowRight } from 'lucide-react';
import { MAP_LOCATIONS } from '../data';
import Reveal from './Reveal';
import SectionHeading from './SectionHeading';

export default function MapTeaser() {
  return (
    <section className="relative px-4 sm:px-6 md:px-10 py-20 sm:py-28 bg-[#f6f8f5] dark:bg-[#14231a]">
      <div className="max-w-6xl mx-auto">
        <SectionHeading
          number="06"
          label="Карта"
          title={
            <>
              Где всё это <span className="font-accent font-semibold text-[#4b7a5a] dark:text-[#a9cbad]">находится</span>
            </>
          }
          text="Все ключевые точки маршрута — центр компактный, большую часть можно обойти пешком. Открой интерактивную карту, чтобы увидеть их вместе."
        />

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {MAP_LOCATIONS.slice(0, 4).map((location, i) => (
            <Reveal key={location.name} delay={i * 0.06}>
              <div className="group flex items-start gap-3 bg-white dark:bg-white/5 rounded-2xl p-5 shadow-sm border border-black/5 dark:border-white/10 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
                <MapPin className="w-5 h-5 text-[#4b7a5a] dark:text-[#a9cbad] mt-0.5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />
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
            className="mt-10 inline-flex items-center gap-2 bg-[#1f2a1d] hover:bg-[#2a3827] dark:bg-white dark:text-[#1f2a1d] text-white text-sm font-semibold px-6 py-3 rounded-full transition-all hover:scale-[1.03] active:scale-[0.98]"
          >
            Открыть интерактивную карту
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

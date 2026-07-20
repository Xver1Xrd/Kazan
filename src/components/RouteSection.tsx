import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ROUTE_DAYS } from '../data';
import Reveal from './Reveal';
import SectionHeading from './SectionHeading';
import TiltCard from './TiltCard';
import WeatherStrip from './WeatherStrip';

export default function RouteSection() {
  return (
    <section id="route" className="relative scroll-mt-20 px-4 sm:px-6 md:px-10 py-20 sm:py-28 bg-white dark:bg-[#0e1712]">
      <div className="max-w-6xl mx-auto">
        <SectionHeading
          number="01"
          label="Маршрут"
          title={
            <>
              Наш план, <span className="font-accent font-semibold text-[#4b7a5a] dark:text-[#a9cbad]">шаг за шагом</span>
            </>
          }
          text="Все пять дней расписаны, от прилёта до обратного рейса: Кремль, слобода, аквапарк, ужины и закаты — каждый день со своей программой."
        />

        <WeatherStrip />

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {ROUTE_DAYS.map((day, i) => (
            <Reveal key={day.slug} delay={(i % 3) * 0.08} className="h-full">
              <TiltCard max={5}>
              <Link
                to={`/route/${day.slug}`}
                className="group relative flex flex-col h-full rounded-3xl border border-black/5 dark:border-white/10 bg-[#fbfcfa] dark:bg-white/[0.03] p-7 overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-[#1f2a1d]/10 dark:hover:shadow-black/40 hover:border-[#4b7a5a]/30"
              >
                <span className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#4b7a5a] via-[#85AB8B] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span
                  aria-hidden
                  className="absolute -top-5 -right-2 text-[5.5rem] font-extrabold leading-none text-[#1f2a1d]/[0.05] dark:text-white/[0.05] select-none transition-transform duration-300 group-hover:scale-110"
                  style={{ fontFamily: "'Manrope', sans-serif" }}
                >
                  {i + 1}
                </span>

                <span className="text-xs font-semibold text-[#4b7a5a] dark:text-[#a9cbad] uppercase tracking-[0.15em]">
                  {day.day}
                </span>
                <h3 className="text-xl font-semibold text-[#1f2a1d] dark:text-white mt-2 mb-2">{day.title}</h3>
                <p className="text-sm text-[#4b5b47] dark:text-white/60 mb-6">{day.summary}</p>

                <ol className="flex flex-col gap-4 border-l border-[#1f2a1d]/10 dark:border-white/10 pl-5 mb-6">
                  {day.stops.map((stop) => (
                    <li key={stop.title} className="relative">
                      <span className="absolute -left-[1.45rem] top-1 w-2 h-2 rounded-full bg-[#4b7a5a] dark:bg-[#a9cbad]" />
                      <span className="text-[11px] font-semibold text-[#4b7a5a] dark:text-[#a9cbad] uppercase tracking-wide">
                        {stop.time}
                      </span>
                      <p className="text-sm font-semibold text-[#1f2a1d] dark:text-white mt-0.5">{stop.title}</p>
                    </li>
                  ))}
                </ol>

                <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-[#1f2a1d] dark:text-white">
                  Подробнее
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </Link>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ROUTE_DAYS } from '../data';
import Reveal from './Reveal';

export default function RouteSection() {
  return (
    <section id="route" className="relative scroll-mt-20 px-4 sm:px-6 md:px-10 py-20 sm:py-28 bg-white dark:bg-[#0e1712]">
      <div className="max-w-5xl mx-auto">
        <Reveal>
          <span className="text-sm font-semibold text-[#4b7a5a] dark:text-[#a9cbad] uppercase tracking-wide">Маршрут</span>
          <h2
            className="mt-3 text-3xl sm:text-4xl md:text-5xl font-normal text-[#1f2a1d] dark:text-white max-w-2xl"
            style={{ letterSpacing: '-0.02em' }}
          >
            Наш план, шаг за шагом
          </h2>
          <p className="mt-4 text-[#4b5b47] dark:text-white/60 max-w-xl">
            Все пять дней, от прилёта до обратного рейса. Первый день расписан точно, остальные — черновик, который легко
            двигать: захотелось задержаться — сдвигаем и никуда не спешим.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {ROUTE_DAYS.map((day, i) => (
            <Reveal key={day.slug} delay={i * 0.1} className="flex flex-col">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-sm font-semibold text-[#4b7a5a] dark:text-[#a9cbad]">{day.day}</span>
              </div>
              <h3 className="text-xl font-semibold text-[#1f2a1d] dark:text-white mb-2">{day.title}</h3>
              <p className="text-sm text-[#4b5b47] dark:text-white/60 mb-6">{day.summary}</p>

              <ol className="flex flex-col gap-5 border-l border-[#1f2a1d]/10 dark:border-white/10 pl-5">
                {day.stops.map((stop) => (
                  <li key={stop.title} className="relative">
                    <span className="absolute -left-[1.45rem] top-1 w-2 h-2 rounded-full bg-[#4b7a5a] dark:bg-[#a9cbad]" />
                    <span className="text-xs font-semibold text-[#4b7a5a] dark:text-[#a9cbad] uppercase tracking-wide">
                      {stop.time}
                    </span>
                    <p className="text-sm font-semibold text-[#1f2a1d] dark:text-white mt-0.5">{stop.title}</p>
                    <p className="text-sm text-[#4b5b47] dark:text-white/60 mt-1 leading-relaxed">{stop.description}</p>
                  </li>
                ))}
              </ol>

              <Link
                to={`/route/${day.slug}`}
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#1f2a1d] dark:text-white hover:gap-2.5 transition-all"
              >
                Подробнее
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

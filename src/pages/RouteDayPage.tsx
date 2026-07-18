import { Link, useParams, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Lightbulb } from 'lucide-react';
import { ROUTE_DAYS } from '../data';

export default function RouteDayPage() {
  const { slug } = useParams();
  const index = ROUTE_DAYS.findIndex((d) => d.slug === slug);
  if (index === -1) return <Navigate to="/#route" replace />;

  const day = ROUTE_DAYS[index];
  const prev = ROUTE_DAYS[index - 1];
  const next = ROUTE_DAYS[index + 1];

  return (
    <motion.main
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen pt-28 sm:pt-32 pb-20 sm:pb-28 px-4 sm:px-6 md:px-10 bg-white dark:bg-[#0e1712]"
    >
      <div className="max-w-3xl mx-auto">
        <Link
          to="/#route"
          className="flex w-fit items-center gap-1.5 text-sm font-medium text-[#4b5b47] dark:text-white/60 hover:text-[#1f2a1d] dark:hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Весь маршрут
        </Link>

        <span className="text-sm font-semibold text-[#4b7a5a] dark:text-[#a9cbad] uppercase tracking-wide">{day.day}</span>
        <h1
          className="mt-3 text-3xl sm:text-4xl md:text-5xl font-normal text-[#1f2a1d] dark:text-white"
          style={{ letterSpacing: '-0.02em' }}
        >
          {day.title}
        </h1>
        <p className="mt-4 text-[#4b5b47] dark:text-white/60 max-w-xl">{day.summary}</p>

        <ol className="mt-12 flex flex-col gap-8 border-l border-[#1f2a1d]/10 dark:border-white/10 pl-6">
          {day.stops.map((stop) => (
            <li key={stop.title} className="relative">
              <span className="absolute -left-[1.65rem] top-1.5 w-2.5 h-2.5 rounded-full bg-[#4b7a5a] dark:bg-[#a9cbad]" />
              <span className="text-xs font-semibold text-[#4b7a5a] dark:text-[#a9cbad] uppercase tracking-wide">
                {stop.time}
              </span>
              <p className="text-lg font-semibold text-[#1f2a1d] dark:text-white mt-1">{stop.title}</p>
              <p className="text-sm text-[#4b5b47] dark:text-white/60 mt-2 leading-relaxed">{stop.description}</p>
            </li>
          ))}
        </ol>

        <div className="mt-12 flex items-start gap-3 bg-[#f6f8f5] dark:bg-white/5 rounded-2xl p-5 border border-black/5 dark:border-white/10">
          <Lightbulb className="w-5 h-5 text-[#4b7a5a] dark:text-[#a9cbad] flex-shrink-0 mt-0.5" />
          <p className="text-sm text-[#4b5b47] dark:text-white/70 leading-relaxed">{day.tip}</p>
        </div>

        <div className="mt-14 flex items-center justify-between border-t border-black/5 dark:border-white/10 pt-6">
          {prev ? (
            <Link
              to={`/route/${prev.slug}`}
              className="flex items-center gap-1.5 text-sm font-medium text-[#4b5b47] dark:text-white/60 hover:text-[#1f2a1d] dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {prev.day}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              to={`/route/${next.slug}`}
              className="flex items-center gap-1.5 text-sm font-medium text-[#1f2a1d] dark:text-white hover:gap-2.5 transition-all"
            >
              {next.day}
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              to="/gallery"
              className="flex items-center gap-1.5 text-sm font-medium text-[#1f2a1d] dark:text-white hover:gap-2.5 transition-all"
            >
              К галерее
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    </motion.main>
  );
}

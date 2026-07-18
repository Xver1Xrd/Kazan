import { Link } from 'react-router-dom';
import { ArrowRight, MapPin } from 'lucide-react';
import { ROUTE_DAYS } from '../data';

/** Shown in the hero while the trip is in progress. */
export default function TodayCard({ day }: { day: number }) {
  const plan = ROUTE_DAYS[day - 1];
  if (!plan) return null;

  return (
    <div className="w-[min(92vw,26rem)] rounded-3xl bg-[#101c14]/70 backdrop-blur-md border border-white/15 shadow-2xl shadow-black/30 text-left overflow-hidden">
      <div className="px-6 pt-5 pb-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-wider text-[#a9cbad] font-semibold">
            Мы в Казани · день {day} из {ROUTE_DAYS.length}
          </span>
          <MapPin className="w-4 h-4 text-[#a9cbad]" />
        </div>
        <p className="text-xl sm:text-2xl font-bold text-white mt-2 leading-tight">{plan.title}</p>
      </div>

      <div className="pass-tear w-full" />

      <div className="px-6 pt-4 pb-5">
        <ul className="flex flex-col gap-2">
          {plan.stops.map((stop) => (
            <li key={stop.title} className="flex items-baseline gap-3 text-sm">
              <span className="text-[11px] uppercase tracking-wide text-white/50 w-20 flex-shrink-0">{stop.time}</span>
              <span className="text-white/90">{stop.title}</span>
            </li>
          ))}
        </ul>
        <Link
          to={`/route/${plan.slug}`}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#c7e0cb] hover:gap-2.5 transition-all"
        >
          План на сегодня
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

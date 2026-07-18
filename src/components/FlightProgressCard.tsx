import { useEffect, useState } from 'react';
import { Plane } from 'lucide-react';
import { TRIP } from '../data';
import { getTripState } from '../trip';

function minutesLeft(progress: number) {
  const depart = new Date(TRIP.departISO).getTime();
  const arrive = new Date(TRIP.arriveISO).getTime();
  return Math.max(0, Math.ceil(((1 - progress) * (arrive - depart)) / 60_000));
}

/** Shown in the hero while the outbound flight is in the air. */
export default function FlightProgressCard() {
  const [state, setState] = useState(() => getTripState());

  useEffect(() => {
    const id = setInterval(() => setState(getTripState()), 1000);
    return () => clearInterval(id);
  }, []);

  const progress = state.flightProgress;
  const left = minutesLeft(progress);

  return (
    <div className="w-[min(92vw,26rem)] rounded-3xl bg-[#101c14]/70 backdrop-blur-md border border-white/15 shadow-2xl shadow-black/30 text-left overflow-hidden">
      <div className="px-6 pt-5 pb-4">
        <div className="flex items-center justify-between text-white">
          <div>
            <p className="text-2xl sm:text-3xl font-bold tracking-tight leading-none">LED</p>
            <p className="text-[11px] text-white/60 mt-1">{TRIP.from}</p>
          </div>
          <span className="text-[11px] uppercase tracking-wider text-[#a9cbad] font-semibold animate-pulse">
            В воздухе
          </span>
          <div className="text-right">
            <p className="text-2xl sm:text-3xl font-bold tracking-tight leading-none">KZN</p>
            <p className="text-[11px] text-white/60 mt-1">{TRIP.to}</p>
          </div>
        </div>

        {/* Progress track */}
        <div className="relative mt-5 h-6">
          <div className="absolute top-1/2 -translate-y-1/2 w-full pass-tear" />
          <div
            className="absolute top-1/2 -translate-y-1/2 h-[2px] bg-[#c7e0cb] transition-[width] duration-1000"
            style={{ width: `${progress * 100}%` }}
          />
          <Plane
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 text-white transition-[left] duration-1000"
            style={{ left: `${progress * 100}%` }}
          />
        </div>
      </div>

      <div className="pass-tear w-full" />

      <div className="px-6 pt-4 pb-5 flex items-center justify-between">
        <span className="text-sm text-white/80">
          {left > 0 ? (
            <>
              Осталось <span className="font-semibold text-white tabular-nums">{left} мин</span>
            </>
          ) : (
            'Заходим на посадку'
          )}
        </span>
        <span className="text-[11px] text-white/50">посадка в 14:30 МСК</span>
      </div>
    </div>
  );
}

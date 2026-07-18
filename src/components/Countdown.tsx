import { useEffect, useRef, useState } from 'react';
import { Plane } from 'lucide-react';
import { TRIP } from '../data';
import { celebrate } from '../trip';

function getTimeLeft(target: number) {
  const diff = Math.max(0, target - Date.now());
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);
  return { days, hours, minutes, seconds, done: diff === 0 };
}

const UNITS: { key: 'days' | 'hours' | 'minutes' | 'seconds'; label: string }[] = [
  { key: 'days', label: 'дней' },
  { key: 'hours', label: 'часов' },
  { key: 'minutes', label: 'минут' },
  { key: 'seconds', label: 'секунд' },
];

function msk(iso: string, opts: Intl.DateTimeFormatOptions) {
  return new Date(iso).toLocaleString('ru-RU', { ...opts, timeZone: 'Europe/Moscow' });
}

export default function Countdown() {
  const target = new Date(TRIP.departISO).getTime();
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(target));
  const wasDone = useRef(timeLeft.done);

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(getTimeLeft(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  // Fire confetti the moment the countdown hits zero with the page open
  // (not when the page is merely opened after departure).
  useEffect(() => {
    if (timeLeft.done && !wasDone.current) {
      celebrate();
    }
    wasDone.current = timeLeft.done;
  }, [timeLeft.done]);

  return (
    <div className="w-[min(92vw,26rem)] rounded-3xl bg-[#101c14]/70 backdrop-blur-md border border-white/15 shadow-2xl shadow-black/30 text-left overflow-hidden">
      {/* Route strip */}
      <div className="px-6 pt-5 pb-4">
        <div className="flex items-center justify-between text-white">
          <div>
            <p className="text-2xl sm:text-3xl font-bold tracking-tight leading-none">LED</p>
            <p className="text-[11px] text-white/60 mt-1">{TRIP.from}</p>
          </div>
          <div className="flex-1 mx-4 relative flex items-center">
            <span className="w-full pass-tear" />
            <Plane className="w-4 h-4 text-white/90 absolute left-1/2 -translate-x-1/2 -translate-y-px bg-transparent rotate-0" />
          </div>
          <div className="text-right">
            <p className="text-2xl sm:text-3xl font-bold tracking-tight leading-none">KZN</p>
            <p className="text-[11px] text-white/60 mt-1">{TRIP.to}</p>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 text-[11px] uppercase tracking-wider text-white/70 font-semibold">
          <span>{msk(TRIP.departISO, { hour: '2-digit', minute: '2-digit' })}</span>
          <span>{msk(TRIP.departISO, { day: 'numeric', month: 'long' })} · МСК</span>
          <span>{msk(TRIP.arriveISO, { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      <div className="pass-tear w-full" />

      {/* Countdown */}
      <div className="px-6 pt-4 pb-5">
        {timeLeft.done ? (
          <p className="text-sm font-medium text-white">Мы уже в пути — или уже там ✈</p>
        ) : (
          <div className="flex items-center justify-between gap-2">
            {UNITS.map((unit) => (
              <div key={unit.key} className="flex flex-col items-center flex-1">
                <span className="text-2xl sm:text-3xl font-bold tabular-nums text-white leading-none">
                  {String(timeLeft[unit.key]).padStart(2, '0')}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-white/50 mt-1.5">{unit.label}</span>
              </div>
            ))}
          </div>
        )}
        <p className="mt-4 text-[11px] text-white/55 text-center">
          Обратно — {msk(TRIP.returnISO, { day: 'numeric', month: 'long' })} в{' '}
          {msk(TRIP.returnISO, { hour: '2-digit', minute: '2-digit' })} из Казани
        </p>
      </div>
    </div>
  );
}

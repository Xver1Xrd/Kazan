import { useEffect, useState } from 'react';
import { Plane } from 'lucide-react';
import { TRIP } from '../data';

function getTimeLeft(target: number) {
  const diff = Math.max(0, target - Date.now());
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);
  return { days, hours, minutes, seconds, done: diff === 0 };
}

const UNITS: { key: keyof ReturnType<typeof getTimeLeft>; label: string }[] = [
  { key: 'days', label: 'дней' },
  { key: 'hours', label: 'часов' },
  { key: 'minutes', label: 'минут' },
  { key: 'seconds', label: 'секунд' },
];

type Props = {
  variant?: 'light' | 'dark';
};

export default function Countdown({ variant = 'light' }: Props) {
  const target = new Date(TRIP.departISO).getTime();
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(target));

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(getTimeLeft(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const textTone = variant === 'light' ? 'text-white' : 'text-[#1f2a1d] dark:text-white';
  const subTone = variant === 'light' ? 'text-white/70' : 'text-[#4b5b47] dark:text-white/60';
  const cardTone =
    variant === 'light' ? 'bg-white/10 border-white/20' : 'bg-[#f6f8f5] dark:bg-white/5 border-black/5 dark:border-white/10';

  if (timeLeft.done) {
    return <p className={`text-sm font-medium ${textTone}`}>Мы уже в пути — или уже там ✈</p>;
  }

  return (
    <div>
      <div className={`flex items-center gap-2 text-xs uppercase tracking-wide font-semibold mb-3 ${subTone}`}>
        <Plane className="w-3.5 h-3.5" />
        <span>
          {TRIP.from} → {TRIP.to},{' '}
          {new Date(TRIP.departISO).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            timeZone: 'Europe/Moscow',
          })}{' '}
          в{' '}
          {new Date(TRIP.departISO).toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Europe/Moscow',
          })}{' '}
          (МСК)
        </span>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        {UNITS.map((unit) => (
          <div key={unit.key} className={`flex flex-col items-center rounded-2xl px-3 sm:px-4 py-2 sm:py-3 border ${cardTone}`}>
            <span className={`text-xl sm:text-3xl font-semibold tabular-nums ${textTone}`}>
              {String(timeLeft[unit.key]).padStart(2, '0')}
            </span>
            <span className={`text-[10px] sm:text-xs mt-0.5 ${subTone}`}>{unit.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

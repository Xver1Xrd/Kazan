import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Droplets } from 'lucide-react';
import Reveal from './Reveal';

const API =
  'https://api.open-meteo.com/v1/forecast?latitude=55.79&longitude=49.11' +
  '&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code' +
  '&timezone=Europe%2FMoscow&start_date=2026-07-24&end_date=2026-07-28';

type DayForecast = {
  date: string;
  tMax: number;
  tMin: number;
  rain: number;
  code: number;
};

function describe(code: number): { emoji: string; label: string } {
  if (code === 0) return { emoji: '☀️', label: 'ясно' };
  if (code <= 2) return { emoji: '🌤️', label: 'переменная' };
  if (code === 3) return { emoji: '☁️', label: 'пасмурно' };
  if (code <= 48) return { emoji: '🌫️', label: 'туман' };
  if (code <= 57) return { emoji: '🌦️', label: 'морось' };
  if (code <= 67) return { emoji: '🌧️', label: 'дождь' };
  if (code <= 77) return { emoji: '🌨️', label: 'снег' };
  if (code <= 82) return { emoji: '🌦️', label: 'ливни' };
  return { emoji: '⛈️', label: 'гроза' };
}

export default function WeatherStrip() {
  const [days, setDays] = useState<DayForecast[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(API)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data) => {
        if (cancelled || !data?.daily?.time) return;
        const result: DayForecast[] = data.daily.time.map((date: string, i: number) => ({
          date,
          tMax: Math.round(data.daily.temperature_2m_max[i]),
          tMin: Math.round(data.daily.temperature_2m_min[i]),
          rain: data.daily.precipitation_probability_max?.[i] ?? 0,
          code: data.daily.weather_code[i],
        }));
        setDays(result);
      })
      .catch(() => {
        // Forecast unavailable (offline, dates out of range, API down) — the strip just doesn't render.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!days) return null;

  return (
    <Reveal className="mt-10">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {days.map((day, i) => {
          const w = describe(day.code);
          const label = new Date(`${day.date}T12:00:00`).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short',
            weekday: 'short',
          });
          return (
            <motion.div
              key={day.date}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center rounded-2xl border border-black/5 dark:border-white/10 bg-[#fbfcfa] dark:bg-white/[0.03] px-3 py-4 text-center transition-transform duration-300 hover:-translate-y-1"
            >
              <span className="text-[11px] uppercase tracking-wider text-[#4b5b47] dark:text-white/50">{label}</span>
              <span className="text-2xl mt-2" title={w.label}>
                {w.emoji}
              </span>
              <span className="text-sm font-semibold text-[#1f2a1d] dark:text-white mt-2">
                {day.tMax}° <span className="text-[#4b5b47] dark:text-white/40 font-normal">/ {day.tMin}°</span>
              </span>
              <span className="flex items-center gap-1 text-[11px] text-[#4b5b47] dark:text-white/50 mt-1">
                <Droplets className="w-3 h-3" />
                {day.rain}%
              </span>
            </motion.div>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-[#4b5b47]/70 dark:text-white/30 text-right">
        Прогноз для Казани · Open-Meteo
      </p>
    </Reveal>
  );
}

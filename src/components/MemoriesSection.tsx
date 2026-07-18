import { useEffect, useRef, useState } from 'react';
import { Heart } from 'lucide-react';
import Reveal from './Reveal';
import { celebrate } from '../trip';

const PLANS = [
  'Подняться на смотровую Кремля и найти слияние Казанки и Волги',
  'Съесть чак-чак на Баумана и вынести вердикт',
  'Сфотографироваться у бронзового дерева Дворца земледельцев',
  'Встретить закат на набережной Казанки',
  'Потереть нос казанскому коту на удачу',
  'Дойти до центра «Казан», когда включат подсветку',
];

const STORAGE_KEY = 'kazan-plans-done';

function loadDone(): boolean[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return PLANS.map((_, i) => Array.isArray(raw) && raw[i] === true);
  } catch {
    return PLANS.map(() => false);
  }
}

export default function MemoriesSection() {
  const [done, setDone] = useState<boolean[]>(loadDone);
  const completedCount = done.filter(Boolean).length;
  const allDoneBefore = useRef(completedCount === PLANS.length);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(done));
    const allDone = done.every(Boolean);
    if (allDone && !allDoneBefore.current) {
      celebrate();
    }
    allDoneBefore.current = allDone;
  }, [done]);

  const toggle = (index: number) => {
    setDone((prev) => prev.map((v, i) => (i === index ? !v : v)));
  };

  return (
    <section
      id="memories"
      className="relative scroll-mt-20 px-4 sm:px-6 md:px-10 py-20 sm:py-28 bg-[#1f2a1d] dark:bg-[#0a120d] text-white overflow-hidden"
    >
      {/* Soft radial glow behind the heading */}
      <div
        aria-hidden
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] rounded-full bg-[#4b7a5a]/25 blur-3xl pointer-events-none"
      />
      <span
        aria-hidden
        className="absolute top-8 right-4 sm:right-10 text-[6rem] sm:text-[9rem] font-extrabold leading-none text-white/[0.04] select-none pointer-events-none"
        style={{ fontFamily: "'Manrope', sans-serif" }}
      >
        03
      </span>

      <div className="relative max-w-3xl mx-auto text-center">
        <Reveal>
          <span className="text-sm font-semibold text-[#a9cbad] uppercase tracking-[0.18em]">Наши планы</span>
          <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-normal" style={{ letterSpacing: '-0.02em' }}>
            Что хотим <span className="font-accent font-semibold text-[#c7e0cb]">успеть</span>
          </h2>
          <p className="mt-4 text-white/70 max-w-xl mx-auto">
            Не расписание, а список. Сделали — отмечаем, прогресс сохраняется на этом устройстве.
          </p>
          <p className="mt-3 text-sm font-semibold text-[#a9cbad] tabular-nums">
            {completedCount === PLANS.length
              ? `Все ${PLANS.length} — поездка удалась`
              : `Готово ${completedCount} из ${PLANS.length}`}
          </p>
        </Reveal>

        <ul className="mt-10 flex flex-col gap-4 text-left max-w-xl mx-auto">
          {PLANS.map((plan, i) => (
            <Reveal key={plan} delay={i * 0.06}>
              <li>
                <button
                  onClick={() => toggle(i)}
                  aria-pressed={done[i]}
                  className={`group w-full flex items-start gap-3 border rounded-2xl px-5 py-4 text-left transition-all duration-300 ${
                    done[i]
                      ? 'bg-[#4b7a5a]/25 border-[#a9cbad]/40'
                      : 'bg-white/5 hover:bg-white/10 border-white/5'
                  }`}
                >
                  <Heart
                    className={`w-4 h-4 mt-1 flex-shrink-0 transition-all duration-300 ${
                      done[i]
                        ? 'text-[#c7e0cb] fill-[#c7e0cb] scale-110'
                        : 'text-[#a9cbad] group-hover:scale-110'
                    }`}
                  />
                  <span
                    className={`text-sm sm:text-base leading-relaxed transition-colors duration-300 ${
                      done[i] ? 'text-white' : 'text-white/90'
                    }`}
                  >
                    {plan}
                  </span>
                </button>
              </li>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

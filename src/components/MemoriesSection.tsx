import { Heart } from 'lucide-react';
import Reveal from './Reveal';

const PLANS = [
  'Взяться за руки на смотровой площадке Кремля и найти взглядом слияние Казанки и Волги',
  'Разделить одну порцию чак-чака на двоих — и поспорить, кому досталось больше',
  'Сфотографироваться у разноцветных домов Старо-Татарской слободы',
  'Дойти до набережной Казанки к закату и остаться там дольше, чем планировали',
  'Загадать желание у башни Сююмбике — говорят, она умеет их исполнять',
];

export default function MemoriesSection() {
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
        04
      </span>

      <div className="relative max-w-3xl mx-auto text-center">
        <Reveal>
          <span className="text-sm font-semibold text-[#a9cbad] uppercase tracking-[0.18em]">Наши планы</span>
          <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-normal" style={{ letterSpacing: '-0.02em' }}>
            Что мы хотим успеть{' '}
            <span className="font-accent font-semibold text-[#c7e0cb]">вдвоём</span>
          </h2>
          <p className="mt-4 text-white/70 max-w-xl mx-auto">
            Не расписание, а список моментов, которые хочется собрать за эти пять дней.
          </p>
        </Reveal>

        <ul className="mt-12 flex flex-col gap-4 text-left max-w-xl mx-auto">
          {PLANS.map((plan, i) => (
            <Reveal key={plan} delay={i * 0.07}>
              <li className="group flex items-start gap-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl px-5 py-4 transition-colors duration-300">
                <Heart className="w-4 h-4 text-[#a9cbad] mt-1 flex-shrink-0 transition-transform duration-300 group-hover:scale-125 group-hover:fill-[#a9cbad]" />
                <span className="text-sm sm:text-base text-white/90 leading-relaxed">{plan}</span>
              </li>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

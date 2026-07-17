import { Heart } from 'lucide-react';

const PLANS = [
  'Взяться за руки на смотровой площадке Кремля и найти взглядом слияние Казанки и Волги',
  'Разделить одну порцию чак-чака на двоих — и поспорить, кому досталось больше',
  'Сфотографироваться у разноцветных домов Старо-Татарской слободы',
  'Дойти до набережной Казанки к закату и остаться там дольше, чем планировали',
  'Загадать желание на острове-граде Свияжск — говорят, места с историей это умеют',
];

export default function MemoriesSection() {
  return (
    <section id="memories" className="relative scroll-mt-20 px-4 sm:px-6 md:px-10 py-20 sm:py-28 bg-[#1f2a1d] text-white">
      <div className="max-w-3xl mx-auto text-center">
        <span className="text-sm font-semibold text-[#a9cbad] uppercase tracking-wide">Наши планы</span>
        <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-normal" style={{ letterSpacing: '-0.02em' }}>
          Что мы хотим успеть вдвоём
        </h2>
        <p className="mt-4 text-white/70 max-w-xl mx-auto">
          Не расписание, а список моментов, которые хочется собрать за эти три дня.
        </p>

        <ul className="mt-12 flex flex-col gap-5 text-left max-w-xl mx-auto">
          {PLANS.map((plan) => (
            <li key={plan} className="flex items-start gap-3 bg-white/5 rounded-xl px-5 py-4">
              <Heart className="w-4 h-4 text-[#a9cbad] mt-1 flex-shrink-0" />
              <span className="text-sm sm:text-base text-white/90 leading-relaxed">{plan}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

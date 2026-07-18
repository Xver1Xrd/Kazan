import { FOOD_DISHES, FOOD_NOTE } from '../data';
import Reveal from './Reveal';
import SectionHeading from './SectionHeading';
import FloatingDecor from './FloatingDecor';

const DISH_EMOJI: Record<string, string> = {
  'Чак-чак': '🍯',
  'Эчпочмак': '🥟',
  'Перемяч': '🥧',
  'Кыстыбый': '🫓',
  'Азу по-татарски': '🍲',
  'Губадия': '🥮',
};

export default function FoodSection() {
  return (
    <section id="food" className="relative scroll-mt-20 px-4 sm:px-6 md:px-10 py-20 sm:py-28 bg-[#f6f8f5] dark:bg-[#14231a] overflow-hidden">
      <FloatingDecor emoji="🍯" className="top-16 right-[8%]" speed={70} />
      <FloatingDecor emoji="🥟" className="bottom-24 left-[5%]" speed={45} />
      <div className="relative max-w-6xl mx-auto">
        <SectionHeading
          number="02"
          label="Где поесть"
          title={
            <>
              Что <span className="font-accent font-semibold text-[#4b7a5a] dark:text-[#a9cbad]">обязательно</span>{' '}
              попробовать
            </>
          }
          text={FOOD_NOTE}
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FOOD_DISHES.map((dish, i) => (
            <Reveal key={dish.name} delay={(i % 3) * 0.08}>
              <div className="group bg-white dark:bg-white/5 rounded-3xl p-7 shadow-sm border border-black/5 dark:border-white/10 h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#1f2a1d]/5 dark:hover:shadow-black/30">
                <span className="inline-block text-2xl mb-3 transition-transform duration-300 group-hover:scale-125 group-hover:-rotate-6">
                  {DISH_EMOJI[dish.name] ?? '🍽'}
                </span>
                <h3 className="text-lg font-semibold text-[#1f2a1d] dark:text-white mb-2">{dish.name}</h3>
                <p className="text-sm text-[#4b5b47] dark:text-white/60 leading-relaxed">{dish.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

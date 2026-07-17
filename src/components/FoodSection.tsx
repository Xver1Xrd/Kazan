import { FOOD_DISHES, FOOD_NOTE } from '../data';

export default function FoodSection() {
  return (
    <section id="food" className="relative scroll-mt-20 px-4 sm:px-6 md:px-10 py-20 sm:py-28 bg-[#f6f8f5]">
      <div className="max-w-5xl mx-auto">
        <span className="text-sm font-semibold text-[#4b7a5a] uppercase tracking-wide">Где поесть</span>
        <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-normal text-[#1f2a1d] max-w-2xl" style={{ letterSpacing: '-0.02em' }}>
          Что обязательно попробовать
        </h2>
        <p className="mt-4 text-[#4b5b47] max-w-xl">{FOOD_NOTE}</p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FOOD_DISHES.map((dish) => (
            <div key={dish.name} className="bg-white rounded-2xl p-6 shadow-sm border border-black/5">
              <h3 className="text-lg font-semibold text-[#1f2a1d] mb-2">{dish.name}</h3>
              <p className="text-sm text-[#4b5b47] leading-relaxed">{dish.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

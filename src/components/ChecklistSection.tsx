import { Check } from 'lucide-react';
import { CHECKLIST } from '../data';

export default function ChecklistSection() {
  return (
    <section id="checklist" className="relative scroll-mt-20 px-4 sm:px-6 md:px-10 py-20 sm:py-28 bg-white">
      <div className="max-w-5xl mx-auto">
        <span className="text-sm font-semibold text-[#4b7a5a] uppercase tracking-wide">Чек-лист</span>
        <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-normal text-[#1f2a1d] max-w-2xl" style={{ letterSpacing: '-0.02em' }}>
          Что возьмём с собой
        </h2>
        <p className="mt-4 text-[#4b5b47] max-w-xl">
          Ничего лишнего — но и без забытого пауэрбанка в последний момент.
        </p>

        <div className="mt-12 grid gap-10 md:grid-cols-3">
          {CHECKLIST.map((group) => (
            <div key={group.category}>
              <h3 className="text-lg font-semibold text-[#1f2a1d] mb-4">{group.category}</h3>
              <ul className="flex flex-col gap-3">
                {group.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-[#4b5b47] leading-relaxed">
                    <Check className="w-4 h-4 text-[#4b7a5a] mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

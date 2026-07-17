import { Check } from 'lucide-react';
import { CHECKLIST } from '../data';
import Reveal from './Reveal';
import SectionHeading from './SectionHeading';

export default function ChecklistSection() {
  return (
    <section id="checklist" className="relative scroll-mt-20 px-4 sm:px-6 md:px-10 py-20 sm:py-28 bg-white dark:bg-[#0e1712]">
      <div className="max-w-6xl mx-auto">
        <SectionHeading
          number="03"
          label="Чек-лист"
          title={
            <>
              Что возьмём <span className="font-accent font-semibold text-[#4b7a5a] dark:text-[#a9cbad]">с собой</span>
            </>
          }
          text="Ничего лишнего — но и без забытого пауэрбанка в последний момент."
        />

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {CHECKLIST.map((group, i) => (
            <Reveal key={group.category} delay={i * 0.1}>
              <div className="h-full rounded-3xl border border-black/5 dark:border-white/10 bg-[#fbfcfa] dark:bg-white/[0.03] p-7">
                <h3 className="text-lg font-semibold text-[#1f2a1d] dark:text-white mb-5">{group.category}</h3>
                <ul className="flex flex-col gap-3">
                  {group.items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-[#4b5b47] dark:text-white/60 leading-relaxed">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#4b7a5a]/10 dark:bg-[#a9cbad]/10 flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-[#4b7a5a] dark:text-[#a9cbad]" />
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

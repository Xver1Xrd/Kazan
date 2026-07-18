import { Plane, TrainFront, Car, Home } from 'lucide-react';
import { TRAVEL_INFO } from '../data';
import Reveal from './Reveal';
import SectionHeading from './SectionHeading';

const ICONS = { plane: Plane, train: TrainFront, car: Car, home: Home };

export default function TravelSection() {
  return (
    <section id="travel" className="relative scroll-mt-20 px-4 sm:px-6 md:px-10 py-20 sm:py-28 bg-white dark:bg-[#0e1712]">
      <div className="max-w-6xl mx-auto">
        <SectionHeading
          number="06"
          label="В дороге"
          title={
            <>
              Полезное <span className="font-accent font-semibold text-[#4b7a5a] dark:text-[#a9cbad]">под рукой</span>
            </>
          }
          text="Всё, что понадобится в аэропорту и по пути. Сайт работает офлайн — эта страница откроется даже без интернета."
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {TRAVEL_INFO.map((item, i) => {
            const Icon = ICONS[item.icon];
            return (
              <Reveal key={item.title} delay={(i % 2) * 0.08}>
                <div className="group h-full rounded-3xl border border-black/5 dark:border-white/10 bg-[#fbfcfa] dark:bg-white/[0.03] p-6 sm:p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#1f2a1d]/5 dark:hover:shadow-black/30">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-[#4b7a5a]/10 dark:bg-[#a9cbad]/10 mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3">
                    <Icon className="w-5 h-5 text-[#4b7a5a] dark:text-[#a9cbad]" />
                  </span>
                  <h3 className="text-lg font-semibold text-[#1f2a1d] dark:text-white mb-2">{item.title}</h3>
                  <ul className="flex flex-col gap-1.5">
                    {item.lines.map((line) => (
                      <li key={line} className="text-sm text-[#4b5b47] dark:text-white/60 leading-relaxed">
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

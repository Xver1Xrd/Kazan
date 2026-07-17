import { ROUTE_DAYS } from '../data';

export default function RouteSection() {
  return (
    <section id="route" className="relative scroll-mt-20 px-4 sm:px-6 md:px-10 py-20 sm:py-28 bg-white">
      <div className="max-w-5xl mx-auto">
        <span className="text-sm font-semibold text-[#4b7a5a] uppercase tracking-wide">Маршрут</span>
        <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-normal text-[#1f2a1d] max-w-2xl" style={{ letterSpacing: '-0.02em' }}>
          Три дня в Казани, шаг за шагом
        </h2>
        <p className="mt-4 text-[#4b5b47] max-w-xl">
          Черновой план, который легко подвинуть — если где-то захочется задержаться подольше, просто сдвигаем вечер на завтра.
        </p>

        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {ROUTE_DAYS.map((day) => (
            <div key={day.day} className="flex flex-col">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-sm font-semibold text-[#4b7a5a]">{day.day}</span>
              </div>
              <h3 className="text-xl font-semibold text-[#1f2a1d] mb-2">{day.title}</h3>
              <p className="text-sm text-[#4b5b47] mb-6">{day.summary}</p>

              <ol className="flex flex-col gap-5 border-l border-[#1f2a1d]/10 pl-5">
                {day.stops.map((stop) => (
                  <li key={stop.title} className="relative">
                    <span className="absolute -left-[1.45rem] top-1 w-2 h-2 rounded-full bg-[#4b7a5a]" />
                    <span className="text-xs font-semibold text-[#4b7a5a] uppercase tracking-wide">{stop.time}</span>
                    <p className="text-sm font-semibold text-[#1f2a1d] mt-0.5">{stop.title}</p>
                    <p className="text-sm text-[#4b5b47] mt-1 leading-relaxed">{stop.description}</p>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

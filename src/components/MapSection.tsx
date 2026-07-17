import { MapPin } from 'lucide-react';
import { MAP_LOCATIONS } from '../data';

export default function MapSection() {
  return (
    <section id="map" className="relative scroll-mt-20 px-4 sm:px-6 md:px-10 py-20 sm:py-28 bg-[#f6f8f5]">
      <div className="max-w-5xl mx-auto">
        <span className="text-sm font-semibold text-[#4b7a5a] uppercase tracking-wide">Карта</span>
        <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-normal text-[#1f2a1d] max-w-2xl" style={{ letterSpacing: '-0.02em' }}>
          Где всё это находится
        </h2>
        <p className="mt-4 text-[#4b5b47] max-w-xl">
          Все ключевые точки маршрута — центр компактный, большую часть можно обойти пешком.
        </p>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {MAP_LOCATIONS.map((location) => (
            <div key={location.name} className="flex items-start gap-3 bg-white rounded-2xl p-5 shadow-sm border border-black/5">
              <MapPin className="w-5 h-5 text-[#4b7a5a] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-[#1f2a1d]">{location.name}</p>
                <p className="text-xs text-[#4b5b47] mt-1">{location.area}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

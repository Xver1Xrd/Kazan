import { useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { motion } from 'framer-motion';
import { DAY_PATHS, MAP_CENTER } from '../data';

function pinIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width: 16px; height: 16px; border-radius: 9999px;
      background: ${color}; border: 2px solid white;
      box-shadow: 0 1px 4px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8],
  });
}

export default function MapPage() {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const visiblePaths = useMemo(
    () => DAY_PATHS.filter((p) => selectedDay === null || p.day === selectedDay),
    [selectedDay]
  );

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen pt-16 bg-white dark:bg-[#0e1712]"
    >
      <div className="px-4 sm:px-6 md:px-10 pt-8 pb-6 max-w-5xl mx-auto">
        <span className="text-sm font-semibold text-[#4b7a5a] dark:text-[#a9cbad] uppercase tracking-wide">Карта</span>
        <h1
          className="mt-3 text-3xl sm:text-4xl md:text-5xl font-normal text-[#1f2a1d] dark:text-white max-w-2xl"
          style={{ letterSpacing: '-0.02em' }}
        >
          Маршрут по дням
        </h1>
        <p className="mt-4 text-[#4b5b47] dark:text-white/60 max-w-xl">
          Каждый день — свой цвет. Выбери день, чтобы посмотреть только его точки, или смотри всё сразу.
        </p>

        {/* Day filter chips */}
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedDay(null)}
            className={`rounded-full px-4 py-2 text-sm font-medium border transition-all ${
              selectedDay === null
                ? 'bg-[#1f2a1d] dark:bg-white text-white dark:text-[#1f2a1d] border-transparent'
                : 'border-black/10 dark:border-white/15 text-[#4b5b47] dark:text-white/70 hover:border-black/30 dark:hover:border-white/40'
            }`}
          >
            Все дни
          </button>
          {DAY_PATHS.map((path) => (
            <button
              key={path.day}
              onClick={() => setSelectedDay(selectedDay === path.day ? null : path.day)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium border transition-all ${
                selectedDay === path.day
                  ? 'bg-[#1f2a1d] dark:bg-white text-white dark:text-[#1f2a1d] border-transparent'
                  : 'border-black/10 dark:border-white/15 text-[#4b5b47] dark:text-white/70 hover:border-black/30 dark:hover:border-white/40'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: path.color }} />
              {path.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[60vh] sm:h-[70vh] w-full">
        <MapContainer center={MAP_CENTER} zoom={10} scrollWheelZoom className="w-full h-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {visiblePaths.map((path) => (
            <Polyline
              key={path.day}
              positions={path.points.map((p) => [p.lat, p.lng] as [number, number])}
              pathOptions={{ color: path.color, weight: 3, dashArray: '6 8', opacity: selectedDay ? 0.9 : 0.55 }}
            />
          ))}
          {visiblePaths.flatMap((path) =>
            path.points.map((point) => (
              <Marker key={`${path.day}-${point.name}`} position={[point.lat, point.lng]} icon={pinIcon(path.color)}>
                <Popup>
                  <strong>{point.name}</strong>
                  <br />
                  {path.label}
                </Popup>
              </Marker>
            ))
          )}
        </MapContainer>
      </div>

      <div className="px-4 sm:px-6 md:px-10 py-10 max-w-5xl mx-auto flex flex-col gap-6">
        {visiblePaths.map((path) => (
          <div key={path.day}>
            <p className="flex items-center gap-2 text-sm font-semibold text-[#1f2a1d] dark:text-white mb-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: path.color }} />
              {path.label}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {path.points.map((point, i) => (
                <div
                  key={point.name}
                  className="flex items-center gap-3 text-sm bg-[#f6f8f5] dark:bg-white/5 rounded-xl px-4 py-3 border border-black/5 dark:border-white/10"
                >
                  <span
                    className="flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white flex-shrink-0"
                    style={{ background: path.color }}
                  >
                    {i + 1}
                  </span>
                  <span className="font-medium text-[#1f2a1d] dark:text-white">{point.name}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.main>
  );
}

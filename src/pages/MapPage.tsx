import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { motion } from 'framer-motion';
import { DAY_PATHS, MAP_CENTER, type DayPath, type DayPoint } from '../data';

/** Photo-card style marker: tilted rounded tile + pill caption (Google-timeline vibe). */
function photoPin(color: string, point: DayPoint, tilt: number, showLabel: boolean) {
  const label = showLabel
    ? `<div style="background:rgba(16,28,20,.92);color:#fff;font:600 12px/1.2 Inter,-apple-system,sans-serif;padding:8px 13px;border-radius:9999px;white-space:nowrap;box-shadow:0 3px 10px rgba(0,0,0,.35)">${point.name}</div>`
    : '';
  const inner = point.image
    ? `<img src="${point.image}" alt="" style="width:100%;height:100%;object-fit:cover" />`
    : `<span style="font-size:22px">${point.emoji}</span>`;
  return L.divIcon({
    className: '',
    html: `<div style="display:flex;align-items:center;gap:9px;width:max-content">
      <div style="width:46px;height:46px;flex-shrink:0;border-radius:15px;overflow:hidden;background:linear-gradient(135deg,${color}e6,${color});border:2.5px solid #fff;box-shadow:0 5px 12px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;transform:rotate(${tilt}deg)">${inner}</div>
      ${label}
    </div>`,
    iconSize: [0, 0],
    iconAnchor: [23, 23],
  });
}

/** Smooth quadratic fallback through the stops (used until/if road routing fails). */
function curvedPath(points: DayPoint[]): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const side = i % 2 === 0 ? 1 : -1;
    const cx = (a.lat + b.lat) / 2 - (b.lng - a.lng) * 0.18 * side;
    const cy = (a.lng + b.lng) / 2 + (b.lat - a.lat) * 0.18 * side;
    for (let s = 0; s <= 20; s++) {
      const t = s / 20;
      out.push([
        (1 - t) ** 2 * a.lat + 2 * (1 - t) * t * cx + t * t * b.lat,
        (1 - t) ** 2 * a.lng + 2 * (1 - t) * t * cy + t * t * b.lng,
      ]);
    }
  }
  return out;
}

const routeCache = new Map<string, [number, number][]>();

/** Fetches a road-following route through the day's stops from the public OSRM demo. */
function useRoadRoute(path: DayPath): [number, number][] {
  const [route, setRoute] = useState<[number, number][]>(() => curvedPath(path.points));
  const key = path.points.map((p) => `${p.lat},${p.lng}`).join(';');

  useEffect(() => {
    const cached = routeCache.get(key);
    if (cached) {
      setRoute(cached);
      return;
    }
    if (path.points.length < 2) return;

    const coords = path.points.map((p) => `${p.lng},${p.lat}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
    let cancelled = false;

    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data) => {
        const line = data?.routes?.[0]?.geometry?.coordinates as [number, number][] | undefined;
        if (cancelled || !line?.length) return;
        const latlngs = line.map(([lng, lat]) => [lat, lng] as [number, number]);
        routeCache.set(key, latlngs);
        setRoute(latlngs);
      })
      .catch(() => {
        // OSRM unavailable — keep the curved fallback already in state.
      });

    return () => {
      cancelled = true;
    };
  }, [key, path.points]);

  return route;
}

function DayRoute({ path, selected }: { path: DayPath; selected: boolean }) {
  const route = useRoadRoute(path);
  return (
    <Polyline
      positions={route}
      pathOptions={{
        color: path.color,
        weight: 4,
        opacity: selected ? 0.9 : 0.5,
        lineCap: 'round',
        lineJoin: 'round',
      }}
    />
  );
}

function DayLayers({ paths, selectedDay }: { paths: DayPath[]; selectedDay: number | null }) {
  const map = useMap();
  const [zoom, setZoom] = useState(() => map.getZoom());
  useMapEvents({ zoomend: () => setZoom(map.getZoom()) });
  const lastFitKey = useRef('');

  const showLabels = selectedDay !== null || zoom >= 13;

  useEffect(() => {
    const key = paths.map((p) => p.day).join(',');
    if (key === lastFitKey.current) return;
    lastFitKey.current = key;
    const pts = paths.flatMap((p) => p.points.map((pt) => [pt.lat, pt.lng] as [number, number]));
    if (pts.length) {
      map.fitBounds(L.latLngBounds(pts), { padding: [70, 70], maxZoom: 14 });
    }
  }, [map, paths]);

  return (
    <>
      {paths.map((path) => (
        <DayRoute key={path.day} path={path} selected={selectedDay !== null} />
      ))}
      {paths.flatMap((path) =>
        path.points.map((point, i) => (
          <Marker
            key={`${path.day}-${point.name}`}
            position={[point.lat, point.lng]}
            icon={photoPin(path.color, point, i % 2 === 0 ? -6 : 5, showLabels)}
            zIndexOffset={i}
          />
        ))
      )}
    </>
  );
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
          Каждый день — свой цвет и свои карточки, а линии идут по настоящим улицам. Выбери день, чтобы увидеть его
          маршрут крупно с подписями.
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
          <DayLayers paths={visiblePaths} selectedDay={selectedDay} />
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
                    className="flex items-center justify-center w-8 h-8 rounded-xl text-base flex-shrink-0 overflow-hidden"
                    style={{ background: `${path.color}22` }}
                  >
                    {point.image ? (
                      <img src={point.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      point.emoji
                    )}
                  </span>
                  <span className="flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white flex-shrink-0" style={{ background: path.color }}>
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

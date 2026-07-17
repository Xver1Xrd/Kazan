import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { motion } from 'framer-motion';
import { MAP_LOCATIONS, MAP_CENTER } from '../data';

const pinIcon = L.divIcon({
  className: '',
  html: `<div style="
    width: 16px; height: 16px; border-radius: 9999px;
    background: #4b7a5a; border: 2px solid white;
    box-shadow: 0 1px 4px rgba(0,0,0,0.4);
  "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  popupAnchor: [0, -8],
});

export default function MapPage() {
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
          Все точки маршрута
        </h1>
        <p className="mt-4 text-[#4b5b47] dark:text-white/60 max-w-xl">
          Клик по метке показывает название места. Всё в городе — большая часть в пешей доступности от центра, дальше всех
          только аэропорт.
        </p>
      </div>

      <div className="h-[60vh] sm:h-[70vh] w-full">
        <MapContainer center={MAP_CENTER} zoom={10} scrollWheelZoom className="w-full h-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {MAP_LOCATIONS.map((location) => (
            <Marker key={location.name} position={[location.lat, location.lng]} icon={pinIcon}>
              <Popup>
                <strong>{location.name}</strong>
                <br />
                {location.area}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="px-4 sm:px-6 md:px-10 py-10 max-w-5xl mx-auto grid gap-3 sm:grid-cols-2">
        {MAP_LOCATIONS.map((location) => (
          <div
            key={location.name}
            className="flex items-center justify-between text-sm bg-[#f6f8f5] dark:bg-white/5 rounded-xl px-4 py-3 border border-black/5 dark:border-white/10"
          >
            <span className="font-medium text-[#1f2a1d] dark:text-white">{location.name}</span>
            <span className="text-[#4b5b47] dark:text-white/50 text-xs">{location.area}</span>
          </div>
        ))}
      </div>
    </motion.main>
  );
}

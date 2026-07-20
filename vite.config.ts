import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Казань вдвоём — 24–28 июля',
        short_name: 'Казань’26',
        description: 'Наше маленькое путешествие в сердце Казани: маршрут на пять дней, погода, карта и галерея.',
        lang: 'ru',
        display: 'standalone',
        theme_color: '#1f2a1d',
        background_color: '#0e1712',
        icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg}'],
        navigateFallback: '/index.html',
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.open-meteo\.com\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'weather',
              expiration: { maxEntries: 4, maxAgeSeconds: 6 * 3600 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'fonts', expiration: { maxEntries: 30, maxAgeSeconds: 30 * 86400 } },
          },
          {
            urlPattern: /^https:\/\/[abc]\.tile\.openstreetmap\.org\/.*/,
            handler: 'CacheFirst',
            options: { cacheName: 'osm-tiles', expiration: { maxEntries: 200, maxAgeSeconds: 7 * 86400 } },
          },
          {
            urlPattern: /^https:\/\/router\.project-osrm\.org\/.*/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'osrm-routes', expiration: { maxEntries: 20, maxAgeSeconds: 30 * 86400 } },
          },
        ],
      },
    }),
  ],
});

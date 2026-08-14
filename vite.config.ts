import type { IncomingMessage, ServerResponse } from 'node:http';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import photosHandler from './api/photos';

/**
 * На проде `/api/photos` обслуживает serverless-функция Vercel. В `vite dev`
 * и `vite preview` функций нет, поэтому тот же обработчик подключаем как
 * middleware — фронтенд работает одинаково везде.
 */
function photosApi(): Plugin {
  const middleware = (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (!req.url || new URL(req.url, 'http://localhost').pathname !== '/api/photos') {
      next();
      return;
    }
    void photosHandler(req, res);
  };

  return {
    name: 'kazan:photos-api',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    photosApi(),
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
        navigateFallbackDenylist: [/^\/api\//, /^\/uploads\//],
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
            // Список загруженных фото: сначала сеть, офлайн — последний ответ.
            urlPattern: /\/api\/photos(\?.*)?$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'gallery-index',
              expiration: { maxEntries: 4, maxAgeSeconds: 7 * 86400 },
            },
          },
          {
            // Сами загруженные снимки неизменяемы — держим их в кэше.
            urlPattern: /^https:\/\/[^/]+\.public\.blob\.vercel-storage\.com\/uploads\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gallery-photos',
              expiration: { maxEntries: 300, maxAgeSeconds: 90 * 86400 },
              cacheableResponse: { statuses: [0, 200] },
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

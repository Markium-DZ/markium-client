import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

// Precache app shell (injected by vite-plugin-pwa)
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// API responses: network-first with 24h cache fallback
registerRoute(
  ({ url }) => /^https:\/\/be(-test)?\.markium\.online\/api\/v1\//.test(url.href),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
    networkTimeoutSeconds: 5,
  })
);

// S3 images: cache-first with 30-day expiry
registerRoute(
  ({ url }) => /^https:\/\/s3\.markium\.online\//.test(url.href),
  new CacheFirst({
    cacheName: 'image-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// Google Fonts stylesheets
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new StaleWhileRevalidate({ cacheName: 'google-fonts-stylesheets' })
);

// Google Fonts webfont files
registerRoute(
  ({ url }) => url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts-webfonts',
    plugins: [
      new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// Background sync for failed POST/PUT/DELETE requests
const bgSyncPlugin = new BackgroundSyncPlugin('offline-mutations', {
  maxRetentionTime: 24 * 60, // 24 hours in minutes
});

registerRoute(
  ({ url }) => /^https:\/\/be(-test)?\.markium\.online\/api\/v1\//.test(url.href),
  new NetworkFirst({ plugins: [bgSyncPlugin] }),
  'POST'
);

['PUT', 'PATCH', 'DELETE'].forEach((method) => {
  registerRoute(
    ({ url }) => /^https:\/\/be(-test)?\.markium\.online\/api\/v1\//.test(url.href),
    new NetworkFirst({ plugins: [bgSyncPlugin] }),
    method
  );
});

// ===== PUSH NOTIFICATION HANDLER =====

self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const { title, body, icon, url, type } = data;

  const options = {
    body,
    icon: icon || '/favicon/android-chrome-192x192.png',
    badge: '/favicon/favicon-32x32.png',
    tag: type || 'general',
    data: { url: url || '/' },
    actions: [{ action: 'open', title: 'Open' }],
    vibrate: [200, 100, 200],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const { url } = event.notification.data;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

// Handle SW activation — claim all clients
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

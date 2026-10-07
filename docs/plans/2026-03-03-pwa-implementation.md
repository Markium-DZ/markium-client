# PWA + Mobile App Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Convert markium-client into a full PWA with push notifications, offline support, native-like mobile UX, and Capacitor app store packaging.

**Architecture:** Three layers on top of existing React+Vite+MUI app: (1) PWA core via vite-plugin-pwa/Workbox for service worker + caching, (2) Push notifications via Web Push API (VAPID) with Capacitor native bridge, (3) Mobile UX with MUI BottomNavigation, framer-motion transitions, and pull-to-refresh.

**Tech Stack:** vite-plugin-pwa, Workbox, Web Push API (VAPID), Capacitor, MUI BottomNavigation, framer-motion (already installed), SWR (already installed), notistack (already installed)

**Design Doc:** `docs/plans/2026-03-03-pwa-design.md`

---

## Phase 1: PWA Core (Service Worker + Caching + Offline)

### Task 1: Install PWA dependencies and configure vite-plugin-pwa

**Files:**
- Modify: `package.json`
- Modify: `vite.config.js:74-83` (plugins array)

**Step 1: Install vite-plugin-pwa**

Run: `npm install vite-plugin-pwa -D`

Expected: Package added to devDependencies.

**Step 2: Add VitePWA plugin to Vite config**

In `vite.config.js`, add the import at line 4:

```js
import { VitePWA } from 'vite-plugin-pwa';
```

Add `VitePWA()` as the last plugin in the plugins array (after `inlineCssPlugin()` at line 82). This ordering is critical — `inlineCssPlugin` modifies `dist/index.html` at `closeBundle`, and VitePWA must run after it.

```js
VitePWA({
  registerType: 'prompt', // user-controlled updates, not auto
  includeAssets: ['favicon/**/*', 'logo/**/*'],
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
    runtimeCaching: [
      {
        // API responses: network-first with cache fallback
        urlPattern: /^https:\/\/be(-test)?\.markium\.online\/api\/v1\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 }, // 24h
          cacheableResponse: { statuses: [0, 200] },
          networkTimeoutSeconds: 5,
        },
      },
      {
        // S3 images: cache-first with 30-day expiry
        urlPattern: /^https:\/\/s3\.markium\.online\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'image-cache',
          expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 }, // 30 days
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        // Google Fonts stylesheets
        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'google-fonts-stylesheets',
        },
      },
      {
        // Google Fonts webfont files
        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts-webfonts',
          expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 }, // 1 year
          cacheableResponse: { statuses: [0, 200] },
        },
      },
    ],
  },
  manifest: false, // We manage manifest.json manually in public/
})
```

**Step 3: Verify build works**

Run: `npm run build`

Expected: Build succeeds. `dist/` contains `sw.js` and `workbox-*.js` files.

**Step 4: Commit**

```bash
git add package.json package-lock.json vite.config.js
git commit -m "feat(pwa): add vite-plugin-pwa with Workbox caching strategies"
```

---

### Task 2: Enhance manifest.json

**Files:**
- Modify: `public/manifest.json`

**Step 1: Update manifest with full PWA fields**

Replace the entire `public/manifest.json` with:

```json
{
  "name": "Markium",
  "short_name": "Markium",
  "description": "Manage your e-commerce store — orders, products, inventory, and analytics",
  "display": "standalone",
  "display_override": ["standalone", "minimal-ui"],
  "start_url": "/",
  "scope": "/",
  "id": "/",
  "orientation": "portrait",
  "dir": "rtl",
  "lang": "ar",
  "theme_color": "#00A76F",
  "background_color": "#ffffff",
  "categories": ["business", "shopping"],
  "icons": [
    {
      "src": "favicon/android-chrome-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "favicon/android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "favicon/android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

**Step 2: Verify manifest loads**

Run: `npm run dev` → open `http://localhost:3031/manifest.json` in browser.

Expected: Full manifest with all new fields.

**Step 3: Commit**

```bash
git add public/manifest.json
git commit -m "feat(pwa): enhance manifest.json with full PWA fields"
```

---

### Task 3: Register service worker and add update prompt

**Files:**
- Create: `src/components/pwa/sw-update-prompt.jsx`
- Modify: `src/main.jsx:1-11` (add SW registration)

**Step 1: Create the SW update prompt component**

Create `src/components/pwa/sw-update-prompt.jsx`:

```jsx
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useSnackbar } from 'notistack';
import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '@mui/material/Button';

export default function SwUpdatePrompt() {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const { t } = useTranslation();

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      // Check for updates every 60 minutes
      if (registration) {
        setInterval(() => registration.update(), 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.error('SW registration error:', error);
    },
  });

  const handleUpdate = useCallback(() => {
    updateServiceWorker(true);
  }, [updateServiceWorker]);

  useEffect(() => {
    if (needRefresh) {
      enqueueSnackbar(t('pwa.update_available', 'A new version is available'), {
        variant: 'info',
        persist: true,
        action: (snackbarId) => (
          <>
            <Button color="inherit" size="small" onClick={handleUpdate}>
              {t('pwa.refresh', 'Refresh')}
            </Button>
            <Button color="inherit" size="small" onClick={() => closeSnackbar(snackbarId)}>
              {t('pwa.dismiss', 'Later')}
            </Button>
          </>
        ),
      });
    }
  }, [needRefresh, enqueueSnackbar, closeSnackbar, handleUpdate, t]);

  return null; // Renderless component
}
```

**Step 2: Mount SwUpdatePrompt in the app**

In `src/main.jsx`, this component needs to be inside the `SnackbarProvider`. The `SnackbarProvider` is wrapped in `App`, so the best place is inside the app component tree.

Find where `SnackbarProvider` is rendered (likely in `src/app.jsx` or a provider wrapper). Add `<SwUpdatePrompt />` as a child of `SnackbarProvider`.

Check `src/app.jsx` for the provider tree and add:

```jsx
import SwUpdatePrompt from 'src/components/pwa/sw-update-prompt';
```

Then add `<SwUpdatePrompt />` inside the JSX, after `SnackbarProvider` opens (it must be a descendant of `SnackbarProvider`).

**Step 3: Verify SW registration in dev**

Run: `npm run build && npm run preview`

Open `http://localhost:3031` → DevTools → Application → Service Workers.

Expected: Service worker registered and active.

**Step 4: Commit**

```bash
git add src/components/pwa/sw-update-prompt.jsx src/app.jsx
git commit -m "feat(pwa): register service worker with update prompt"
```

---

### Task 4: Create offline detection hook and UI

**Files:**
- Create: `src/hooks/use-network-status.js`
- Create: `src/components/pwa/offline-indicator.jsx`
- Modify: `src/utils/axios.js:44-47` (enhance network error handling)

**Step 1: Create useNetworkStatus hook**

Create `src/hooks/use-network-status.js`:

```js
import { useSyncExternalStore, useCallback } from 'react';

function subscribe(callback) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function getSnapshot() {
  return navigator.onLine;
}

function getServerSnapshot() {
  return true; // Assume online during SSR
}

export function useNetworkStatus() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
```

**Step 2: Create offline indicator component**

Create `src/components/pwa/offline-indicator.jsx`:

```jsx
import { useEffect } from 'react';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { useNetworkStatus } from 'src/hooks/use-network-status';

export default function OfflineIndicator() {
  const isOnline = useNetworkStatus();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const { t } = useTranslation();

  useEffect(() => {
    if (!isOnline) {
      enqueueSnackbar(
        t('pwa.offline', 'You are offline. Some features may be limited.'),
        {
          variant: 'warning',
          persist: true,
          key: 'offline-indicator',
          preventDuplicate: true,
        }
      );
    } else {
      closeSnackbar('offline-indicator');
    }
  }, [isOnline, enqueueSnackbar, closeSnackbar, t]);

  return null;
}
```

**Step 3: Mount OfflineIndicator in the app**

Add `<OfflineIndicator />` next to `<SwUpdatePrompt />` inside the provider tree (descendant of `SnackbarProvider`).

```jsx
import OfflineIndicator from 'src/components/pwa/offline-indicator';
```

**Step 4: Verify offline detection**

Run: `npm run dev` → DevTools → Network → toggle "Offline".

Expected: Warning snackbar appears when offline, dismisses when back online.

**Step 5: Commit**

```bash
git add src/hooks/use-network-status.js src/components/pwa/offline-indicator.jsx src/app.jsx
git commit -m "feat(pwa): add offline detection hook and indicator"
```

---

## Phase 2: Push Notifications

### Task 5: Create push notification service

**Files:**
- Create: `src/services/push-notifications.js`
- Modify: `.env.development` (add VAPID key)
- Modify: `.env.production` (add VAPID key)

**Step 1: Generate VAPID keys**

Run (one-time, save the output):
```bash
npx web-push generate-vapid-keys
```

Add the public key to both env files:
```
VITE_VAPID_PUBLIC_KEY=<your-public-key-here>
```

Keep the private key for the backend.

**Step 2: Create push notification service**

Create `src/services/push-notifications.js`:

```js
import axios from 'src/utils/axios';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push notifications not supported');
  }

  const registration = await navigator.serviceWorker.ready;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  // Send subscription to backend
  await axios.post('/push/subscribe', subscription.toJSON());

  return subscription;
}

export async function unsubscribeFromPush() {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    await subscription.unsubscribe();
    await axios.delete('/push/subscribe', {
      data: { endpoint: subscription.endpoint },
    });
  }
}

export async function getSubscriptionStatus() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { supported: false, subscribed: false, permission: 'unsupported' };
  }

  const permission = Notification.permission;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  return {
    supported: true,
    subscribed: !!subscription,
    permission,
  };
}

export async function getPushPreferences() {
  const { data } = await axios.get('/push/preferences');
  return data;
}

export async function updatePushPreferences(preferences) {
  const { data } = await axios.put('/push/preferences', preferences);
  return data;
}
```

**Step 3: Commit**

```bash
git add src/services/push-notifications.js
git commit -m "feat(push): add push notification subscription service"
```

---

### Task 6: Create push permission prompt component

**Files:**
- Create: `src/components/pwa/push-permission-prompt.jsx`
- Create: `src/hooks/use-push-notifications.js`

**Step 1: Create usePushNotifications hook**

Create `src/hooks/use-push-notifications.js`:

```js
import { useState, useEffect, useCallback } from 'react';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { subscribeToPush, getSubscriptionStatus } from 'src/services/push-notifications';

const PROMPT_DISMISSED_KEY = 'push-prompt-dismissed';

export function usePushNotifications() {
  const [status, setStatus] = useState({ supported: false, subscribed: false, permission: 'default' });
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation();

  useEffect(() => {
    getSubscriptionStatus().then(setStatus);
  }, []);

  const subscribe = useCallback(async () => {
    setLoading(true);
    try {
      await subscribeToPush();
      const newStatus = await getSubscriptionStatus();
      setStatus(newStatus);
      enqueueSnackbar(t('pwa.push_enabled', 'Notifications enabled!'), { variant: 'success' });
    } catch (err) {
      console.error('Push subscription failed:', err);
      enqueueSnackbar(t('pwa.push_error', 'Could not enable notifications'), { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar, t]);

  const dismiss = useCallback(() => {
    localStorage.setItem(PROMPT_DISMISSED_KEY, Date.now().toString());
  }, []);

  const shouldShowPrompt =
    status.supported &&
    !status.subscribed &&
    status.permission === 'default' &&
    !localStorage.getItem(PROMPT_DISMISSED_KEY);

  return { status, loading, subscribe, dismiss, shouldShowPrompt };
}
```

**Step 2: Create the soft prompt component**

Create `src/components/pwa/push-permission-prompt.jsx`:

```jsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Iconify from 'src/components/iconify';
import { usePushNotifications } from 'src/hooks/use-push-notifications';

export default function PushPermissionPrompt() {
  const { shouldShowPrompt, subscribe, dismiss, loading } = usePushNotifications();
  const { t } = useTranslation();
  const [visible, setVisible] = useState(true);

  if (!shouldShowPrompt || !visible) return null;

  const handleDismiss = () => {
    dismiss();
    setVisible(false);
  };

  return (
    <Card
      sx={{
        position: 'fixed',
        bottom: { xs: 72, lg: 24 }, // above bottom nav on mobile
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1300,
        p: 2,
        mx: 2,
        maxWidth: 400,
        width: 'calc(100% - 32px)',
        boxShadow: (theme) => theme.customShadows?.z16 || theme.shadows[16],
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
        <Iconify icon="solar:bell-bing-bold-duotone" width={32} sx={{ color: 'primary.main', mt: 0.5 }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2">
            {t('pwa.push_prompt_title', 'Stay updated')}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            {t('pwa.push_prompt_body', 'Get notified about new orders, inventory alerts, and more.')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
            <Button variant="contained" size="small" onClick={subscribe} disabled={loading}>
              {t('pwa.push_enable', 'Enable')}
            </Button>
            <Button variant="text" size="small" onClick={handleDismiss} sx={{ color: 'text.secondary' }}>
              {t('pwa.push_later', 'Not now')}
            </Button>
          </Box>
        </Box>
        <IconButton size="small" onClick={handleDismiss} sx={{ mt: -0.5, mr: -0.5 }}>
          <Iconify icon="mingcute:close-line" width={18} />
        </IconButton>
      </Box>
    </Card>
  );
}
```

**Step 3: Mount inside the dashboard layout**

Add `<PushPermissionPrompt />` inside the dashboard layout (all three render paths in `src/layouts/dashboard/index.jsx`), so it only shows for authenticated users.

```jsx
import PushPermissionPrompt from 'src/components/pwa/push-permission-prompt';
```

Add `<PushPermissionPrompt />` before the closing `</>` in each render path.

**Step 4: Verify the prompt renders**

Run: `npm run dev` → log in → check that the notification prompt card appears at the bottom.

Expected: Card with bell icon, "Stay updated" title, Enable/Not now buttons.

**Step 5: Commit**

```bash
git add src/hooks/use-push-notifications.js src/components/pwa/push-permission-prompt.jsx src/layouts/dashboard/index.jsx
git commit -m "feat(push): add soft permission prompt for push notifications"
```

---

### Task 7: Add push event handler to service worker

**Files:**
- Create: `src/sw-custom.js` (custom SW additions for push handling)
- Modify: `vite.config.js` VitePWA config (switch to injectManifest strategy)

**Step 1: Switch VitePWA to injectManifest strategy**

We need a custom service worker to handle push events. Update the VitePWA config in `vite.config.js`:

Replace `workbox: { ... }` with:

```js
strategies: 'injectManifest',
srcDir: 'src',
filename: 'sw-custom.js',
injectManifest: {
  globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
},
```

**Step 2: Create custom service worker**

Create `src/sw-custom.js`:

```js
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
  ({ url, request }) =>
    /^https:\/\/be(-test)?\.markium\.online\/api\/v1\//.test(url.href) &&
    ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method),
  new NetworkFirst({
    plugins: [bgSyncPlugin],
  }),
  'POST' // Workbox needs method hint for non-GET
);

// Also register for PUT, PATCH, DELETE
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
    tag: type || 'general', // Group by notification type
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
      // Focus existing window if found
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      // Open new window if none found
      return self.clients.openWindow(url);
    })
  );
});

// Handle SW activation — claim all clients
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
```

**Step 3: Verify build with custom SW**

Run: `npm run build`

Expected: Build succeeds. `dist/sw-custom.js` contains the precache manifest injected by Workbox plus all custom push/cache code.

**Step 4: Commit**

```bash
git add src/sw-custom.js vite.config.js
git commit -m "feat(pwa): add custom service worker with push handler and background sync"
```

---

## Phase 3: Mobile UX

### Task 8: Create bottom navigation bar component

**Files:**
- Create: `src/layouts/dashboard/bottom-nav.jsx`

**Step 1: Create the BottomNav component**

Create `src/layouts/dashboard/bottom-nav.jsx`:

```jsx
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Badge from '@mui/material/Badge';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Iconify from 'src/components/iconify';
import { paths } from 'src/routes/paths';

const NAV_HEIGHT = 56;

const PRIMARY_TABS = [
  { label: 'nav.dashboard', icon: 'solar:widget-5-bold-duotone', path: paths.dashboard.root },
  { label: 'nav.orders', icon: 'solar:bag-check-bold-duotone', path: paths.dashboard.order?.list || '/dashboard/orders' },
  { label: 'nav.products', icon: 'solar:box-bold-duotone', path: paths.dashboard.product?.list || '/dashboard/products' },
  { label: 'nav.analytics', icon: 'solar:chart-bold-duotone', path: paths.dashboard.general?.analytics || '/dashboard/analytics' },
];

const MORE_ITEMS = [
  { label: 'nav.inventory', icon: 'solar:archive-bold-duotone', path: paths.dashboard.inventory?.list || '/dashboard/inventory' },
  { label: 'nav.settings', icon: 'solar:settings-bold-duotone', path: paths.dashboard.settings || '/dashboard/settings' },
];

function getActiveTab(pathname) {
  const idx = PRIMARY_TABS.findIndex((tab) => pathname.startsWith(tab.path));
  return idx >= 0 ? idx : -1;
}

export default function BottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [moreOpen, setMoreOpen] = useState(false);

  const activeTab = getActiveTab(pathname);

  const handleChange = (_event, newValue) => {
    if (newValue === 4) {
      setMoreOpen(true);
      return;
    }
    const tab = PRIMARY_TABS[newValue];
    if (tab) {
      navigate(tab.path);
      if (navigator.vibrate) navigator.vibrate(10);
    }
  };

  const handleMoreNav = (path) => {
    setMoreOpen(false);
    navigate(path);
  };

  return (
    <>
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: (theme) => theme.zIndex.appBar,
          pb: 'env(safe-area-inset-bottom)',
          bgcolor: 'background.paper',
          borderTop: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <BottomNavigation
          value={activeTab >= 0 ? activeTab : false}
          onChange={handleChange}
          showLabels
          sx={{ height: NAV_HEIGHT }}
        >
          {PRIMARY_TABS.map((tab, idx) => (
            <BottomNavigationAction
              key={tab.path}
              label={t(tab.label)}
              icon={
                tab.label === 'nav.orders' ? (
                  <Badge color="error" variant="dot" invisible>
                    <Iconify icon={tab.icon} width={24} />
                  </Badge>
                ) : (
                  <Iconify icon={tab.icon} width={24} />
                )
              }
              sx={{
                '&.Mui-selected': { color: 'primary.main' },
                minWidth: 0,
                py: 1,
              }}
            />
          ))}
          <BottomNavigationAction
            label={t('nav.more', 'More')}
            icon={<Iconify icon="solar:hamburger-menu-bold-duotone" width={24} />}
            sx={{ '&.Mui-selected': { color: 'primary.main' }, minWidth: 0, py: 1 }}
          />
        </BottomNavigation>
      </Box>

      {/* More drawer */}
      <Drawer
        anchor="bottom"
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            pb: 'env(safe-area-inset-bottom)',
          },
        }}
      >
        <Box sx={{ p: 1, textAlign: 'center' }}>
          <Box sx={{ width: 40, height: 4, bgcolor: 'grey.300', borderRadius: 2, mx: 'auto', mb: 1 }} />
        </Box>
        <List>
          {MORE_ITEMS.map((item) => (
            <ListItemButton key={item.path} onClick={() => handleMoreNav(item.path)}>
              <ListItemIcon>
                <Iconify icon={item.icon} width={24} />
              </ListItemIcon>
              <ListItemText primary={t(item.label)} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      {/* Spacer to prevent content from being hidden behind bottom nav */}
      <Box sx={{ height: `calc(${NAV_HEIGHT}px + env(safe-area-inset-bottom))` }} />
    </>
  );
}

export { NAV_HEIGHT };
```

**Step 2: Commit**

```bash
git add src/layouts/dashboard/bottom-nav.jsx
git commit -m "feat(mobile): create bottom navigation bar component"
```

---

### Task 9: Integrate bottom nav into dashboard layout

**Files:**
- Modify: `src/layouts/dashboard/index.jsx:37-88`

**Step 1: Import BottomNav and useResponsive**

Add imports at the top of `src/layouts/dashboard/index.jsx`:

```jsx
import BottomNav from './bottom-nav';
```

`useResponsive` is already imported. The `lgUp` variable already exists at line 23.

**Step 2: Add BottomNav to all three render paths**

In each render path (horizontal at ~line 48, mini at ~line 68, default at ~line 88), add `{!lgUp && <BottomNav />}` **after** `<Main>{children}</Main>` and **before** `</>`:

For example, the default layout becomes:

```jsx
<>
  <SkipToContent />
  <Header onOpenNav={nav.onTrue} />
  <Box sx={{ minHeight: 1, display: 'flex', flexDirection: { xs: 'column', lg: 'row' } }}>
    {renderNavVertical}
    <Main>{children}</Main>
  </Box>
  {!lgUp && <BottomNav />}
</>
```

**Step 3: Hide mobile hamburger sidebar when bottom nav is present**

In the `Header` component, the hamburger button should be hidden on mobile since the bottom nav replaces it. Check `src/layouts/dashboard/header.jsx` — the hamburger icon likely uses `!lgUp` to show. Consider keeping it for now and removing it in a follow-up task (the sidebar drawer is still accessible via the "More" bottom sheet).

**Step 4: Verify bottom nav renders on mobile**

Run: `npm run dev` → DevTools → toggle device toolbar (mobile view).

Expected: Bottom navigation bar appears at the bottom with 5 tabs. Desktop view shows the normal sidebar.

**Step 5: Commit**

```bash
git add src/layouts/dashboard/index.jsx
git commit -m "feat(mobile): integrate bottom nav into dashboard layout"
```

---

### Task 10: Add page transitions with framer-motion

**Files:**
- Create: `src/components/animate/page-transition.jsx`
- Modify: `src/layouts/dashboard/index.jsx` (wrap `<Main>` children)

**Step 1: Create PageTransition wrapper**

Create `src/components/animate/page-transition.jsx`:

```jsx
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useSettingsContext } from 'src/components/settings';

const variants = {
  initial: (direction) => ({
    opacity: 0,
    x: direction === 'rtl' ? -20 : 20,
  }),
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
  exit: (direction) => ({
    opacity: 0,
    x: direction === 'rtl' ? 20 : -20,
    transition: { duration: 0.15, ease: 'easeIn' },
  }),
};

export default function PageTransition({ children }) {
  const { pathname } = useLocation();
  const settings = useSettingsContext();
  const direction = settings?.themeDirection || 'rtl';

  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={pathname}
        custom={direction}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{ flex: 1 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

**Step 2: Wrap Main children in PageTransition**

In `src/layouts/dashboard/index.jsx`, wrap `{children}` inside `<Main>` with `<PageTransition>`:

```jsx
import PageTransition from 'src/components/animate/page-transition';

// In each render path:
<Main>
  <PageTransition>{children}</PageTransition>
</Main>
```

**Step 3: Verify transitions**

Run: `npm run dev` → navigate between dashboard pages on mobile.

Expected: Pages slide in/out with subtle animation. Direction respects RTL.

**Step 4: Commit**

```bash
git add src/components/animate/page-transition.jsx src/layouts/dashboard/index.jsx
git commit -m "feat(mobile): add page transition animations with framer-motion"
```

---

### Task 11: Add pull-to-refresh component

**Files:**
- Create: `src/components/pwa/pull-to-refresh.jsx`

**Step 1: Create PullToRefresh component**

Create `src/components/pwa/pull-to-refresh.jsx`:

```jsx
import { useState, useRef, useCallback } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

const THRESHOLD = 80;

export default function PullToRefresh({ onRefresh, children }) {
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pullDistance = useMotionValue(0);
  const opacity = useTransform(pullDistance, [0, THRESHOLD], [0, 1]);
  const scale = useTransform(pullDistance, [0, THRESHOLD], [0.5, 1]);

  const handleTouchStart = useCallback((e) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback(
    (e) => {
      if (refreshing || window.scrollY > 0) return;
      const diff = e.touches[0].clientY - startY.current;
      if (diff > 0) {
        pullDistance.set(Math.min(diff * 0.5, THRESHOLD + 20));
      }
    },
    [refreshing, pullDistance]
  );

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance.get() >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      pullDistance.set(THRESHOLD);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        pullDistance.set(0);
      }
      if (navigator.vibrate) navigator.vibrate(10);
    } else {
      pullDistance.set(0);
    }
  }, [pullDistance, refreshing, onRefresh]);

  return (
    <Box
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      sx={{ position: 'relative' }}
    >
      <motion.div
        style={{
          display: 'flex',
          justifyContent: 'center',
          paddingTop: 8,
          paddingBottom: 8,
          opacity,
          scale,
        }}
      >
        <CircularProgress size={24} thickness={4} />
      </motion.div>
      {children}
    </Box>
  );
}
```

**Step 2: Usage example for list views**

In any list page (e.g. orders list), wrap the content:

```jsx
import PullToRefresh from 'src/components/pwa/pull-to-refresh';
import { useSWRConfig } from 'swr';

function OrderListView() {
  const { mutate } = useSWRConfig();

  const handleRefresh = async () => {
    await mutate((key) => typeof key === 'string' && key.includes('/orders'), undefined, { revalidate: true });
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      {/* existing order list content */}
    </PullToRefresh>
  );
}
```

This is a utility component — integration into specific list views can be done incrementally.

**Step 3: Commit**

```bash
git add src/components/pwa/pull-to-refresh.jsx
git commit -m "feat(mobile): add pull-to-refresh component"
```

---

### Task 12: Create install prompt banner

**Files:**
- Create: `src/components/pwa/install-prompt.jsx`

**Step 1: Create InstallPrompt component**

Create `src/components/pwa/install-prompt.jsx`:

```jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Iconify from 'src/components/iconify';
import { useResponsive } from 'src/hooks/use-responsive';

const INSTALL_DISMISSED_KEY = 'pwa-install-dismissed';
const VISIT_COUNT_KEY = 'pwa-visit-count';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation();
  const lgUp = useResponsive('up', 'lg');

  useEffect(() => {
    // Track visits — show prompt after 2nd visit
    const visits = parseInt(localStorage.getItem(VISIT_COUNT_KEY) || '0', 10) + 1;
    localStorage.setItem(VISIT_COUNT_KEY, visits.toString());

    if (visits < 2 || localStorage.getItem(INSTALL_DISMISSED_KEY)) return;

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Don't show on desktop or if already installed
  if (lgUp || !visible || !deferredPrompt) return null;

  const handleInstall = async () => {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem(INSTALL_DISMISSED_KEY, 'true');
    setVisible(false);
  };

  return (
    <Card
      sx={{
        position: 'fixed',
        bottom: 72, // above bottom nav
        left: 16,
        right: 16,
        zIndex: 1300,
        p: 2,
        boxShadow: (theme) => theme.customShadows?.z16 || theme.shadows[16],
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
        <Iconify icon="solar:download-minimalistic-bold-duotone" width={32} sx={{ color: 'primary.main', mt: 0.5 }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2">
            {t('pwa.install_title', 'Install Markium')}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            {t('pwa.install_body', 'Add to your home screen for a faster experience.')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
            <Button variant="contained" size="small" onClick={handleInstall}>
              {t('pwa.install_button', 'Install')}
            </Button>
            <Button variant="text" size="small" onClick={handleDismiss} sx={{ color: 'text.secondary' }}>
              {t('pwa.install_dismiss', 'Not now')}
            </Button>
          </Box>
        </Box>
        <IconButton size="small" onClick={handleDismiss} sx={{ mt: -0.5, mr: -0.5 }}>
          <Iconify icon="mingcute:close-line" width={18} />
        </IconButton>
      </Box>
    </Card>
  );
}
```

**Step 2: Mount inside dashboard layout**

Add alongside `PushPermissionPrompt` and `SwUpdatePrompt`:

```jsx
import InstallPrompt from 'src/components/pwa/install-prompt';
```

**Step 3: Commit**

```bash
git add src/components/pwa/install-prompt.jsx src/layouts/dashboard/index.jsx
git commit -m "feat(pwa): add install prompt banner for mobile users"
```

---

## Phase 4: Capacitor Integration

### Task 13: Initialize Capacitor project

**Files:**
- Modify: `package.json` (add Capacitor deps)
- Create: `capacitor.config.ts`

**Step 1: Install Capacitor**

Run:
```bash
npm install @capacitor/core @capacitor/app @capacitor/haptics @capacitor/network @capacitor/push-notifications @capacitor/status-bar @capacitor/splash-screen
npm install -D @capacitor/cli
```

**Step 2: Initialize Capacitor**

Run:
```bash
npx cap init Markium com.markium.app --web-dir dist
```

**Step 3: Update capacitor.config.ts**

Replace generated config with:

```ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.markium.app',
  appName: 'Markium',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#00A76F',
    },
  },
};

export default config;
```

**Step 4: Add platform projects**

Run:
```bash
npx cap add android
npx cap add ios
```

**Step 5: Add Capacitor scripts to package.json**

Add to `scripts`:

```json
"cap:sync": "npx cap sync",
"cap:android": "npx cap open android",
"cap:ios": "npx cap open ios",
"build:mobile": "npm run build && npx cap sync"
```

**Step 6: Add android/ and ios/ to .gitignore**

These are generated — add to `.gitignore`:

```
# Capacitor native projects
android/
ios/
```

**Step 7: Commit**

```bash
git add package.json package-lock.json capacitor.config.ts .gitignore
git commit -m "feat(capacitor): initialize Capacitor with Android and iOS support"
```

---

### Task 14: Create platform detection utilities

**Files:**
- Create: `src/utils/platform.js`

**Step 1: Create platform utility**

Create `src/utils/platform.js`:

```js
let _isNative = false;

try {
  // Dynamic import to avoid bundling Capacitor in web builds
  const { Capacitor } = await import('@capacitor/core');
  _isNative = Capacitor.isNativePlatform();
} catch {
  _isNative = false;
}

export const isNativePlatform = () => _isNative;

export const getPlatform = () => {
  if (!_isNative) return 'web';
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('android')) return 'android';
  if (ua.includes('iphone') || ua.includes('ipad')) return 'ios';
  return 'web';
};

export const isIos = () => getPlatform() === 'ios';
export const isAndroid = () => getPlatform() === 'android';
```

**Step 2: Update push notification service for native**

In `src/services/push-notifications.js`, add native platform support at the top:

```js
import { isNativePlatform } from 'src/utils/platform';

// In subscribeToPush():
export async function subscribeToPush() {
  if (isNativePlatform()) {
    return subscribeNativePush();
  }
  // ... existing web push code
}

async function subscribeNativePush() {
  const { PushNotifications } = await import('@capacitor/push-notifications');

  const permission = await PushNotifications.requestPermissions();
  if (permission.receive !== 'granted') {
    throw new Error('Push permission denied');
  }

  await PushNotifications.register();

  return new Promise((resolve, reject) => {
    PushNotifications.addListener('registration', (token) => {
      // Send FCM/APNs token to backend
      axios.post('/push/subscribe-native', { token: token.value, platform: getPlatform() });
      resolve(token);
    });
    PushNotifications.addListener('registrationError', reject);
  });
}
```

**Step 3: Commit**

```bash
git add src/utils/platform.js src/services/push-notifications.js
git commit -m "feat(capacitor): add platform detection and native push bridge"
```

---

## Phase 5: Translations

### Task 15: Add i18n keys for all PWA strings

**Files:**
- Modify: Locale files (find via `src/locales/langs/`)

**Step 1: Find locale files**

Search for where translations are stored. Look for `ar.json`, `en.json`, or similar files under `src/locales/`.

**Step 2: Add PWA translation keys**

Add to all locale files:

```json
{
  "pwa": {
    "update_available": "A new version is available",
    "refresh": "Refresh",
    "dismiss": "Later",
    "offline": "You are offline. Some features may be limited.",
    "push_enabled": "Notifications enabled!",
    "push_error": "Could not enable notifications",
    "push_prompt_title": "Stay updated",
    "push_prompt_body": "Get notified about new orders, inventory alerts, and more.",
    "push_enable": "Enable",
    "push_later": "Not now",
    "install_title": "Install Markium",
    "install_body": "Add to your home screen for a faster experience.",
    "install_button": "Install",
    "install_dismiss": "Not now",
    "synced": "Changes synced",
    "saved_offline": "Saved offline — will sync when connected"
  },
  "nav": {
    "more": "More"
  }
}
```

Translate to Arabic (ar) as appropriate.

**Step 3: Commit**

```bash
git add src/locales/
git commit -m "feat(i18n): add PWA-related translation keys"
```

---

## Summary of Tasks

| # | Task | Phase | Key Files |
|---|------|-------|-----------|
| 1 | Install & configure vite-plugin-pwa | PWA Core | `vite.config.js`, `package.json` |
| 2 | Enhance manifest.json | PWA Core | `public/manifest.json` |
| 3 | Register SW + update prompt | PWA Core | `src/components/pwa/sw-update-prompt.jsx` |
| 4 | Offline detection hook + UI | PWA Core | `src/hooks/use-network-status.js`, `src/components/pwa/offline-indicator.jsx` |
| 5 | Push notification service | Push | `src/services/push-notifications.js` |
| 6 | Push permission prompt | Push | `src/components/pwa/push-permission-prompt.jsx`, `src/hooks/use-push-notifications.js` |
| 7 | Custom SW with push handler | Push | `src/sw-custom.js` |
| 8 | Bottom navigation component | Mobile UX | `src/layouts/dashboard/bottom-nav.jsx` |
| 9 | Integrate bottom nav in layout | Mobile UX | `src/layouts/dashboard/index.jsx` |
| 10 | Page transitions | Mobile UX | `src/components/animate/page-transition.jsx` |
| 11 | Pull-to-refresh component | Mobile UX | `src/components/pwa/pull-to-refresh.jsx` |
| 12 | Install prompt banner | PWA Core | `src/components/pwa/install-prompt.jsx` |
| 13 | Initialize Capacitor | Capacitor | `capacitor.config.ts`, `package.json` |
| 14 | Platform detection + native push | Capacitor | `src/utils/platform.js` |
| 15 | i18n translations | Polish | Locale files |

# PWA + Mobile App Design for Markium Client

**Date:** 2026-03-03
**Status:** Approved
**Approach:** vite-plugin-pwa (Workbox) + Capacitor

---

## Goals

1. Convert markium-client into a full PWA with offline support
2. Add push notifications (orders, marketing, inventory alerts) via Web Push API (VAPID)
3. Deliver smooth native-like mobile UX (bottom nav, transitions, pull-to-refresh)
4. Enable app store distribution via Capacitor (Google Play + Apple App Store)

---

## Architecture

Three layers built on top of the existing React + Vite + MUI app:

1. **PWA Core** — service worker (Workbox via vite-plugin-pwa), caching, offline support, install prompt, SW update flow
2. **Push Notifications** — VAPID subscription, permission prompt, notification handler, Capacitor native bridge
3. **Mobile UX** — bottom navigation bar, page transitions (framer-motion), pull-to-refresh, haptic feedback

### Caching Strategy (Workbox)

| Resource | Strategy | Reason |
|----------|----------|--------|
| App shell (HTML/CSS/JS) | Precache | Instant load, updated on new deploy |
| Vendor chunks (React, MUI) | Cache-first | Rarely change, large files |
| Page chunks (lazy routes) | Stale-while-revalidate | Fast load + stays fresh |
| API responses (`/api/v1/*`) | Network-first, cache fallback | Fresh data when online, cached when offline |
| Images/assets (S3) | Cache-first, 30-day expiry | Static content |

---

## Push Notifications

### Flow

1. App loads after login
2. Soft prompt: "Would you like order notifications?" (custom UI, not browser dialog)
3. If accepted → browser permission dialog → `PushManager.subscribe(VAPID)`
4. Subscription sent to backend: `POST /push/subscribe` with `{endpoint, p256dh, auth}`
5. Backend stores subscription per user per device
6. On events (new order, low stock, etc.) → backend sends push via VAPID
7. Service worker receives push → shows notification with type + URL
8. User taps notification → app opens/focuses and navigates to relevant page

### Backend API Requirements

- `POST /push/subscribe` — store push subscription
- `DELETE /push/subscribe` — unsubscribe device
- `GET /push/preferences` — get user notification preferences
- `PUT /push/preferences` — update preferences (toggle order/marketing/inventory)
- Server-side `web-push` library for VAPID push delivery

### Native Bridge (Capacitor)

When running inside Capacitor native shell:
- Detect via `Capacitor.isNativePlatform()`
- Use `@capacitor/push-notifications` instead of Web Push API
- Same subscription flow, different transport (APNs for iOS, FCM for Android)

### Notification Types

- **Order**: new order, status change, delivery update
- **Marketing**: promotions, flash sales, announcements
- **Inventory**: low stock, out of stock, restock alerts

Each notification payload includes `{type, title, body, url, icon}`.

---

## Mobile UX

### Bottom Navigation Bar

Shown on screens `< md` (below 768px). Replaces hamburger sidebar on mobile.

**5 tabs:**
1. Dashboard (home)
2. Orders (with unread badge)
3. Quick Action (new order/product)
4. Analytics
5. More (bottom sheet with remaining menu items)

- Active tab: brand green `#00A76F`
- Existing desktop sidebar (`lg+`) unchanged
- Badge indicator on Orders tab for new order count

### Page Transitions (framer-motion)

- **Forward nav**: slide in from right (from left in RTL/Arabic)
- **Back nav**: slide out to right (to left in RTL)
- **Tab switch**: crossfade (150ms)
- **Modal/sheet**: slide up from bottom

### Pull-to-Refresh

- On list pages (orders, products, inventory)
- Triggers SWR `mutate()` to revalidate data
- Spring animation for native rubber-band feel

### Other Native Touches

- Haptic feedback on tab switch and pull-to-refresh (`navigator.vibrate()` / Capacitor `Haptics`)
- iOS safe areas already handled via `env(safe-area-inset-*)` in global.css
- Custom install prompt banner for first-time mobile visitors (shown after 2nd visit, dismissible)

---

## Capacitor Integration

### Project Structure

```
markium-client/
  src/                    # Existing React app (unchanged)
  public/                 # Existing assets
  capacitor.config.ts     # Capacitor config
  android/                # Generated Android project
  ios/                    # Generated iOS project
```

### Capacitor Plugins

- `@capacitor/core` + `@capacitor/cli` — base runtime
- `@capacitor/push-notifications` — native push (APNs/FCM)
- `@capacitor/haptics` — vibration/haptic feedback
- `@capacitor/status-bar` — status bar color/style control
- `@capacitor/splash-screen` — launch screen
- `@capacitor/app` — app lifecycle events (resume, background)
- `@capacitor/network` — network status detection

### Platform Detection

```js
import { Capacitor } from '@capacitor/core';

if (Capacitor.isNativePlatform()) {
  // Native push, haptics, status bar
} else {
  // Web Push API, navigator.vibrate()
}
```

---

## Offline Sync

### Queue Strategy

```
User action → Network available?
  → Yes: Send immediately
  → No: Queue in IndexedDB → "Saved offline" toast
       → Back online: Replay queued actions → "Synced" toast
```

- Uses Workbox Background Sync plugin
- Queue persisted in IndexedDB (survives app restart)
- Conflict resolution: last-write-wins for simple updates
- Max retry: 24 hours, then discard with user notification

---

## Service Worker Update Flow

1. SW detects new version in background
2. Toast: "New version available" with "Refresh" button
3. User taps → `skipWaiting()` + reload
4. No forced refresh — user stays in control

---

## Manifest Enhancements

Current `manifest.json` needs:
- `description` field
- `scope: "/"`
- `id: "/"`
- `orientation: "portrait"`
- `categories: ["business", "shopping"]`
- `screenshots` (for richer install prompt)
- `maskable` icon purpose on existing icons
- `display_override: ["standalone", "minimal-ui"]`

---

## Dependencies to Add

### NPM Packages

- `vite-plugin-pwa` — Workbox integration for Vite
- `@capacitor/core` — Capacitor runtime
- `@capacitor/cli` — Capacitor CLI (dev dependency)
- `@capacitor/push-notifications` — native push
- `@capacitor/haptics` — haptic feedback
- `@capacitor/status-bar` — status bar control
- `@capacitor/splash-screen` — splash screen
- `@capacitor/app` — app lifecycle
- `@capacitor/network` — network detection

### Environment Variables

- `VITE_VAPID_PUBLIC_KEY` — VAPID public key for Web Push subscriptions

### Backend Dependencies (separate repo)

- `web-push` library (Node.js) or equivalent for your backend stack
- VAPID key pair generation
- Push subscription storage (database table)
- Push sending service/queue

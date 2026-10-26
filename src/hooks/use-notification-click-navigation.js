import { useEffect } from 'react';

import { useRouter } from 'src/routes/hooks';

// ----------------------------------------------------------------------

// The service worker asks an open tab to route to a notification's page (e.g. the
// order) instead of reloading it — see the `notificationclick` handler in sw-custom.js.
export function useNotificationClickNavigation() {
  const router = useRouter();

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return undefined;

    const handleMessage = (event) => {
      if (event.data?.type !== 'NOTIFICATION_CLICK' || !event.data.url) return;

      const url = new URL(event.data.url, window.location.origin);
      if (url.origin !== window.location.origin) return;

      router.push(`${url.pathname}${url.search}${url.hash}`);
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
  }, [router]);
}

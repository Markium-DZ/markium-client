import axios, { endpoints } from 'src/utils/axios';

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

export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export async function subscribeToPush() {
  if (!isPushSupported()) {
    throw new Error('Push notifications not supported on this device/browser');
  }
  if (!VAPID_PUBLIC_KEY) {
    throw new Error('Missing VITE_VAPID_PUBLIC_KEY');
  }

  const registration = await navigator.serviceWorker.ready;

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  const json = subscription.toJSON();
  await axios.post(endpoints.notifications.subscriptions, {
    endpoint: json.endpoint,
    keys: json.keys,
    device_type: 'web',
  });

  return subscription;
}

export async function unsubscribeFromPush() {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    const { endpoint } = subscription;
    await subscription.unsubscribe();
    await axios.delete(endpoints.notifications.subscriptions, { data: { endpoint } });
  }
}

export async function getSubscriptionStatus() {
  if (!isPushSupported()) {
    return { supported: false, subscribed: false, permission: 'unsupported' };
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  return {
    supported: true,
    subscribed: !!subscription,
    permission: Notification.permission,
  };
}

/**
 * Idempotent: if permission is already granted, make sure the current
 * subscription is registered with the backend (covers key rotation / fresh device).
 */
export async function ensureSubscribed() {
  if (!isPushSupported() || Notification.permission !== 'granted') {
    return;
  }
  try {
    await subscribeToPush();
  } catch (err) {
    console.error('ensureSubscribed failed:', err);
  }
}

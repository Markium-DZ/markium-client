import axios from 'src/utils/axios';
import { isNativePlatform, getPlatform } from 'src/utils/platform';

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

export async function subscribeToPush() {
  if (isNativePlatform()) {
    return subscribeNativePush();
  }

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

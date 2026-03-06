import useSWR from 'swr';
import { useMemo, useCallback } from 'react';

import axios, { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

const MOCK_NOTIFICATIONS = [
  {
    id: 'notif-1',
    type: 'order',
    title: 'طلب جديد #1234',
    body: 'زبون طلب 3 منتجات',
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    action_url: '/dashboard/order',
    metadata: {},
  },
  {
    id: 'notif-2',
    type: 'inventory',
    title: 'مخزون منخفض',
    body: 'منتج "قهوة عربية" وصل للحد الأدنى',
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    action_url: '/dashboard/inventory',
    metadata: {},
  },
  {
    id: 'notif-3',
    type: 'system',
    title: 'تحديث النظام',
    body: 'تم تحديث النظام بنجاح',
    is_read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    action_url: null,
    metadata: {},
  },
  {
    id: 'notif-4',
    type: 'order',
    title: 'طلب ملغى #1230',
    body: 'الزبون ألغى الطلب',
    is_read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    action_url: '/dashboard/order',
    metadata: {},
  },
  {
    id: 'notif-5',
    type: 'account',
    title: 'مستخدم جديد',
    body: 'تم إضافة موظف جديد للفريق',
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    action_url: null,
    metadata: {},
  },
];

// ----------------------------------------------------------------------

export function useGetNotifications() {
  const URL = endpoints.notifications.root;

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    // Fallback to mock data when API is not ready (404)
    onErrorRetry: (err, key, config, revalidate, { retryCount }) => {
      if (err?.status === 404) return;
      const delays = [5000, 10000, 20000];
      if (retryCount >= delays.length) return;
      setTimeout(() => revalidate({ retryCount }), delays[retryCount]);
    },
  });

  // Use API data if available, otherwise fall back to mock
  const isMock = !!error;
  const notifications = data?.data || (isMock ? MOCK_NOTIFICATIONS : []);
  const unreadCount = isMock
    ? notifications.filter((n) => !n.is_read).length
    : (data?.unread_count ?? 0);

  const memoizedValue = useMemo(
    () => ({
      notifications,
      unreadCount,
      notificationsLoading: isLoading,
      notificationsError: isMock ? null : error,
      notificationsValidating: isValidating,
      notificationsEmpty: !isLoading && !notifications.length,
      notificationsMutate: mutate,
    }),
    [notifications, unreadCount, isLoading, error, isMock, isValidating, mutate]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export async function markAsRead(id) {
  const URL = endpoints.notifications.read(id);
  return axios.post(URL);
}

export async function markAllAsRead() {
  const URL = endpoints.notifications.readAll;
  return axios.post(URL);
}

export async function deleteNotification(id) {
  const URL = endpoints.notifications.delete(id);
  return axios.delete(URL);
}

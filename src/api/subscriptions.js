import useSWR from 'swr';
import { useMemo } from 'react';

import axios, { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

const options = {
  revalidateIfStale: true,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  onErrorRetry: (err, key, config, revalidate, { retryCount }) => {
    const delays = [5000, 10000, 20000, 30000];
    if (retryCount >= delays.length) return;
    setTimeout(() => revalidate({ retryCount }), delays[retryCount]);
  },
};

// ----------------------------------------------------------------------

/**
 * Get available subscription packages
 * GET /subscriptions/packages
 */
export function useGetSubscriptionPackages() {
  const url = endpoints.subscriptions.packages;

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, options);

  const memoizedValue = useMemo(
    () => ({
      packages: data?.data || [],
      packagesLoading: isLoading,
      packagesError: error,
      packagesValidating: isValidating,
      packagesEmpty: !isLoading && !data?.data?.length,
      packagesMutate: mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

/**
 * Get paginated list of subscription payments
 * GET /subscriptions/payments
 */
export function useGetSubscriptionPayments(page = 1, perPage = 15) {
  const params = new URLSearchParams({ page, per_page: perPage });
  const url = `${endpoints.subscriptions.payments}?${params.toString()}`;

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, options);

  const memoizedValue = useMemo(
    () => ({
      payments: data?.data || [],
      pagination: data?.pagination || {},
      paymentsLoading: isLoading,
      paymentsError: error,
      paymentsValidating: isValidating,
      paymentsEmpty: !isLoading && !data?.data?.length,
      paymentsMutate: mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

/**
 * Get single subscription payment detail
 * GET /subscriptions/payments/{id}
 */
export function useGetSubscriptionPayment(paymentId) {
  const url = paymentId ? endpoints.subscriptions.payment(paymentId) : null;

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, options);

  const memoizedValue = useMemo(
    () => ({
      payment: data?.data || null,
      paymentLoading: isLoading,
      paymentError: error,
      paymentValidating: isValidating,
      paymentMutate: mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

/**
 * Get current subscription status
 * GET /subscriptions/current
 */
export function useGetCurrentSubscription() {
  const url = endpoints.subscriptions.current;

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, options);

  const memoizedValue = useMemo(
    () => ({
      subscription: data?.data || null,
      subscriptionLoading: isLoading,
      subscriptionError: error,
      subscriptionValidating: isValidating,
      subscriptionMutate: mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

/**
 * Initiate subscription checkout
 * POST /subscriptions/checkout
 * @param {Object} body - { package_slug: string, payment_method?: 'edahabia' | 'cib' }
 * @returns {Promise<{ checkout_url: string, payment_id: number }>}
 */
export async function checkoutSubscription(body) {
  const URL = endpoints.subscriptions.checkout;
  const response = await axios.post(URL, body);
  return response.data;
}

import useSWR from 'swr';
import { useMemo } from 'react';
import axios, { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

const options = {
  revalidateIfStale: true,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

// ----------------------------------------------------------------------

/**
 * Get available add-ons for current tier
 * GET /add-ons
 */
export function useGetAvailableAddOns() {
  const url = endpoints.addons.available;

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, options);

  const memoizedValue = useMemo(
    () => ({
      addOns: data?.data || [],
      addOnsLoading: isLoading,
      addOnsError: error,
      addOnsValidating: isValidating,
      addOnsEmpty: !isLoading && !data?.data?.length,
      addOnsMutate: mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

/**
 * Get active add-ons
 * GET /add-ons/active
 */
export function useGetActiveAddOns() {
  const url = endpoints.addons.active;

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, options);

  const memoizedValue = useMemo(
    () => ({
      activeAddOns: data?.data || [],
      activeAddOnsLoading: isLoading,
      activeAddOnsError: error,
      activeAddOnsValidating: isValidating,
      activeAddOnsEmpty: !isLoading && !data?.data?.length,
      activeAddOnsMutate: mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

/**
 * Checkout add-on
 * POST /add-ons/checkout
 * @param {Object} body - { add_on_slug: string, payment_method: string }
 */
export async function checkoutAddOn(body) {
  const URL = endpoints.addons.checkout;
  const response = await axios.post(URL, body);
  return response.data;
}

// ----------------------------------------------------------------------

/**
 * Cancel an active add-on
 * POST /add-ons/{id}/cancel
 */
export async function cancelAddOn(clientAddOnId) {
  const URL = endpoints.addons.cancel(clientAddOnId);
  const response = await axios.post(URL);
  return response.data;
}

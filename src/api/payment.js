import useSWR from 'swr';
import { useMemo } from 'react';
import axios, { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

const options = {
  revalidateIfStale: true,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

export function useGetPaymentProviders() {
  const url = endpoints.payment.providers;

  const { data, isLoading, error, isValidating, mutate } = useSWR(
    url,
    fetcher,
    options
  );

  const memoizedValue = useMemo(
    () => ({
      providers: data?.data || [],
      providersLoading: isLoading,
      providersError: error,
      providersValidating: isValidating,
      providersEmpty: !isLoading && !data?.data?.length,
      mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

export function useGetPaymentConnections() {
  const url = endpoints.payment.connections;

  const { data, isLoading, error, isValidating, mutate } = useSWR(
    url,
    fetcher,
    options
  );

  const memoizedValue = useMemo(
    () => ({
      connections: data?.data || [],
      connectionsLoading: isLoading,
      connectionsError: error,
      connectionsValidating: isValidating,
      connectionsEmpty: !isLoading && !data?.data?.length,
      mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export async function createPaymentConnection(body) {
  const URL = endpoints.payment.connections;
  return await axios.post(URL, body);
}

export async function updatePaymentConnection(connectionId, body) {
  const URL = endpoints.payment.updateConnection(connectionId);
  return await axios.patch(URL, body);
}

export async function validatePaymentConnection(connectionId) {
  const URL = endpoints.payment.validateConnection(connectionId);
  return await axios.post(URL);
}

export async function setDefaultPaymentConnection(connectionId) {
  const URL = endpoints.payment.setDefaultConnection(connectionId);
  return await axios.post(URL);
}

export async function deletePaymentConnection(connectionId) {
  const URL = endpoints.payment.deleteConnection(connectionId);
  return await axios.delete(URL);
}

// ----------------------------------------------------------------------

/**
 * Hook to get enabled payment connections for checkout
 * Returns only active connections with their provider information
 */
export function useGetEnabledPaymentMethods() {
  const { connections, connectionsLoading, connectionsError, mutate } = useGetPaymentConnections();

  const memoizedValue = useMemo(
    () => ({
      paymentMethods: connections?.filter(conn => conn.is_active) || [],
      paymentMethodsLoading: connectionsLoading,
      paymentMethodsError: connectionsError,
      mutate,
    }),
    [connections, connectionsLoading, connectionsError, mutate]
  );

  return memoizedValue;
}

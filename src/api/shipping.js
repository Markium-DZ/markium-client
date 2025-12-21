import useSWR from 'swr';
import { useMemo } from 'react';
import axios, { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

const options = {
  revalidateIfStale: true,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

export function useGetShippingProviders() {
  const url = endpoints.shipping.providers;

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

export function useGetShippingConnections() {
  const url = endpoints.shipping.connections;

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

export async function createShippingConnection(body) {
  const URL = endpoints.shipping.connections;
  return await axios.post(URL, body);
}

export async function updateShippingConnection(connectionId, body) {
  const URL = endpoints.shipping.updateConnection(connectionId);
  return await axios.patch(URL, body);
}

export async function validateShippingConnection(connectionId) {
  const URL = endpoints.shipping.validateConnection(connectionId);
  return await axios.post(URL);
}

export async function setDefaultShippingConnection(connectionId) {
  const URL = endpoints.shipping.setDefaultConnection(connectionId);
  return await axios.post(URL);
}

export async function deleteShippingConnection(connectionId) {
  const URL = endpoints.shipping.deleteConnection(connectionId);
  return await axios.delete(URL);
}

// ----------------------------------------------------------------------

export function useGetShippingRates(orderId) {
  const url = orderId ? endpoints.shipping.orderRatesByProvider(orderId) : null;

  const { data, isLoading, error, isValidating, mutate } = useSWR(
    url,
    fetcher,
    options
  );

  const memoizedValue = useMemo(
    () => {
      // Transform provider-grouped data into flat quotes array with provider info
      const providerData = data?.data || {};
      const quotes = [];

      Object.keys(providerData).forEach((providerName) => {
        const providerQuotes = providerData[providerName] || [];
        providerQuotes.forEach((quote) => {
          quotes.push({
            ...quote,
            providerName, // Add provider name to each quote for grouping
          });
        });
      });

      return {
        quotes,
        quotesGroupedByProvider: providerData, // Keep original grouped structure
        ratesLoading: isLoading,
        ratesError: error,
        ratesValidating: isValidating,
        ratesEmpty: !isLoading && quotes.length === 0,
        mutate,
      };
    },
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

export async function refreshShippingRates(orderId) {
  const URL = endpoints.shipping.refreshOrderRates(orderId);
  return await axios.post(URL);
}

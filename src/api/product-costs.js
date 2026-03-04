import useSWR from 'swr';
import { useMemo } from 'react';

import axios, { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

const options = {
  revalidateIfStale: true,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  onErrorRetry: (err, key, config, revalidate, { retryCount }) => {
    if (err?.status === 403) return;
    const delays = [5000, 10000, 20000, 30000];
    if (retryCount >= delays.length) return;
    setTimeout(() => revalidate({ retryCount }), delays[retryCount]);
  },
};

// ----------------------------------------------------------------------

export function useGetProductCosts(productId) {
  const url = productId ? endpoints.productCosts.list(productId) : null;

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, options);

  const memoizedValue = useMemo(
    () => ({
      costs: data?.data || [],
      costsLoading: isLoading,
      costsError: error,
      costsValidating: isValidating,
      costsEmpty: !isLoading && !data?.data?.length,
      costsMutate: mutate,
    }),
    [data?.data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export async function createProductCost(productId, body) {
  const url = endpoints.productCosts.create(productId);
  return await axios.post(url, body);
}

export async function updateProductCost(productId, costId, body) {
  const url = endpoints.productCosts.update(productId, costId);
  return await axios.put(url, body);
}

export async function deleteProductCost(productId, costId) {
  const url = endpoints.productCosts.delete(productId, costId);
  return await axios.delete(url);
}


import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';
import axios, { fetcher, endpoints } from 'src/utils/axios';
import { capture } from 'src/utils/analytics';

// ----------------------------------------------------------------------



const options = {
    revalidateIfStale: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
};



export function useGetMyStore(slug) {
  const URL = endpoints.store.slug(slug);
  const { data, isLoading, error, isValidating, mutate } = useSWR(
    URL,
    fetcher,
    options
  );

  const memoizedValue = useMemo(
    () => ({
      store: data?.data?.store || {},
      storeLoading: isLoading,
      storeError: error,
      storeValidating: isValidating,
      storeEmpty: !isLoading && !data?.data?.length,
      mutate,
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}


export async function updateStoreLogo(formData) {
  const URL = endpoints.store.root;

  const response = await axios.post(URL, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  capture('store_updated', { updated_fields: ['logo'] });
  return response;
}


export async function updateStoreConfig(formData) {
  const URL = endpoints.store.root;

  const response = await axios.post(URL, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  capture('store_updated', { updated_fields: ['config'] });
  return response;
}

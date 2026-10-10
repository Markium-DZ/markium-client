import useSWR from 'swr';
import { useMemo } from 'react';

import axios , { fetcher, endpoints } from 'src/utils/axios';
import { HOST_API } from 'src/config-global';
import { capture } from 'src/utils/analytics';

// ----------------------------------------------------------------------

export function useGetProducts() {
  const URL = endpoints.product.root;
  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    onErrorRetry: (err, key, config, revalidate, { retryCount }) => {
      const delays = [5000, 10000, 20000, 30000];
      if (retryCount >= delays.length) return;
      setTimeout(() => revalidate({ retryCount }), delays[retryCount]);
    },
  });

  const memoizedValue = useMemo(
    () => ({
      products: data?.data || [],
      productsLoading: isLoading,
      productsError: error,
      productsValidating: isValidating,
      productsEmpty: !isLoading && !data?.data?.length,
      productsMutate: mutate,
    }),
    [data?.data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useGetProduct(productId) {
  const URL = endpoints.product.root;

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  const memoizedValue = useMemo(
    () => ({
      product: data?.data?.find((p) => p.id == productId) || null,
      productLoading: isLoading,
      productError: error,
      productValidating: isValidating,
      productMutate: mutate,
    }),
    [data?.data, error, isLoading, isValidating, productId, mutate]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useSearchProducts(query) {
  const URL = query ? [endpoints.product.search, { params: { query } }] : '';

  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  const memoizedValue = useMemo(
    () => ({
      searchResults: data?.results || [],
      searchLoading: isLoading,
      searchError: error,
      searchValidating: isValidating,
      searchEmpty: !isLoading && !data?.results.length,
    }),
    [data?.results, error, isLoading, isValidating]
  );
  return memoizedValue;
}



export async function createProduct(body) {
  const URL = endpoints.product.root;
  const response = await axios.post(URL, body);
  return response;
}

export async function updateProduct(id,body) {
  const URL = endpoints.product.update(id);
  const response = await axios.post(URL, body);
  capture('product_updated', { product_id: id });
  return response;
}

export async function deleteProduct(id) {
  const URL = endpoints.product.delete(id);
  const response = await axios.delete(URL);
  capture('product_deleted', { product_id: id });
  return response;
}

export async function deployProduct(id) {
  const URL = endpoints.product.deploy(id)
  const response = await axios.post(URL);
  return response;
}

// Hide a deployed product from the storefront (status → draft). Show again = deployProduct.
export async function unpublishProduct(id) {
  const URL = endpoints.product.unpublish(id);
  const response = await axios.post(URL);
  return response;
}

export async function uploadProductImages(id, body) {
  const URL = endpoints.product.assets(id);
  return await axios.post(URL, body);
}

export async function createMedia(files, onProgress) {
  const URL = endpoints.media.root;
  const formData = new FormData();

  files.forEach((file) => {
    formData.append('files[]', file);
  });

  return await axios.post(URL, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: onProgress
      ? (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      : undefined,
  });
}

// ----------------------------------------------------------------------

export async function updateProductVariant(productId, variantId, data) {
  const URL = `/products/${productId}/variants/${variantId}`;
  return await axios.put(URL, data);
}

export async function deleteProductVariant(productId, variantId) {
  const URL = `/products/${productId}/variants/${variantId}`;
  return await axios.delete(URL);
}

export async function addOptionValue(productId, data) {
  const res = await axios.post(`/products/${productId}/variants/add-option-value`, data);
  return res.data;
}
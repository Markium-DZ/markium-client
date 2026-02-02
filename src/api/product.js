import useSWR from 'swr';
import { useMemo } from 'react';

import axios , { fetcher, endpoints } from 'src/utils/axios';
import { HOST_API } from 'src/config-global';
import { capture } from 'src/utils/analytics';

// ----------------------------------------------------------------------

export function useGetProducts() {
  const URL = endpoints.product.root;
  const { data, isLoading, error, isValidating, mutate } = useSWR( URL, fetcher);

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
  const URL = endpoints.product.root ;

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);

  const memoizedValue = useMemo(
    () => ({
      product: data?.data?.find( p => p.id == productId) || null,
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
  const product = response.data?.data;
  capture('product_created', {
    product_id: product?.id,
    product_name: product?.name,
    variant_count: product?.variants?.length,
  });
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
  capture('product_deployment_started', { product_id: id });
  return response;
}

export async function uploadProductImages(id, body) {
  const URL = endpoints.product.assets(id);
  return await axios.post(URL, body);
}

export async function createMedia(files) {
  // const URL = '/media';
  const URL = endpoints.media.root;
  const formData = new FormData();

  files.forEach((file) => {
    formData.append('files[]', file);
  });

  return await axios.post(URL, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
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
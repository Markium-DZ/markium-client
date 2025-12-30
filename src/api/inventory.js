import useSWR from 'swr';
import { useMemo } from 'react';
import axios, { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

const options = {
  revalidateIfStale: true,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

/**
 * Hook to fetch inventory with pagination
 * @param {number} page - Current page number
 * @param {number} perPage - Number of items per page
 * @returns {object} Inventory data and loading states
 */
export function useGetInventory(page = 1, perPage = 20) {
  const params = new URLSearchParams({ page, per_page: perPage });
  const url = `${endpoints.inventory.root}?${params.toString()}`;

  const { data, isLoading, error, isValidating, mutate } = useSWR(
    url,
    fetcher,
    options
  );

  const memoizedValue = useMemo(
    () => ({
      inventory: data?.data || [],
      inventoryLoading: isLoading,
      inventoryError: error,
      inventoryValidating: isValidating,
      inventoryEmpty: !isLoading && !data?.data?.length,
      totalPages: data?.meta?.last_page || 1,
      currentPage: data?.meta?.current_page || page,
      total: data?.meta?.total || 0,
      mutate,
    }),
    [data, error, isLoading, isValidating, page, mutate]
  );

  return memoizedValue;
}

/**
 * Hook to fetch single inventory item details
 * @param {number} inventoryId - Inventory ID
 * @returns {object} Inventory item data and loading states
 */
export function useGetInventoryItem(inventoryId) {
  const url = inventoryId ? `${endpoints.inventory.root}/${inventoryId}` : null;

  const { data, isLoading, error, isValidating, mutate } = useSWR(
    url,
    fetcher,
    options
  );

  const memoizedValue = useMemo(
    () => ({
      inventoryItem: data?.data || null,
      inventoryItemLoading: isLoading,
      inventoryItemError: error,
      inventoryItemValidating: isValidating,
      mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

/**
 * Hook to fetch inventory tracking/history
 * @param {number} inventoryId - Inventory ID
 * @returns {object} Inventory tracking data and loading states
 */
export function useGetInventoryTracking(inventoryId) {
  const url = inventoryId ? endpoints.inventory.tracking(inventoryId) : null;

  const { data, isLoading, error, isValidating, mutate } = useSWR(
    url,
    fetcher,
    options
  );

  const memoizedValue = useMemo(
    () => ({
      trackingData: data?.data || [],
      trackingLoading: isLoading,
      trackingError: error,
      trackingValidating: isValidating,
      mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

/**
 * Hook to fetch inventory items (individual units)
 * @param {number} inventoryId - Inventory ID
 * @returns {object} Inventory items data and loading states
 */
export function useGetInventoryItems(inventoryId) {
  const url = inventoryId ? endpoints.inventory.items(inventoryId) : null;

  const { data, isLoading, error, isValidating, mutate } = useSWR(
    url,
    fetcher,
    options
  );

  const memoizedValue = useMemo(
    () => ({
      items: data?.data || [],
      itemsLoading: isLoading,
      itemsError: error,
      itemsValidating: isValidating,
      mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

/**
 * Hook to fetch individual item tracking
 * @param {number} inventoryId - Inventory ID
 * @param {number} itemId - Item ID
 * @returns {object} Item tracking data and loading states
 */
export function useGetItemTracking(inventoryId, itemId) {
  const url = inventoryId && itemId ? endpoints.inventory.itemTracking(inventoryId, itemId) : null;

  const { data, isLoading, error, isValidating, mutate } = useSWR(
    url,
    fetcher,
    options
  );

  const memoizedValue = useMemo(
    () => ({
      itemTracking: data?.data || [],
      itemTrackingLoading: isLoading,
      itemTrackingError: error,
      itemTrackingValidating: isValidating,
      itemDetails: data?.item || null,
      mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

/**
 * Update inventory quantity
 * @param {number} inventoryId - Inventory ID to update
 * @param {number} quantity - New quantity
 * @returns {Promise} Update response
 */
export async function updateInventoryQuantity(inventoryId, quantity) {
  const URL = `${endpoints.inventory.root}/${inventoryId}`;
  return await axios.patch(URL, { quantity });
}

/**
 * Adjust inventory quantity
 * @param {number} inventoryId - Inventory ID to adjust
 * @param {object} data - Adjustment data { quantity, type: 'addition'|'subtraction', notes }
 * @returns {Promise} Adjustment response
 */
export async function adjustInventoryQuantity(inventoryId, data) {
  const URL = `${endpoints.inventory.root}/${inventoryId}/adjust`;
  return await axios.post(URL, data);
}

/**
 * Hook to fetch low stock inventory with pagination
 * @param {number} page - Current page number
 * @param {number} perPage - Number of items per page
 * @returns {object} Low stock inventory data and loading states
 */
export function useGetLowStockInventory(page = 1, perPage = 20) {
  const params = new URLSearchParams({ page, per_page: perPage });
  const url = `${endpoints.inventory.lowStock}?${params.toString()}`;

  const { data, isLoading, error, isValidating, mutate } = useSWR(
    url,
    fetcher,
    options
  );

  const memoizedValue = useMemo(
    () => ({
      inventory: data?.data || [],
      inventoryLoading: isLoading,
      inventoryError: error,
      inventoryValidating: isValidating,
      inventoryEmpty: !isLoading && !data?.data?.length,
      totalPages: data?.meta?.last_page || 1,
      currentPage: data?.meta?.current_page || page,
      total: data?.meta?.total || 0,
      mutate,
    }),
    [data, error, isLoading, isValidating, page, mutate]
  );

  return memoizedValue;
}

/**
 * Hook to fetch inventory transactions
 * @param {number} inventoryId - Inventory ID
 * @returns {object} Inventory transactions data and loading states
 */
export function useGetInventoryTransactions(inventoryId) {
  const url = inventoryId ? endpoints.inventory.transactions(inventoryId) : null;

  const { data, isLoading, error, isValidating, mutate } = useSWR(
    url,
    fetcher,
    options
  );

  const memoizedValue = useMemo(
    () => ({
      transactions: data?.data || [],
      transactionsLoading: isLoading,
      transactionsError: error,
      transactionsValidating: isValidating,
      mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

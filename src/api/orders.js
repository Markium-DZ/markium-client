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

export function useGetOrdersByProduct(product_id) {
    // Only fetch if product_id is provided
    const shouldFetch = product_id != null && product_id !== undefined;

    const { data, isLoading, error, isValidating, mutate } = useSWR(
        shouldFetch ? endpoints.order.root : null,
        fetcher,
        options
    );

    const memoizedValue = useMemo(
        () => ({
            orders: data?.data || [],
            ordersLoading: isLoading,
            ordersError: error,
            ordersValidating: isValidating,
            ordersEmpty: !isLoading && !data?.data?.length,
            mutate,
        }),
        [data, error, isLoading, isValidating]
    );

    return memoizedValue;
}


/**
 * Orders list (server-side pagination + filters).
 *
 * Accepts either the legacy positional form `useGetOrders(page, perPage)` or an
 * options object `useGetOrders({ page, perPage, status, dateFrom, dateTo, search })`.
 * `dateFrom` / `dateTo` must be `yyyy-MM-dd` strings. Empty filters are omitted.
 */
export function useGetOrders(pageOrParams = 1, perPageArg = 100) {
    const isObject = pageOrParams !== null && typeof pageOrParams === 'object';
    const {
        page = 1,
        perPage = perPageArg,
        status,
        dateFrom,
        dateTo,
        search,
    } = isObject ? pageOrParams : { page: pageOrParams };

    const params = new URLSearchParams({ page, per_page: perPage });
    if (status && status !== 'all') params.set('status', status);
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);
    if (search && String(search).trim()) params.set('search', String(search).trim());

    const url = `${endpoints.order?.root}?${params.toString()}`;
    const { data, isLoading, error, isValidating, mutate } = useSWR(
        url,
        fetcher,
        // keepPreviousData: avoid flashing an empty list while the next page / filter loads
        { ...options, keepPreviousData: true }
    );

    const memoizedValue = useMemo(
        () => ({
            orders: data?.data || [],
            pagination: data?.pagination || null,
            ordersLoading: isLoading,
            ordersError: error,
            ordersValidating: isValidating,
            ordersEmpty: !isLoading && !data?.data?.length,
            mutate,
        }),
        [data, error, isLoading, isValidating, mutate]
    );

    return memoizedValue;
}

export function useGetOrder(order_id) {
    // const params = new URLSearchParams({ page, per_page: perPage });
    // const url = `${endpoints.order?.root}?${params.toString()}`;
    // console.log("url : ",url);
    const url = endpoints.order.root + "/" + order_id;

    const { data, isLoading, error, isValidating, mutate } = useSWR(
        url,
        fetcher,
        options
    );

    const memoizedValue = useMemo(
        () => ({
            order: data?.data || {},
            orderLoading: isLoading,
            orderError: error,
            orderValidating: isValidating,
            orderEmpty: !isLoading && !data?.data?.length,
            mutate,
        }),
        [data, error, isLoading, isValidating]
    );

    return memoizedValue;
}

// ----------------------------------------------------------------------


// ----------------------------------------------------------------------



export async function createProduct(body) {
    const URL = endpoints.product.root;

    return await axios.post(URL, body);
}



export async function updateOrder(order_id, body) {
    const URL = endpoints.order.root+"/"+order_id;
    return await axios.patch(URL, body);
}
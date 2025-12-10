import useSWR from 'swr';
import { useMemo } from 'react';
import axios, { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------




const options = {
    revalidateIfStale: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
};

export function useGetOrdersByProduct(product_id) {
    // Only fetch if product_id is provided
    const shouldFetch = product_id != null && product_id !== undefined;

    const { data, isLoading, error, isValidating, mutate } = useSWR(
        shouldFetch ? endpoints.product.orders(product_id) : null,
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


export function useGetOrders(page = 1, perPage = 100) {
    const params = new URLSearchParams({ page, per_page: perPage });
    const url = `${endpoints.order?.root}?${params.toString()}`;
    console.log("url : ",url);

    const { data, isLoading, error, isValidating, mutate } = useSWR(
        url,
        fetcher,
        options
    );
    console.log("data : ", data);
    console.log("error : ", error);

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

// ----------------------------------------------------------------------


// ----------------------------------------------------------------------



export async function createProduct(body) {
    const URL = endpoints.product.root;

    return await axios.post(URL, body);
}



export async function updateOrder(product_id, order_id, body) {
    const URL = endpoints.product.updateOrdersStatus(product_id, order_id);
    console.log(" URL : ", URL)
    return await axios.patch(URL, body);
}
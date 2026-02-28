import useSWR from 'swr';
import { useMemo } from 'react';
import axios, { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

const options = {
  revalidateIfStale: true,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
};

// ----------------------------------------------------------------------

/**
 * Get wallet balance
 * GET /wallet/balance
 */
export function useGetWalletBalance() {
  const url = endpoints.wallet.balance;

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, options);

  const memoizedValue = useMemo(
    () => ({
      balance: data?.data?.balance ?? 0,
      currency: data?.data?.currency || 'DZD',
      balanceLoading: isLoading,
      balanceError: error,
      balanceValidating: isValidating,
      balanceMutate: mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

/**
 * Get wallet transactions
 * GET /wallet/transactions
 */
export function useGetWalletTransactions(page = 1, perPage = 15) {
  const params = new URLSearchParams({ page, per_page: perPage });
  const url = `${endpoints.wallet.transactions}?${params.toString()}`;

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, options);

  const memoizedValue = useMemo(
    () => ({
      transactions: data?.data || [],
      pagination: data?.pagination || {},
      transactionsLoading: isLoading,
      transactionsError: error,
      transactionsValidating: isValidating,
      transactionsMutate: mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

/**
 * Initiate wallet top-up
 * POST /wallet/topup
 * @param {Object} body - { amount: number, payment_method: string }
 * @returns {Promise<{ checkout_url: string, payment_id: number }>}
 */
export async function walletTopup(body) {
  const URL = endpoints.wallet.topup;
  const response = await axios.post(URL, body);
  return response.data;
}

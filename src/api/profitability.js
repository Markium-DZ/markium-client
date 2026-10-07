import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

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

export function useGetStorePnL(dateFrom = '-30d') {
  const params = new URLSearchParams({ date_from: dateFrom });
  const url = `${endpoints.profitability.store}?${params.toString()}`;

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, options);

  const memoizedValue = useMemo(
    () => ({
      storePnL: data?.data || null,
      summary: data?.data?.summary || {},
      period: data?.data?.period || {},
      topProducts: data?.data?.top_profitable_products || [],
      topCampaigns: data?.data?.top_costly_campaigns || [],
      unitsSold: data?.data?.units_sold ?? 0,
      costPerUnit: data?.data?.cost_per_unit ?? 0,
      profitPerUnit: data?.data?.profit_per_unit ?? 0,
      storePnLLoading: isLoading,
      storePnLError: error,
      storePnLForbidden: error?.status === 403,
      storePnLValidating: isValidating,
      storePnLMutate: mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useGetProductsPnL(dateFrom = '-30d') {
  const params = new URLSearchParams({ date_from: dateFrom });
  const url = `${endpoints.profitability.products}?${params.toString()}`;

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, options);

  const memoizedValue = useMemo(
    () => ({
      products: data?.data?.products || [],
      period: data?.data?.period || {},
      productsPnLLoading: isLoading,
      productsPnLError: error,
      productsPnLForbidden: error?.status === 403,
      productsPnLValidating: isValidating,
      productsPnLMutate: mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useGetProductPnL(productId, dateFrom = '-30d') {
  const params = new URLSearchParams({ date_from: dateFrom });
  const url = productId
    ? `${endpoints.profitability.product(productId)}?${params.toString()}`
    : null;

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, options);

  const memoizedValue = useMemo(
    () => ({
      productPnL: data?.data || null,
      productInfo: data?.data?.product || {},
      period: data?.data?.period || {},
      revenue: data?.data?.revenue ?? 0,
      unitsSold: data?.data?.units_sold ?? 0,
      costs: data?.data?.costs || {},
      totalCosts: data?.data?.total_costs ?? 0,
      grossProfit: data?.data?.gross_profit ?? 0,
      profitMargin: data?.data?.profit_margin_pct ?? 0,
      profitPerUnit: data?.data?.profit_per_unit ?? 0,
      productPnLLoading: isLoading,
      productPnLError: error,
      productPnLForbidden: error?.status === 403,
      productPnLValidating: isValidating,
      productPnLMutate: mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useGetCampaignsROI(dateFrom = '-30d') {
  const params = new URLSearchParams({ date_from: dateFrom });
  const url = `${endpoints.profitability.campaigns}?${params.toString()}`;

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, options);

  const memoizedValue = useMemo(
    () => ({
      campaigns: data?.data?.campaigns || [],
      period: data?.data?.period || {},
      totalMarketingSpend: data?.data?.total_marketing_spend ?? 0,
      totalRevenue: data?.data?.total_revenue ?? 0,
      overallMarketingROI: data?.data?.overall_marketing_roi ?? 0,
      campaignsLoading: isLoading,
      campaignsError: error,
      campaignsForbidden: error?.status === 403,
      campaignsValidating: isValidating,
      campaignsMutate: mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useGetChannelsOverview(dateFrom = '-30d') {
  const params = new URLSearchParams({ date_from: dateFrom });
  const url = `${endpoints.profitability.channels}?${params.toString()}`;

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, options);

  const memoizedValue = useMemo(
    () => ({
      channels: data?.data?.channels || [],
      period: data?.data?.period || {},
      totalMarketingSpend: data?.data?.total_marketing_spend ?? 0,
      totalAttributedRevenue: data?.data?.total_attributed_revenue ?? 0,
      overallMarketingROI: data?.data?.overall_marketing_roi ?? 0,
      channelsLoading: isLoading,
      channelsError: error,
      channelsForbidden: error?.status === 403,
      channelsValidating: isValidating,
      channelsMutate: mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useGetChannelDetail(channel, dateFrom = '-30d') {
  const params = new URLSearchParams({ date_from: dateFrom });
  const url = channel
    ? `${endpoints.profitability.channel(channel)}?${params.toString()}`
    : null;

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, options);

  const memoizedValue = useMemo(
    () => ({
      channelDetail: data?.data || null,
      channelName: data?.data?.channel || channel,
      period: data?.data?.period || {},
      totalSpend: data?.data?.total_spend ?? 0,
      campaignsCount: data?.data?.campaigns_count ?? 0,
      productsReached: data?.data?.products_reached ?? 0,
      attributedRevenue: data?.data?.attributed_revenue ?? 0,
      roi: data?.data?.roi ?? 0,
      channelCampaigns: data?.data?.campaigns || [],
      channelDetailLoading: isLoading,
      channelDetailError: error,
      channelDetailForbidden: error?.status === 403,
      channelDetailValidating: isValidating,
      channelDetailMutate: mutate,
    }),
    [data, channel, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

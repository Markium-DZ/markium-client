import useSWR from 'swr';
import { useMemo } from 'react';
import { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

const options = {
  revalidateIfStale: true,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

// ----------------------------------------------------------------------

// Available date range options
export const DATE_RANGE_OPTIONS = [
  { value: '-7d', label: 'last_7_days' },
  { value: '-14d', label: 'last_14_days' },
  { value: '-30d', label: 'last_30_days' },
  { value: '-90d', label: 'last_90_days' },
];

// ----------------------------------------------------------------------

/**
 * Fetch analytics overview (total_orders, total_revenue, total_visitors, total_product_views)
 * @param {string} dateFrom - Date range: -7d, -14d, -30d, -90d (default: -30d)
 */
export function useGetAnalyticsOverview(dateFrom = '-30d') {
  const shouldFetch = dateFrom !== null;
  const params = new URLSearchParams({ date_from: dateFrom || '-30d' });
  const url = `${endpoints.analytics.overview}?${params.toString()}`;

  const { data, isLoading, error, isValidating, mutate } = useSWR(
    shouldFetch ? url : null,
    fetcher,
    options
  );

  console.log("momodatra :",data);

  const memoizedValue = useMemo(() => {
    const metrics = data?.data?.metrics || {};
    return {
      overview: metrics,
      totalOrders: metrics.total_orders?.count ?? 0,
      totalOrdersData: metrics.total_orders?.data ?? [],
      totalOrdersLabels: metrics.total_orders?.labels ?? [],
      totalRevenue: metrics.total_revenue?.count ?? 0,
      totalRevenueData: metrics.total_revenue?.data ?? [],
      totalRevenueLabels: metrics.total_revenue?.labels ?? [],
      totalVisitors: metrics.total_visitors?.count ?? 0,
      totalVisitorsData: metrics.total_visitors?.data ?? [],
      totalVisitorsLabels: metrics.total_visitors?.labels ?? [],
      totalProductViews: metrics.total_product_views?.count ?? 0,
      totalProductViewsData: metrics.total_product_views?.data ?? [],
      totalProductViewsLabels: metrics.total_product_views?.labels ?? [],
      overviewLoading: isLoading,
      overviewError: error,
      overviewValidating: isValidating,
      mutate,
    };
  }, [data, error, isLoading, isValidating, mutate]);

  return memoizedValue;
}

// ----------------------------------------------------------------------

/**
 * Fetch traffic data (unique visitors and product views time series)
 * @param {string} dateFrom - Date range: -7d, -14d, -30d, -90d (default: -30d)
 * @param {string} interval - Interval: day, week, month (default: day)
 */
export function useGetAnalyticsTraffic(dateFrom = '-30d', interval = 'day') {
  const shouldFetch = dateFrom !== null;
  const params = new URLSearchParams({ date_from: dateFrom || '-30d', interval });
  const url = `${endpoints.analytics.traffic}?${params.toString()}`;

  const { data, isLoading, error, isValidating, mutate } = useSWR(
    shouldFetch ? url : null,
    fetcher,
    options
  );

  const memoizedValue = useMemo(() => {
    const traffic = data?.data?.traffic || [];
    return {
      traffic,
      visitors: traffic[0] || { count: 0, data: [], labels: [] },
      productViews: traffic[1] || { count: 0, data: [], labels: [] },
      trafficLoading: isLoading,
      trafficError: error,
      trafficValidating: isValidating,
      mutate,
    };
  }, [data, error, isLoading, isValidating, mutate]);

  return memoizedValue;
}

// ----------------------------------------------------------------------

/**
 * Fetch conversion funnel data
 * @param {string} dateFrom - Date range: -7d, -14d, -30d, -90d (default: -30d)
 */
export function useGetAnalyticsFunnel(dateFrom = '-30d') {
  const shouldFetch = dateFrom !== null;
  const params = new URLSearchParams({ date_from: dateFrom || '-30d' });
  const url = `${endpoints.analytics.funnel}?${params.toString()}`;

  const { data, isLoading, error, isValidating, mutate } = useSWR(
    shouldFetch ? url : null,
    fetcher,
    options
  );

  const memoizedValue = useMemo(() => {
    const funnel = data?.data?.funnel || [];
    return {
      funnel,
      pageviews: funnel.find((f) => f.name === '$pageview')?.count ?? 0,
      productViewed: funnel.find((f) => f.name === 'product_viewed')?.count ?? 0,
      addToCart: funnel.find((f) => f.name === 'add_to_cart')?.count ?? 0,
      checkoutStarted: funnel.find((f) => f.name === 'checkout_started')?.count ?? 0,
      orderCompleted: funnel.find((f) => f.name === 'order_completed')?.count ?? 0,
      funnelLoading: isLoading,
      funnelError: error,
      funnelValidating: isValidating,
      mutate,
    };
  }, [data, error, isLoading, isValidating, mutate]);

  return memoizedValue;
}

// ----------------------------------------------------------------------

/**
 * Fetch top products by view count
 * @param {string} dateFrom - Date range: -7d, -14d, -30d, -90d (default: -30d)
 */
export function useGetAnalyticsTopProducts(dateFrom = '-30d') {
  const shouldFetch = dateFrom !== null;
  const params = new URLSearchParams({ date_from: dateFrom || '-30d' });
  const url = `${endpoints.analytics.topProducts}?${params.toString()}`;

  const { data, isLoading, error, isValidating, mutate } = useSWR(
    shouldFetch ? url : null,
    fetcher,
    options
  );

  const memoizedValue = useMemo(
    () => ({
      topProducts: data?.data?.top_products || [],
      topProductsLoading: isLoading,
      topProductsError: error,
      topProductsValidating: isValidating,
      topProductsEmpty: !isLoading && !data?.data?.top_products?.length,
      mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

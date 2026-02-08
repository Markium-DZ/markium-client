import useSWR from 'swr';
import { useMemo } from 'react';
import { fetcher, endpoints } from 'src/utils/axios';

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

// ----------------------------------------------------------------------

// Available date range options
export const DATE_RANGE_OPTIONS = [
  { value: '-1d', label: 'last_1_day' },
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

  const memoizedValue = useMemo(() => {
    const metrics = data?.data?.metrics || {};
    // Backend may return plain numbers or objects with { count, data, labels }
    const val = (m) => (typeof m === 'object' && m !== null ? m.count ?? 0 : m ?? 0);
    const arr = (m, key) => (typeof m === 'object' && m !== null ? m[key] ?? [] : []);
    return {
      overview: metrics,
      totalOrders: val(metrics.total_orders),
      totalOrdersData: arr(metrics.total_orders, 'data'),
      totalOrdersLabels: arr(metrics.total_orders, 'labels'),
      totalRevenue: val(metrics.total_revenue),
      totalRevenueData: arr(metrics.total_revenue, 'data'),
      totalRevenueLabels: arr(metrics.total_revenue, 'labels'),
      totalVisitors: val(metrics.total_visitors),
      totalVisitorsData: arr(metrics.total_visitors, 'data'),
      totalVisitorsLabels: arr(metrics.total_visitors, 'labels'),
      totalProductViews: val(metrics.total_product_views),
      totalProductViewsData: arr(metrics.total_product_views, 'data'),
      totalProductViewsLabels: arr(metrics.total_product_views, 'labels'),
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
      orderCompleted: traffic[2] || { count: 0, data: [], labels: [] },
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

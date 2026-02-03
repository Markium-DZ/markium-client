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

/**
 * Fetch analytics overview (total_orders, total_revenue, total_visitors, total_product_views)
 * @param {string} dateFrom - Date range: -7d, -14d, -30d, -90d (default: -30d)
 */
export function useGetAnalyticsOverview(dateFrom = '-30d') {
  const params = new URLSearchParams({ date_from: dateFrom });
  const url = `${endpoints.analytics.overview}?${params.toString()}`;

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, options);

  const memoizedValue = useMemo(() => {
    const metrics = data?.data?.metrics || {};
    return {
      overview: metrics,
      totalOrders: metrics.total_orders?.[0]?.count ?? 0,
      totalOrdersData: metrics.total_orders?.[0]?.data ?? [],
      totalRevenue: metrics.total_revenue?.[0]?.count ?? 0,
      totalRevenueData: metrics.total_revenue?.[0]?.data ?? [],
      totalVisitors: metrics.total_visitors?.[0]?.count ?? 0,
      totalVisitorsData: metrics.total_visitors?.[0]?.data ?? [],
      totalProductViews: metrics.total_product_views?.[0]?.count ?? 0,
      totalProductViewsData: metrics.total_product_views?.[0]?.data ?? [],
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
  const params = new URLSearchParams({ date_from: dateFrom, interval });
  const url = `${endpoints.analytics.traffic}?${params.toString()}`;

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, options);

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
  const params = new URLSearchParams({ date_from: dateFrom });
  const url = `${endpoints.analytics.funnel}?${params.toString()}`;

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, options);

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
  const params = new URLSearchParams({ date_from: dateFrom });
  const url = `${endpoints.analytics.topProducts}?${params.toString()}`;

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, options);

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

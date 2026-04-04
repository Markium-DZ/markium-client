import useSWR from 'swr';
import { useMemo } from 'react';
import axios, { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

const options = {
  revalidateIfStale: true,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  onErrorRetry: (err, key, config, revalidate, { retryCount }) => {
    // Don't retry on auth/subscription errors (401, 403)
    if (err?.status === 401 || err?.status === 403) return;
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
 * Fetch analytics capabilities — what sections the current user can access.
 * Each section has { accessible, required_feature } based on per-feature gating.
 */
export function useGetAnalyticsCapabilities() {
  const url = endpoints.analytics.capabilities;

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, options);

  const memoizedValue = useMemo(
    () => ({
      capabilities: data?.data || null,
      sections: data?.data?.sections || {},
      exportEnabled: data?.data?.export_enabled || false,
      capabilitiesLoading: isLoading,
      capabilitiesError: error,
      capabilitiesValidating: isValidating,
      capabilitiesMutate: mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

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

// ----------------------------------------------------------------------

/**
 * Fetch traffic sources — breakdown by referring domain
 * @param {string} dateFrom
 */
export function useGetAnalyticsTrafficSources(dateFrom = '-30d') {
  const shouldFetch = dateFrom !== null;
  const params = new URLSearchParams({ date_from: dateFrom || '-30d' });
  const url = `${endpoints.analytics.trafficSources}?${params.toString()}`;

  const { data, isLoading, error, isValidating, mutate } = useSWR(
    shouldFetch ? url : null,
    fetcher,
    options
  );

  const memoizedValue = useMemo(
    () => ({
      trafficSources: data?.data?.traffic_sources || [],
      trafficSourcesLoading: isLoading,
      trafficSourcesError: error,
      trafficSourcesValidating: isValidating,
      mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

/**
 * Fetch conversion rate — visitors vs buyers
 * @param {string} dateFrom
 */
export function useGetAnalyticsConversion(dateFrom = '-30d') {
  const shouldFetch = dateFrom !== null;
  const params = new URLSearchParams({ date_from: dateFrom || '-30d' });
  const url = `${endpoints.analytics.conversion}?${params.toString()}`;

  const { data, isLoading, error, isValidating, mutate } = useSWR(
    shouldFetch ? url : null,
    fetcher,
    options
  );

  const memoizedValue = useMemo(
    () => ({
      conversion: data?.data?.conversion || {},
      uniqueVisitors: data?.data?.conversion?.unique_visitors ?? 0,
      uniqueBuyers: data?.data?.conversion?.unique_buyers ?? 0,
      conversionRate: data?.data?.conversion?.conversion_rate ?? 0,
      conversionLoading: isLoading,
      conversionError: error,
      conversionValidating: isValidating,
      mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

/**
 * Fetch orders geography — orders count by wilaya
 * @param {string} dateFrom
 */
export function useGetAnalyticsOrdersGeography(dateFrom = '-30d') {
  const shouldFetch = dateFrom !== null;
  const params = new URLSearchParams({ date_from: dateFrom || '-30d' });
  const url = `${endpoints.analytics.ordersGeography}?${params.toString()}`;

  const { data, isLoading, error, isValidating, mutate } = useSWR(
    shouldFetch ? url : null,
    fetcher,
    options
  );

  const memoizedValue = useMemo(
    () => ({
      ordersGeography: data?.data?.orders_geography || [],
      ordersGeographyLoading: isLoading,
      ordersGeographyError: error,
      ordersGeographyValidating: isValidating,
      mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

/**
 * Fetch cart abandonment — cart vs checkout vs order trends
 * @param {string} dateFrom
 * @param {string} interval
 */
export function useGetAnalyticsCartAbandonment(dateFrom = '-30d', interval = 'day') {
  const shouldFetch = dateFrom !== null;
  const params = new URLSearchParams({ date_from: dateFrom || '-30d', interval });
  const url = `${endpoints.analytics.cartAbandonment}?${params.toString()}`;

  const { data, isLoading, error, isValidating, mutate } = useSWR(
    shouldFetch ? url : null,
    fetcher,
    options
  );

  const memoizedValue = useMemo(
    () => ({
      cartAbandonment: data?.data?.cart_abandonment || [],
      cartAbandonmentLoading: isLoading,
      cartAbandonmentError: error,
      cartAbandonmentValidating: isValidating,
      mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

/**
 * Fetch customer insights — repeat buyers, AOV, peak hours
 * @param {string} dateFrom
 */
export function useGetAnalyticsCustomerInsights(dateFrom = '-90d') {
  const shouldFetch = dateFrom !== null;
  const params = new URLSearchParams({ date_from: dateFrom || '-90d' });
  const url = `${endpoints.analytics.customerInsights}?${params.toString()}`;

  const { data, isLoading, error, isValidating, mutate } = useSWR(
    shouldFetch ? url : null,
    fetcher,
    options
  );

  const memoizedValue = useMemo(
    () => ({
      customerInsights: data?.data?.customer_insights || {},
      customerInsightsLoading: isLoading,
      customerInsightsError: error,
      customerInsightsValidating: isValidating,
      mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

/**
 * Fetch delivery performance — delivery/return rates by wilaya
 * @param {string} dateFrom
 */
export function useGetAnalyticsDeliveryPerformance(dateFrom = '-90d') {
  const shouldFetch = dateFrom !== null;
  const params = new URLSearchParams({ date_from: dateFrom || '-90d' });
  const url = `${endpoints.analytics.deliveryPerformance}?${params.toString()}`;

  const { data, isLoading, error, isValidating, mutate } = useSWR(
    shouldFetch ? url : null,
    fetcher,
    options
  );

  const memoizedValue = useMemo(
    () => ({
      deliveryPerformance: data?.data?.delivery_performance || [],
      deliveryPerformanceLoading: isLoading,
      deliveryPerformanceError: error,
      deliveryPerformanceValidating: isValidating,
      mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

/**
 * Fetch revenue breakdown — by product, wilaya, daily trend
 * @param {string} dateFrom
 */
export function useGetAnalyticsRevenueBreakdown(dateFrom = '-90d') {
  const shouldFetch = dateFrom !== null;
  const params = new URLSearchParams({ date_from: dateFrom || '-90d' });
  const url = `${endpoints.analytics.revenueBreakdown}?${params.toString()}`;

  const { data, isLoading, error, isValidating, mutate } = useSWR(
    shouldFetch ? url : null,
    fetcher,
    options
  );

  const memoizedValue = useMemo(
    () => ({
      revenueBreakdown: data?.data?.revenue_breakdown || {},
      byProduct: data?.data?.revenue_breakdown?.by_product || [],
      byWilaya: data?.data?.revenue_breakdown?.by_wilaya || [],
      dailyTrend: data?.data?.revenue_breakdown?.daily_trend || [],
      revenueBreakdownLoading: isLoading,
      revenueBreakdownError: error,
      revenueBreakdownValidating: isValidating,
      mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

/**
 * Fetch device breakdown — desktop vs mobile vs tablet
 * @param {string} dateFrom
 */
export function useGetAnalyticsDeviceBreakdown(dateFrom) {
  const URL = dateFrom
    ? [endpoints.analytics.deviceBreakdown, { params: { date_from: dateFrom } }]
    : null;

  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher, options);

  const memoizedValue = useMemo(
    () => ({
      deviceBreakdown: data?.data?.device_breakdown || [],
      deviceBreakdownLoading: isLoading,
      deviceBreakdownError: error,
      deviceBreakdownValidating: isValidating,
      deviceBreakdownEmpty: !isLoading && (!data?.data?.device_breakdown || data.data.device_breakdown.length === 0),
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

/**
 * Fetch visitor types — new vs returning visitors
 * @param {string} dateFrom
 */
export function useGetAnalyticsVisitorTypes(dateFrom) {
  const URL = dateFrom
    ? [endpoints.analytics.visitorTypes, { params: { date_from: dateFrom } }]
    : null;

  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher, options);

  const memoizedValue = useMemo(
    () => ({
      visitorTypes: data?.data?.visitor_types || { new_visitors: 0, returning_visitors: 0 },
      visitorTypesLoading: isLoading,
      visitorTypesError: error,
      visitorTypesValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

/**
 * Fetch landing pages — top entry pages
 * @param {string} dateFrom
 */
export function useGetAnalyticsLandingPages(dateFrom) {
  const URL = dateFrom
    ? [endpoints.analytics.landingPages, { params: { date_from: dateFrom } }]
    : null;

  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher, options);

  const memoizedValue = useMemo(
    () => ({
      landingPages: data?.data?.landing_pages || [],
      landingPagesLoading: isLoading,
      landingPagesError: error,
      landingPagesValidating: isValidating,
      landingPagesEmpty: !isLoading && (!data?.data?.landing_pages || data.data.landing_pages.length === 0),
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

/**
 * Fetch bounce rate — visitors who left after one page
 * @param {string} dateFrom
 */
export function useGetAnalyticsBounceRate(dateFrom) {
  const URL = dateFrom
    ? [endpoints.analytics.bounceRate, { params: { date_from: dateFrom } }]
    : null;

  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher, options);

  const memoizedValue = useMemo(
    () => ({
      bounceRate: data?.data?.bounce_rate || { total_visitors: 0, bounced_visitors: 0, bounce_rate: 0 },
      bounceRateLoading: isLoading,
      bounceRateError: error,
      bounceRateValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

/**
 * Fetch session duration — average and median
 * @param {string} dateFrom
 */
export function useGetAnalyticsSessionDuration(dateFrom) {
  const URL = dateFrom
    ? [endpoints.analytics.sessionDuration, { params: { date_from: dateFrom } }]
    : null;

  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher, options);

  const memoizedValue = useMemo(
    () => ({
      sessionDuration: data?.data?.session_duration || { avg_duration_seconds: 0, median_duration_seconds: 0 },
      sessionDurationLoading: isLoading,
      sessionDurationError: error,
      sessionDurationValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

/**
 * Fetch average order value
 * @param {string} dateFrom
 */
export function useGetAnalyticsAov(dateFrom) {
  const URL = dateFrom
    ? [endpoints.analytics.aov, { params: { date_from: dateFrom } }]
    : null;

  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher, options);

  const memoizedValue = useMemo(
    () => ({
      aov: data?.data?.aov || { average_order_value: 0, total_orders: 0 },
      aovLoading: isLoading,
      aovError: error,
      aovValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

/**
 * Download analytics CSV export
 * @param {string} dateFrom
 */
export async function downloadAnalyticsExport(dateFrom = '-30d') {
  const params = new URLSearchParams({ date_from: dateFrom });
  const url = `${endpoints.analytics.export}?${params.toString()}`;

  const response = await axios.get(url, { responseType: 'blob' });

  // Extract filename from Content-Disposition header
  const disposition = response.headers['content-disposition'] || '';
  const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
  const filename = filenameMatch ? filenameMatch[1] : `analytics-export-${dateFrom}.csv`;

  // Trigger browser download
  const blob = new Blob([response.data], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

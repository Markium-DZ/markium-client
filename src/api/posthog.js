import useSWR from 'swr';
import { useMemo } from 'react';

import { POSTHOG_API } from 'src/config-global';

// ----------------------------------------------------------------------

// In dev, use Vite proxy to avoid CORS. In production, use the queryHost directly.
function getBaseUrl() {
  const isDev = import.meta.env.DEV;
  if (isDev) {
    return '/posthog-api';
  }
  return POSTHOG_API.queryHost || 'https://eu.posthog.com';
}

const posthogFetcher = async (hogql) => {
  const { projectId, personalApiKey } = POSTHOG_API;

  if (!projectId || !personalApiKey) {
    return null;
  }

  const baseUrl = getBaseUrl();

  const res = await fetch(`${baseUrl}/api/projects/${projectId}/query/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${personalApiKey}`,
    },
    body: JSON.stringify({
      query: {
        kind: 'HogQLQuery',
        query: hogql,
      },
    }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    console.error('PostHog API error:', res.status, error);
    throw new Error(error?.detail || `PostHog API error: ${res.status}`);
  }

  return res.json();
};

// ----------------------------------------------------------------------
// Check if PostHog is configured
// ----------------------------------------------------------------------

export function isPostHogConfigured() {
  return !!(POSTHOG_API.projectId && POSTHOG_API.personalApiKey);
}

// ----------------------------------------------------------------------
// Page views over time
// ----------------------------------------------------------------------

export function usePostHogPageViews(storeSlug, days = 30) {
  const query = storeSlug && isPostHogConfigured()
    ? `SELECT
        toDate(timestamp) as day,
        count() as views
      FROM events
      WHERE event = '$pageview'
        AND properties.store_slug = '${storeSlug}'
        AND timestamp >= now() - interval ${days} day
      GROUP BY day
      ORDER BY day`
    : null;

  const { data, isLoading, error } = useSWR(query, posthogFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  return useMemo(() => ({
    pageViews: data?.results || [],
    pageViewsLoading: isLoading,
    pageViewsError: error,
  }), [data, isLoading, error]);
}

// ----------------------------------------------------------------------
// Summary stats
// ----------------------------------------------------------------------

export function usePostHogSummary(storeSlug, days = 30) {
  const query = storeSlug && isPostHogConfigured()
    ? `SELECT
        countIf(event = '$pageview') as total_pageviews,
        countIf(event = 'product_viewed') as total_product_views,
        countIf(event = 'add_to_cart') as total_add_to_cart,
        countIf(event = 'checkout_started') as total_checkouts,
        countIf(event = 'order_completed') as total_orders,
        countIf(event = 'search_performed') as total_searches
      FROM events
      WHERE properties.store_slug = '${storeSlug}'
        AND timestamp >= now() - interval ${days} day`
    : null;

  const { data, isLoading, error } = useSWR(query, posthogFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  const row = data?.results?.[0] || [];
  const columns = data?.columns || [];

  return useMemo(() => {
    const result = {};
    columns.forEach((col, idx) => {
      result[col] = row[idx] || 0;
    });
    return {
      summary: result,
      summaryLoading: isLoading,
      summaryError: error,
    };
  }, [columns, row, isLoading, error]);
}

// ----------------------------------------------------------------------
// Top products (most viewed)
// ----------------------------------------------------------------------

export function usePostHogTopProducts(storeSlug, days = 30, limit = 10) {
  const query = storeSlug && isPostHogConfigured()
    ? `SELECT
        properties.product_name as product_name,
        count() as views
      FROM events
      WHERE event = 'product_viewed'
        AND properties.store_slug = '${storeSlug}'
        AND timestamp >= now() - interval ${days} day
        AND properties.product_name IS NOT NULL
      GROUP BY product_name
      ORDER BY views DESC
      LIMIT ${limit}`
    : null;

  const { data, isLoading, error } = useSWR(query, posthogFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  return useMemo(() => ({
    topProducts: data?.results || [],
    topProductsLoading: isLoading,
    topProductsError: error,
  }), [data, isLoading, error]);
}

// ----------------------------------------------------------------------
// Conversion funnel
// ----------------------------------------------------------------------

export function usePostHogFunnel(storeSlug, days = 30) {
  const query = storeSlug && isPostHogConfigured()
    ? `SELECT
        countIf(event = '$pageview') as page_views,
        countIf(event = 'product_viewed') as product_views,
        countIf(event = 'add_to_cart') as add_to_cart,
        countIf(event = 'checkout_started') as checkout_started,
        countIf(event = 'order_completed') as order_completed
      FROM events
      WHERE properties.store_slug = '${storeSlug}'
        AND timestamp >= now() - interval ${days} day`
    : null;

  const { data, isLoading, error } = useSWR(query, posthogFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  const row = data?.results?.[0] || [];

  return useMemo(() => ({
    funnel: {
      pageViews: row[0] || 0,
      productViews: row[1] || 0,
      addToCart: row[2] || 0,
      checkoutStarted: row[3] || 0,
      orderCompleted: row[4] || 0,
    },
    funnelLoading: isLoading,
    funnelError: error,
  }), [row, isLoading, error]);
}

// ----------------------------------------------------------------------
// Top search terms
// ----------------------------------------------------------------------

export function usePostHogTopSearches(storeSlug, days = 30, limit = 10) {
  const query = storeSlug && isPostHogConfigured()
    ? `SELECT
        properties.search_term as search_term,
        count() as searches
      FROM events
      WHERE event = 'search_performed'
        AND properties.store_slug = '${storeSlug}'
        AND timestamp >= now() - interval ${days} day
        AND properties.search_term IS NOT NULL
      GROUP BY search_term
      ORDER BY searches DESC
      LIMIT ${limit}`
    : null;

  const { data, isLoading, error } = useSWR(query, posthogFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  return useMemo(() => ({
    topSearches: data?.results || [],
    topSearchesLoading: isLoading,
    topSearchesError: error,
  }), [data, isLoading, error]);
}

// ----------------------------------------------------------------------
// Orders by wilaya (geographic distribution)
// ----------------------------------------------------------------------

export function usePostHogOrdersByWilaya(storeSlug, days = 30, limit = 10) {
  const query = storeSlug && isPostHogConfigured()
    ? `SELECT
        properties.customer_wilaya as wilaya,
        count() as orders
      FROM events
      WHERE event = 'order_completed'
        AND properties.store_slug = '${storeSlug}'
        AND timestamp >= now() - interval ${days} day
        AND properties.customer_wilaya IS NOT NULL
      GROUP BY wilaya
      ORDER BY orders DESC
      LIMIT ${limit}`
    : null;

  const { data, isLoading, error } = useSWR(query, posthogFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  return useMemo(() => ({
    ordersByWilaya: data?.results || [],
    ordersByWilayaLoading: isLoading,
    ordersByWilayaError: error,
  }), [data, isLoading, error]);
}

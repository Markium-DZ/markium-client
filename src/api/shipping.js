import useSWR from 'swr';
import { useMemo } from 'react';

import { capture } from 'src/utils/analytics';
import axios, { fetcher, endpoints } from 'src/utils/axios';

import { CHAT_HOST_API } from 'src/config-global';

// ----------------------------------------------------------------------

const options = {
  revalidateIfStale: true,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

export function useGetShippingProviders() {
  const url = endpoints.shipping.providers;

  const { data, isLoading, error, isValidating, mutate } = useSWR(
    url,
    fetcher,
    options
  );

  const memoizedValue = useMemo(
    () => ({
      providers: data?.data || [],
      providersLoading: isLoading,
      providersError: error,
      providersValidating: isValidating,
      providersEmpty: !isLoading && !data?.data?.length,
      mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

export function useGetShippingConnections() {
  const url = endpoints.shipping.connections;

  const { data, isLoading, error, isValidating, mutate } = useSWR(
    url,
    fetcher,
    options
  );

  const memoizedValue = useMemo(
    () => ({
      connections: data?.data || [],
      connectionsLoading: isLoading,
      connectionsError: error,
      connectionsValidating: isValidating,
      connectionsEmpty: !isLoading && !data?.data?.length,
      mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export async function createShippingConnection(body) {
  const URL = endpoints.shipping.connections;
  const response = await axios.post(URL, body);
  capture('shipping_connection_created', { provider_name: body?.provider_slug });
  return response;
}

export async function updateShippingConnection(connectionId, body) {
  const URL = endpoints.shipping.updateConnection(connectionId);
  return await axios.put(URL, body);
}

export async function validateShippingConnection(connectionId) {
  const URL = endpoints.shipping.validateConnection(connectionId);
  return await axios.post(URL);
}

export async function setDefaultShippingConnection(connectionId) {
  const URL = endpoints.shipping.setDefaultConnection(connectionId);
  return await axios.post(URL);
}

export async function deleteShippingConnection(connectionId) {
  const URL = endpoints.shipping.deleteConnection(connectionId);
  return await axios.delete(URL);
}

// ----------------------------------------------------------------------

export function useGetShippingRates(orderId) {
  const url = orderId ? endpoints.shipping.orderRates(orderId) : null;

  const { data, isLoading, error, isValidating, mutate } = useSWR(
    url,
    fetcher,
    options
  );

  const memoizedValue = useMemo(
    () => {
      const quotes = data?.data?.quotes || [];

      // Group quotes by provider name for the UI
      const grouped = {};
      quotes.forEach((quote) => {
        const providerName = quote.provider?.name || quote.connection?.provider?.name || 'unknown';
        if (!grouped[providerName]) grouped[providerName] = [];
        grouped[providerName].push(quote);
      });

      return {
        quotes,
        quotesGroupedByProvider: grouped,
        ratesLoading: isLoading,
        ratesError: error,
        ratesValidating: isValidating,
        ratesEmpty: !isLoading && quotes.length === 0,
        mutate,
      };
    },
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

export async function refreshShippingRates(orderId) {
  const URL = `${endpoints.shipping.refreshOrderRates(orderId)}?sync=true`;
  return await axios.post(URL);
}

export async function createShipment(orderId, { connectionId, quoteId, serviceCode, metadata }) {
  const URL = endpoints.shipping.shipOrder(orderId);
  return await axios.post(URL, {
    connection_id: connectionId,
    quote_id: quoteId || null,
    service_code: serviceCode || null,
    metadata: metadata || null,
  });
}

// ----------------------------------------------------------------------
// Labels, bulk shipments, stop-desk hubs

// -> { shipment_id, label_url } (fresh link on every call)
export async function getShipmentLabel(shipmentId) {
  const response = await axios.get(endpoints.shipping.shipmentLabel(shipmentId));
  return response?.data?.data;
}

// shipmentIds: number[] (same connection) -> { file_url|null, failed: [{ shipment_id, tracking_number, reason }] }
// inline: true also returns the label document's `html` (fetched by the backend) for print-ready opening
export async function generateShippingLabels(shipmentIds, { inline = false } = {}) {
  const response = await axios.post(endpoints.shipping.labels, {
    shipment_ids: shipmentIds,
    ...(inline && { inline: true }),
  });
  capture('shipping_labels_printed', { shipments_count: shipmentIds?.length });
  return response?.data?.data;
}

// -> { tracking_number, file_url }
export async function generatePickupBagLabel(connectionId, trackingNumber) {
  const response = await axios.post(endpoints.shipping.pickupBagLabel(connectionId), {
    tracking_number: trackingNumber,
  });
  return response?.data?.data;
}

// deliveryType: 'home' | 'stop_desk'; stopdeskId optional (backend auto-picks one per order)
// -> { total, success_count, failure_count, results: [...] }
export async function createBulkShipments({ orderIds, connectionId, deliveryType, stopdeskId }) {
  const body = {
    order_ids: orderIds,
    connection_id: connectionId,
    delivery_type: deliveryType,
  };
  if (stopdeskId) body.stopdesk_id = String(stopdeskId);
  const response = await axios.post(endpoints.shipping.bulkShipments, body);
  const data = response?.data?.data;
  capture('shipping_bulk_shipments_created', {
    orders_count: orderIds?.length,
    success_count: data?.success_count,
    delivery_type: deliveryType,
  });
  return data;
}

// Stop-desk centers of a connection; pass connectionId = null to skip fetching.
export function useGetShippingHubs(connectionId, wilayaId) {
  let url = null;
  if (connectionId) {
    url = wilayaId
      ? [endpoints.shipping.connectionHubs(connectionId), { params: { wilaya_id: wilayaId } }]
      : endpoints.shipping.connectionHubs(connectionId);
  }

  const { data, isLoading, error } = useSWR(url, fetcher, options);

  return useMemo(
    () => ({
      hubs: data?.data || [],
      hubsLoading: isLoading,
      hubsError: error,
    }),
    [data, error, isLoading]
  );
}

// ----------------------------------------------------------------------
// Shipping prices per commune

export function useGetCommuneShippingRates() {
  const url = endpoints.shipping.rates;

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, options);

  const memoizedValue = useMemo(
    () => ({
      rates: data?.data || [],
      ratesLoading: isLoading,
      ratesError: error,
      ratesValidating: isValidating,
      ratesEmpty: !isLoading && !data?.data?.length,
      mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

// body: { commune_ids: number[], home_price: number, desk_price: number }
export async function bulkSetShippingRates(body) {
  const URL = endpoints.shipping.ratesBulk;
  const response = await axios.put(URL, body);
  capture('shipping_rates_set', { communes_count: body?.commune_ids?.length });
  return response;
}

// commune_ids: number[] — sent as the DELETE request body
export async function bulkClearShippingRates(commune_ids) {
  const URL = endpoints.shipping.ratesBulk;
  const response = await axios.delete(URL, { data: { commune_ids } });
  capture('shipping_rates_cleared', { communes_count: commune_ids?.length });
  return response;
}

// ----------------------------------------------------------------------
// AI price-list import

// images: base64 JPEG strings; signal: optional AbortSignal.
// Throws an Error with `status` (0 = network) and `resetsAt`; AbortError is rethrown as-is.
export async function extractShippingRates(images, signal) {
  let response;
  try {
    response = await fetch(`${CHAT_HOST_API}/extract/shipping-rates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('accessToken') ?? ''}`,
      },
      body: JSON.stringify({ images }),
      signal,
    });
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    const networkError = new Error('network');
    networkError.status = 0;
    networkError.resetsAt = null;
    throw networkError;
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.error || 'extract_failed');
    error.status = response.status;
    error.resetsAt = body.resets_at || null;
    throw error;
  }
  capture('shipping_rates_ai_extracted', { rows: body.rows?.length ?? 0, carrier: body.carrier });
  return body;
}

// rates: [{ wilaya_id, home_price, desk_price }]
export async function bulkSetShippingRatesByWilaya(rates) {
  const response = await axios.put(endpoints.shipping.ratesByWilaya, { rates });
  capture('shipping_rates_ai_saved', { wilayas_count: rates.length });
  return response;
}

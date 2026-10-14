// Provider capability helpers for shipments / connections.
// Capabilities come from ShippingProviderResource.capabilities; the identifier
// lists are a fallback for payloads where the provider relation isn't loaded.

const FALLBACK_PROVIDERS = {
  order_label: ['zr_express_next', 'yalidine'],
  bulk_create_order: ['zr_express_next'],
  bulk_label: ['zr_express_next'],
  pickup_bag_label: ['zr_express_next'],
};

function providerOfShipment(shipment) {
  return {
    identifier: shipment?.provider?.identifier || shipment?.connection?.provider?.identifier,
    name: shipment?.provider?.name || shipment?.connection?.provider?.name,
    capabilities: shipment?.connection?.provider?.capabilities,
  };
}

function hasCapability(provider, capability) {
  const caps = provider?.capabilities;
  if (caps && typeof caps === 'object' && capability in caps) return !!caps[capability];
  return (FALLBACK_PROVIDERS[capability] || []).includes(provider?.identifier);
}

export function shipmentSupports(shipment, capability) {
  if (!shipment) return false;
  return hasCapability(providerOfShipment(shipment), capability);
}

export function connectionSupports(connection, capability) {
  if (!connection) return false;
  return hasCapability(connection.provider, capability);
}

export function shipmentProviderName(shipment) {
  return providerOfShipment(shipment).name || '';
}

// Orders the backend will refuse to ship (mirrors ShipmentService::validateOrderForShipping)
export function isOrderShippable(order) {
  const status = order?.status?.key || order?.status;
  return !order?.active_shipment && (status === 'pending' || status === 'confirmed');
}

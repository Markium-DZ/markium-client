export const COST_TYPES = [
  { value: 'buy_price', labelKey: 'cost_type_buy_price', icon: 'solar:tag-price-bold-duotone', color: 'primary', hexColor: '#00A76F' },
  { value: 'marketing', labelKey: 'cost_type_marketing', icon: 'solar:megaphone-bold-duotone', color: 'warning', hexColor: '#FFAB00' },
  { value: 'content', labelKey: 'cost_type_content', icon: 'solar:pen-new-round-bold-duotone', color: 'info', hexColor: '#00B8D9' },
  { value: 'packaging', labelKey: 'cost_type_packaging', icon: 'solar:box-bold-duotone', color: 'secondary', hexColor: '#8E33FF' },
  { value: 'shipping', labelKey: 'cost_type_shipping', icon: 'solar:delivery-bold-duotone', color: 'success', hexColor: '#22C55E' },
  { value: 'confirmation_call', labelKey: 'cost_type_confirmation_call', icon: 'solar:phone-calling-bold-duotone', color: 'default', hexColor: '#919EAB' },
  { value: 'custom', labelKey: 'cost_type_custom', icon: 'solar:settings-bold-duotone', color: 'error', hexColor: '#FF5630' },
];

export const MARKETING_CHANNELS = [
  { value: 'facebook', labelKey: 'channel_facebook', icon: 'mdi:facebook' },
  { value: 'tiktok', labelKey: 'channel_tiktok', icon: 'ic:baseline-tiktok' },
  { value: 'google', labelKey: 'channel_google', icon: 'mdi:google' },
  { value: 'instagram', labelKey: 'channel_instagram', icon: 'mdi:instagram' },
  { value: 'snapchat', labelKey: 'channel_snapchat', icon: 'mdi:snapchat' },
  { value: 'other', labelKey: 'channel_other', icon: 'solar:global-bold-duotone' },
];

export const SCOPE_OPTIONS = [
  { value: 'per_unit', labelKey: 'scope_per_unit' },
  { value: 'global', labelKey: 'scope_global' },
];

export function getCostTypeConfig(type) {
  return COST_TYPES.find((ct) => ct.value === type) || COST_TYPES[COST_TYPES.length - 1];
}

export function getChannelConfig(channel) {
  return MARKETING_CHANNELS.find((ch) => ch.value === channel) || MARKETING_CHANNELS[MARKETING_CHANNELS.length - 1];
}

// Derived maps for profitability views
export const COST_TYPE_LABELS = Object.fromEntries(
  COST_TYPES.map((ct) => [ct.value, ct.labelKey])
);

export const COST_TYPE_COLORS = Object.fromEntries(
  COST_TYPES.map((ct) => [ct.value, ct.hexColor])
);

export const CHANNEL_ICONS = Object.fromEntries(
  MARKETING_CHANNELS.map((ch) => [ch.value, ch.icon])
);

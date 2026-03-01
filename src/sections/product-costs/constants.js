export const COST_TYPES = [
  { value: 'buy_price', labelKey: 'cost_type_buy_price', icon: 'solar:tag-price-bold-duotone', color: 'primary' },
  { value: 'marketing', labelKey: 'cost_type_marketing', icon: 'solar:megaphone-bold-duotone', color: 'warning' },
  { value: 'content', labelKey: 'cost_type_content', icon: 'solar:pen-new-round-bold-duotone', color: 'info' },
  { value: 'packaging', labelKey: 'cost_type_packaging', icon: 'solar:box-bold-duotone', color: 'secondary' },
  { value: 'shipping', labelKey: 'cost_type_shipping', icon: 'solar:delivery-bold-duotone', color: 'success' },
  { value: 'confirmation_call', labelKey: 'cost_type_confirmation_call', icon: 'solar:phone-calling-bold-duotone', color: 'default' },
  { value: 'custom', labelKey: 'cost_type_custom', icon: 'solar:settings-bold-duotone', color: 'error' },
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

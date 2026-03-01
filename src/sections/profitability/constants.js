export const DATE_RANGE_OPTIONS = [
  { value: '-1d', labelKey: 'last_24h' },
  { value: '-7d', labelKey: 'last_7_days' },
  { value: '-14d', labelKey: 'last_14_days' },
  { value: '-30d', labelKey: 'last_30_days' },
  { value: '-90d', labelKey: 'last_90_days' },
];

export const DEFAULT_DATE_RANGE = '-30d';

export const COST_TYPE_LABELS = {
  buy_price: 'cost_type_buy_price',
  marketing: 'cost_type_marketing',
  content: 'cost_type_content',
  packaging: 'cost_type_packaging',
  shipping: 'cost_type_shipping',
  confirmation_call: 'cost_type_confirmation_call',
  custom: 'cost_type_custom',
};

export const COST_TYPE_COLORS = {
  buy_price: '#00A76F',
  marketing: '#FFAB00',
  content: '#00B8D9',
  packaging: '#8E33FF',
  shipping: '#22C55E',
  confirmation_call: '#919EAB',
  custom: '#FF5630',
};

export const CHANNEL_ICONS = {
  facebook: 'mdi:facebook',
  tiktok: 'ic:baseline-tiktok',
  google: 'mdi:google',
  instagram: 'mdi:instagram',
  snapchat: 'mdi:snapchat',
  other: 'solar:global-bold-duotone',
};

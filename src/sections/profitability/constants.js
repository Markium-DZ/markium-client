import { fNumber } from 'src/utils/format-number';

export { COST_TYPE_LABELS, COST_TYPE_COLORS, CHANNEL_ICONS } from 'src/sections/product-costs/constants';

export const DATE_RANGE_OPTIONS = [
  { value: '-1d', labelKey: 'last_24h' },
  { value: '-7d', labelKey: 'last_7_days' },
  { value: '-14d', labelKey: 'last_14_days' },
  { value: '-30d', labelKey: 'last_30_days' },
  { value: '-90d', labelKey: 'last_90_days' },
];

export const DEFAULT_DATE_RANGE = '-30d';

// Format helpers
export const fmtAmount = (val) =>
  typeof val === 'number' ? `${fNumber(val)} DA` : '\u2014';

export const fmtPct = (val) =>
  typeof val === 'number' ? `${val.toFixed(1)}%` : '\u2014';

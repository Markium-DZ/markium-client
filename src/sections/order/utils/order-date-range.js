import { format, subDays, isValid, startOfMonth } from 'date-fns';

// ----------------------------------------------------------------------

export const DATE_PRESETS = ['all', 'today', 'yesterday', 'last_7_days', 'this_month', 'custom'];

const toApiDate = (date) => (date && isValid(date) ? format(date, 'yyyy-MM-dd') : undefined);

/**
 * Resolve a date preset into the `date_from` / `date_to` (yyyy-MM-dd, inclusive)
 * query params of GET /orders. Returns undefined values for "all".
 */
export function resolveDateRange(preset, customFrom, customTo, now = new Date()) {
  switch (preset) {
    case 'today':
      return { dateFrom: toApiDate(now), dateTo: toApiDate(now) };
    case 'yesterday': {
      const y = subDays(now, 1);
      return { dateFrom: toApiDate(y), dateTo: toApiDate(y) };
    }
    case 'last_7_days':
      return { dateFrom: toApiDate(subDays(now, 6)), dateTo: toApiDate(now) };
    case 'this_month':
      return { dateFrom: toApiDate(startOfMonth(now)), dateTo: toApiDate(now) };
    case 'custom': {
      let from = customFrom && isValid(customFrom) ? customFrom : null;
      let to = customTo && isValid(customTo) ? customTo : null;
      // Be forgiving if the user picks the range backwards.
      if (from && to && from > to) [from, to] = [to, from];
      return { dateFrom: toApiDate(from), dateTo: toApiDate(to) };
    }
    default:
      return { dateFrom: undefined, dateTo: undefined };
  }
}

// ----------------------------------------------------------------------
// Order Status Configuration
// Centralized order status definitions for consistent usage across the application
// ----------------------------------------------------------------------

/**
 * Order status definitions
 * Each status has:
 * - key: unique identifier (matches backend status values)
 * - labelKey: translation key for i18n
 * - color: MUI color variant (warning, success, error, info, secondary, primary)
 * - icon: Iconify icon name
 */
export const ORDER_STATUSES = [
  {
    key: 'pending',
    labelKey: 'pending',
    color: 'warning',
    icon: 'solar:clock-circle-bold',
  },
  {
    key: 'confirmed',
    labelKey: 'confirmed',
    color: 'secondary',
    icon: 'solar:check-circle-bold',
  },
  {
    key: 'shipment_created',
    labelKey: 'shipment_created',
    color: 'primary',
    icon: 'solar:delivery-bold',
  },
  {
    key: 'shipped',
    labelKey: 'shipped',
    color: 'info',
    icon: 'solar:box-bold',
  },
  {
    key: 'delivered',
    labelKey: 'delivered',
    color: 'success',
    icon: 'solar:verified-check-bold',
  },
  {
    key: 'cancelled',
    labelKey: 'cancelled',
    color: 'error',
    icon: 'solar:close-circle-bold',
  },
];

/**
 * Get status configuration by key
 * @param {string} statusKey - The status key to look up
 * @returns {object|null} Status configuration object or null if not found
 */
export function getOrderStatus(statusKey) {
  return ORDER_STATUSES.find((status) => status.key === statusKey) || null;
}

/**
 * Get status color by key
 * @param {string} statusKey - The status key to look up
 * @returns {string} Color variant (warning, success, error, etc.)
 */
export function getOrderStatusColor(statusKey) {
  const status = getOrderStatus(statusKey);
  return status?.color || 'default';
}

/**
 * Get status icon by key
 * @param {string} statusKey - The status key to look up
 * @returns {string} Iconify icon name
 */
export function getOrderStatusIcon(statusKey) {
  const status = getOrderStatus(statusKey);
  return status?.icon || 'solar:question-circle-bold';
}

/**
 * Get status label key for translation
 * @param {string} statusKey - The status key to look up
 * @returns {string} Translation key
 */
export function getOrderStatusLabelKey(statusKey) {
  const status = getOrderStatus(statusKey);
  return status?.labelKey || statusKey;
}

/**
 * Get all status options for dropdowns/selects
 * Useful for forms and filters
 * @param {function} t - Translation function
 * @returns {array} Array of status options with value and label
 */
export function getOrderStatusOptions(t) {
  return ORDER_STATUSES.map((status) => ({
    value: status.key,
    label: t(status.labelKey),
    color: status.color,
    icon: status.icon,
  }));
}

/**
 * Check if a status is valid
 * @param {string} statusKey - The status key to validate
 * @returns {boolean} True if status exists
 */
export function isValidOrderStatus(statusKey) {
  return ORDER_STATUSES.some((status) => status.key === statusKey);
}

/**
 * Get status keys only (for validation, filtering, etc.)
 * @returns {array} Array of status keys
 */
export function getOrderStatusKeys() {
  return ORDER_STATUSES.map((status) => status.key);
}

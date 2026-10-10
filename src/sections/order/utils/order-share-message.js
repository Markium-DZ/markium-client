import { format } from 'date-fns';

// ----------------------------------------------------------------------
// Builds the plain-text message used to share one or more orders
// (native share sheet, WhatsApp, clipboard). Pure functions only — no React,
// no i18next import — so it stays easy to read and to unit test.
// ----------------------------------------------------------------------

/** WhatsApp `wa.me/?text=` gets unreliable past this many characters. */
export const WHATSAPP_MAX_CHARS = 4000;

const SECTION_LINE = '━━━━━━━━';
const ORDER_SEPARATOR = '\n\n════════════\n\n';

/** Per-store order number, falling back to the DB id for legacy rows. */
export function getOrderDisplayNumber(order) {
  return order?.order_number ?? order?.id ?? '';
}

/** "#12", or '' when the order has no per-store number yet. */
export function formatOrderNumber(order) {
  const number = getOrderDisplayNumber(order);
  return number === '' ? '' : `#${number}`;
}

function formatOrderDate(createdAt) {
  if (!createdAt) return '';
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return '';
  return format(date, 'dd/MM/yyyy HH:mm');
}

function localizedName(entity, lang) {
  if (!entity) return '';
  if (lang === 'ar') return entity.name_ar || entity.name || '';
  return entity.name || entity.name_ar || '';
}

function formatLocation(address, lang) {
  const commune = localizedName(address?.commune, lang);
  const wilaya = localizedName(address?.wilaya, lang);
  const parts = [commune, wilaya].filter(Boolean);
  if (parts.length) return parts.join(', ');
  return address?.full_address || '';
}

function formatVariant(item) {
  const values = (item?.variant?.options || [])
    .map((opt) => (typeof opt === 'string' ? opt : opt?.value))
    .filter(Boolean);
  return values.length ? ` (${values.join(' / ')})` : '';
}

function lineTotal(item) {
  if (item?.total_price !== null && item?.total_price !== undefined && item?.total_price !== '') {
    return item.total_price;
  }
  if (item?.unit_price !== null && item?.unit_price !== undefined) {
    return Number(item.unit_price) * Number(item.quantity || 1);
  }
  return null;
}

function hasValue(value) {
  return value !== null && value !== undefined && value !== '';
}

/**
 * Build the share text for a single order.
 *
 * @param {object} order   OrderResource payload
 * @param {object} ctx
 * @param {(key: string, opts?: object) => string} ctx.t   i18n translate
 * @param {string} ctx.lang                                 current language ('ar' | 'en' | 'fr')
 * @param {(value: number|string) => string} ctx.formatMoney currency formatter
 */
export function buildOrderShareText(order, { t, lang, formatMoney }) {
  const lines = [];

  const date = formatOrderDate(order?.created_at);
  const title = t('order_share_title', { number: getOrderDisplayNumber(order) });
  lines.push(`🧾 ${title}${date ? ` — ${date}` : ''}`);

  if (order?.customer?.full_name) lines.push(`👤 ${order.customer.full_name}`);
  if (order?.customer?.phone) lines.push(`📞 ${order.customer.phone}`);

  const location = formatLocation(order?.address, lang);
  if (location) lines.push(`📍 ${location}`);

  if (order?.delivery_type === 'home') lines.push(`🚚 ${t('delivery_home')}`);
  else if (order?.delivery_type === 'stop_desk') lines.push(`🚚 ${t('delivery_stop_desk')}`);

  lines.push(SECTION_LINE);
  (order?.items || []).forEach((item) => {
    const name = item?.product?.name || '-';
    const total = lineTotal(item);
    const price = hasValue(total) ? ` — ${formatMoney(total)}` : '';
    lines.push(`• ${name}${formatVariant(item)} × ${item?.quantity ?? 1}${price}`);
  });
  lines.push(SECTION_LINE);

  if (hasValue(order?.subtotal)) lines.push(`${t('subtotal')}: ${formatMoney(order.subtotal)}`);

  const shipping = hasValue(order?.shipping_price)
    ? formatMoney(order.shipping_price)
    : t('shipping_to_be_confirmed');
  lines.push(`${t('shipping')}: ${shipping}`);

  if (hasValue(order?.total_price)) lines.push(`${t('total')}: ${formatMoney(order.total_price)}`);

  if (order?.notes && String(order.notes).trim()) lines.push(`📝 ${String(order.notes).trim()}`);

  return lines.join('\n');
}

/**
 * Build one message for several orders. Blurred (plan-locked) orders are
 * excluded and reported back so the caller can explain why.
 *
 * @returns {{ text: string, included: object[], excluded: object[] }}
 */
export function buildOrdersShareMessage(orders, ctx) {
  const list = Array.isArray(orders) ? orders : [];
  const included = list.filter((order) => !order?.is_blurred);
  const excluded = list.filter((order) => !!order?.is_blurred);

  const text = included.map((order) => buildOrderShareText(order, ctx)).join(ORDER_SEPARATOR);

  return { text, included, excluded };
}

/** `https://wa.me/?text=…` — no phone, so WhatsApp lets the user pick the chat. */
export function buildWhatsAppShareUrl(text) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

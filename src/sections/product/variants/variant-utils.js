// ----------------------------------------------------------------------
// Pure helpers for the grouped variant editor (no React).
// ----------------------------------------------------------------------

const byPosition = (a, b) => (a?.position ?? 0) - (b?.position ?? 0);

function optionName(option) {
  return option?.definition_name || option?.name || '';
}

/** Option values of a variant, ordered like the product's option definitions. */
function orderedOptions(variant, definitionOrder) {
  const options = [...(variant?.options || [])];
  return options.sort(
    (a, b) =>
      (definitionOrder.get(optionName(a)) ?? Infinity) -
      (definitionOrder.get(optionName(b)) ?? Infinity)
  );
}

function firstImage(variants) {
  const withMedia = variants.find((variant) => variant?.media?.[0]?.full_url);
  return withMedia ? withMedia.media[0].full_url : null;
}

/**
 * Group variants by the first option definition (by position), e.g. one group per Color.
 *
 * - 2+ options → one group per value of the first option; rows are labelled with the
 *   remaining option values joined " / " (e.g. "M / Cotton").
 * - 1 option   → a single group; rows are labelled with that option's value.
 * - 0 options  → a single group with one unlabelled row per variant.
 *
 * @returns {Array<{ key: string, label: string, colorHex: string|null, image: string|null,
 *   rows: Array<{ variant: object, label: string }> }>}
 */
export function groupVariants(variants = [], optionDefinitions = []) {
  const definitions = [...optionDefinitions].sort(byPosition);
  const definitionOrder = new Map(definitions.map((def, index) => [def.name, index]));
  const sortedVariants = [...variants].sort(byPosition);

  const rowLabel = (variant, skipFirst) =>
    orderedOptions(variant, definitionOrder)
      .filter((option) => !skipFirst || optionName(option) !== definitions[0]?.name)
      .map((option) => option?.value)
      .filter(Boolean)
      .join(' / ');

  // 0 or 1 option definition → one card
  if (definitions.length < 2) {
    return sortedVariants.length
      ? [
          {
            key: 'all',
            label: definitions[0]?.name || '',
            colorHex: null,
            image: firstImage(sortedVariants),
            rows: sortedVariants.map((variant) => ({ variant, label: rowLabel(variant, false) })),
          },
        ]
      : [];
  }

  const firstDefinition = definitions[0];
  const groups = new Map();

  // Seed groups in the definition's value order so cards follow the merchant's ordering
  [...(firstDefinition.values || [])].sort(byPosition).forEach((value) => {
    groups.set(value.value, {
      key: `value-${value.id ?? value.value}`,
      label: value.value,
      colorHex: value.color_hex || null,
      variants: [],
    });
  });

  sortedVariants.forEach((variant) => {
    const option = (variant.options || []).find((opt) => optionName(opt) === firstDefinition.name);
    const value = option?.value ?? '';
    if (!groups.has(value)) {
      groups.set(value, {
        key: `value-${value || 'none'}`,
        label: value,
        colorHex: option?.color_hex || null,
        variants: [],
      });
    }
    const group = groups.get(value);
    if (!group.colorHex && option?.color_hex) group.colorHex = option.color_hex;
    group.variants.push(variant);
  });

  return Array.from(groups.values())
    .filter((group) => group.variants.length > 0)
    .map(({ variants: groupVariantsList, ...group }) => ({
      ...group,
      image: firstImage(groupVariantsList),
      rows: groupVariantsList.map((variant) => ({ variant, label: rowLabel(variant, true) })),
    }));
}

// ----------------------------------------------------------------------
// Draft edits: { [variantId]: { quantity?: string, price?: string, is_active?: boolean } }
// Inputs are kept as strings while typing; only fields that differ from the server value
// are stored, so "dirty" === "has an entry".
// ----------------------------------------------------------------------

export const EDITABLE_FIELDS = ['quantity', 'price', 'is_active'];

/** Server value of a field, normalised to the same shape the inputs use. */
export function originalValue(variant, field) {
  if (field === 'is_active') return variant?.is_active ?? true;
  const raw = variant?.[field];
  return raw === null || raw === undefined ? '' : String(raw);
}

export function effectiveValue(variant, draft, field) {
  return draft && field in draft ? draft[field] : originalValue(variant, field);
}

function sameValue(field, a, b) {
  if (field === 'is_active') return Boolean(a) === Boolean(b);
  if (a === '' || b === '') return a === b;
  return Number(a) === Number(b);
}

/** Returns the next draft for one variant after changing `field` (or null when back to original). */
export function applyFieldChange(variant, draft, field, value) {
  const next = { ...(draft || {}) };
  if (sameValue(field, value, originalValue(variant, field))) {
    delete next[field];
  } else {
    next[field] = value;
  }
  return Object.keys(next).length ? next : null;
}

/** Field → i18n error key, for invalid draft values. */
export function validateDraft(draft) {
  const errors = {};
  if (!draft) return errors;
  if ('quantity' in draft && !/^\d+$/.test(String(draft.quantity).trim())) {
    errors.quantity = 'variants_invalid_quantity';
  }
  if ('price' in draft) {
    const price = String(draft.price).trim();
    if (price === '' || Number.isNaN(Number(price)) || Number(price) < 0) {
      errors.price = 'variants_invalid_price';
    }
  }
  return errors;
}

/** API payload for PUT /products/{p}/variants/{v} — changed fields only. */
export function draftToPayload(draft) {
  const payload = {};
  if ('quantity' in draft) payload.quantity = parseInt(String(draft.quantity).trim(), 10);
  if ('price' in draft) payload.price = parseFloat(String(draft.price).trim());
  if ('is_active' in draft) payload.is_active = Boolean(draft.is_active);
  return payload;
}

/** Sum of the (draft-aware) stock of the given variants; invalid inputs count as 0. */
export function totalStock(variants, drafts) {
  return variants.reduce((sum, variant) => {
    const quantity = parseInt(effectiveValue(variant, drafts[variant.id], 'quantity'), 10);
    return sum + (Number.isNaN(quantity) ? 0 : quantity);
  }, 0);
}

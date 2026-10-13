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

/** Total stock of the given variants. */
export function totalStock(variants) {
  return variants.reduce((sum, variant) => {
    const quantity = parseInt(variant?.quantity, 10);
    return sum + (Number.isNaN(quantity) ? 0 : quantity);
  }, 0);
}

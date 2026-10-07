# Product Summary Overhaul + Carousel Variant Tags

**Date:** 2026-03-06
**Scope:** `src/sections/product/product-details-summary.jsx`, `src/sections/product/product-details-carousel.jsx`

---

## Goal

Replace the per-variant hero summary with a global product overview, and add variant identity tags to carousel images.

---

## Part 1 — ProductDetailsSummary

### What changes

The current summary shows the selected variant's price, SKU, and option values as static text. Since the full variant breakdown is already in the Variants tab below, the hero should show product-level information.

### New layout (top to bottom)

1. **Labels** — sale/new badges (unchanged)
2. **Inventory status** — derived from `totalQuantity > 0` (unchanged logic, already uses total)
3. **Product name** (unchanged)
4. **Price range** — compute `minPrice` and `maxPrice` across all active variants. If equal, show one price. If different, show "2,500 د.ج – 3,200 د.ج". Typography `h5`.
5. **Variant count chip** — small `Chip` or `Label` immediately below price: "5 variants" (uses `t('variants')` + count).
6. **Short description** (unchanged)
7. **Divider** (unchanged)
8. **Options overview** — for each `option_definition`, render:
   - Option name as `subtitle2` label
   - All unique values across all variants as static `Chip` components
   - Color values (`color_hex` present) get a small color dot avatar inside the chip
9. **Total available** row — kept as-is (already shows total across all variants)

### What is removed

- `renderVariantInfo` (per-variant SKU + static option text)
- `selectedVariant` dependency for price calculation
- `handleOptionChange` and all related form/useEffect logic (dead code — never triggered any UI)
- `defaultValues` form state (no longer needed since there's no interactive picker)
- `coverUrl` derivation from `currentVariant` (carousel handles images independently)

### Props that become unused

`selectedVariant`, `onVariantChange`, `onAddCart`, `onGotoStep`, `items` — all can be removed from the component signature since the dashboard view passes `disabledActions` and none of the cart/checkout logic is reachable.

---

## Part 2 — ProductDetailsCarousel

### What changes

Each large carousel slide gets a small variant label badge overlaid in the bottom-left corner, identifying which variant the image belongs to.

### Implementation

**Pre-compute `imageVariantMap`** (a plain object `{ [src]: label }`) immediately after `slides` is built:

```js
const imageVariantMap = {};
(product?.variants || []).forEach((variant) => {
  const media = Array.isArray(variant.media) ? variant.media : (variant.media ? [variant.media] : []);
  media.forEach((m) => {
    const src = m?.full_url || m?.url || m?.src || '';
    if (src && !imageVariantMap[src]) {
      // Build label from all option values joined with ' · '
      const label = variant.options?.map((o) => o.value).filter(Boolean).join(' · ') || variant.sku || '';
      if (label) imageVariantMap[src] = label;
    }
  });
});
```

**Overlay in `renderLargeImg`**: wrap each `<Image>` in a `<Box sx={{ position: 'relative' }}>` and add a `<Chip>` absolutely positioned at `bottom: 8, left: 8` when `imageVariantMap[slide.src]` exists.

Chip style: `size="small"`, `variant="filled"`, semi-transparent dark background (`rgba(0,0,0,0.55)`), white text, no pointer events.

**Thumbnails**: no tags (too small).

---

## Files

| File | Change |
|------|--------|
| `product-details-summary.jsx` | Replace variant-specific logic with global overview |
| `product-details-carousel.jsx` | Add `imageVariantMap` + slide overlay chip |

No new files. No new API calls. No i18n keys needed beyond existing `t('variants')`.

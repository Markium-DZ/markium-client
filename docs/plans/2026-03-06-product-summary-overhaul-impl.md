# Product Summary Overhaul + Carousel Variant Tags Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the per-variant hero summary with a global product overview (price range, variant count, all option swatches) and add variant identity tags to carousel images.

**Architecture:** Two self-contained component edits — no new files, no new API calls, no new i18n keys beyond what already exists. `ProductDetailsSummary` drops all per-variant/interactive logic and renders product-level data. `ProductDetailsCarousel` pre-computes an `imageVariantMap` and overlays a `Chip` on each large slide.

**Tech Stack:** React 18, MUI v5 (Unstable_Grid2), `useTranslate` for i18n, SWR data already available via props.

---

## Task 1: Rewrite ProductDetailsSummary — Price Range + Variant Count

**Files:**
- Modify: `src/sections/product/product-details-summary.jsx`

The component currently derives price from `selectedVariant`. Replace with min/max across all variants.

**Step 1: Replace the price + variant-count derivation block**

Find this section (around lines 57–63):

```jsx
const price = parseFloat(currentVariant?.price) || 0;
const priceSale = has_discount && currentVariant?.compare_at_price
  ? parseFloat(currentVariant.compare_at_price)
  : null;
const available = currentVariant?.available_quantity || 0;
const quantity = currentVariant?.quantity || 0;
```

Replace with:

```jsx
const variantCount = variants?.length || 0;

const activePrices = variants
  .map((v) => parseFloat(v.price))
  .filter((p) => !Number.isNaN(p) && p > 0);

const minPrice = activePrices.length > 0 ? Math.min(...activePrices) : 0;
const maxPrice = activePrices.length > 0 ? Math.max(...activePrices) : 0;
const hasPriceRange = minPrice !== maxPrice;
```

**Step 2: Replace `renderPrice`**

Find and replace the `renderPrice` block:

```jsx
// BEFORE
const renderPrice = (
  <Box sx={{ typography: 'h5' }}>
    {priceSale && (
      <Box component="span" sx={{ color: 'text.disabled', textDecoration: 'line-through', mr: 0.5 }}>
        {fCurrency(priceSale)}
      </Box>
    )}
    {fCurrency(price)}
  </Box>
);
```

```jsx
// AFTER
const renderPrice = (
  <Stack spacing={0.5}>
    <Box sx={{ typography: 'h5' }}>
      {hasPriceRange ? (
        <>
          {fCurrency(minPrice)}
          <Box component="span" sx={{ mx: 0.75, color: 'text.disabled' }}>–</Box>
          {fCurrency(maxPrice)}
        </>
      ) : (
        fCurrency(minPrice)
      )}
    </Box>
    {variantCount > 0 && (
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {variantCount} {t('variants')}
      </Typography>
    )}
  </Stack>
);
```

**Step 3: Verify visually**

Open any product with multiple variants at `http://localhost:3031/dashboard/product/[id]`. The hero price area should show a range like "2,500 د.ج – 3,200 د.ج" with "5 variants" below. Single-price products show one price.

**Step 4: Commit**

```bash
git add src/sections/product/product-details-summary.jsx
git commit -m "fix(product-summary): show price range and variant count instead of selected variant price"
```

---

## Task 2: Rewrite ProductDetailsSummary — Options Overview

**Files:**
- Modify: `src/sections/product/product-details-summary.jsx`

Replace `renderVariantInfo` (static per-variant options) with `renderOptionsOverview` (all values for each option type).

**Step 1: Add `Chip` to MUI imports**

At the top of the file, find the MUI imports block. Add `Chip` if not already present:

```jsx
import Chip from '@mui/material/Chip';
```

**Step 2: Add `renderOptionsOverview` block**

Replace the existing `renderVariantInfo` variable with:

```jsx
const renderOptionsOverview = option_definitions?.length > 0 && (
  <Stack spacing={2}>
    {option_definitions.map((optDef) => {
      // Collect all unique values for this option across all variants
      const seen = new Set();
      const uniqueValues = [];
      variants.forEach((variant) => {
        const opt = variant.options?.find((o) => o.option_definition_id === optDef.id);
        if (opt && !seen.has(opt.value_id)) {
          seen.add(opt.value_id);
          uniqueValues.push(opt);
        }
      });

      return (
        <Stack key={optDef.id} direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', minWidth: 80 }}>
            {optDef.name}:
          </Typography>
          <Stack direction="row" spacing={0.75} flexWrap="wrap">
            {uniqueValues.map((opt) => (
              <Chip
                key={opt.value_id}
                size="small"
                label={opt.value}
                avatar={
                  opt.color_hex ? (
                    <Box
                      sx={{
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        bgcolor: opt.color_hex,
                        border: '1px solid',
                        borderColor: 'divider',
                        ml: '4px !important',
                      }}
                    />
                  ) : undefined
                }
                sx={{ height: 24, fontSize: '0.75rem' }}
              />
            ))}
          </Stack>
        </Stack>
      );
    })}
  </Stack>
);
```

**Step 3: Replace `renderVariantInfo` with `renderOptionsOverview` in the return**

Find:

```jsx
{renderVariantInfo}
```

Replace with:

```jsx
{renderOptionsOverview}
```

**Step 4: Remove now-unused code**

Delete these blocks that are no longer needed:

- `const currentVariant = selectedVariant || variants?.[0];`
- The entire `handleOptionChange` function
- The `initialOptions` block and `defaultValues` object
- The `useForm` call and `methods` destructuring
- The `useEffect` that resets the form
- The `onSubmit` and `handleAddCart` handlers
- The `existProduct` and `isMaxQuantity` variables
- The `renderVariantInfo` variable

Also remove unused imports:
- `useEffect`, `useCallback` from `react` (if no longer used)
- `useForm`, `Controller` from `react-hook-form`
- `useRouter` from `src/routes/hooks`
- `paths` from `src/routes/paths`
- `Rating` from `@mui/material/Rating`
- `Link` from `@mui/material/Link`
- `MenuItem` from `@mui/material/MenuItem`
- `formHelperTextClasses` from `@mui/material/FormHelperText`
- `fShortenNumber` from `src/utils/format-number`
- `ColorPicker` from `src/components/color-utils`
- `FormProvider`, `RHFSelect` from `src/components/hook-form`
- `IncrementerButton` from `./common/incrementer-button`

**Step 5: Clean up component signature**

Update the prop signature — remove props that are only needed by the deleted cart/form logic:

```jsx
// BEFORE
export default function ProductDetailsSummary({
  items,
  product,
  selectedVariant,
  onVariantChange,
  onAddCart,
  onGotoStep,
  disabledActions,
  ...other
})

// AFTER
export default function ProductDetailsSummary({ product, ...other }) {
```

Update `PropTypes` to match:

```jsx
ProductDetailsSummary.propTypes = {
  product: PropTypes.object,
};
```

**Step 6: Verify visually**

The hero right column should now show: name → price range → variant count → description → divider → option chips. No broken imports in the console.

**Step 7: Commit**

```bash
git add src/sections/product/product-details-summary.jsx
git commit -m "fix(product-summary): replace per-variant display with global options overview"
```

---

## Task 3: Clean up product-details-view.jsx — Remove dead props

**Files:**
- Modify: `src/sections/product/view/product-details-view.jsx`

The view currently passes `selectedVariant` and `onVariantChange` to `ProductDetailsSummary`. These props no longer exist on the component.

**Step 1: Update the `ProductDetailsSummary` usage**

Find:

```jsx
<ProductDetailsSummary
  disabledActions
  product={product}
  selectedVariant={selectedVariant}
  onVariantChange={setSelectedVariant}
/>
```

Replace with:

```jsx
<ProductDetailsSummary product={product} />
```

**Step 2: Remove now-unused state**

In `product-details-view.jsx`, remove:

```jsx
const [selectedVariant, setSelectedVariant] = useState(null);
```

And remove the `setSelectedVariant` call inside the `useEffect`:

```jsx
// Remove this line from the useEffect:
const defaultVar = product?.variants?.find((v) => v.is_default) || product?.variants?.[0];
setSelectedVariant(defaultVar);
```

If the `useEffect` becomes empty after removing `setSelectedVariant`, remove the whole effect block. Double-check — the effect also calls `setPublish`, so keep that part:

```jsx
useEffect(() => {
  if (product) {
    const status = product?.status === 'deployed' ? 'published' : (product?.status || product?.publish || '');
    setPublish(status);
  }
}, [product]);
```

**Step 3: Verify**

No console errors. Product page loads with updated summary. The `selectedVariant` state is gone.

**Step 4: Commit**

```bash
git add src/sections/product/view/product-details-view.jsx
git commit -m "fix(product-page): remove dead selectedVariant state after summary refactor"
```

---

## Task 4: Add Variant Tags to Carousel Images

**Files:**
- Modify: `src/sections/product/product-details-carousel.jsx`

**Step 1: Pre-compute `imageVariantMap` after `slides` is built**

After the `slides` array is derived (around line where `slides` is built from `mediaSource.map`), add:

```jsx
// Map each image src to the label of the first variant that owns it
const imageVariantMap = {};
(product?.variants || []).forEach((variant) => {
  const media = Array.isArray(variant.media)
    ? variant.media
    : variant.media
    ? [variant.media]
    : [];
  const label = variant.options?.map((o) => o.value).filter(Boolean).join(' · ') || '';
  media.forEach((m) => {
    const src = m?.full_url || m?.url || m?.src || '';
    if (src && !imageVariantMap[src] && label) {
      imageVariantMap[src] = label;
    }
  });
});
```

**Step 2: Add `Chip` to MUI imports**

At the top of the carousel file, add:

```jsx
import Chip from '@mui/material/Chip';
```

**Step 3: Update `renderLargeImg` to overlay the tag**

Find the `<Image>` component inside the Carousel map:

```jsx
{slides.map((slide) => (
  <Image
    key={slide.src}
    alt={slide.src}
    src={slide.src}
    ratio="1/1"
    onClick={() => lightbox.onOpen(slide.src)}
    sx={{ cursor: 'zoom-in' }}
  />
))}
```

Replace with:

```jsx
{slides.map((slide) => (
  <Box key={slide.src} sx={{ position: 'relative' }}>
    <Image
      alt={slide.src}
      src={slide.src}
      ratio="1/1"
      onClick={() => lightbox.onOpen(slide.src)}
      sx={{ cursor: 'zoom-in' }}
    />
    {imageVariantMap[slide.src] && (
      <Chip
        label={imageVariantMap[slide.src]}
        size="small"
        sx={{
          position: 'absolute',
          bottom: 10,
          left: 10,
          bgcolor: 'rgba(0,0,0,0.55)',
          color: 'common.white',
          fontWeight: 600,
          fontSize: '0.7rem',
          height: 22,
          pointerEvents: 'none',
          '& .MuiChip-label': { px: 1 },
        }}
      />
    )}
  </Box>
))}
```

**Step 4: Verify visually**

Open a product with variant images. Each large carousel slide should show a small dark badge (e.g. "Black · S") in the bottom-left corner. Slides with no variant match show no tag. Clicking the image still opens the lightbox.

**Step 5: Commit**

```bash
git add src/sections/product/product-details-carousel.jsx
git commit -m "feat(product-carousel): overlay variant label tag on each slide image"
```

---

## Summary Table

| Task | File | Change |
|------|------|--------|
| 1 — Price range + variant count | `product-details-summary.jsx` | Replace single-variant price with min/max range |
| 2 — Options overview + cleanup | `product-details-summary.jsx` | Replace `renderVariantInfo` with option chips, remove dead form code |
| 3 — Remove dead props from view | `product-details-view.jsx` | Drop `selectedVariant` state and props |
| 4 — Carousel variant tags | `product-details-carousel.jsx` | Pre-compute image→variant map, overlay `Chip` on slides |

# Product Page UX Overhaul Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all UX/UI flaws on the merchant product detail page — eliminate wasted space, fix broken interactions, and improve information density.

**Architecture:** All changes are confined to `src/sections/product/` and `src/api/product.js`. No new components are created — existing MUI primitives and project patterns are reused throughout. Changes are grouped from lowest to highest risk.

**Tech Stack:** React 18, MUI v5 (Unstable_Grid2), react-hook-form, SWR, i18n via `useTranslate`

---

## Task 1: Delete the 160px Dead Zone

**Files:**
- Modify: `src/sections/product/view/product-details-view.jsx:230-252`

The empty `<Box sx={{ my: 10 }}>` with all content commented out creates a 160px invisible gap between the hero section and the tab card. Just delete it.

**Step 1: Delete lines 230–252**

Remove this entire block:

```jsx
<Box
  gap={5}
  display="grid"
  gridTemplateColumns={{
    xs: 'repeat(1, 1fr)',
    md: 'repeat(3, 1fr)',
  }}
  sx={{ my: 10 }}
>
  {/* {SUMMARY.map((item) => (
    <Box key={item.title} sx={{ textAlign: 'center', px: 5 }}>
      <Iconify icon={item.icon} width={32} sx={{ color: 'primary.main' }} />
      <Typography variant="subtitle1" sx={{ mb: 1, mt: 2 }}>
        {item.title}
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {item.description}
      </Typography>
    </Box>
  ))} */}
</Box>
```

Also remove the now-unused `SUMMARY` array at lines 67–83 and the `Typography` import if it becomes unused.

**Step 2: Verify visually**

Open `http://localhost:3031/dashboard/product/[any-id]`. The gap between the hero section and the tab card should now be tight (only the grid's bottom margin).

**Step 3: Commit**

```bash
git add src/sections/product/view/product-details-view.jsx
git commit -m "fix(product-page): remove 160px dead zone left by commented-out SUMMARY block"
```

---

## Task 2: Tighten Hero Grid Spacing and Balance Columns

**Files:**
- Modify: `src/sections/product/view/product-details-view.jsx:215-228`

`spacing={{ lg: 8 }}` = 64px gutter between carousel and summary. `lg={7}` gives the carousel 58% of the page. Both are excessive for a dashboard.

**Step 1: Change grid spacing and column widths**

Find this block (around line 215 after Task 1 removes lines above):

```jsx
<Grid container spacing={{ xs: 3, md: 5, lg: 8 }}>
  <Grid xs={12} md={6} lg={7}>
    <ProductDetailsCarousel product={product} />
  </Grid>

  <Grid xs={12} md={6} lg={5}>
    <ProductDetailsSummary
```

Replace with:

```jsx
<Grid container spacing={{ xs: 3, md: 4, lg: 5 }}>
  <Grid xs={12} md={6} lg={6}>
    <ProductDetailsCarousel product={product} />
  </Grid>

  <Grid xs={12} md={6} lg={6}>
    <ProductDetailsSummary
```

**Step 2: Verify visually**

The hero section should look balanced — equal columns, tighter gutter. No visual overflow.

**Step 3: Commit**

```bash
git add src/sections/product/view/product-details-view.jsx
git commit -m "fix(product-page): tighten hero grid spacing and balance carousel/summary columns"
```

---

## Task 3: Fix Currency Symbol in Variant Edit Dialog

**Files:**
- Modify: `src/sections/product/product-variant-edit-dialog.jsx:184,199,216`

Three price fields show `$` but the app serves Algerian merchants (DZD). The costs section already uses `t('currency_da')`.

**Step 1: Add `useTranslate` if not already imported**

Check the top of `product-variant-edit-dialog.jsx`. If `useTranslate` is not imported, add:

```jsx
import { useTranslate } from 'src/locales';
```

And inside the component function, add:

```jsx
const { t } = useTranslate();
```

**Step 2: Replace all three `$` adornments**

Find and replace each occurrence:

```jsx
// BEFORE (appears 3 times — price, compare_at_price, cost fields)
startAdornment: <InputAdornment position="start">$</InputAdornment>,

// AFTER
startAdornment: <InputAdornment position="start">{t('currency_da')}</InputAdornment>,
```

**Step 3: Verify visually**

Open a product, click the three-dot menu on any variant card, click Edit. All three price fields should show "د.ج" (or whatever `currency_da` resolves to) instead of `$`.

**Step 4: Commit**

```bash
git add src/sections/product/product-variant-edit-dialog.jsx
git commit -m "fix(product-page): replace hardcoded dollar sign with DZD currency in variant edit dialog"
```

---

## Task 4: Consistent Tab Icons

**Files:**
- Modify: `src/sections/product/view/product-details-view.jsx:266-282`

Currently only the "Costs" tab has an icon. Add icons to Variants and Description for visual consistency.

**Step 1: Update the tabs array**

Find this block:

```jsx
{[
  {
    value: 'variants',
    label: `${t('variants')} (${product?.variants?.length || 0})`,
  },
  {
    value: 'costs',
    label: t('costs'),
    icon: <Iconify icon="solar:tag-price-bold-duotone" width={18} />,
  },
  {
    value: 'description',
    label: t('product_description'),
  },
].map((tab) => (
  <Tab key={tab.value} value={tab.value} label={tab.label} icon={tab.icon} iconPosition="start" />
))}
```

Replace with:

```jsx
{[
  {
    value: 'variants',
    label: `${t('variants')} (${product?.variants?.length || 0})`,
    icon: <Iconify icon="solar:layers-bold-duotone" width={18} />,
  },
  {
    value: 'costs',
    label: t('costs'),
    icon: <Iconify icon="solar:tag-price-bold-duotone" width={18} />,
  },
  {
    value: 'description',
    label: t('product_description'),
    icon: <Iconify icon="solar:document-text-bold-duotone" width={18} />,
  },
].map((tab) => (
  <Tab key={tab.value} value={tab.value} label={tab.label} icon={tab.icon} iconPosition="start" />
))}
```

**Step 2: Verify visually**

All three tabs should have icons. Heights should be uniform.

**Step 3: Commit**

```bash
git add src/sections/product/view/product-details-view.jsx
git commit -m "fix(product-page): add icons to all tabs for visual consistency"
```

---

## Task 5: Empty State When Product Has No Images

**Files:**
- Modify: `src/sections/product/product-details-carousel.jsx:123-156`

When `slides.length === 0`, both the main image and thumbnail areas return `null`, leaving the 6-column left hero area completely blank.

**Step 1: Add imports to the carousel file**

At the top of `product-details-carousel.jsx`, add (if not already present):

```jsx
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { RouterLink } from 'src/routes/components';
import { useTranslate } from 'src/locales';
import Iconify from 'src/components/iconify';
```

**Step 2: Accept `editLink` prop**

Change the component signature from:

```jsx
export default function ProductDetailsCarousel({ product }) {
```

To:

```jsx
export default function ProductDetailsCarousel({ product, editLink }) {
  const { t } = useTranslate();
```

**Step 3: Add empty state before the null check**

After the `slides` variable is derived (around line 90 where slides are built from `product`), add the empty state render:

```jsx
const renderEmpty = slides?.length === 0 && (
  <Box
    sx={{
      height: 320,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      border: '2px dashed',
      borderColor: 'divider',
      borderRadius: 2,
      color: 'text.disabled',
      gap: 1.5,
    }}
  >
    <Iconify icon="solar:camera-add-bold-duotone" width={48} />
    <Typography variant="subtitle2">{t('no_images_yet')}</Typography>
    {editLink && (
      <Button
        component={RouterLink}
        href={editLink}
        size="small"
        variant="outlined"
        color="inherit"
        startIcon={<Iconify icon="solar:pen-bold" width={16} />}
      >
        {t('add_images')}
      </Button>
    )}
  </Box>
);
```

**Step 4: Return `renderEmpty` instead of null in the component's return**

Find the return statement of `ProductDetailsCarousel`. Change:

```jsx
return (
  <Box sx={{ '& .slick-slide': { float: (theme) => ... } }}>
    {renderLargeImg}
    {renderThumbnails}
    <Lightbox ... />
  </Box>
);
```

To:

```jsx
if (!slides || slides.length === 0) {
  return renderEmpty;
}

return (
  <Box sx={{ '& .slick-slide': { float: (theme) => ... } }}>
    {renderLargeImg}
    {renderThumbnails}
    <Lightbox ... />
  </Box>
);
```

**Step 5: Pass `editLink` from the parent**

In `product-details-view.jsx`, update the carousel usage:

```jsx
// BEFORE
<ProductDetailsCarousel product={product} />

// AFTER
<ProductDetailsCarousel
  product={product}
  editLink={paths.dashboard.product.edit(`${product?.id}`)}
/>
```

**Step 6: Add i18n keys**

In the locale files (`src/locales/langs/ar.js` and `fr.js` and any others), add:

```js
no_images_yet: 'لا توجد صور بعد',   // ar
add_images: 'إضافة صور',            // ar
```

**Step 7: Verify visually**

Test with a product that has no images — should see the dashed placeholder with camera icon. Test with a product that has images — carousel should work as before.

**Step 8: Commit**

```bash
git add src/sections/product/product-details-carousel.jsx src/sections/product/view/product-details-view.jsx src/locales/langs/
git commit -m "fix(product-page): add empty state when product has no images"
```

---

## Task 6: Empty State for Description Tab

**Files:**
- Modify: `src/sections/product/product-details-description.jsx`
- Modify: `src/sections/product/view/product-details-view.jsx:285-295`

When `description` is an empty string, `Markdown` renders an empty padded div. There is no message or CTA.

**Step 1: Update `ProductDetailsDescription`**

Replace the entire file content:

```jsx
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { RouterLink } from 'src/routes/components';
import { useTranslate } from 'src/locales';
import Iconify from 'src/components/iconify';
import Markdown from 'src/components/markdown';

// ----------------------------------------------------------------------

export default function ProductDetailsDescription({ description, editLink }) {
  const { t } = useTranslate();

  if (!description) {
    return (
      <Box
        sx={{
          p: 5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          color: 'text.disabled',
          gap: 1.5,
        }}
      >
        <Iconify icon="solar:document-text-bold-duotone" width={48} />
        <Typography variant="subtitle2">{t('no_description_yet')}</Typography>
        {editLink && (
          <Button
            component={RouterLink}
            href={editLink}
            size="small"
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon="solar:pen-bold" width={16} />}
          >
            {t('add_description')}
          </Button>
        )}
      </Box>
    );
  }

  return (
    <Markdown
      children={description}
      sx={{
        p: 3,
        '& p, li, ol': {
          typography: 'body2',
        },
        '& ol': {
          p: 0,
          display: { md: 'flex' },
          listStyleType: 'none',
          '& li': {
            '&:first-of-type': {
              minWidth: 240,
              mb: { xs: 0.5, md: 0 },
            },
          },
        },
      }}
    />
  );
}

ProductDetailsDescription.propTypes = {
  description: PropTypes.string,
  editLink: PropTypes.string,
};
```

**Step 2: Pass `editLink` from parent**

In `product-details-view.jsx`, update the description tab:

```jsx
// BEFORE
{currentTab === 'description' && (
  <ProductDetailsDescription
    description={
      typeof product?.content === 'string'
        ? product.content
        : typeof product?.description === 'string'
        ? product.description
        : ''
    }
  />
)}

// AFTER
{currentTab === 'description' && (
  <ProductDetailsDescription
    description={
      typeof product?.content === 'string'
        ? product.content
        : typeof product?.description === 'string'
        ? product.description
        : ''
    }
    editLink={paths.dashboard.product.edit(`${product?.id}`)}
  />
)}
```

**Step 3: Add i18n keys**

```js
no_description_yet: 'لا يوجد وصف بعد',   // ar
add_description: 'إضافة وصف',             // ar
```

**Step 4: Verify visually**

Check a product with no description — should see icon + text + edit button. Check a product with a description — Markdown renders normally.

**Step 5: Commit**

```bash
git add src/sections/product/product-details-description.jsx src/sections/product/view/product-details-view.jsx src/locales/langs/
git commit -m "fix(product-page): add empty state with edit CTA in description tab"
```

---

## Task 7: Fix "Add Variant" Dead Button

**Files:**
- Modify: `src/sections/product/product-details-variants.jsx:32-35,57-63`

`handleAddVariant` only calls `console.log`. Clicking it does nothing visible. Replace the broken handler with a navigation link to the product edit page.

**Step 1: Add imports**

At the top of `product-details-variants.jsx`, add:

```jsx
import Tooltip from '@mui/material/Tooltip';
import { RouterLink } from 'src/routes/components';
import { paths } from 'src/routes/paths';
```

**Step 2: Accept `productId` prop**

Change the component signature:

```jsx
// BEFORE
export default function ProductDetailsVariants({ product, optionDefinitions, onRefresh }) {

// AFTER
export default function ProductDetailsVariants({ product, optionDefinitions, onRefresh }) {
  const editLink = paths.dashboard.product.edit(`${product?.id}`);
```

**Step 3: Replace the header "Add Variant" button**

```jsx
// BEFORE
<Button
  variant="contained"
  startIcon={<Iconify icon="mingcute:add-line" />}
  onClick={handleAddVariant}
>
  {t('add_variant')}
</Button>

// AFTER
<Tooltip title={t('manage_variants_in_edit')} arrow>
  <Button
    component={RouterLink}
    href={editLink}
    variant="contained"
    startIcon={<Iconify icon="solar:pen-bold" width={16} />}
  >
    {t('manage_variants')}
  </Button>
</Tooltip>
```

**Step 4: Replace the empty state "Add First Variant" button**

```jsx
// BEFORE
<Button
  variant="contained"
  startIcon={<Iconify icon="mingcute:add-line" />}
  onClick={handleAddVariant}
  sx={{ mt: 3 }}
>
  {t('add_first_variant')}
</Button>

// AFTER
<Button
  component={RouterLink}
  href={editLink}
  variant="contained"
  startIcon={<Iconify icon="solar:pen-bold" width={16} />}
  sx={{ mt: 3 }}
>
  {t('add_first_variant')}
</Button>
```

**Step 5: Remove dead `handleAddVariant` function (lines 32-35)**

Delete:

```jsx
const handleAddVariant = () => {
  console.log('Add new variant');
  // TODO: Implement add variant functionality
};
```

**Step 6: Add i18n keys**

```js
manage_variants: 'إدارة المتغيرات',
manage_variants_in_edit: 'يمكنك إدارة المتغيرات من صفحة التعديل',
```

**Step 7: Verify visually**

Click "Manage Variants" — should navigate to the product edit page. No more silent no-op.

**Step 8: Commit**

```bash
git add src/sections/product/product-details-variants.jsx src/locales/langs/
git commit -m "fix(product-page): replace dead add-variant no-op with navigation to edit page"
```

---

## Task 8: Move Copy-Link Action Into Toolbar

**Files:**
- Modify: `src/sections/product/view/product-details-view.jsx:174-213`
- Modify: `src/sections/product/product-details-toolbar.jsx`

The copy-link strip floats between toolbar and hero, changing layout height depending on whether the store has a slug. Move it into the toolbar's action row.

**Step 1: Add `publicProductUrl` and `onCopyLink` props to toolbar**

In `product-details-toolbar.jsx`, update the prop signature:

```jsx
export default function ProductDetailsToolbar({
  publish,
  backLink,
  editLink,
  costsLink,
  liveLink,
  publishOptions,
  onChangePublish,
  publicProductUrl,   // ADD
  onCopyLink,         // ADD
  sx,
  ...other
})
```

**Step 2: Add the copy-link button inside the toolbar's Stack, before the publish dropdown**

Inside the `<Stack direction="row" spacing={0.5} alignItems="center">` in the toolbar (around line 74), add before the publish `LoadingButton`:

```jsx
{publicProductUrl && (
  <>
    <Tooltip title={t('copy_product_link')} arrow>
      <IconButton
        size="small"
        onClick={onCopyLink}
        sx={{
          color: 'text.secondary',
          bgcolor: (theme) => alpha(theme.palette.grey[500], 0.08),
          '&:hover': { bgcolor: (theme) => alpha(theme.palette.grey[500], 0.16) },
        }}
      >
        <Iconify icon="eva:copy-fill" width={18} />
      </IconButton>
    </Tooltip>

    <Tooltip title={t('open_in_new_tab')} arrow>
      <IconButton
        component="a"
        href={publicProductUrl}
        target="_blank"
        rel="noopener noreferrer"
        size="small"
        sx={{
          color: 'text.secondary',
          bgcolor: (theme) => alpha(theme.palette.grey[500], 0.08),
          '&:hover': { bgcolor: (theme) => alpha(theme.palette.grey[500], 0.16) },
        }}
      >
        <Iconify icon="eva:external-link-fill" width={18} />
      </IconButton>
    </Tooltip>
  </>
)}
```

**Step 3: Update `ProductDetailsToolbar.propTypes`**

```jsx
ProductDetailsToolbar.propTypes = {
  // ... existing props ...
  publicProductUrl: PropTypes.string,
  onCopyLink: PropTypes.func,
};
```

**Step 4: Pass props from `product-details-view.jsx` to `ProductDetailsToolbar`**

```jsx
<ProductDetailsToolbar
  backLink={paths.dashboard.product.root}
  editLink={paths.dashboard.product.edit(`${product?.id}`)}
  costsLink={paths.dashboard.product.costs(`${product?.id}`)}
  liveLink={paths.product.details(`${product?.id}`)}
  publish={publishLoading ? '' : (publish || '')}
  onChangePublish={handleChangePublish}
  publishOptions={PRODUCT_PUBLISH_OPTIONS}
  publicProductUrl={publicProductUrl}   // ADD
  onCopyLink={handleCopyLink}           // ADD
/>
```

**Step 5: Delete the orphaned copy-link Stack in the view**

Remove the entire block at lines 174–213:

```jsx
{publicProductUrl && (
  <Stack
    direction="row"
    ...
  >
    ...
  </Stack>
)}
```

**Step 6: Verify visually**

The toolbar should now show the copy and open-in-new-tab icon buttons inline with Edit and Manage Costs. The area between toolbar and hero should be clean. For merchants without a store slug, neither icon appears — no layout shift.

**Step 7: Commit**

```bash
git add src/sections/product/product-details-toolbar.jsx src/sections/product/view/product-details-view.jsx
git commit -m "fix(product-page): move copy-link action into toolbar, remove orphaned strip between toolbar and hero"
```

---

## Task 9: Fix Publish Toggle Loading Flash

**Files:**
- Modify: `src/sections/product/view/product-details-view.jsx:87,98-107`
- Modify: `src/sections/product/product-details-toolbar.jsx:134`

On every page load there is a brief loading spinner because `publish` initializes to `''`. Fix by deriving the initial state directly.

**Step 1: Initialize `publish` from product synchronously**

In `product-details-view.jsx`, the toolbar receives:

```jsx
publish={publishLoading ? '' : (publish || '')}
```

The problem is `publish` starts as `''` and the `useEffect` that sets it runs after render. Change the initial state to use a lazy initializer:

```jsx
// BEFORE
const [publish, setPublish] = useState('');

// AFTER — no change needed here; fix is in the toolbar
```

The toolbar treats `!publish` (empty string) as loading. But at page load, `product` is null until data arrives, so `publish` will be `''` legitimately during load. The real fix is to only show the loading state when `productLoading` is true, not when publish is empty.

In `product-details-toolbar.jsx`, line 134:

```jsx
// BEFORE
loading={!publish}

// AFTER
loading={publish === ''}
```

And in `product-details-view.jsx`, pass `publishLoading` separately so the toolbar can distinguish "still loading product" from "waiting for deploy API":

```jsx
// Pass productLoading to toolbar
publish={publish || ''}
// and update the toolbar to show loading only during actual deploy action
```

Simplest fix — update the toolbar prop to be explicit:

In the view, change the toolbar call:

```jsx
// BEFORE
publish={publishLoading ? '' : (publish || '')}

// AFTER
publish={publish || ''}
loading={publishLoading}
```

In the toolbar, add `loading` to props and use it:

```jsx
export default function ProductDetailsToolbar({
  // ... existing ...
  loading,   // ADD
}) {
  // ...
  <LoadingButton
    loading={loading}          // WAS: loading={!publish}
    // ...
  >
```

**Step 2: Disable "Draft" option when product is already deployed**

In `product-details-toolbar.jsx`, update the MenuItem render in the popover:

```jsx
{publishOptions.map((option) => (
  <MenuItem
    key={option.value}
    selected={option.value === publish}
    disabled={option.value === 'draft' && isPublished}  // ADD
    onClick={() => {
      popover.onClose();
      onChangePublish(option.value);
    }}
    // ...
  >
```

Pass `isPublished` down from the view, or derive it in the toolbar from `publish === 'published'` (already done via `const isPublished = publish === 'published'` at line 37).

**Step 3: Update PropTypes**

```jsx
ProductDetailsToolbar.propTypes = {
  // ... existing ...
  loading: PropTypes.bool,
};
```

**Step 4: Verify visually**

On page load: no loading spinner — the button should immediately show "Draft" or "Published" based on product status. After clicking publish and during the API call: spinner appears. "Draft" option in the dropdown should be greyed out for published products.

**Step 5: Commit**

```bash
git add src/sections/product/view/product-details-view.jsx src/sections/product/product-details-toolbar.jsx
git commit -m "fix(product-page): eliminate publish loading flash on page load, disable Draft option for deployed products"
```

---

## Task 10: Fix Variant Image Display (Avatar → contain-fit)

**Files:**
- Modify: `src/sections/product/product-details-variants.jsx:139-146`

`Avatar` uses `object-fit: cover` which crops product images. Replace with a plain `Box` + `img` using `object-fit: contain`.

**Step 1: Replace `Avatar` in `VariantCard` with a `Box`**

Find the Avatar in `VariantCard` (around line 139):

```jsx
<Avatar
  src={variant.media && variant.media.length > 0 ? (variant.media[0]?.full_url || '') : ''}
  variant="rounded"
  sx={{
    width: { xs: '100%', sm: 120 },
    height: { xs: 200, sm: 120 }
  }}
/>
```

Replace with:

```jsx
<Box
  sx={{
    flexShrink: 0,
    width: { xs: '100%', sm: 120 },
    height: { xs: 200, sm: 120 },
    borderRadius: 1.5,
    overflow: 'hidden',
    bgcolor: 'background.neutral',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid',
    borderColor: 'divider',
  }}
>
  {variant.media && variant.media.length > 0 ? (
    <Box
      component="img"
      src={variant.media[0]?.full_url || ''}
      alt={variant.sku || ''}
      sx={{
        width: '100%',
        height: '100%',
        objectFit: 'contain',
      }}
    />
  ) : (
    <Iconify icon="solar:camera-bold-duotone" width={32} sx={{ color: 'text.disabled' }} />
  )}
</Box>
```

Remove the `Avatar` import if it is no longer used elsewhere in the file.

**Step 2: Verify visually**

Check a variant with a product image — it should display contained (no cropping). Check a variant without an image — should see the camera placeholder icon.

**Step 3: Commit**

```bash
git add src/sections/product/product-details-variants.jsx
git commit -m "fix(product-page): replace Avatar crop with contain-fit image in variant cards"
```

---

## Task 11: Update Loading Skeleton to Match Actual Layout

**Files:**
- Modify: `src/sections/product/product-skeleton.jsx:45-81`

`ProductDetailsSkeleton` renders 3 circular icons from the deleted SUMMARY block. It should mirror the actual page: hero grid + tab card with rows.

**Step 1: Replace `ProductDetailsSkeleton`**

Replace the function body (lines 45–81):

```jsx
export function ProductDetailsSkeleton({ ...other }) {
  return (
    <Grid container spacing={{ xs: 3, md: 4, lg: 5 }} {...other}>
      {/* Hero left — image */}
      <Grid xs={12} md={6} lg={6}>
        <Skeleton sx={{ paddingTop: '100%', borderRadius: 2 }} />
      </Grid>

      {/* Hero right — product info */}
      <Grid xs={12} md={6} lg={6}>
        <Stack spacing={2.5}>
          <Skeleton sx={{ height: 14, width: 80, borderRadius: 1 }} />
          <Skeleton sx={{ height: 28, width: '70%', borderRadius: 1 }} />
          <Skeleton sx={{ height: 20, width: 100, borderRadius: 1 }} />
          <Skeleton sx={{ height: 14, width: '90%', borderRadius: 1 }} />
          <Skeleton sx={{ height: 14, width: '75%', borderRadius: 1 }} />
          <Stack direction="row" spacing={1} sx={{ pt: 1 }}>
            <Skeleton sx={{ height: 32, width: 80, borderRadius: 1 }} />
            <Skeleton sx={{ height: 32, width: 80, borderRadius: 1 }} />
          </Stack>
        </Stack>
      </Grid>

      {/* Tab card */}
      <Grid xs={12}>
        <Paper variant="outlined" sx={{ borderRadius: 2 }}>
          {/* Tab headers */}
          <Stack direction="row" spacing={2} sx={{ px: 3, pt: 2, pb: 0 }}>
            <Skeleton sx={{ height: 44, width: 120, borderRadius: 1 }} />
            <Skeleton sx={{ height: 44, width: 100, borderRadius: 1 }} />
            <Skeleton sx={{ height: 44, width: 130, borderRadius: 1 }} />
          </Stack>
          <Skeleton sx={{ height: 2, width: '100%' }} />
          {/* Row skeletons */}
          <Stack spacing={2} sx={{ p: 3 }}>
            {[...Array(2)].map((_, i) => (
              <Paper key={i} variant="outlined" sx={{ p: 2, borderRadius: 1.5 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Skeleton sx={{ width: 80, height: 80, borderRadius: 1.5, flexShrink: 0 }} />
                  <Stack spacing={1} sx={{ flexGrow: 1 }}>
                    <Skeleton sx={{ height: 16, width: '40%' }} />
                    <Skeleton sx={{ height: 14, width: '60%' }} />
                    <Stack direction="row" spacing={2}>
                      <Skeleton sx={{ height: 14, width: 60 }} />
                      <Skeleton sx={{ height: 14, width: 60 }} />
                      <Skeleton sx={{ height: 14, width: 60 }} />
                    </Stack>
                  </Stack>
                </Stack>
              </Paper>
            ))}
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );
}
```

You'll need to add `Paper` to imports at the top of the file:

```jsx
import Paper from '@mui/material/Paper';
```

**Step 2: Verify visually**

Navigate to any product page on a slow connection (use Chrome DevTools Network throttling → Slow 3G). The skeleton should now visually match the page structure that appears after load.

**Step 3: Commit**

```bash
git add src/sections/product/product-skeleton.jsx
git commit -m "fix(product-page): update loading skeleton to match current hero + tabs layout"
```

---

## Task 12: Remove Costs Tab (Avoid Duplication)

**Files:**
- Modify: `src/sections/product/view/product-details-view.jsx:40,266-282,305-307`

The "Costs" tab in the detail page duplicates the standalone `/dashboard/product/:id/costs` page, which has more features. Remove the inline tab and keep the "Manage Costs" toolbar button as the single entry point.

**Step 1: Remove the `costs` tab from the tabs array**

In `product-details-view.jsx`, find the tabs array and remove the costs entry:

```jsx
// BEFORE
{[
  { value: 'variants', label: ..., icon: ... },
  { value: 'costs',    label: ..., icon: ... },  // REMOVE THIS
  { value: 'description', label: ..., icon: ... },
]}

// AFTER
{[
  { value: 'variants', label: ..., icon: ... },
  { value: 'description', label: ..., icon: ... },
]}
```

**Step 2: Remove the `costs` tab panel**

```jsx
// REMOVE this block entirely:
{currentTab === 'costs' && (
  <ProductDetailsCosts product={product} />
)}
```

**Step 3: Remove the `ProductDetailsCosts` import**

```jsx
// REMOVE:
import ProductDetailsCosts from '../product-details-costs';
```

**Step 4: Verify**

The tab bar should now show only Variants and Description. The "Manage Costs" button in the toolbar should still navigate to the full costs page.

**Step 5: Commit**

```bash
git add src/sections/product/view/product-details-view.jsx
git commit -m "fix(product-page): remove duplicate costs tab — toolbar button is the single entry point"
```

---

## Task 13: Delete Legacy Duplicate Files and Debug Logs

**Files:**
- Delete: `src/sections/product/view/product-details-view-markium.jsx`
- Delete: `src/pages/dashboard/product/details_markium.jsx`
- Modify: `src/sections/product/view/product-details-view.jsx:48`

The legacy view has hardcoded English strings, no i18n, and ships `console.log` debug statements.

**Step 1: Check if any route references `details_markium`**

```bash
grep -r "details_markium\|markium_detail\|product-details-view-markium" src/routes/ src/pages/
```

If a route entry exists, remove it.

**Step 2: Delete the legacy files**

```bash
rm src/sections/product/view/product-details-view-markium.jsx
rm src/pages/dashboard/product/details_markium.jsx
```

**Step 3: Remove debug console.log from active view**

In `product-details-view.jsx` line 48:

```jsx
// REMOVE:
console.log("product :" ,product)
```

**Step 4: Verify**

Run the dev server — no import errors. Navigate to the product page — works normally.

**Step 5: Commit**

```bash
git add -A
git commit -m "chore(product-page): delete legacy markium duplicate view and remove debug console.log"
```

---

## Task 14: Fix API — Fetch Single Product Instead of Full Catalog

**Files:**
- Modify: `src/api/product.js:38-58`

`useGetProduct` fetches the entire product list and does a `.find()` in JavaScript. This means every product detail page load downloads the full catalog.

**Step 1: Read the existing `endpoints` config**

Check `src/utils/axios.js` or wherever `endpoints` is defined. Look for a per-product endpoint. The route paths already reference `paths.dashboard.product.details(id)`, suggesting an API endpoint exists or is intended.

Find the endpoints file:

```bash
grep -r "product" src/utils/axios.js src/api/
```

**Step 2: Add a per-product endpoint if it doesn't exist**

In the endpoints config (likely `src/utils/axios.js`), look for:

```js
product: {
  root: '/products',
  // ...
}
```

Add:

```js
product: {
  root: '/products',
  details: (id) => `/products/${id}`,
  // ... existing entries
}
```

**Step 3: Update `useGetProduct`**

```js
// BEFORE
export function useGetProduct(productId) {
  const URL = endpoints.product.root;
  const { data, isLoading, error, mutate } = useSWR(URL, fetcher, swrOptions);
  const memoizedValue = useMemo(
    () => ({
      product: data?.data?.find(p => p.id == productId) || null,
      productLoading: isLoading,
      productError: error,
      productMutate: mutate,
    }),
    [data?.data, productId, isLoading, error, mutate]
  );
  return memoizedValue;
}

// AFTER
export function useGetProduct(productId) {
  const URL = productId ? endpoints.product.details(productId) : null;
  const { data, isLoading, error, mutate } = useSWR(URL, fetcher, swrOptions);
  const memoizedValue = useMemo(
    () => ({
      product: data?.data || null,
      productLoading: isLoading,
      productError: error,
      productMutate: mutate,
    }),
    [data?.data, isLoading, error, mutate]
  );
  return memoizedValue;
}
```

**Note:** The exact shape of the API response (`data?.data`) may differ between the list endpoint and the details endpoint. Verify the actual response shape from the API and adjust accordingly. If the backend does not yet have a per-product GET endpoint, confirm with the backend team before implementing this task.

**Step 4: Test with a real product**

Open any product detail page. Check the Network tab in DevTools — you should see a single `GET /products/:id` request, not a full `GET /products` list request.

**Step 5: Commit**

```bash
git add src/api/product.js src/utils/axios.js
git commit -m "perf(product-page): fetch single product by ID instead of full catalog"
```

---

## Summary Table

| Task | File(s) | Impact | Risk |
|------|---------|--------|------|
| 1 — Delete dead zone | `product-details-view.jsx` | Removes 160px gap | None |
| 2 — Tighten hero grid | `product-details-view.jsx` | Better balance | None |
| 3 — Fix currency symbol | `product-variant-edit-dialog.jsx` | Correctness | None |
| 4 — Tab icon consistency | `product-details-view.jsx` | Visual polish | None |
| 5 — Carousel empty state | `product-details-carousel.jsx` | UX for imageless products | Low |
| 6 — Description empty state | `product-details-description.jsx` | UX for empty descriptions | None |
| 7 — Fix dead add-variant button | `product-details-variants.jsx` | Merchant trust | None |
| 8 — Move copy-link to toolbar | `product-details-toolbar.jsx`, view | Cleaner layout | Low |
| 9 — Fix publish loading flash | toolbar + view | UX polish | Low |
| 10 — Fix variant image crop | `product-details-variants.jsx` | Visual correctness | None |
| 11 — Fix loading skeleton | `product-skeleton.jsx` | UX during load | None |
| 12 — Remove duplicate costs tab | `product-details-view.jsx` | Single source of truth | None |
| 13 — Delete legacy files + debug logs | `*-markium.jsx`, view | Codebase hygiene | None |
| 14 — Fix API fetch | `product.js` | Performance | Medium* |

*Task 14 depends on backend having a per-product GET endpoint. Confirm first.

# Revenue Stream PR #8 Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all code review issues found in PR #8 (Feat/revenu-stream) — 2 blockers, 4 high-priority, 6 medium-priority issues.

**Architecture:** Targeted fixes across the existing `feat/revenu-stream` branch. No new features — only bug fixes, deduplication, and consistency improvements. Work on the `feat/revenu-stream` branch.

**Tech Stack:** React 18, MUI v5, @mui/x-charts, SWR, i18next, Yup, framer-motion

**Branch:** `feat/revenu-stream` (checkout before starting)

---

## Task 1: Fix ApexCharts crash — replace with @mui/x-charts PieChart (BLOCKER)

**Files:**
- Modify: `src/sections/profitability/components/cost-breakdown-chart.jsx`

**Step 1: Rewrite cost-breakdown-chart.jsx**

Replace the entire file. The current file imports `react-apexcharts` which is stubbed out. Replace with `@mui/x-charts/PieChart`.

Remove these imports:
```jsx
import Chart from 'react-apexcharts';
```

Add this import:
```jsx
import { PieChart } from '@mui/x-charts/PieChart';
```

Remove the entire `chartOptions` object (the `useMemo` block that builds ApexCharts options — approximately lines 21-73).

Replace the `<Chart type="donut" series={series} options={chartOptions} height={280} />` with:

```jsx
<PieChart
  series={[
    {
      data: entries.map(([key, val], idx) => ({
        id: idx,
        value: val,
        label: labels[idx],
        color: colors[idx],
      })),
      innerRadius: '55%',
      outerRadius: '90%',
      paddingAngle: 2,
      cornerRadius: 4,
      arcLabel: (item) => `${((item.value / total) * 100).toFixed(0)}%`,
      arcLabelMinAngle: 20,
    },
  ]}
  height={280}
  slotProps={{ legend: { hidden: true } }}
  margin={{ top: 0, bottom: 0, left: 0, right: 0 }}
/>
```

Keep the custom legend JSX block below the chart (the `<Stack>` with colored dots and labels) — that stays unchanged.

Remove `useTheme` import if it is no longer used after removing `chartOptions`. Keep `alpha` from `@mui/material/styles` if it's used in the legend.

**Step 2: Verify build**

Run: `npm run build`

Expected: Build succeeds with no errors about `react-apexcharts`.

**Step 3: Verify visually**

Run: `npm run dev` → navigate to any profitability page with a cost breakdown chart.

Expected: Donut chart renders with colored segments, percentage labels, and the custom legend below.

**Step 4: Commit**

```bash
git add src/sections/profitability/components/cost-breakdown-chart.jsx
git commit -m "fix: replace react-apexcharts with @mui/x-charts PieChart in cost breakdown"
```

---

## Task 2: Fix invalid locale in number formatting (BLOCKER)

**Files:**
- Modify: `src/sections/profitability/components/profitability-summary-cards.jsx`
- Modify: `src/sections/product-costs/view/product-costs-view.jsx`
- Modify: `src/sections/product/product-details-costs.jsx`
- Modify: `src/sections/profitability/view/profitability-overview-view.jsx`
- Modify: `src/sections/profitability/constants.js`

**Step 1: Fix profitability-summary-cards.jsx**

Find all `.toLocaleString('fr-DZ', ...)` calls. Replace with `fNumber()` from `src/utils/format-number.js`.

Add import:
```jsx
import { fNumber } from 'src/utils/format-number';
```

Replace:
```jsx
// OLD:
value.toLocaleString('fr-DZ', { minimumFractionDigits: value % 1 !== 0 ? 1 : 0 })
// NEW:
fNumber(value)
```

**Step 2: Fix product-costs-view.jsx**

Search for any `.toLocaleString('fr-DZ'` calls and replace with `fNumber()`. Add import if not present:
```jsx
import { fNumber } from 'src/utils/format-number';
```

**Step 3: Fix product-details-costs.jsx**

Same fix — search for `.toLocaleString('fr-DZ'` and replace with `fNumber()`.

**Step 4: Fix profitability-overview-view.jsx**

Same fix — search for `.toLocaleString('fr-DZ'` and replace with `fNumber()`.

**Step 5: Fix profitability/constants.js**

The `fmtAmount` helper uses `toLocaleString('fr-DZ')`. Replace:

```js
// OLD:
export const fmtAmount = (v) => v?.toLocaleString('fr-DZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '—';
// NEW:
import { fNumber } from 'src/utils/format-number';
export const fmtAmount = (v) => (v != null ? fNumber(v) : '—');
```

**Step 6: Search for any remaining `'fr-DZ'` references**

Run: `grep -r "fr-DZ" src/` — should return 0 results.

**Step 7: Commit**

```bash
git add src/sections/profitability/components/profitability-summary-cards.jsx src/sections/product-costs/view/product-costs-view.jsx src/sections/product/product-details-costs.jsx src/sections/profitability/view/profitability-overview-view.jsx src/sections/profitability/constants.js
git commit -m "fix: replace invalid 'fr-DZ' locale with fNumber utility"
```

---

## Task 3: Extract shared CostRow component to eliminate duplication (HIGH)

**Files:**
- Create: `src/sections/product-costs/cost-row.jsx`
- Modify: `src/sections/product-costs/view/product-costs-view.jsx`
- Modify: `src/sections/product/product-details-costs.jsx`

**Step 1: Create the shared cost-row.jsx**

Create `src/sections/product-costs/cost-row.jsx`. Extract from `product-costs-view.jsx`:

1. The `TABLE_HEAD` constant — export it as `COST_TABLE_HEAD`
2. The `CostRow` component — export it as the default export

The component signature should be:
```jsx
export const COST_TABLE_HEAD = [
  { id: 'type', label: 'cost_type' },
  { id: 'scope', label: 'scope' },
  { id: 'amount', label: 'amount' },
  { id: 'details', label: 'details' },
  { id: 'notes', label: 'notes' },
  { id: 'actions', label: '', width: 50 },
];

export default function CostRow({ cost, product, onEdit, onDelete }) {
  // ... exact same CostRow code from product-costs-view.jsx
}
```

Copy ALL imports that `CostRow` needs (TableRow, TableCell, IconButton, Tooltip, MenuItem, Iconify, Label, usePopover, CustomPopover, useTranslation, fNumber, getCostTypeConfig, getChannelConfig, COST_TYPES).

**Step 2: Update product-costs-view.jsx**

Remove the local `TABLE_HEAD` constant and `CostRow` function. Add imports:

```jsx
import CostRow, { COST_TABLE_HEAD } from '../cost-row';
```

Replace all references to `TABLE_HEAD` with `COST_TABLE_HEAD`.

**Step 3: Update product-details-costs.jsx**

Remove the local `TABLE_HEAD` constant and `CostRow` function. Add imports:

```jsx
import CostRow, { COST_TABLE_HEAD } from 'src/sections/product-costs/cost-row';
```

Replace all references to `TABLE_HEAD` with `COST_TABLE_HEAD`.

**Step 4: Verify both views still work**

Run: `npm run dev`
- Navigate to `/dashboard/product/:id/costs` (standalone page) — table should render correctly
- Navigate to product detail page → costs tab — table should render correctly

**Step 5: Commit**

```bash
git add src/sections/product-costs/cost-row.jsx src/sections/product-costs/view/product-costs-view.jsx src/sections/product/product-details-costs.jsx
git commit -m "refactor: extract shared CostRow component to eliminate duplication"
```

---

## Task 4: Add error handling to all profitability views (HIGH)

**Files:**
- Modify: `src/sections/profitability/view/profitability-overview-view.jsx`
- Modify: `src/sections/profitability/view/profitability-products-view.jsx`
- Modify: `src/sections/profitability/view/profitability-campaigns-view.jsx`
- Modify: `src/sections/profitability/view/profitability-channels-view.jsx`
- Modify: `src/sections/profitability/view/profitability-channel-view.jsx`

**Step 1: Fix profitability-overview-view.jsx**

Add `storePnLError` to the destructured values from `useGetStorePnL`:
```jsx
const { storePnL, storePnLLoading, storePnLError, storePnLForbidden } = useGetStorePnL(dateFrom);
```

After the loading check and before the forbidden check, add:
```jsx
if (storePnLError && !storePnLForbidden) {
  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'}>
      <EmptyContent title={t('error')} description={t('error_loading_data', 'Could not load data. Please try again.')} />
    </Container>
  );
}
```

Import `EmptyContent` if not already imported:
```jsx
import EmptyContent from 'src/components/empty-content';
```

**Step 2: Fix profitability-products-view.jsx**

Same pattern — destructure `productsPnLError`, add error render:
```jsx
const { productsPnL, productsPnLLoading, productsPnLError, productsPnLForbidden } = useGetProductsPnL(dateFrom);
```

Add after loading check:
```jsx
if (productsPnLError && !productsPnLForbidden) {
  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'}>
      <EmptyContent title={t('error')} description={t('error_loading_data', 'Could not load data. Please try again.')} />
    </Container>
  );
}
```

**Step 3: Fix profitability-campaigns-view.jsx**

Destructure `campaignsError`:
```jsx
const { campaignsROI, campaignsLoading, campaignsError, campaignsForbidden } = useGetCampaignsROI(dateFrom);
```

Add error render after loading check.

**Step 4: Fix profitability-channels-view.jsx**

Destructure `channelsError`:
```jsx
const { channelsOverview, channelsLoading, channelsError, channelsForbidden } = useGetChannelsOverview(dateFrom);
```

Add error render after loading check.

**Step 5: Fix profitability-channel-view.jsx**

Destructure `channelDetailError`:
```jsx
const { channelDetail, channelDetailLoading, channelDetailError, channelDetailForbidden } = useGetChannelDetail(channel, dateFrom);
```

Add error render after loading check.

**Step 6: Verify error handling**

Temporarily modify the API URL in one hook to trigger a 500 error. Verify the error message renders.

**Step 7: Commit**

```bash
git add src/sections/profitability/view/
git commit -m "fix: add error state handling to all profitability views"
```

---

## Task 5: Validate channel URL parameter (HIGH)

**Files:**
- Modify: `src/pages/dashboard/profitability/channel-detail.jsx`

**Step 1: Add channel validation**

```jsx
import { Helmet } from 'react-helmet-async';
import { useParams, Navigate } from 'react-router-dom';
import { ProfitabilityChannelView } from 'src/sections/profitability/view';
import { paths } from 'src/routes/paths';

const VALID_CHANNELS = ['facebook', 'tiktok', 'google', 'instagram', 'snapchat', 'other'];

export default function ProfitabilityChannelDetailPage() {
  const { channel } = useParams();

  if (!VALID_CHANNELS.includes(channel)) {
    return <Navigate to={paths.dashboard.profitability.channels} replace />;
  }

  return (
    <>
      <Helmet>
        <title>Dashboard: Channel Detail</title>
      </Helmet>

      <ProfitabilityChannelView channel={channel} />
    </>
  );
}
```

**Step 2: Verify redirect**

Run: `npm run dev` → navigate to `/dashboard/profitability/channels/invalid-channel`.

Expected: Redirects to `/dashboard/profitability/channels`.

**Step 3: Commit**

```bash
git add src/pages/dashboard/profitability/channel-detail.jsx
git commit -m "fix: validate channel URL parameter to prevent invalid API calls"
```

---

## Task 6: Fix existing total_revenue translation change (HIGH)

**Files:**
- Modify: `src/locales/langs/en.json`
- Modify: `src/locales/langs/ar.json`
- Modify: `src/locales/langs/fr.json`

**Step 1: Revert total_revenue to original short labels**

The PR changed existing `total_revenue` translations to longer versions. Revert them and create a new key `total_revenue_full` for the profitability views.

In `en.json`:
```json
"total_revenue": "Revenue",
"total_revenue_full": "Total Revenue",
```

In `ar.json`:
```json
"total_revenue": "الأرباح",
"total_revenue_full": "إجمالي الإيرادات",
```

In `fr.json`:
```json
"total_revenue": "Revenus",
"total_revenue_full": "Revenu total",
```

**Step 2: Update profitability views to use the new key**

Search all profitability view files for `t('total_revenue')` and replace with `t('total_revenue_full')` where the longer label is intended (in the profitability summary cards/overview).

Run: `grep -rn "t('total_revenue')" src/sections/profitability/` to find all usages.

**Step 3: Verify existing analytics page is not broken**

Run: `npm run dev` → navigate to `/dashboard/analytics`.

Expected: Analytics cards still show short labels ("Revenue" / "الأرباح" / "Revenus").

**Step 4: Commit**

```bash
git add src/locales/langs/ src/sections/profitability/
git commit -m "fix: revert total_revenue translation, add total_revenue_full for profitability"
```

---

## Task 7: Fix Yup schema issues in cost-form-dialog.jsx (MEDIUM)

**Files:**
- Modify: `src/sections/product-costs/cost-form-dialog.jsx`

**Step 1: Fix variant_id validation**

Find the `variant_id` schema definition (approximately line 56). Change it to always be optional:

```jsx
// OLD:
variant_id: Yup.number()
  .transform((value, originalValue) => (originalValue === '' ? null : value))
  .when('type', {
    is: 'buy_price',
    then: (schema) => schema.required(t('variant') + ' ' + t('name_is_required')),
    otherwise: (schema) => schema.nullable(),
  }),

// NEW:
variant_id: Yup.number()
  .transform((value, originalValue) => (originalValue === '' ? null : value))
  .nullable(),
```

**Step 2: Fix amount typeError**

Find the `amount` schema definition (approximately line 46). Add `.typeError()`:

```jsx
// OLD:
amount: Yup.number()
  .required(t('amount') + ' ' + t('name_is_required'))
  .min(0)
  .max(99999999.99),

// NEW:
amount: Yup.number()
  .typeError(t('amount') + ' ' + t('name_is_required'))
  .required(t('amount') + ' ' + t('name_is_required'))
  .min(0)
  .max(99999999.99),
```

**Step 3: Memoize the schema**

Wrap the `CostSchema` definition in `useMemo`:

```jsx
const CostSchema = useMemo(
  () =>
    Yup.object().shape({
      // ... all fields
    }),
  [t]
);
```

**Step 4: Commit**

```bash
git add src/sections/product-costs/cost-form-dialog.jsx
git commit -m "fix: fix Yup schema validation for variant_id and amount in cost form"
```

---

## Task 8: Fix 403 retry in product-costs.js API hook (MEDIUM)

**Files:**
- Modify: `src/api/product-costs.js`

**Step 1: Add 403 bail-out**

Find the `onErrorRetry` function (approximately lines 8-14). Add the 403 check as the first line:

```jsx
onErrorRetry: (err, key, config, revalidate, { retryCount }) => {
  if (err?.status === 403) return;  // ← ADD THIS LINE
  const delays = [5000, 10000, 20000, 30000];
  if (retryCount >= delays.length) return;
  setTimeout(() => revalidate({ retryCount }), delays[retryCount]);
},
```

**Step 2: Commit**

```bash
git add src/api/product-costs.js
git commit -m "fix: skip retry on 403 in product-costs API hook"
```

---

## Task 9: Replace Chip variant="soft" with Label (MEDIUM)

**Files:**
- Modify: `src/sections/profitability/view/profitability-overview-view.jsx`
- Modify: `src/sections/profitability/view/profitability-products-view.jsx`
- Modify: `src/sections/profitability/view/profitability-campaigns-view.jsx`
- Modify: `src/sections/profitability/view/profitability-channel-view.jsx`

**Step 1: Fix profitability-overview-view.jsx**

Find all `<Chip variant="soft"` usages. Replace with `<Label variant="soft"`.

Remove `Chip` from MUI imports if no longer used. Add:
```jsx
import Label from 'src/components/label';
```

Replace each instance:
```jsx
// OLD:
<Chip label={`${topProducts.length} ${t('products')}`} size="small" variant="soft" color="success" />
// NEW:
<Label variant="soft" color="success">{`${topProducts.length} ${t('products')}`}</Label>
```

Note: `Label` does not have a `size` prop — it has its own default size. Remove `size="small"` from each replacement.

**Step 2: Fix profitability-products-view.jsx**

Same replacement. Find `<Chip variant="soft"` → `<Label variant="soft">`.

**Step 3: Fix profitability-campaigns-view.jsx**

Same replacement.

**Step 4: Fix profitability-channel-view.jsx**

Same replacement.

**Step 5: Verify no remaining Chip variant="soft"**

Run: `grep -rn 'variant="soft"' src/sections/profitability/ | grep -i chip`

Expected: 0 results.

**Step 6: Commit**

```bash
git add src/sections/profitability/view/
git commit -m "fix: replace Chip variant='soft' with Label component"
```

---

## Task 10: Extract shared MarginBar component (MEDIUM)

**Files:**
- Create: `src/sections/profitability/components/margin-bar.jsx`
- Modify: `src/sections/profitability/view/profitability-overview-view.jsx`
- Modify: `src/sections/profitability/view/profitability-products-view.jsx`

**Step 1: Create margin-bar.jsx**

Create `src/sections/profitability/components/margin-bar.jsx`. Extract the `MarginBar` component from `profitability-overview-view.jsx` (approximately lines 32-54):

```jsx
import Box from '@mui/material/Box';
import { alpha } from '@mui/material/styles';

export default function MarginBar({ value, color = 'primary.main' }) {
  const clampedValue = Math.max(0, Math.min(100, value || 0));

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 120 }}>
      <Box sx={{ flex: 1, height: 6, borderRadius: 1, bgcolor: (theme) => alpha(theme.palette.grey[500], 0.16) }}>
        <Box
          sx={{
            height: '100%',
            borderRadius: 1,
            width: `${clampedValue}%`,
            bgcolor: color,
            transition: 'width 0.3s ease',
          }}
        />
      </Box>
      <Box component="span" sx={{ typography: 'caption', fontWeight: 'bold', minWidth: 40 }}>
        {`${clampedValue.toFixed(1)}%`}
      </Box>
    </Box>
  );
}
```

Adjust the implementation to match what the existing `MarginBar` does in the overview view (copy the exact logic, just move it to its own file).

**Step 2: Update profitability-overview-view.jsx**

Remove the local `MarginBar` definition. Add import:
```jsx
import MarginBar from '../components/margin-bar';
```

**Step 3: Update profitability-products-view.jsx**

Remove the local `MarginBar` definition. Add import:
```jsx
import MarginBar from '../components/margin-bar';
```

**Step 4: Commit**

```bash
git add src/sections/profitability/components/margin-bar.jsx src/sections/profitability/view/profitability-overview-view.jsx src/sections/profitability/view/profitability-products-view.jsx
git commit -m "refactor: extract shared MarginBar component"
```

---

## Task 11: Add pagination to products P&L table (MEDIUM)

**Files:**
- Modify: `src/sections/profitability/view/profitability-products-view.jsx`

**Step 1: Add useTable hook and pagination**

Import `useTable` and `TablePaginationCustom`:
```jsx
import { useTable, TablePaginationCustom } from 'src/components/table';
```

Add the table hook near the top of the component:
```jsx
const table = useTable({ defaultRowsPerPage: 10 });
```

**Step 2: Slice the products array for current page**

Find where `products.map(...)` is used to render table rows. Replace with paginated slice:

```jsx
const paginatedProducts = products.slice(
  table.page * table.rowsPerPage,
  table.page * table.rowsPerPage + table.rowsPerPage
);
```

Use `paginatedProducts.map(...)` instead of `products.map(...)` in the table body.

**Step 3: Add TablePaginationCustom after the table**

After the closing `</Table>` (inside `TableContainer`'s parent), add:

```jsx
<TablePaginationCustom
  count={products.length}
  page={table.page}
  rowsPerPage={table.rowsPerPage}
  onPageChange={table.onChangePage}
  onRowsPerPageChange={table.onChangeRowsPerPage}
/>
```

**Step 4: Verify pagination**

Run: `npm run dev` → navigate to profitability products page.

Expected: Table shows 10 rows per page with pagination controls.

**Step 5: Commit**

```bash
git add src/sections/profitability/view/profitability-products-view.jsx
git commit -m "feat: add pagination to products P&L table"
```

---

## Task 12: Consolidate duplicated constants (MEDIUM)

**Files:**
- Modify: `src/sections/product-costs/constants.js`
- Modify: `src/sections/profitability/constants.js`

**Step 1: Build derived maps in product-costs/constants.js**

At the bottom of `src/sections/product-costs/constants.js`, add derived exports that the profitability views need:

```jsx
// Derived maps for profitability views
export const COST_TYPE_LABELS = Object.fromEntries(
  COST_TYPES.map((ct) => [ct.value, ct.labelKey])
);

export const COST_TYPE_COLORS = Object.fromEntries(
  COST_TYPES.map((ct) => [ct.value, ct.color])
);

export const CHANNEL_ICONS = Object.fromEntries(
  MARKETING_CHANNELS.map((ch) => [ch.value, ch.icon])
);
```

**Step 2: Update profitability/constants.js**

Remove the local `COST_TYPE_LABELS`, `COST_TYPE_COLORS`, and `CHANNEL_ICONS` definitions. Replace with imports:

```jsx
export { COST_TYPE_LABELS, COST_TYPE_COLORS, CHANNEL_ICONS } from 'src/sections/product-costs/constants';
```

Keep the profitability-specific constants (`DATE_RANGE_OPTIONS`, `DEFAULT_DATE_RANGE`, `fmtPct`) in `profitability/constants.js`. Remove `fmtAmount` if it was replaced by `fNumber` in Task 2.

**Step 3: Verify no broken imports**

Run: `npm run build`

Expected: Build succeeds. All profitability views still import from `profitability/constants` and get the re-exported values.

**Step 4: Commit**

```bash
git add src/sections/product-costs/constants.js src/sections/profitability/constants.js
git commit -m "refactor: consolidate duplicated cost type and channel constants"
```

---

## Task 13: Fix i18n JSON indentation (MEDIUM)

**Files:**
- Modify: `src/locales/langs/en.json`
- Modify: `src/locales/langs/ar.json`
- Modify: `src/locales/langs/fr.json`

**Step 1: Fix indentation**

Open each locale file and ensure all keys use consistent indentation. The existing keys use 4-space indentation. The new keys added by the PR may use 2-space.

Run a quick check:
```bash
python3 -c "import json; f=open('src/locales/langs/en.json'); d=json.load(f); f.close(); open('src/locales/langs/en.json','w').write(json.dumps(d, indent=4, ensure_ascii=False) + '\n')"
```

Do the same for `ar.json` and `fr.json`.

This will normalize all indentation to 4-space consistently.

**Step 2: Verify JSON is valid**

Run: `node -e "require('./src/locales/langs/en.json')"`
Run: `node -e "require('./src/locales/langs/ar.json')"`
Run: `node -e "require('./src/locales/langs/fr.json')"`

Expected: No errors.

**Step 3: Commit**

```bash
git add src/locales/langs/
git commit -m "fix: normalize i18n JSON indentation to 4 spaces"
```

---

## Task 14: Add delete loading state to cost views (LOW)

**Files:**
- Modify: `src/sections/product-costs/cost-row.jsx` (created in Task 3)

**Step 1: Add loading state to CostRow delete**

This depends on how delete is triggered. The `CostRow` receives `onDelete` as a prop. Add a local loading state:

```jsx
const [deleting, setDeleting] = useState(false);

const handleDelete = async () => {
  setDeleting(true);
  try {
    await onDelete(cost.id);
  } finally {
    setDeleting(false);
  }
};
```

In the popover menu, disable the delete item while deleting:

```jsx
<MenuItem onClick={handleDelete} sx={{ color: 'error.main' }} disabled={deleting}>
  <Iconify icon="solar:trash-bin-trash-bold" />
  {deleting ? t('deleting', 'Deleting...') : t('delete')}
</MenuItem>
```

**Step 2: Update both view files**

Ensure `onDelete` in both `product-costs-view.jsx` and `product-details-costs.jsx` returns a Promise (it likely already does since it calls `deleteProductCost` which is async).

**Step 3: Commit**

```bash
git add src/sections/product-costs/cost-row.jsx
git commit -m "fix: add loading state to cost delete action"
```

---

## Task 15: Remove implementation plan from PR (LOW)

**Files:**
- Delete: `docs/plans/2026-03-01-revenue-stream-plan.md`

**Step 1: Remove the file**

The implementation plan contains machine-specific paths (`/Users/zak-info/...`) and is a build artifact, not documentation.

```bash
git rm docs/plans/2026-03-01-revenue-stream-plan.md
```

Keep `docs/plans/2026-03-01-revenue-stream-design.md` — the design doc is appropriate.

**Step 2: Commit**

```bash
git commit -m "chore: remove machine-specific implementation plan from repo"
```

---

## Summary

| # | Task | Severity | Commit message |
|---|------|----------|----------------|
| 1 | Replace react-apexcharts with @mui/x-charts PieChart | BLOCKER | `fix: replace react-apexcharts with @mui/x-charts PieChart` |
| 2 | Replace invalid `fr-DZ` locale with `fNumber` | BLOCKER | `fix: replace invalid 'fr-DZ' locale with fNumber utility` |
| 3 | Extract shared CostRow + TABLE_HEAD | HIGH | `refactor: extract shared CostRow component` |
| 4 | Add error handling to all profitability views | HIGH | `fix: add error state handling to all profitability views` |
| 5 | Validate channel URL parameter | HIGH | `fix: validate channel URL parameter` |
| 6 | Revert total_revenue translation change | HIGH | `fix: revert total_revenue translation, add total_revenue_full` |
| 7 | Fix Yup schema (variant_id + amount) | MEDIUM | `fix: fix Yup schema validation in cost form` |
| 8 | Add 403 bail-out in product-costs.js | MEDIUM | `fix: skip retry on 403 in product-costs API hook` |
| 9 | Replace Chip variant="soft" with Label | MEDIUM | `fix: replace Chip variant='soft' with Label` |
| 10 | Extract shared MarginBar component | MEDIUM | `refactor: extract shared MarginBar component` |
| 11 | Add pagination to products P&L table | MEDIUM | `feat: add pagination to products P&L table` |
| 12 | Consolidate duplicated constants | MEDIUM | `refactor: consolidate duplicated constants` |
| 13 | Fix i18n JSON indentation | MEDIUM | `fix: normalize i18n JSON indentation` |
| 14 | Add delete loading state | LOW | `fix: add loading state to cost delete action` |
| 15 | Remove implementation plan from PR | LOW | `chore: remove machine-specific implementation plan` |

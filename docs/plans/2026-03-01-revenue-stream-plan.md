# Revenue Stream Frontend Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate product cost management (CRUD) and profitability analytics (P&L dashboard) into the frontend.

**Architecture:** Dedicated product costs page (`/dashboard/product/:id/costs`) with modal-based CRUD. Separate profitability nav section with 6 flat routes for store P&L, products, campaigns, and channels analytics. All analytics views tier-gated to Medium+ subscription. SWR for data fetching, React Hook Form + Yup for cost form validation.

**Tech Stack:** React 18, MUI 5, SWR, React Hook Form, Yup, ApexCharts, i18next, React Router v6

**Design doc:** `docs/plans/2026-03-01-revenue-stream-design.md`

---

## Task 1: Add API Endpoints

**Files:**
- Modify: `src/utils/axios.js:86-220` (add to `endpoints` object)

**Step 1: Add productCosts and profitability endpoint definitions**

In `src/utils/axios.js`, add these entries inside the `endpoints` object (after the `analytics` block around line 175):

```javascript
productCosts: {
  list: (productId) => `/products/${productId}/costs`,
  create: (productId) => `/products/${productId}/costs`,
  bulk: (productId) => `/products/${productId}/costs/bulk`,
  update: (productId, costId) => `/products/${productId}/costs/${costId}`,
  delete: (productId, costId) => `/products/${productId}/costs/${costId}`,
},
profitability: {
  store: '/analytics/profitability',
  products: '/analytics/profitability/products',
  product: (id) => `/analytics/profitability/products/${id}`,
  campaigns: '/analytics/profitability/campaigns',
  channels: '/analytics/profitability/channels',
  channel: (ch) => `/analytics/profitability/channels/${ch}`,
},
```

**Step 2: Verify it compiles**

Run: `cd /Users/zak-info/Documents/Projects/markium/markium && npx vite build --mode development 2>&1 | head -20`

**Step 3: Commit**

```bash
git add src/utils/axios.js
git commit -m "feat: add product costs and profitability API endpoints"
```

---

## Task 2: Create Product Costs API Hooks

**Files:**
- Create: `src/api/product-costs.js`

**Step 1: Create the API hooks file**

Create `src/api/product-costs.js` with this content:

```javascript
import useSWR from 'swr';
import { useMemo } from 'react';

import axios, { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

const options = {
  revalidateIfStale: true,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  onErrorRetry: (err, key, config, revalidate, { retryCount }) => {
    const delays = [5000, 10000, 20000, 30000];
    if (retryCount >= delays.length) return;
    setTimeout(() => revalidate({ retryCount }), delays[retryCount]);
  },
};

// ----------------------------------------------------------------------

/**
 * Fetch all costs for a product
 * @param {string|number} productId
 * @param {object} filters - Optional { type, variant_id }
 */
export function useGetProductCosts(productId) {
  const url = productId ? endpoints.productCosts.list(productId) : null;

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, options);

  const memoizedValue = useMemo(
    () => ({
      costs: data?.data || [],
      costsLoading: isLoading,
      costsError: error,
      costsValidating: isValidating,
      costsEmpty: !isLoading && !data?.data?.length,
      costsMutate: mutate,
    }),
    [data?.data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export async function createProductCost(productId, body) {
  const url = endpoints.productCosts.create(productId);
  return await axios.post(url, body);
}

export async function updateProductCost(productId, costId, body) {
  const url = endpoints.productCosts.update(productId, costId);
  return await axios.put(url, body);
}

export async function deleteProductCost(productId, costId) {
  const url = endpoints.productCosts.delete(productId, costId);
  return await axios.delete(url);
}
```

**Step 2: Verify it compiles**

Run: `cd /Users/zak-info/Documents/Projects/markium/markium && npx vite build --mode development 2>&1 | head -20`

**Step 3: Commit**

```bash
git add src/api/product-costs.js
git commit -m "feat: add product costs SWR hooks and CRUD functions"
```

---

## Task 3: Create Profitability API Hooks

**Files:**
- Create: `src/api/profitability.js`

**Step 1: Create the profitability API hooks file**

Create `src/api/profitability.js`:

```javascript
import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

const options = {
  revalidateIfStale: true,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  onErrorRetry: (err, key, config, revalidate, { retryCount }) => {
    if (err?.status === 403) return; // Don't retry tier-gated endpoints
    const delays = [5000, 10000, 20000, 30000];
    if (retryCount >= delays.length) return;
    setTimeout(() => revalidate({ retryCount }), delays[retryCount]);
  },
};

// ----------------------------------------------------------------------

/**
 * Fetch store-level P&L summary
 * @param {string} dateFrom - e.g. '-30d'
 */
export function useGetStorePnL(dateFrom = '-30d') {
  const params = new URLSearchParams({ date_from: dateFrom });
  const url = `${endpoints.profitability.store}?${params.toString()}`;

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, options);

  const memoizedValue = useMemo(
    () => ({
      storePnL: data?.data || null,
      summary: data?.data?.summary || {},
      period: data?.data?.period || {},
      topProducts: data?.data?.top_profitable_products || [],
      topCampaigns: data?.data?.top_costly_campaigns || [],
      unitsSold: data?.data?.units_sold ?? 0,
      costPerUnit: data?.data?.cost_per_unit ?? 0,
      profitPerUnit: data?.data?.profit_per_unit ?? 0,
      storePnLLoading: isLoading,
      storePnLError: error,
      storePnLForbidden: error?.status === 403 || error?.message?.includes('403'),
      storePnLValidating: isValidating,
      storePnLMutate: mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

/**
 * Fetch all products P&L
 * @param {string} dateFrom
 */
export function useGetProductsPnL(dateFrom = '-30d') {
  const params = new URLSearchParams({ date_from: dateFrom });
  const url = `${endpoints.profitability.products}?${params.toString()}`;

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, options);

  const memoizedValue = useMemo(
    () => ({
      products: data?.data?.products || [],
      period: data?.data?.period || {},
      productsPnLLoading: isLoading,
      productsPnLError: error,
      productsPnLForbidden: error?.status === 403,
      productsPnLValidating: isValidating,
      productsPnLMutate: mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

/**
 * Fetch single product P&L
 * @param {string|number} productId
 * @param {string} dateFrom
 */
export function useGetProductPnL(productId, dateFrom = '-30d') {
  const params = new URLSearchParams({ date_from: dateFrom });
  const url = productId
    ? `${endpoints.profitability.product(productId)}?${params.toString()}`
    : null;

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, options);

  const memoizedValue = useMemo(
    () => ({
      productPnL: data?.data || null,
      productInfo: data?.data?.product || {},
      period: data?.data?.period || {},
      revenue: data?.data?.revenue ?? 0,
      unitsSold: data?.data?.units_sold ?? 0,
      costs: data?.data?.costs || {},
      totalCosts: data?.data?.total_costs ?? 0,
      grossProfit: data?.data?.gross_profit ?? 0,
      profitMargin: data?.data?.profit_margin_pct ?? 0,
      profitPerUnit: data?.data?.profit_per_unit ?? 0,
      productPnLLoading: isLoading,
      productPnLError: error,
      productPnLForbidden: error?.status === 403,
      productPnLValidating: isValidating,
      productPnLMutate: mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

/**
 * Fetch campaigns ROI
 * @param {string} dateFrom
 */
export function useGetCampaignsROI(dateFrom = '-30d') {
  const params = new URLSearchParams({ date_from: dateFrom });
  const url = `${endpoints.profitability.campaigns}?${params.toString()}`;

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, options);

  const memoizedValue = useMemo(
    () => ({
      campaigns: data?.data?.campaigns || [],
      period: data?.data?.period || {},
      totalMarketingSpend: data?.data?.total_marketing_spend ?? 0,
      totalRevenue: data?.data?.total_revenue ?? 0,
      overallMarketingROI: data?.data?.overall_marketing_roi ?? 0,
      campaignsLoading: isLoading,
      campaignsError: error,
      campaignsForbidden: error?.status === 403,
      campaignsValidating: isValidating,
      campaignsMutate: mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

/**
 * Fetch channels overview
 * @param {string} dateFrom
 */
export function useGetChannelsOverview(dateFrom = '-30d') {
  const params = new URLSearchParams({ date_from: dateFrom });
  const url = `${endpoints.profitability.channels}?${params.toString()}`;

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, options);

  const memoizedValue = useMemo(
    () => ({
      channels: data?.data?.channels || [],
      period: data?.data?.period || {},
      totalMarketingSpend: data?.data?.total_marketing_spend ?? 0,
      totalAttributedRevenue: data?.data?.total_attributed_revenue ?? 0,
      overallMarketingROI: data?.data?.overall_marketing_roi ?? 0,
      channelsLoading: isLoading,
      channelsError: error,
      channelsForbidden: error?.status === 403,
      channelsValidating: isValidating,
      channelsMutate: mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

/**
 * Fetch single channel detail
 * @param {string} channel - e.g. 'facebook'
 * @param {string} dateFrom
 */
export function useGetChannelDetail(channel, dateFrom = '-30d') {
  const params = new URLSearchParams({ date_from: dateFrom });
  const url = channel
    ? `${endpoints.profitability.channel(channel)}?${params.toString()}`
    : null;

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, options);

  const memoizedValue = useMemo(
    () => ({
      channelDetail: data?.data || null,
      channelName: data?.data?.channel || channel,
      period: data?.data?.period || {},
      totalSpend: data?.data?.total_spend ?? 0,
      campaignsCount: data?.data?.campaigns_count ?? 0,
      productsReached: data?.data?.products_reached ?? 0,
      attributedRevenue: data?.data?.attributed_revenue ?? 0,
      roi: data?.data?.roi ?? 0,
      channelCampaigns: data?.data?.campaigns || [],
      channelDetailLoading: isLoading,
      channelDetailError: error,
      channelDetailForbidden: error?.status === 403,
      channelDetailValidating: isValidating,
      channelDetailMutate: mutate,
    }),
    [data, channel, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}
```

**Step 2: Verify it compiles**

Run: `cd /Users/zak-info/Documents/Projects/markium/markium && npx vite build --mode development 2>&1 | head -20`

**Step 3: Commit**

```bash
git add src/api/profitability.js
git commit -m "feat: add profitability analytics SWR hooks"
```

---

## Task 4: Add i18n Translations

**Files:**
- Modify: `src/locales/langs/en.json`
- Modify: `src/locales/langs/ar.json`
- Modify: `src/locales/langs/fr.json`

**Step 1: Add English translations**

Add these keys to the end of `src/locales/langs/en.json` (before the closing `}`):

```json
"costs": "Costs",
"add_cost": "Add Cost",
"edit_cost": "Edit Cost",
"delete_cost": "Delete Cost",
"manage_costs": "Manage Costs",
"cost_created": "Cost created successfully",
"cost_updated": "Cost updated successfully",
"cost_deleted": "Cost deleted successfully",
"cost_type": "Cost Type",
"cost_type_buy_price": "Buy Price",
"cost_type_marketing": "Marketing",
"cost_type_content": "Content",
"cost_type_packaging": "Packaging",
"cost_type_shipping": "Shipping",
"cost_type_confirmation_call": "Confirmation Call",
"cost_type_custom": "Custom",
"scope": "Scope",
"scope_per_unit": "Per Unit",
"scope_global": "Global",
"campaign_name": "Campaign Name",
"channel": "Channel",
"custom_type_name": "Custom Type Name",
"variant": "Variant",
"all_variants": "All Variants",
"notes": "Notes",
"amount": "Amount",
"save_and_add_another": "Save & Add Another",
"no_costs_yet": "No costs added yet",
"no_costs_description": "Add your first cost to start tracking profitability",
"confirm_delete_cost": "Are you sure you want to delete this cost?",
"channel_facebook": "Facebook",
"channel_tiktok": "TikTok",
"channel_google": "Google",
"channel_instagram": "Instagram",
"channel_snapchat": "Snapchat",
"channel_other": "Other",
"profitability": "Profitability",
"profitability_overview": "Overview",
"products_pnl": "Products P&L",
"campaigns_roi": "Campaigns ROI",
"channels_overview": "Channels",
"total_revenue": "Total Revenue",
"total_costs": "Total Costs",
"gross_profit": "Gross Profit",
"profit_margin": "Profit Margin",
"cost_per_unit": "Cost / Unit",
"profit_per_unit": "Profit / Unit",
"cost_breakdown": "Cost Breakdown",
"top_profitable_products": "Top Profitable Products",
"top_costly_campaigns": "Top Costly Campaigns",
"units_sold": "Units Sold",
"attributed_revenue": "Attributed Revenue",
"roi": "ROI",
"total_marketing_spend": "Total Marketing Spend",
"overall_marketing_roi": "Overall Marketing ROI",
"products_reached": "Products Reached",
"campaigns_count": "Campaigns",
"channel_detail": "Channel Detail",
"spend": "Spend",
"attributed_orders": "Attributed Orders",
"revenue": "Revenue",
"profit": "Profit",
"margin": "Margin",
"last_24h": "Last 24 hours",
"last_7_days": "Last 7 days",
"last_14_days": "Last 14 days",
"last_30_days": "Last 30 days",
"last_90_days": "Last 90 days",
"profitability_locked_title": "Unlock Profitability Analytics",
"profitability_locked_description": "Upgrade to a Medium plan or higher to access profitability insights",
"upgrade_to_unlock": "Upgrade to Unlock",
"product_pnl": "Product P&L",
"no_campaigns": "No campaigns found",
"no_channels": "No channels found",
"no_products_pnl": "No product profitability data available"
```

**Step 2: Add Arabic translations**

Add corresponding keys to `src/locales/langs/ar.json`:

```json
"costs": "التكاليف",
"add_cost": "إضافة تكلفة",
"edit_cost": "تعديل التكلفة",
"delete_cost": "حذف التكلفة",
"manage_costs": "إدارة التكاليف",
"cost_created": "تم إنشاء التكلفة بنجاح",
"cost_updated": "تم تحديث التكلفة بنجاح",
"cost_deleted": "تم حذف التكلفة بنجاح",
"cost_type": "نوع التكلفة",
"cost_type_buy_price": "سعر الشراء",
"cost_type_marketing": "التسويق",
"cost_type_content": "المحتوى",
"cost_type_packaging": "التغليف",
"cost_type_shipping": "الشحن",
"cost_type_confirmation_call": "مكالمة التأكيد",
"cost_type_custom": "مخصص",
"scope": "النطاق",
"scope_per_unit": "لكل وحدة",
"scope_global": "إجمالي",
"campaign_name": "اسم الحملة",
"channel": "القناة",
"custom_type_name": "اسم النوع المخصص",
"variant": "المتغير",
"all_variants": "جميع المتغيرات",
"notes": "ملاحظات",
"amount": "المبلغ",
"save_and_add_another": "حفظ وإضافة أخرى",
"no_costs_yet": "لا توجد تكاليف بعد",
"no_costs_description": "أضف أول تكلفة لبدء تتبع الربحية",
"confirm_delete_cost": "هل أنت متأكد من حذف هذه التكلفة؟",
"channel_facebook": "فيسبوك",
"channel_tiktok": "تيك توك",
"channel_google": "جوجل",
"channel_instagram": "إنستغرام",
"channel_snapchat": "سناب شات",
"channel_other": "أخرى",
"profitability": "الربحية",
"profitability_overview": "نظرة عامة",
"products_pnl": "ربحية المنتجات",
"campaigns_roi": "عائد الحملات",
"channels_overview": "القنوات",
"total_revenue": "إجمالي الإيرادات",
"total_costs": "إجمالي التكاليف",
"gross_profit": "إجمالي الربح",
"profit_margin": "هامش الربح",
"cost_per_unit": "التكلفة / الوحدة",
"profit_per_unit": "الربح / الوحدة",
"cost_breakdown": "تفاصيل التكاليف",
"top_profitable_products": "أكثر المنتجات ربحية",
"top_costly_campaigns": "أكثر الحملات تكلفة",
"units_sold": "الوحدات المباعة",
"attributed_revenue": "الإيرادات المنسوبة",
"roi": "العائد على الاستثمار",
"total_marketing_spend": "إجمالي إنفاق التسويق",
"overall_marketing_roi": "العائد التسويقي الإجمالي",
"products_reached": "المنتجات المستهدفة",
"campaigns_count": "الحملات",
"channel_detail": "تفاصيل القناة",
"spend": "الإنفاق",
"attributed_orders": "الطلبات المنسوبة",
"revenue": "الإيرادات",
"profit": "الربح",
"margin": "الهامش",
"last_24h": "آخر 24 ساعة",
"last_7_days": "آخر 7 أيام",
"last_14_days": "آخر 14 يوم",
"last_30_days": "آخر 30 يوم",
"last_90_days": "آخر 90 يوم",
"profitability_locked_title": "افتح تحليلات الربحية",
"profitability_locked_description": "قم بالترقية إلى الخطة المتوسطة أو أعلى للوصول إلى تحليلات الربحية",
"upgrade_to_unlock": "الترقية للفتح",
"product_pnl": "ربحية المنتج",
"no_campaigns": "لا توجد حملات",
"no_channels": "لا توجد قنوات",
"no_products_pnl": "لا تتوفر بيانات ربحية المنتجات"
```

**Step 3: Add French translations**

Add corresponding keys to `src/locales/langs/fr.json`:

```json
"costs": "Coûts",
"add_cost": "Ajouter un coût",
"edit_cost": "Modifier le coût",
"delete_cost": "Supprimer le coût",
"manage_costs": "Gérer les coûts",
"cost_created": "Coût créé avec succès",
"cost_updated": "Coût mis à jour avec succès",
"cost_deleted": "Coût supprimé avec succès",
"cost_type": "Type de coût",
"cost_type_buy_price": "Prix d'achat",
"cost_type_marketing": "Marketing",
"cost_type_content": "Contenu",
"cost_type_packaging": "Emballage",
"cost_type_shipping": "Expédition",
"cost_type_confirmation_call": "Appel de confirmation",
"cost_type_custom": "Personnalisé",
"scope": "Portée",
"scope_per_unit": "Par unité",
"scope_global": "Global",
"campaign_name": "Nom de la campagne",
"channel": "Canal",
"custom_type_name": "Nom du type personnalisé",
"variant": "Variante",
"all_variants": "Toutes les variantes",
"notes": "Notes",
"amount": "Montant",
"save_and_add_another": "Enregistrer et ajouter un autre",
"no_costs_yet": "Aucun coût ajouté",
"no_costs_description": "Ajoutez votre premier coût pour commencer à suivre la rentabilité",
"confirm_delete_cost": "Êtes-vous sûr de vouloir supprimer ce coût ?",
"channel_facebook": "Facebook",
"channel_tiktok": "TikTok",
"channel_google": "Google",
"channel_instagram": "Instagram",
"channel_snapchat": "Snapchat",
"channel_other": "Autre",
"profitability": "Rentabilité",
"profitability_overview": "Vue d'ensemble",
"products_pnl": "Rentabilité des produits",
"campaigns_roi": "ROI des campagnes",
"channels_overview": "Canaux",
"total_revenue": "Revenu total",
"total_costs": "Coûts totaux",
"gross_profit": "Bénéfice brut",
"profit_margin": "Marge bénéficiaire",
"cost_per_unit": "Coût / Unité",
"profit_per_unit": "Profit / Unité",
"cost_breakdown": "Répartition des coûts",
"top_profitable_products": "Produits les plus rentables",
"top_costly_campaigns": "Campagnes les plus coûteuses",
"units_sold": "Unités vendues",
"attributed_revenue": "Revenu attribué",
"roi": "ROI",
"total_marketing_spend": "Dépenses marketing totales",
"overall_marketing_roi": "ROI marketing global",
"products_reached": "Produits atteints",
"campaigns_count": "Campagnes",
"channel_detail": "Détail du canal",
"spend": "Dépenses",
"attributed_orders": "Commandes attribuées",
"revenue": "Revenu",
"profit": "Bénéfice",
"margin": "Marge",
"last_24h": "Dernières 24 heures",
"last_7_days": "7 derniers jours",
"last_14_days": "14 derniers jours",
"last_30_days": "30 derniers jours",
"last_90_days": "90 derniers jours",
"profitability_locked_title": "Débloquer l'analyse de rentabilité",
"profitability_locked_description": "Passez au plan Moyen ou supérieur pour accéder aux analyses de rentabilité",
"upgrade_to_unlock": "Mettre à niveau",
"product_pnl": "Rentabilité du produit",
"no_campaigns": "Aucune campagne trouvée",
"no_channels": "Aucun canal trouvé",
"no_products_pnl": "Aucune donnée de rentabilité disponible"
```

**Step 4: Commit**

```bash
git add src/locales/langs/en.json src/locales/langs/ar.json src/locales/langs/fr.json
git commit -m "feat: add i18n translations for costs and profitability (en, ar, fr)"
```

---

## Task 5: Add Routes and Paths

**Files:**
- Modify: `src/routes/paths.js:127-138` (add product.costs and profitability paths)
- Modify: `src/routes/sections/dashboard.jsx` (add lazy imports and route definitions)

**Step 1: Add path definitions**

In `src/routes/paths.js`, add `costs` to the `product` section (after `uploadAssets` on line 133):

```javascript
costs: (id) => `${ROOTS.DASHBOARD}/product/${id}/costs`,
```

Then add a new `profitability` section after the `product` block (around line 138):

```javascript
profitability: {
  root: `${ROOTS.DASHBOARD}/profitability`,
  products: `${ROOTS.DASHBOARD}/profitability/products`,
  product: (id) => `${ROOTS.DASHBOARD}/profitability/products/${id}`,
  campaigns: `${ROOTS.DASHBOARD}/profitability/campaigns`,
  channels: `${ROOTS.DASHBOARD}/profitability/channels`,
  channel: (ch) => `${ROOTS.DASHBOARD}/profitability/channels/${ch}`,
},
```

**Step 2: Add lazy imports in dashboard.jsx**

At the top of `src/routes/sections/dashboard.jsx`, add these lazy imports (after the existing PRODUCT imports around line 24):

```javascript
// PRODUCT COSTS
const ProductCostsPage = lazy(() => import('src/pages/dashboard/product/costs'));
// PROFITABILITY
const ProfitabilityOverviewPage = lazy(() => import('src/pages/dashboard/profitability/overview'));
const ProfitabilityProductsPage = lazy(() => import('src/pages/dashboard/profitability/products'));
const ProfitabilityProductDetailPage = lazy(() => import('src/pages/dashboard/profitability/product-detail'));
const ProfitabilityCampaignsPage = lazy(() => import('src/pages/dashboard/profitability/campaigns'));
const ProfitabilityChannelsPage = lazy(() => import('src/pages/dashboard/profitability/channels'));
const ProfitabilityChannelDetailPage = lazy(() => import('src/pages/dashboard/profitability/channel-detail'));
```

**Step 3: Add route definitions**

In the `children` array of the `dashboard` route in `src/routes/sections/dashboard.jsx`:

Add `costs` route inside the product children (after the upload-assets route, around line 154):

```javascript
{ path: ':id/costs', element: <ProductCostsPage /> },
```

Add profitability routes as a new block (after the product block, around line 156):

```javascript
{
  path: 'profitability',
  children: [
    { element: <ProfitabilityOverviewPage />, index: true },
    { path: 'products', element: <ProfitabilityProductsPage /> },
    { path: 'products/:id', element: <ProfitabilityProductDetailPage /> },
    { path: 'campaigns', element: <ProfitabilityCampaignsPage /> },
    { path: 'channels', element: <ProfitabilityChannelsPage /> },
    { path: 'channels/:channel', element: <ProfitabilityChannelDetailPage /> },
  ],
},
```

**Step 4: Commit**

```bash
git add src/routes/paths.js src/routes/sections/dashboard.jsx
git commit -m "feat: add routes for product costs and profitability analytics"
```

---

## Task 6: Add Navigation Item

**Files:**
- Modify: `src/layouts/dashboard/config-navigation.jsx:55-168`

**Step 1: Add profitability nav icon and menu item**

In `src/layouts/dashboard/config-navigation.jsx`:

First, add a profitability icon to the ICONS object (around line 51):

```javascript
profitability: <Iconify icon="solar:chart-2-bold-duotone" />,
```

Then add the profitability nav item in the OVERVIEW section's items array (after the analytics item, around line 74):

```javascript
{
  title: t('profitability'),
  path: paths.dashboard.profitability.root,
  icon: ICONS.profitability,
  children: [
    { title: t('profitability_overview'), path: paths.dashboard.profitability.root },
    { title: t('products_pnl'), path: paths.dashboard.profitability.products },
    { title: t('campaigns_roi'), path: paths.dashboard.profitability.campaigns },
    { title: t('channels_overview'), path: paths.dashboard.profitability.channels },
  ],
},
```

**Step 2: Commit**

```bash
git add src/layouts/dashboard/config-navigation.jsx
git commit -m "feat: add profitability navigation item to sidebar"
```

---

## Task 7: Create Page Wrappers

**Files:**
- Create: `src/pages/dashboard/product/costs.jsx`
- Create: `src/pages/dashboard/profitability/overview.jsx`
- Create: `src/pages/dashboard/profitability/products.jsx`
- Create: `src/pages/dashboard/profitability/product-detail.jsx`
- Create: `src/pages/dashboard/profitability/campaigns.jsx`
- Create: `src/pages/dashboard/profitability/channels.jsx`
- Create: `src/pages/dashboard/profitability/channel-detail.jsx`

**Step 1: Create page wrapper files**

Create `src/pages/dashboard/product/costs.jsx`:

```jsx
import { Helmet } from 'react-helmet-async';
import { useParams } from 'src/routes/hooks';
import ProductCostsView from 'src/sections/product-costs/view/product-costs-view';

export default function ProductCostsPage() {
  const { id } = useParams();

  return (
    <>
      <Helmet>
        <title>Dashboard: Product Costs</title>
      </Helmet>
      <ProductCostsView id={id} />
    </>
  );
}
```

Create `src/pages/dashboard/profitability/overview.jsx`:

```jsx
import { Helmet } from 'react-helmet-async';
import ProfitabilityOverviewView from 'src/sections/profitability/view/profitability-overview-view';

export default function ProfitabilityOverviewPage() {
  return (
    <>
      <Helmet>
        <title>Dashboard: Profitability Overview</title>
      </Helmet>
      <ProfitabilityOverviewView />
    </>
  );
}
```

Create `src/pages/dashboard/profitability/products.jsx`:

```jsx
import { Helmet } from 'react-helmet-async';
import ProfitabilityProductsView from 'src/sections/profitability/view/profitability-products-view';

export default function ProfitabilityProductsPage() {
  return (
    <>
      <Helmet>
        <title>Dashboard: Products P&L</title>
      </Helmet>
      <ProfitabilityProductsView />
    </>
  );
}
```

Create `src/pages/dashboard/profitability/product-detail.jsx`:

```jsx
import { Helmet } from 'react-helmet-async';
import { useParams } from 'src/routes/hooks';
import ProfitabilityProductView from 'src/sections/profitability/view/profitability-product-view';

export default function ProfitabilityProductDetailPage() {
  const { id } = useParams();

  return (
    <>
      <Helmet>
        <title>Dashboard: Product P&L</title>
      </Helmet>
      <ProfitabilityProductView id={id} />
    </>
  );
}
```

Create `src/pages/dashboard/profitability/campaigns.jsx`:

```jsx
import { Helmet } from 'react-helmet-async';
import ProfitabilityCampaignsView from 'src/sections/profitability/view/profitability-campaigns-view';

export default function ProfitabilityCampaignsPage() {
  return (
    <>
      <Helmet>
        <title>Dashboard: Campaigns ROI</title>
      </Helmet>
      <ProfitabilityCampaignsView />
    </>
  );
}
```

Create `src/pages/dashboard/profitability/channels.jsx`:

```jsx
import { Helmet } from 'react-helmet-async';
import ProfitabilityChannelsView from 'src/sections/profitability/view/profitability-channels-view';

export default function ProfitabilityChannelsPage() {
  return (
    <>
      <Helmet>
        <title>Dashboard: Channels Overview</title>
      </Helmet>
      <ProfitabilityChannelsView />
    </>
  );
}
```

Create `src/pages/dashboard/profitability/channel-detail.jsx`:

```jsx
import { Helmet } from 'react-helmet-async';
import { useParams } from 'src/routes/hooks';
import ProfitabilityChannelView from 'src/sections/profitability/view/profitability-channel-view';

export default function ProfitabilityChannelDetailPage() {
  const { channel } = useParams();

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

**Step 2: Commit**

```bash
git add src/pages/dashboard/product/costs.jsx src/pages/dashboard/profitability/
git commit -m "feat: add page wrappers for costs and profitability views"
```

---

## Task 8: Build Cost Management - Constants & Shared Components

**Files:**
- Create: `src/sections/product-costs/constants.js`
- Create: `src/sections/product-costs/cost-type-badge.jsx`

**Step 1: Create constants file**

Create `src/sections/product-costs/constants.js`:

```javascript
export const COST_TYPES = [
  { value: 'buy_price', labelKey: 'cost_type_buy_price', icon: 'solar:tag-price-bold-duotone', color: 'primary' },
  { value: 'marketing', labelKey: 'cost_type_marketing', icon: 'solar:megaphone-bold-duotone', color: 'warning' },
  { value: 'content', labelKey: 'cost_type_content', icon: 'solar:pen-new-round-bold-duotone', color: 'info' },
  { value: 'packaging', labelKey: 'cost_type_packaging', icon: 'solar:box-bold-duotone', color: 'secondary' },
  { value: 'shipping', labelKey: 'cost_type_shipping', icon: 'solar:delivery-bold-duotone', color: 'success' },
  { value: 'confirmation_call', labelKey: 'cost_type_confirmation_call', icon: 'solar:phone-calling-bold-duotone', color: 'default' },
  { value: 'custom', labelKey: 'cost_type_custom', icon: 'solar:settings-bold-duotone', color: 'error' },
];

export const MARKETING_CHANNELS = [
  { value: 'facebook', labelKey: 'channel_facebook', icon: 'mdi:facebook' },
  { value: 'tiktok', labelKey: 'channel_tiktok', icon: 'ic:baseline-tiktok' },
  { value: 'google', labelKey: 'channel_google', icon: 'mdi:google' },
  { value: 'instagram', labelKey: 'channel_instagram', icon: 'mdi:instagram' },
  { value: 'snapchat', labelKey: 'channel_snapchat', icon: 'mdi:snapchat' },
  { value: 'other', labelKey: 'channel_other', icon: 'solar:global-bold-duotone' },
];

export const SCOPE_OPTIONS = [
  { value: 'per_unit', labelKey: 'scope_per_unit' },
  { value: 'global', labelKey: 'scope_global' },
];

export function getCostTypeConfig(type) {
  return COST_TYPES.find((ct) => ct.value === type) || COST_TYPES[COST_TYPES.length - 1];
}

export function getChannelConfig(channel) {
  return MARKETING_CHANNELS.find((ch) => ch.value === channel) || MARKETING_CHANNELS[MARKETING_CHANNELS.length - 1];
}
```

**Step 2: Create cost type badge component**

Create `src/sections/product-costs/cost-type-badge.jsx`:

```jsx
import PropTypes from 'prop-types';
import { Stack, Typography } from '@mui/material';
import Iconify from 'src/components/iconify';
import Label from 'src/components/label';
import { useTranslate } from 'src/locales';
import { getCostTypeConfig } from './constants';

// ----------------------------------------------------------------------

export default function CostTypeBadge({ type, customTypeName }) {
  const { t } = useTranslate();
  const config = getCostTypeConfig(type);

  const label = type === 'custom' && customTypeName ? customTypeName : t(config.labelKey);

  return (
    <Label
      variant="soft"
      color={config.color}
      startIcon={<Iconify icon={config.icon} width={16} />}
    >
      {label}
    </Label>
  );
}

CostTypeBadge.propTypes = {
  type: PropTypes.string.isRequired,
  customTypeName: PropTypes.string,
};
```

**Step 3: Commit**

```bash
git add src/sections/product-costs/
git commit -m "feat: add cost type constants and badge component"
```

---

## Task 9: Build Cost Form Dialog

**Files:**
- Create: `src/sections/product-costs/cost-form-dialog.jsx`

**Step 1: Create the cost form dialog**

Create `src/sections/product-costs/cost-form-dialog.jsx`:

```jsx
import PropTypes from 'prop-types';
import * as Yup from 'yup';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
} from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';

import { useTranslate } from 'src/locales';
import { useSnackbar } from 'src/components/snackbar';
import FormProvider, { RHFTextField, RHFSelect } from 'src/components/hook-form';
import { createProductCost, updateProductCost } from 'src/api/product-costs';
import { showError } from 'src/utils/show_error';

import { COST_TYPES, MARKETING_CHANNELS, SCOPE_OPTIONS } from './constants';

// ----------------------------------------------------------------------

export default function CostFormDialog({
  open,
  onClose,
  productId,
  currentCost,
  variants,
  onSuccess,
}) {
  const { t } = useTranslate();
  const { enqueueSnackbar } = useSnackbar();
  const isEdit = !!currentCost;

  const CostSchema = Yup.object().shape({
    type: Yup.string().required(t('cost_type') + ' ' + t('name_is_required')).oneOf(COST_TYPES.map((ct) => ct.value)),
    scope: Yup.string().required().oneOf(['per_unit', 'global']),
    amount: Yup.number()
      .required(t('amount') + ' ' + t('name_is_required'))
      .min(0)
      .max(99999999.99),
    custom_type_name: Yup.string().when('type', {
      is: 'custom',
      then: (schema) => schema.required(t('custom_type_name') + ' ' + t('name_is_required')),
      otherwise: (schema) => schema.nullable(),
    }),
    campaign_name: Yup.string().when('type', {
      is: 'marketing',
      then: (schema) => schema.required(t('campaign_name') + ' ' + t('name_is_required')),
      otherwise: (schema) => schema.nullable(),
    }),
    channel: Yup.string().when('type', {
      is: 'marketing',
      then: (schema) => schema.required(t('channel') + ' ' + t('name_is_required')).oneOf(MARKETING_CHANNELS.map((ch) => ch.value)),
      otherwise: (schema) => schema.nullable(),
    }),
    variant_id: Yup.number().nullable(),
    notes: Yup.string().max(1000).nullable(),
  });

  const defaultValues = useMemo(
    () => ({
      type: currentCost?.type || 'buy_price',
      scope: currentCost?.scope || 'per_unit',
      amount: currentCost?.amount ? Number(currentCost.amount) : '',
      custom_type_name: currentCost?.custom_type_name || '',
      campaign_name: currentCost?.campaign_name || '',
      channel: currentCost?.channel || '',
      variant_id: currentCost?.variant_id || '',
      notes: currentCost?.notes || '',
    }),
    [currentCost]
  );

  const methods = useForm({
    resolver: yupResolver(CostSchema),
    defaultValues,
  });

  const {
    reset,
    watch,
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const watchType = watch('type');

  useEffect(() => {
    reset(defaultValues);
  }, [currentCost, reset, defaultValues]);

  const handleSave = async (data, addAnother = false) => {
    try {
      const body = {
        type: data.type,
        scope: data.scope,
        amount: data.amount,
        currency: 'DZD',
      };

      if (data.type === 'custom') body.custom_type_name = data.custom_type_name;
      if (data.type === 'marketing') {
        body.campaign_name = data.campaign_name;
        body.channel = data.channel;
      }
      if (data.variant_id) body.variant_id = data.variant_id;
      if (data.notes) body.notes = data.notes;

      if (isEdit) {
        await updateProductCost(productId, currentCost.id, body);
        enqueueSnackbar(t('cost_updated'), { variant: 'success' });
      } else {
        await createProductCost(productId, body);
        enqueueSnackbar(t('cost_created'), { variant: 'success' });
      }

      onSuccess?.();

      if (addAnother) {
        reset({
          type: data.type,
          scope: data.scope,
          amount: '',
          custom_type_name: '',
          campaign_name: '',
          channel: data.channel || '',
          variant_id: '',
          notes: '',
        });
      } else {
        onClose();
      }
    } catch (err) {
      showError(err);
    }
  };

  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={onClose}>
      <DialogTitle>{isEdit ? t('edit_cost') : t('add_cost')}</DialogTitle>

      <FormProvider methods={methods}>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <RHFSelect name="type" label={t('cost_type')}>
              {COST_TYPES.map((ct) => (
                <MenuItem key={ct.value} value={ct.value}>
                  {t(ct.labelKey)}
                </MenuItem>
              ))}
            </RHFSelect>

            {watchType === 'marketing' && (
              <>
                <RHFTextField name="campaign_name" label={t('campaign_name')} />
                <RHFSelect name="channel" label={t('channel')}>
                  {MARKETING_CHANNELS.map((ch) => (
                    <MenuItem key={ch.value} value={ch.value}>
                      {t(ch.labelKey)}
                    </MenuItem>
                  ))}
                </RHFSelect>
              </>
            )}

            {watchType === 'custom' && (
              <RHFTextField name="custom_type_name" label={t('custom_type_name')} />
            )}

            <FormControl>
              <FormLabel>{t('scope')}</FormLabel>
              <RadioGroup
                row
                value={watch('scope')}
                onChange={(e) => setValue('scope', e.target.value)}
              >
                {SCOPE_OPTIONS.map((opt) => (
                  <FormControlLabel
                    key={opt.value}
                    value={opt.value}
                    control={<Radio />}
                    label={t(opt.labelKey)}
                  />
                ))}
              </RadioGroup>
            </FormControl>

            <RHFTextField name="amount" label={t('amount')} type="number" InputProps={{ endAdornment: 'DZD' }} />

            {variants?.length > 0 && (
              <RHFSelect name="variant_id" label={t('variant')}>
                <MenuItem value="">{t('all_variants')}</MenuItem>
                {variants.map((v) => (
                  <MenuItem key={v.id} value={v.id}>
                    {v.name || v.title || `#${v.id}`}
                  </MenuItem>
                ))}
              </RHFSelect>
            )}

            <RHFTextField name="notes" label={t('notes')} multiline rows={2} />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" color="inherit" onClick={onClose}>
            {t('cancel')}
          </Button>

          {!isEdit && (
            <LoadingButton
              variant="outlined"
              loading={isSubmitting}
              onClick={handleSubmit((data) => handleSave(data, true))}
            >
              {t('save_and_add_another')}
            </LoadingButton>
          )}

          <LoadingButton
            variant="contained"
            loading={isSubmitting}
            onClick={handleSubmit((data) => handleSave(data, false))}
          >
            {isEdit ? t('save_changes') : t('add_cost')}
          </LoadingButton>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
}

CostFormDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  productId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  currentCost: PropTypes.object,
  variants: PropTypes.array,
  onSuccess: PropTypes.func,
};
```

**Step 2: Commit**

```bash
git add src/sections/product-costs/cost-form-dialog.jsx
git commit -m "feat: add cost form dialog with dynamic fields and validation"
```

---

## Task 10: Build Cost Management View

**Files:**
- Create: `src/sections/product-costs/view/product-costs-view.jsx`

**Step 1: Create the main costs view**

Create `src/sections/product-costs/view/product-costs-view.jsx`:

```jsx
import PropTypes from 'prop-types';
import { useState, useCallback } from 'react';

import {
  Container,
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  IconButton,
  MenuItem,
  Tooltip,
  Typography,
  Stack,
  Chip,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { useGetProduct } from 'src/api/product';
import { useGetProductCosts, deleteProductCost } from 'src/api/product-costs';

import { useTranslate } from 'src/locales';
import { useBoolean } from 'src/hooks/use-boolean';
import { useSettingsContext } from 'src/components/settings';
import { useSnackbar } from 'src/components/snackbar';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import Iconify from 'src/components/iconify';
import EmptyContent from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog';
import CustomPopover, { usePopover } from 'src/components/custom-popover';
import { useTable, TableHeadCustom, TablePaginationCustom } from 'src/components/table';
import { LoadingScreen } from 'src/components/loading-screen';
import Label from 'src/components/label';

import CostFormDialog from '../cost-form-dialog';
import CostTypeBadge from '../cost-type-badge';
import { getChannelConfig } from '../constants';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'type', label: 'cost_type' },
  { id: 'scope', label: 'scope' },
  { id: 'amount', label: 'amount' },
  { id: 'details', label: 'details' },
  { id: 'notes', label: 'notes' },
  { id: 'actions', label: '', width: 50 },
];

// ----------------------------------------------------------------------

export default function ProductCostsView({ id }) {
  const { t } = useTranslate();
  const settings = useSettingsContext();
  const { enqueueSnackbar } = useSnackbar();
  const table = useTable({ defaultOrderBy: 'type' });

  const { product } = useGetProduct(id);
  const { costs, costsLoading, costsEmpty, costsMutate } = useGetProductCosts(id);

  const formDialog = useBoolean();
  const confirmDelete = useBoolean();

  const [editingCost, setEditingCost] = useState(null);
  const [deletingCostId, setDeletingCostId] = useState(null);

  const handleAdd = useCallback(() => {
    setEditingCost(null);
    formDialog.onTrue();
  }, [formDialog]);

  const handleEdit = useCallback(
    (cost) => {
      setEditingCost(cost);
      formDialog.onTrue();
    },
    [formDialog]
  );

  const handleDeleteClick = useCallback(
    (costId) => {
      setDeletingCostId(costId);
      confirmDelete.onTrue();
    },
    [confirmDelete]
  );

  const handleDeleteConfirm = useCallback(async () => {
    try {
      await deleteProductCost(id, deletingCostId);
      enqueueSnackbar(t('cost_deleted'), { variant: 'success' });
      costsMutate();
      confirmDelete.onFalse();
    } catch (err) {
      enqueueSnackbar(err.message || t('error'), { variant: 'error' });
    }
  }, [id, deletingCostId, costsMutate, confirmDelete, enqueueSnackbar, t]);

  const handleFormSuccess = useCallback(() => {
    costsMutate();
  }, [costsMutate]);

  const dataInPage = costs.slice(
    table.page * table.rowsPerPage,
    table.page * table.rowsPerPage + table.rowsPerPage
  );

  if (costsLoading) {
    return <LoadingScreen />;
  }

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading={t('costs')}
        links={[
          { name: t('dashboard'), href: paths.dashboard.root },
          { name: t('products'), href: paths.dashboard.product.root },
          { name: product?.name || '...' },
          { name: t('costs') },
        ]}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={handleAdd}
          >
            {t('add_cost')}
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {costsEmpty ? (
        <EmptyContent
          filled
          title={t('no_costs_yet')}
          description={t('no_costs_description')}
          action={
            <Button
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={handleAdd}
              sx={{ mt: 2 }}
            >
              {t('add_cost')}
            </Button>
          }
          sx={{ py: 10 }}
        />
      ) : (
        <Card>
          <TableContainer>
            <Table>
              <TableHeadCustom
                headLabel={TABLE_HEAD.map((col) => ({
                  ...col,
                  label: col.label ? t(col.label) : '',
                }))}
              />
              <TableBody>
                {dataInPage.map((cost) => (
                  <CostRow
                    key={cost.id}
                    cost={cost}
                    product={product}
                    onEdit={() => handleEdit(cost)}
                    onDelete={() => handleDeleteClick(cost.id)}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePaginationCustom
            count={costs.length}
            page={table.page}
            rowsPerPage={table.rowsPerPage}
            onPageChange={table.onChangePage}
            onRowsPerPageChange={table.onChangeRowsPerPage}
          />
        </Card>
      )}

      <CostFormDialog
        open={formDialog.value}
        onClose={formDialog.onFalse}
        productId={id}
        currentCost={editingCost}
        variants={product?.variants || []}
        onSuccess={handleFormSuccess}
      />

      <ConfirmDialog
        open={confirmDelete.value}
        onClose={confirmDelete.onFalse}
        title={t('delete_cost')}
        content={t('confirm_delete_cost')}
        action={
          <Button variant="contained" color="error" onClick={handleDeleteConfirm}>
            {t('delete')}
          </Button>
        }
      />
    </Container>
  );
}

ProductCostsView.propTypes = {
  id: PropTypes.string.isRequired,
};

// ----------------------------------------------------------------------

function CostRow({ cost, product, onEdit, onDelete }) {
  const { t } = useTranslate();
  const popover = usePopover();

  const variant = cost.variant_id
    ? product?.variants?.find((v) => v.id === cost.variant_id)
    : null;

  const renderDetails = () => {
    const parts = [];

    if (cost.type === 'marketing') {
      if (cost.campaign_name) parts.push(cost.campaign_name);
      if (cost.channel) {
        const ch = getChannelConfig(cost.channel);
        parts.push(t(ch.labelKey));
      }
    }

    if (cost.type === 'custom' && cost.custom_type_name) {
      parts.push(cost.custom_type_name);
    }

    if (variant) {
      parts.push(variant.name || variant.title || `#${variant.id}`);
    }

    return parts.join(' · ') || '—';
  };

  return (
    <>
      <TableRow hover>
        <TableCell>
          <CostTypeBadge type={cost.type} customTypeName={cost.custom_type_name} />
        </TableCell>

        <TableCell>
          <Label variant="soft" color={cost.scope === 'per_unit' ? 'info' : 'warning'}>
            {t(cost.scope === 'per_unit' ? 'scope_per_unit' : 'scope_global')}
          </Label>
        </TableCell>

        <TableCell>
          <Typography variant="body2" fontWeight={600}>
            {Number(cost.amount).toLocaleString('fr-DZ', { minimumFractionDigits: 2 })} DA
          </Typography>
        </TableCell>

        <TableCell>
          <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
            {renderDetails()}
          </Typography>
        </TableCell>

        <TableCell>
          {cost.notes ? (
            <Tooltip title={cost.notes}>
              <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 150 }}>
                {cost.notes}
              </Typography>
            </Tooltip>
          ) : (
            '—'
          )}
        </TableCell>

        <TableCell align="right">
          <IconButton onClick={popover.onOpen}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>
      </TableRow>

      <CustomPopover
        open={popover.open}
        onClose={popover.onClose}
        arrow="right-top"
      >
        <MenuItem
          onClick={() => {
            popover.onClose();
            onEdit();
          }}
        >
          <Iconify icon="solar:pen-bold" />
          {t('edit')}
        </MenuItem>

        <MenuItem
          onClick={() => {
            popover.onClose();
            onDelete();
          }}
          sx={{ color: 'error.main' }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" />
          {t('delete')}
        </MenuItem>
      </CustomPopover>
    </>
  );
}

CostRow.propTypes = {
  cost: PropTypes.object.isRequired,
  product: PropTypes.object,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
```

**Step 2: Verify it compiles**

Run: `cd /Users/zak-info/Documents/Projects/markium/markium && npx vite build --mode development 2>&1 | tail -20`

**Step 3: Commit**

```bash
git add src/sections/product-costs/view/product-costs-view.jsx
git commit -m "feat: add product costs list view with table, CRUD actions"
```

---

## Task 11: Build Profitability Shared Components

**Files:**
- Create: `src/sections/profitability/constants.js`
- Create: `src/sections/profitability/components/profitability-date-filter.jsx`
- Create: `src/sections/profitability/components/profitability-summary-cards.jsx`
- Create: `src/sections/profitability/components/channel-icon.jsx`
- Create: `src/sections/profitability/components/profitability-gate.jsx`
- Create: `src/sections/profitability/components/cost-breakdown-chart.jsx`

**Step 1: Create constants**

Create `src/sections/profitability/constants.js`:

```javascript
export const DATE_RANGE_OPTIONS = [
  { value: '-1d', labelKey: 'last_24h' },
  { value: '-7d', labelKey: 'last_7_days' },
  { value: '-14d', labelKey: 'last_14_days' },
  { value: '-30d', labelKey: 'last_30_days' },
  { value: '-90d', labelKey: 'last_90_days' },
];

export const DEFAULT_DATE_RANGE = '-30d';

export const COST_TYPE_LABELS = {
  buy_price: 'cost_type_buy_price',
  marketing: 'cost_type_marketing',
  content: 'cost_type_content',
  packaging: 'cost_type_packaging',
  shipping: 'cost_type_shipping',
  confirmation_call: 'cost_type_confirmation_call',
  custom: 'cost_type_custom',
};

export const COST_TYPE_COLORS = {
  buy_price: '#00A76F',
  marketing: '#FFAB00',
  content: '#00B8D9',
  packaging: '#8E33FF',
  shipping: '#22C55E',
  confirmation_call: '#919EAB',
  custom: '#FF5630',
};

export const CHANNEL_ICONS = {
  facebook: 'mdi:facebook',
  tiktok: 'ic:baseline-tiktok',
  google: 'mdi:google',
  instagram: 'mdi:instagram',
  snapchat: 'mdi:snapchat',
  other: 'solar:global-bold-duotone',
};
```

**Step 2: Create date filter component**

Create `src/sections/profitability/components/profitability-date-filter.jsx`:

```jsx
import PropTypes from 'prop-types';
import { MenuItem, TextField } from '@mui/material';
import { useTranslate } from 'src/locales';
import { DATE_RANGE_OPTIONS } from '../constants';

export default function ProfitabilityDateFilter({ value, onChange, sx }) {
  const { t } = useTranslate();

  return (
    <TextField
      select
      size="small"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      sx={{ minWidth: 160, ...sx }}
    >
      {DATE_RANGE_OPTIONS.map((opt) => (
        <MenuItem key={opt.value} value={opt.value}>
          {t(opt.labelKey)}
        </MenuItem>
      ))}
    </TextField>
  );
}

ProfitabilityDateFilter.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  sx: PropTypes.object,
};
```

**Step 3: Create summary cards component**

Create `src/sections/profitability/components/profitability-summary-cards.jsx`:

```jsx
import PropTypes from 'prop-types';
import { Card, Stack, Typography, Box } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import Iconify from 'src/components/iconify';

export default function ProfitabilitySummaryCards({ cards }) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
      {cards.map((card) => (
        <SummaryCard key={card.title} {...card} />
      ))}
    </Stack>
  );
}

function SummaryCard({ title, value, suffix, icon, color = 'primary' }) {
  const theme = useTheme();

  return (
    <Card sx={{ p: 3, flex: 1 }}>
      <Stack spacing={1}>
        <Box
          sx={{
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 1,
            bgcolor: alpha(theme.palette[color]?.main || theme.palette.primary.main, 0.08),
          }}
        >
          <Iconify
            icon={icon}
            width={24}
            sx={{ color: theme.palette[color]?.main || theme.palette.primary.main }}
          />
        </Box>
        <Typography variant="h4">
          {typeof value === 'number' ? value.toLocaleString('fr-DZ', { minimumFractionDigits: value % 1 !== 0 ? 1 : 0 }) : value}
          {suffix && (
            <Typography component="span" variant="subtitle2" sx={{ ml: 0.5 }}>
              {suffix}
            </Typography>
          )}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
      </Stack>
    </Card>
  );
}

ProfitabilitySummaryCards.propTypes = {
  cards: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      suffix: PropTypes.string,
      icon: PropTypes.string.isRequired,
      color: PropTypes.string,
    })
  ).isRequired,
};

SummaryCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  suffix: PropTypes.string,
  icon: PropTypes.string.isRequired,
  color: PropTypes.string,
};
```

**Step 4: Create channel icon component**

Create `src/sections/profitability/components/channel-icon.jsx`:

```jsx
import PropTypes from 'prop-types';
import { Stack, Typography } from '@mui/material';
import Iconify from 'src/components/iconify';
import { useTranslate } from 'src/locales';
import { CHANNEL_ICONS } from '../constants';

export default function ChannelIcon({ channel, showLabel = true }) {
  const { t } = useTranslate();
  const icon = CHANNEL_ICONS[channel] || CHANNEL_ICONS.other;

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Iconify icon={icon} width={20} />
      {showLabel && (
        <Typography variant="body2">{t(`channel_${channel}`)}</Typography>
      )}
    </Stack>
  );
}

ChannelIcon.propTypes = {
  channel: PropTypes.string.isRequired,
  showLabel: PropTypes.bool,
};
```

**Step 5: Create profitability gate component**

Create `src/sections/profitability/components/profitability-gate.jsx`:

```jsx
import PropTypes from 'prop-types';
import { Box, Button, Typography, alpha } from '@mui/material';
import Iconify from 'src/components/iconify';
import { useTranslate } from 'src/locales';
import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';

export default function ProfitabilityGate({ forbidden, children }) {
  const { t } = useTranslate();
  const router = useRouter();

  if (!forbidden) return children;

  return (
    <Box sx={{ position: 'relative', overflow: 'hidden', borderRadius: 2, flex: 1 }}>
      <Box sx={{ filter: 'blur(8px)', pointerEvents: 'none', userSelect: 'none' }}>
        {children}
      </Box>
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: (theme) => alpha(theme.palette.background.default, 0.35),
          zIndex: 1,
        }}
      >
        <Iconify icon="solar:lock-bold" width={32} sx={{ mb: 1, opacity: 0.6 }} />
        <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
          {t('profitability_locked_title')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center', maxWidth: 320 }}>
          {t('profitability_locked_description')}
        </Typography>
        <Button
          variant="contained"
          size="small"
          onClick={() => router.push(paths.dashboard.subscription.checkout)}
        >
          {t('upgrade_to_unlock')}
        </Button>
      </Box>
    </Box>
  );
}

ProfitabilityGate.propTypes = {
  forbidden: PropTypes.bool,
  children: PropTypes.node.isRequired,
};
```

**Step 6: Create cost breakdown chart**

Create `src/sections/profitability/components/cost-breakdown-chart.jsx`:

```jsx
import PropTypes from 'prop-types';
import { Card, CardHeader } from '@mui/material';
import Chart from 'react-apexcharts';
import { useTranslate } from 'src/locales';
import { COST_TYPE_LABELS, COST_TYPE_COLORS } from '../constants';

export default function CostBreakdownChart({ costsBreakdown, title }) {
  const { t } = useTranslate();

  const entries = Object.entries(costsBreakdown || {}).filter(([, val]) => val > 0);
  const labels = entries.map(([key]) => t(COST_TYPE_LABELS[key] || key));
  const series = entries.map(([, val]) => val);
  const colors = entries.map(([key]) => COST_TYPE_COLORS[key] || '#919EAB');

  const chartOptions = {
    chart: { type: 'donut' },
    labels,
    colors,
    legend: {
      position: 'right',
      formatter: (label, opts) => {
        const val = opts.w.globals.series[opts.seriesIndex];
        return `${label}: ${val.toLocaleString('fr-DZ')} DA`;
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => `${val.toFixed(1)}%`,
    },
    tooltip: {
      y: {
        formatter: (val) => `${val.toLocaleString('fr-DZ')} DA`,
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: '60%',
        },
      },
    },
  };

  if (series.length === 0) return null;

  return (
    <Card>
      <CardHeader title={title || t('cost_breakdown')} />
      <Chart type="donut" series={series} options={chartOptions} height={320} />
    </Card>
  );
}

CostBreakdownChart.propTypes = {
  costsBreakdown: PropTypes.object,
  title: PropTypes.string,
};
```

**Step 7: Commit**

```bash
git add src/sections/profitability/
git commit -m "feat: add profitability shared components (date filter, cards, chart, gate)"
```

---

## Task 12: Build Store P&L Overview View

**Files:**
- Create: `src/sections/profitability/view/profitability-overview-view.jsx`

**Step 1: Create the store P&L overview**

Create `src/sections/profitability/view/profitability-overview-view.jsx`. This is the main profitability landing page with:
- Summary cards (Revenue, Costs, Profit, Margin)
- Cost breakdown donut chart
- Per-unit stats
- Top profitable products table
- Top costly campaigns table

Use `useGetStorePnL(dateFrom)` hook. Wrap content in `ProfitabilityGate`. Include `ProfitabilityDateFilter`. Follow the patterns from `overview-analytics-view.jsx` for layout (Container, CustomBreadcrumbs, useSettingsContext).

The view should have these elements:
- Breadcrumbs: Dashboard > Profitability > Overview
- Date filter in top-right
- 4 summary cards row
- Cost breakdown chart + per-unit stats side by side
- Top products table
- Top campaigns table

Use `paths.dashboard.profitability.root` for breadcrumb links. Navigate to `paths.dashboard.profitability.products` for product drill-down via `useRouter().push()`.

**Important code patterns to follow:**
- `const settings = useSettingsContext()` for container width
- `const { t } = useTranslate()` for translations
- `<Container maxWidth={settings.themeStretch ? false : 'lg'}>` wrapper
- `<CustomBreadcrumbs>` with `heading` and `links`
- Use `CircularProgress` centered in a `Box` for loading state
- Format all amounts with `.toLocaleString('fr-DZ')` + ' DA' suffix

**Step 2: Verify it compiles**

Run: `cd /Users/zak-info/Documents/Projects/markium/markium && npx vite build --mode development 2>&1 | tail -20`

**Step 3: Commit**

```bash
git add src/sections/profitability/view/profitability-overview-view.jsx
git commit -m "feat: add store P&L overview view with charts and tables"
```

---

## Task 13: Build Products P&L View

**Files:**
- Create: `src/sections/profitability/view/profitability-products-view.jsx`

**Step 1: Create the products P&L table view**

Sortable table of all products with columns: Product Name, Revenue, Units Sold, Total Costs, Gross Profit, Margin %, Profit/Unit. Click row navigates to `paths.dashboard.profitability.product(row.product_id)`. Include date filter, ProfitabilityGate, breadcrumbs. Use `useGetProductsPnL(dateFrom)` hook.

**Step 2: Commit**

```bash
git add src/sections/profitability/view/profitability-products-view.jsx
git commit -m "feat: add products P&L table view"
```

---

## Task 14: Build Single Product P&L View

**Files:**
- Create: `src/sections/profitability/view/profitability-product-view.jsx`

**Step 1: Create the single product P&L view**

Use `useGetProductPnL(id, dateFrom)`. Show:
- Product name header
- Summary cards (Revenue, Units Sold, Total Costs, Profit, Margin)
- Cost breakdown by type: for each type in `costs`, show a card/row with type name, total, per_unit
- Marketing section: if `costs.marketing` exists and has `campaigns`, show campaigns table (name, channel, spend, attributed_orders, roi)
- "Manage Costs" button → `paths.dashboard.product.costs(id)`

Include ProfitabilityGate, date filter, breadcrumbs.

**Step 2: Commit**

```bash
git add src/sections/profitability/view/profitability-product-view.jsx
git commit -m "feat: add single product P&L detail view"
```

---

## Task 15: Build Campaigns ROI View

**Files:**
- Create: `src/sections/profitability/view/profitability-campaigns-view.jsx`

**Step 1: Create the campaigns ROI view**

Use `useGetCampaignsROI(dateFrom)`. Show:
- Summary cards: Total Marketing Spend, Total Revenue, Overall Marketing ROI
- Campaigns table: Campaign Name, Channel (with ChannelIcon), Spend, Attributed Revenue, ROI

Include ProfitabilityGate, date filter, breadcrumbs.

**Step 2: Commit**

```bash
git add src/sections/profitability/view/profitability-campaigns-view.jsx
git commit -m "feat: add campaigns ROI view"
```

---

## Task 16: Build Channels Overview View

**Files:**
- Create: `src/sections/profitability/view/profitability-channels-view.jsx`

**Step 1: Create the channels overview view**

Use `useGetChannelsOverview(dateFrom)`. Show:
- Summary cards: Total Marketing Spend, Total Attributed Revenue, Overall Marketing ROI
- Channels table/cards: Channel (icon + name), Total Spend, Campaigns Count, Products Reached, Attributed Revenue, ROI. Click navigates to `paths.dashboard.profitability.channel(row.channel)`.

Include ProfitabilityGate, date filter, breadcrumbs.

**Step 2: Commit**

```bash
git add src/sections/profitability/view/profitability-channels-view.jsx
git commit -m "feat: add channels overview view"
```

---

## Task 17: Build Channel Detail View

**Files:**
- Create: `src/sections/profitability/view/profitability-channel-view.jsx`

**Step 1: Create the channel detail view**

Use `useGetChannelDetail(channel, dateFrom)`. Show:
- Header: ChannelIcon + channel name + summary stats (spend, ROI, campaigns count)
- Campaigns table: Campaign Name, Product Name, Spend, Attributed Revenue, ROI

Include ProfitabilityGate, date filter, breadcrumbs.

**Step 2: Commit**

```bash
git add src/sections/profitability/view/profitability-channel-view.jsx
git commit -m "feat: add channel detail view"
```

---

## Task 18: Add "Manage Costs" Link to Product Edit Page

**Files:**
- Modify: `src/sections/product/view/product-edit-view.jsx`

**Step 1: Add a "Manage Costs" button**

In `src/sections/product/view/product-edit-view.jsx`, add a "Manage Costs" button in the breadcrumbs `action` prop that links to `paths.dashboard.product.costs(id)`:

```jsx
<CustomBreadcrumbs
  heading={t('edit')}
  links={[...]}
  action={
    <Button
      component={RouterLink}
      href={paths.dashboard.product.costs(id)}
      variant="outlined"
      startIcon={<Iconify icon="solar:tag-price-bold-duotone" />}
    >
      {t('manage_costs')}
    </Button>
  }
  sx={{ mb: { xs: 3, md: 5 } }}
/>
```

**Step 2: Commit**

```bash
git add src/sections/product/view/product-edit-view.jsx
git commit -m "feat: add manage costs button to product edit view"
```

---

## Task 19: Final Build Verification

**Step 1: Full build check**

Run: `cd /Users/zak-info/Documents/Projects/markium/markium && npx vite build 2>&1`

Expected: Build succeeds with no errors.

**Step 2: Fix any compilation errors**

If there are import errors or missing exports, fix them.

**Step 3: Final commit if fixes were needed**

```bash
git add -A
git commit -m "fix: resolve build errors in revenue stream feature"
```

---

## Task Summary

| # | Task | Files |
|---|------|-------|
| 1 | API endpoints | `src/utils/axios.js` |
| 2 | Product costs hooks | `src/api/product-costs.js` |
| 3 | Profitability hooks | `src/api/profitability.js` |
| 4 | i18n translations | `ar.json`, `en.json`, `fr.json` |
| 5 | Routes & paths | `paths.js`, `dashboard.jsx` |
| 6 | Navigation item | `config-navigation.jsx` |
| 7 | Page wrappers | 7 page files |
| 8 | Cost constants & badge | `constants.js`, `cost-type-badge.jsx` |
| 9 | Cost form dialog | `cost-form-dialog.jsx` |
| 10 | Cost management view | `product-costs-view.jsx` |
| 11 | Profitability shared | 6 component files |
| 12 | Store P&L overview | `profitability-overview-view.jsx` |
| 13 | Products P&L table | `profitability-products-view.jsx` |
| 14 | Product P&L detail | `profitability-product-view.jsx` |
| 15 | Campaigns ROI | `profitability-campaigns-view.jsx` |
| 16 | Channels overview | `profitability-channels-view.jsx` |
| 17 | Channel detail | `profitability-channel-view.jsx` |
| 18 | Manage costs link | `product-edit-view.jsx` |
| 19 | Final build check | — |

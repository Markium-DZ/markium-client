# Revenue Stream Frontend Integration Design

## Summary

Integrate the Revenue Stream backend feature into the frontend. Two main areas:
1. **Cost Management** — CRUD for product costs on a dedicated page
2. **Profitability Analytics** — P&L dashboard with store, product, campaign, and channel views

## Decisions

| Decision | Choice |
|----------|--------|
| Cost Management UI | Dedicated page at `/product/:id/costs` |
| Profitability Analytics | Separate sidebar nav item with flat route structure |
| Cost add/edit form | Modal dialog |
| Bulk add | Fast single-add (modal resets after save) |
| i18n | Arabic, English, French |
| Architecture | Flat routes — each view is a standalone page |
| Charts | ApexCharts (already installed) |
| Tier gating | Reuse AnalyticsGate pattern for Medium+ restriction |

## Routes

```
/dashboard/product/:id/costs              # Product Costs page

/dashboard/profitability                   # Store P&L Overview
/dashboard/profitability/products          # Products P&L table
/dashboard/profitability/products/:id      # Single Product P&L
/dashboard/profitability/campaigns         # Campaigns ROI
/dashboard/profitability/channels          # Channels Overview
/dashboard/profitability/channels/:channel # Channel Detail
```

## Sidebar Navigation

New "Profitability" item with collapsible children:

```
Analytics
Profitability        (PRO badge)
  Overview
  Products
  Campaigns
  Channels
Products
Orders
```

Product edit page gets a "Manage Costs" link → `/dashboard/product/:id/costs`.

## API Layer

### New Files

**`src/api/product-costs.js`** — SWR hooks:
- `useGetProductCosts(productId, filters?)` — GET `/products/{productId}/costs`
- `createProductCost(productId, data)` — POST
- `updateProductCost(productId, costId, data)` — PUT
- `deleteProductCost(productId, costId)` — DELETE

**`src/api/profitability.js`** — SWR hooks:
- `useGetStorePnL(dateFrom?)` — GET `/analytics/profitability`
- `useGetProductsPnL(dateFrom?)` — GET `/analytics/profitability/products`
- `useGetProductPnL(productId, dateFrom?)` — GET `/analytics/profitability/products/{id}`
- `useGetCampaignsROI(dateFrom?)` — GET `/analytics/profitability/campaigns`
- `useGetChannelsOverview(dateFrom?)` — GET `/analytics/profitability/channels`
- `useGetChannelDetail(channel, dateFrom?)` — GET `/analytics/profitability/channels/{channel}`

### Endpoints (added to `src/utils/axios.js`)

```javascript
productCosts: {
  list: (productId) => `/products/${productId}/costs`,
  create: (productId) => `/products/${productId}/costs`,
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

## Cost Management Page

### File Structure

```
src/sections/product-costs/
  view/product-costs-view.jsx       # Main page
  cost-table-row.jsx                # Table row
  cost-form-dialog.jsx              # Add/edit modal
  cost-type-badge.jsx               # Type icon + label badge

src/pages/dashboard/product/costs.jsx   # Page wrapper (lazy loaded)
```

### Page Layout

- Breadcrumb: Products > [Product Name] > Costs
- Filter by type dropdown
- "+ Add Cost" button
- Table: Type (badge), Scope (chip), Amount, Details, Notes, Actions (3-dot: Edit, Delete)
- Pagination

### Cost Form Dialog

Dynamic fields based on type:
- **Always**: Type dropdown, Scope radio (Per Unit / Global), Amount input, Variant dropdown (optional), Notes textarea
- **When type = marketing**: Campaign Name input, Channel dropdown
- **When type = custom**: Custom Type Name input

Buttons:
- Create mode: "Cancel", "Save & Add Another", "Save"
- Edit mode: "Cancel", "Save"

"Save & Add Another" saves then resets form for fast multi-entry.

### Validation (Yup)

- `type`: required, oneOf enum values
- `scope`: required, oneOf ['per_unit', 'global']
- `amount`: required, number, min 0, max 99999999.99
- `custom_type_name`: required when type = 'custom'
- `campaign_name`: required when type = 'marketing'
- `channel`: required when type = 'marketing', oneOf enum values
- `variant_id`: optional, number
- `notes`: optional, max 1000 chars
- `currency`: optional, defaults to 'DZD'

### Delete

Uses existing `ConfirmDialog` with translated confirmation message.

## Profitability Analytics Pages

### File Structure

```
src/sections/profitability/
  view/
    profitability-overview-view.jsx     # Store P&L
    profitability-products-view.jsx     # Products table
    profitability-product-view.jsx      # Single product
    profitability-campaigns-view.jsx    # Campaigns ROI
    profitability-channels-view.jsx     # Channels overview
    profitability-channel-view.jsx      # Single channel
  components/
    profitability-date-filter.jsx       # Date range selector
    profitability-summary-cards.jsx     # Revenue/Cost/Profit cards
    cost-breakdown-chart.jsx            # Donut chart (ApexCharts)
    channel-icon.jsx                    # Channel logo/icon
    profitability-gate.jsx              # Tier gate wrapper
  constants.js                          # Date ranges, cost types, channels

src/pages/dashboard/profitability/
  overview.jsx
  products.jsx
  product-detail.jsx
  campaigns.jsx
  channels.jsx
  channel-detail.jsx
```

### Store P&L Overview

1. **Summary cards** (4 cards): Total Revenue, Total Costs, Gross Profit, Profit Margin %
2. **Cost breakdown** donut chart by type with legend
3. **Per-unit stats**: Cost/Unit, Profit/Unit
4. **Top profitable products** table: Product, Revenue, Profit, Margin, Profit/Unit
5. **Top costly campaigns** table: Campaign, Channel (icon), Spend

### Products P&L Table

Sortable table: Product Name, Revenue, Units Sold, Total Costs, Gross Profit, Margin %, Profit/Unit. Click row → single product P&L.

### Single Product P&L

- Product header (name)
- Summary cards: Revenue, Units Sold, Total Costs, Profit, Margin
- Cost breakdown by type: each type shows total + per-unit
- Marketing campaigns table (if marketing costs exist): Campaign, Channel, Spend, Attributed Orders, ROI
- "Manage Costs" link → product costs page

### Campaigns ROI

- Summary cards: Total Marketing Spend, Total Revenue, Overall Marketing ROI
- Table: Campaign Name, Channel (icon), Spend, Attributed Revenue, ROI

### Channels Overview

- Cards or table per channel: Channel (icon + name), Total Spend, Campaigns Count, Products Reached, Attributed Revenue, ROI
- Click → channel detail

### Channel Detail

- Header: Channel icon + name + total spend + ROI
- Campaigns table: Campaign Name, Product, Spend, Attributed Revenue, ROI

### Date Range Filter

Select component used across all views:
- Last 24h (`-1d`)
- Last 7 days (`-7d`)
- Last 14 days (`-14d`)
- Last 30 days (`-30d`) — default
- Last 90 days (`-90d`)

Stored in URL query param `?date_from=-30d`.

## Tier Gating

- `ProfitabilityGate` wraps all profitability views
- Reuses `AnalyticsGate` pattern: blur + overlay + upgrade CTA
- Cost Management page is NOT gated (all tiers can add costs)
- SWR hooks handle 403 gracefully

## i18n

New keys added to `ar.json`, `en.json`, `fr.json`:

**Cost types**: `cost_type_buy_price`, `cost_type_marketing`, `cost_type_content`, `cost_type_packaging`, `cost_type_shipping`, `cost_type_confirmation_call`, `cost_type_custom`

**Cost management**: `costs`, `add_cost`, `edit_cost`, `delete_cost`, `cost_deleted`, `cost_created`, `cost_updated`, `scope_per_unit`, `scope_global`, `campaign_name`, `channel`, `custom_type_name`, `variant`, `all_variants`, `notes`, `save_and_add_another`

**Profitability**: `profitability`, `profitability_overview`, `store_pnl`, `products_pnl`, `campaigns_roi`, `channels_overview`, `total_revenue`, `total_costs`, `gross_profit`, `profit_margin`, `cost_per_unit`, `profit_per_unit`, `cost_breakdown`, `top_profitable_products`, `top_costly_campaigns`, `units_sold`, `attributed_revenue`, `roi`, `total_marketing_spend`, `overall_marketing_roi`, `products_reached`, `campaigns_count`, `channel_detail`

**Date filter**: `last_24h`, `last_7_days`, `last_14_days`, `last_30_days`, `last_90_days`

**Tier gating**: `profitability_locked_title`, `profitability_locked_description`, `upgrade_to_unlock`

**Channels**: `channel_facebook`, `channel_tiktok`, `channel_google`, `channel_instagram`, `channel_snapchat`, `channel_other`

## Currency Formatting

All amounts formatted as DZD (Algerian Dinar). Use existing `fCurrency` utility or create a `formatDZD(amount)` helper. Amounts have 2 decimal places. Display: `500.00 DA` or `500,00 DA` depending on locale.

## Business Logic Notes

- `per_unit` costs multiply by units sold for total; `global` costs divide by units sold for per-unit
- Campaign ROI = attributed revenue / campaign spend
- Cost breakdown in store P&L shows totals per type (after per_unit * quantity)
- All analytics views support the 5 date range options
- Default date range: Last 30 days (-30d)

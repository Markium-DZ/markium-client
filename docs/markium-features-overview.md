# Markium — Platform Features Overview

Markium is an e-commerce platform built for Algerian merchants. It provides a full store management solution with built-in analytics, order tracking, marketing pixel management, and profitability tools.

---

## 1. Analytics Dashboard

Markium includes a comprehensive analytics suite organized into 5 tabs:

### Overview Tab
- **Store Visits** — daily visitor trend chart (7/14/30/90 days)
- **Unique Visitors** — deduplicated visitor count
- **Page Views** — total pages viewed across the store
- **Product Views** — how often products are being seen

### Traffic & Visitors Tab
- **Bounce Rate** — percentage of visitors who leave after viewing one page
- **Session Duration** — average time visitors spend browsing
- **Visitor Types** — new vs returning visitors breakdown
- **Device Breakdown** — desktop, mobile, tablet distribution
- **Traffic Sources** — top referring domains driving visits
- **Landing Pages** — which pages visitors land on first

### Products & Conversion Tab
- **Conversion Rate** — unique visitors vs buyers percentage
- **Conversion Funnel** — step-by-step drop-off: page view → product view → add to cart → checkout → order completed
- **Average Order Value (AOV)** — average amount per order, tracked over time
- **Cart Abandonment** — cart additions vs completed orders
- **Top Products** — most viewed products
- **Top Searches** — what customers are searching for in-store

### Orders & Fulfillment Tab
- **Orders by Region (Wilaya)** — geographic heatmap of orders across Algeria
- **Delivery Performance** — delivery success rates by region, return rates, total shipments

### Customer Behavior Tab
- **Unique Buyers & Repeat Buyers** — one-time vs repeat purchase breakdown
- **Repeat Rate** — percentage of customers who buy again
- **Peak Hours** — busiest times for store activity
- **Revenue Breakdown** — revenue by product, region, and time period

### Analytics Features
- Date range filtering: last 24h, 7d, 14d, 30d, 90d
- CSV export of all analytics data
- Real-time data indicator (live updates)
- Fully localized in Arabic (Algerian Darija), French, and English

---

## 2. Three-Tier Plan System

Analytics features are gated across 3 subscription tiers. Locked metrics show a blurred overlay with an upgrade prompt.

### Basic Plan
- Store visits overview
- Page views & product views
- Basic order count
- Top products (by views)

### Pro Plan (Medium)
- Everything in Basic
- Traffic & visitor analytics (bounce rate, session duration, visitor types)
- Device breakdown
- Conversion rate & funnel
- AOV tracking
- Cart abandonment analysis
- Traffic sources & landing pages

### Business Plan (Advanced)
- Everything in Pro
- Orders by region (geographic analysis)
- Delivery performance metrics
- Customer behavior insights (repeat rate, peak hours)
- Revenue breakdown (by product, region, daily)
- Full profitability & P&L dashboard access

### Gating UX
- Locked sections show blurred fake chart data behind a frosted overlay
- Lock icon + "Upgrade to unlock" CTA
- Clicking upgrade opens a modal showing required plan and features included
- Smooth, non-intrusive — merchants can see something is there, encouraging upgrade

---

## 3. Revenue Stream (Profitability P&L)

A full profit & loss dashboard that helps merchants understand their unit economics.

### Store-Level P&L
- **Total Revenue** — sum of all order revenue
- **Total Costs** — sum of all costs (buy price, marketing, shipping, packaging, etc.)
- **Gross Profit** — revenue minus costs
- **Profit Margin %** — profit as percentage of revenue
- **Cost per Unit** / **Profit per Unit** — unit economics
- **Cost Breakdown Chart** — donut chart showing cost distribution by type
- **Top 5 Profitable Products** — ranked by margin
- **Top Costly Campaigns** — highest spending campaigns

### Product-Level P&L
- Sortable table: product name, revenue, units sold, total costs, gross profit, margin %, profit/unit
- Click any product → detailed single product P&L page
- Single product view: revenue, units, costs, profit, margin + cost breakdown chart + linked campaigns

### Campaign ROI
- Summary: total marketing spend, total attributed revenue, overall ROI
- Campaign table: campaign name, channel, spend, attributed revenue, ROI percentage
- Channels overview: Facebook, TikTok, Google, Instagram, Snapchat — each with spend, campaign count, attributed revenue, ROI

### Cost Management
Merchants can add costs to any product:
- **Cost Types**: Buy Price, Marketing, Content, Packaging, Shipping, Confirmation Call, Custom
- **Scope**: Per Unit (multiplied by quantity sold) or Global (divided across units)
- **Marketing costs** include: campaign name + channel (Facebook, TikTok, Google, Instagram, Snapchat, Other)
- Quick "Save & Add Another" for bulk entry

---

## 4. Order Tracking URL & Customer Tracking Analytics

Each order gets a unique tracking URL that merchants share with customers (typically via WhatsApp or SMS). This page shows the customer their order status and delivery progress in real-time.

### What the Tracking Page Shows Customers
- Current order status with visual progress
- Shipping provider info and tracking number
- Delivery timeline with status history
- Estimated delivery information

### Tracking Analytics for Merchants (New)
On the order detail page, merchants see a **"Tracking Page Views"** card showing:

- **Total view count** — how many times the customer visited the tracking page
- **Last view with status** — shows what order status the customer last saw (e.g., "Viewed while order was *shipped*")
- **"View all" dialog** — full timeline of every view with timestamps and the order status at each visit

### Why This Matters
- **Customer engagement signal** — if a customer checks tracking frequently, they're engaged and expecting their order
- **Information gap detection** — if the last view was while the order was "shipped" but it's now "delivered", the merchant knows the customer hasn't seen the delivery update yet
- **Delivery issue awareness** — helps merchants know if a customer is aware of delays or failed delivery attempts
- **Proactive communication** — merchants can reach out to customers who haven't checked their tracking in a while

---

## 5. Conversion API (CAPI) & Pixel Management

Markium provides built-in marketing pixel integration so merchants can track conversions from their ad campaigns.

### Supported Platforms

#### Facebook Pixel + Conversions API
- **Pixel ID** — tracks customer actions on the store (page views, add to cart, purchases)
- **Access Token (CAPI)** — enables server-side event tracking, ensuring conversions are captured even when browser cookies are blocked
- Benefits: better attribution accuracy, improved ad optimization, higher match rates for custom audiences

#### TikTok Pixel + Events API
- **Pixel ID** — tracks conversions from TikTok ad campaigns
- **Access Token** — server-side event tracking for better attribution
- Benefits: accurate ROAS measurement, audience building for TikTok campaigns

#### Google Analytics (GA4)
- **Tracking ID** — UA or G- format
- **Measurement ID** — GA4 measurement stream
- Benefits: full website traffic analysis, user behavior tracking, integration with Google Ads

### Pixel Management UX
- Card-based interface: each platform is a card with icon, name, description, and status toggle
- **Status badges**: "Configured" (green), "Missing ID" (warning), "Disabled" (gray)
- Click any card → opens configuration dialog with fields and helper text
- Enable/disable via toggle switch — disabling auto-saves immediately
- CAPI access tokens are tucked behind an "Advanced settings" collapsible to avoid confusing new merchants

### Dashboard Onboarding
- New merchants see a **pixel setup prompt** on the dashboard
- Simplified benefit-focused descriptions (e.g., "Link your Facebook Pixel to know who visits your store and boost your ads")
- Inline configuration — no redirect to settings page needed
- Card auto-hides once any pixel is configured

---

## 6. Localization

The entire platform is available in 3 languages:
- **Arabic** — Algerian Darija dialect (not formal MSA), making it natural and accessible for local merchants
- **French** — standard French, widely used in Algerian business
- **English** — for international users

All analytics metrics, labels, descriptions, and onboarding text are fully translated.

---

## 7. Platform Architecture

- **Frontend**: React 18 + MUI 5 (Material UI)
- **Data fetching**: SWR with real-time revalidation
- **Forms**: React Hook Form + Yup validation
- **Charts**: @mui/x-charts (PieChart, LineChart, BarChart)
- **i18n**: i18next with namespace-based translations
- **Shipping**: Multi-provider integration (Algerian delivery companies)
- **Payments**: COD (Cash on Delivery) as primary payment method (standard in Algeria)

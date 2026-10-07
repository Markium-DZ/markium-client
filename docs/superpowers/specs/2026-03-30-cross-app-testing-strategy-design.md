# Cross-App Testing Strategy for Markium

**Date:** 2026-03-30
**Status:** Approved
**Problem:** No way to verify that markium-be, markium-client, and markium-storefront work together without manual testing after every change.

## Current State

| Project | Framework | Tests | CI/CD |
|---------|-----------|-------|-------|
| markium-be | PHPUnit 11 + Laravel 12 | 98 tests (24 unit, 73 feature, 1 Selenium) | GitHub Actions on `dev` push |
| markium-client | None | 0 | None |
| markium-storefront | None | 0 | None |

All 3 apps are deployed independently. API contract breaks, frontend regressions, and end-to-end flow failures all occur regularly and are only caught via manual testing.

## Solution: Playwright E2E + API Schema Tests

### Architecture

A shared Playwright test project at `markium/markium-tests/` (sibling to the 3 apps) that exercises real user flows across all apps running locally against the test backend.

```
markium/
├── markium-be/           (Laravel, port 8000)
├── markium-client/       (Vite, port 3031)
├── markium-storefront/   (Vite, port 3035)
└── markium-tests/        (Playwright test suite)
```

Complemented by API response shape assertions in the existing PHPUnit suite.

### File Structure

```
markium-tests/
├── package.json
├── playwright.config.ts
├── tsconfig.json
├── .env                        (gitignored - test credentials)
├── .env.example                (template with placeholder values)
├── .gitignore
├── scripts/
│   └── check-servers.sh        (verify dev servers are running)
├── fixtures/
│   ├── auth.ts                 (login + storageState reuse)
│   └── api-client.ts           (direct API calls for setup/teardown)
├── helpers/
│   ├── products.ts             (create/delete products via API, including variant products)
│   └── orders.ts               (create orders via API)
└── tests/
    ├── auth/
    │   └── login.spec.ts
    ├── products/
    │   └── product-lifecycle.spec.ts
    ├── orders/
    │   └── order-flow.spec.ts
    ├── settings/
    │   └── store-settings.spec.ts
    └── language/
        └── multi-language.spec.ts
```

## Test Suites

### Suite 1: Auth Flow

Tests the client dashboard authentication cycle.

| # | Test | App | What it verifies |
|---|------|-----|-----------------|
| 1 | Login with valid phone + password | client | Lands on dashboard, token stored |
| 2 | Login with invalid credentials | client | Error shown, stays on login page |
| 3 | Authenticated request includes Bearer token | client | API calls have Authorization header |
| 4 | Logout | client | Session cleared, redirected to login |
| 5 | Unauthenticated dashboard access | client | Redirected to login |

### Suite 2: Product Lifecycle (Cross-App)

Tests the full product lifecycle from creation in the client to display in the storefront, including variant handling.

| # | Test | App | What it verifies |
|---|------|-----|-----------------|
| 1 | Create simple product | client | Product appears in product list |
| 2 | Deploy product | client | Status changes to deployed |
| 3 | Product visible in storefront | storefront | Deployed product shows with correct name, price, image |
| 4 | Edit product price | client | Save succeeds, list reflects new price |
| 5 | Storefront reflects updated price | storefront | Price matches after refresh |
| 6 | Delete product | client | Product removed from list |
| 7 | Product gone from storefront | storefront | Deleted product no longer visible |
| 8 | Create product with variants (size + color) | client | Variant combinations generated, each with price/SKU |
| 9 | Variant product visible in storefront | storefront | Option selectors (size, color) displayed correctly |
| 10 | Selecting variant updates price and image | storefront | Price and image change to match selected variant |
| 11 | Add specific variant to cart | storefront | Cart item preserves variant info (option values, SKU) |

### Suite 3: Order Flow (Cross-App)

Tests the order lifecycle from storefront purchase to dashboard management, including cart persistence, address selection, and order tracking.

| # | Test | App | What it verifies |
|---|------|-----|-----------------|
| 1 | Browse products and add to cart | storefront | Cart shows correct items and total |
| 2 | Cart persists after page reload | storefront | Items and quantities survive browser refresh |
| 3 | Wilaya dropdown populates on checkout | storefront | All wilayas loaded from local JSON |
| 4 | Selecting wilaya populates commune dropdown | storefront | Communes filtered by selected wilaya |
| 5 | Fill checkout form and submit | storefront | Order created, redirected to success page |
| 6 | Order contains correct variant details | storefront | Submitted order items include variant ID, options, quantity |
| 7 | Track order via UUID (no auth) | storefront | Public tracking page shows status, items, delivery location |
| 8 | Order appears in dashboard | client | New order visible with correct customer info and items |
| 9 | View order details | client | Status timeline shows "pending" |
| 10 | Confirm order | client | Status updates to "confirmed" |
| 11 | Order tracking reflects confirmed status | storefront | Tracking page updates to show "confirmed" |

### Suite 4: Settings Reflection (Cross-App)

Tests that client dashboard settings changes propagate to the storefront.

| # | Test | App | What it verifies |
|---|------|-----|-----------------|
| 1 | Update store name | client | Save succeeds |
| 2 | Store name reflected in storefront | storefront | Updated name visible |
| 3 | Update color palette | client | Save succeeds |
| 4 | Colors reflected in storefront | storefront | CSS variables match new palette |

### Suite 5: Multi-Language & RTL (Cross-App)

Tests that the storefront works correctly in Arabic (RTL), English, and French.

| # | Test | App | What it verifies |
|---|------|-----|-----------------|
| 1 | Storefront loads with store's default language | storefront | UI labels match default language |
| 2 | Switch language to Arabic | storefront | `dir="rtl"` set on document element |
| 3 | Language persists after page reload | storefront | Page reload keeps selected language and direction |
| 4 | Key UI elements display in selected language | storefront | Product names, prices, checkout labels, buttons translated |
| 5 | Switch back to French/English | storefront | `dir="ltr"` restored, translations updated |

### API Schema Tests (PHPUnit, backend-only)

Added to the existing PHPUnit feature test suite in markium-be. Assert JSON response structures for key storefront-consumed endpoints:

- `GET /api/v1/stores/{slug}` — store config shape (name, slug, config.colorPalette, config.pixels, etc.)
- `GET /api/v1/stores/{slug}/products` — product list shape (variants, option_definitions, media)
- `POST /api/v1/orders` — order creation response shape
- `GET /api/v1/orders/{id}` — order detail shape (items, status, active_shipment, timestamps)
- `GET /api/v1/orders/track/{uuid}` — public order tracking response shape

Additionally, assert subscription feature gating:

- Product creation blocked when feature limit reached (returns 403/402)
- Product deployment blocked when deployment limit reached
- `POST /api/v1/subscriptions/check-feature-access` returns correct limits per plan

These run as part of the existing `php artisan test` command and catch field renames/removals before they reach frontends.

## Test Infrastructure

### Test Data Strategy

- Dedicated test account on `be-test.markium.online` with a pre-configured store
- Credentials stored in `.env` file inside `markium-tests/` (gitignored)
- Each test suite creates its own data via API helpers and cleans up after itself
- No shared state between suites — they can run independently or in parallel

### .env.example

```
# Client dashboard
CLIENT_BASE_URL=http://localhost:3031
CLIENT_PHONE=+213XXXXXXXXX
CLIENT_PASSWORD=test-password

# Storefront
STOREFRONT_BASE_URL=http://localhost:3035
TEST_STORE_SLUG=test-store-e2e

# Backend API (for direct API calls in helpers)
API_BASE_URL=https://be-test.markium.online/api/v1
```

### Auth Fixture

A reusable Playwright fixture that:
1. Logs into the client dashboard via the UI on first run
2. Saves Playwright `storageState` to a file for reuse across tests
3. Provides a raw API client (fetch with Bearer token) for fast test data setup/teardown without UI interaction

### Storefront Access

- Tests access the storefront via `?store=test-store-e2e` query param (no subdomain required locally)
- The test store must exist in the test backend before running tests

### Turnstile CAPTCHA Handling

Both client login and storefront order submission use Cloudflare Turnstile. For the test environment:
- Backend test env should set `TURNSTILE_ENABLED=false` to skip CAPTCHA validation
- This is standard practice — CAPTCHAs block bots, not tests

### Playwright Configuration

| Setting | Value |
|---------|-------|
| Client base URL | `http://localhost:3031` |
| Storefront base URL | `http://localhost:3035` |
| Test timeout | 30s per test |
| Action timeout | 10s per action |
| Retries | 0 locally, 1 on CI |
| Screenshots | On failure only |
| Trace | On first retry |
| Browser | Chromium (single browser sufficient for integration testing) |

### Server Check Script

`scripts/check-servers.sh` verifies all 3 dev servers are reachable before tests start. Prints which servers are missing and exits with error if any are down.

### Running Tests

```bash
cd markium-tests/

# Run all suites
npm test

# Run a specific suite
npm test -- --grep "product"

# Run with UI mode for debugging
npx playwright test --ui
```

## What This Does NOT Cover (Justified)

- **Shipping provider integration** — depends on third-party APIs (Yalidine, ZRExpress, Maystro), too flaky for E2E. Already covered by PHPUnit tests.
- **Payment webhooks** — depends on external payment providers. Already covered by PHPUnit tests.
- **Inventory management** — read-only view tied to product stock, implicitly covered by product variant tests.
- **Component-level tests** — can add later with Vitest for isolated frontend unit testing.
- **Visual regression testing** — screenshots comparison, future enhancement.
- **Performance testing** — load testing, Lighthouse, future enhancement.
- **Mobile-specific testing** — Capacitor/native app flows, future enhancement.
- **CI/CD pipeline integration** — can add later once tests are stable locally.

## Success Criteria

1. Running `npm test` in `markium-tests/` exercises all 5 suites against locally running apps
2. A broken API contract (e.g., renamed field) causes a test failure
3. A frontend regression (e.g., broken form submission) causes a test failure
4. A cross-app flow break (e.g., product not showing in storefront) causes a test failure
5. A variant system break (e.g., wrong price for selected option) causes a test failure
6. A broken order tracking page causes a test failure
7. A broken language/RTL switch causes a test failure
8. Subscription feature gating changes caught by PHPUnit schema tests
9. Tests complete in under 5 minutes total
10. New team members can run tests with only: install deps, copy `.env.example`, start dev servers, `npm test`

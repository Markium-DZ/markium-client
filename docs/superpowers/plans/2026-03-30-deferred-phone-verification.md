# Deferred Phone Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move phone OTP verification from a registration blocker to a post-registration gate on write actions, so SMS failures don't prevent users from entering the app.

**Architecture:** Backend splits route middleware by HTTP method (reads open, writes gated). Frontend removes OTP blocking from guards, adds a `VerificationBanner` in the dashboard layout and a `VerificationGate` wrapper around write-action entry points. Defense in depth: frontend gate + backend middleware + axios interceptor.

**Tech Stack:** Laravel 11 (backend), React 18 + MUI v5 + Vite 5 (frontend), existing `is_phone_verified` flag, existing `OtpVerifyModal` component.

**Spec:** `docs/superpowers/specs/2026-03-30-deferred-phone-verification-design.md`

---

## File Structure

### Backend (`markium-be`)

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `routes/api.php:141-358` | Split Tier 2/3 middleware groups by read/write |
| Modify | `tests/Feature/Api/MiddlewareTest.php` | Update tests for new middleware structure |

### Frontend (`markium-client`)

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/auth/guard/auth-guard.jsx` | Remove OTP blocking for unverified users |
| Modify | `src/auth/guard/guest-guard.jsx` | Remove OTP modal overlay on login page |
| Delete | `src/auth/guard/phone-verified-guard.jsx` | No longer needed |
| Modify | `src/auth/guard/index.js` | Remove PhoneVerifiedGuard export |
| Modify | `src/routes/sections/onboarding.jsx` | Remove PhoneVerifiedGuard from store setup route |
| Create | `src/components/verification-banner/verification-banner.jsx` | Persistent banner for unverified users |
| Create | `src/components/verification-gate/verification-gate.jsx` | Wrapper that intercepts write-action clicks |
| Modify | `src/sections/auth/jwt/jwt-verify-view.jsx` | Add "Later" button, remove forced logout on close |
| Modify | `src/layouts/dashboard/index.jsx` | Render VerificationBanner |
| Modify | `src/utils/axios.js` | Intercept 403 PHONE_NOT_VERIFIED responses |
| Modify | `src/locales/langs/en.json` | New translation keys |
| Modify | `src/locales/langs/ar.json` | New translation keys |
| Modify | `src/locales/langs/fr.json` | New translation keys |
| Modify | ~35-40 files in `src/sections/` | Wrap write-action entry points with VerificationGate |

---

## Task 1: Backend — Remove `phone-verified` from Tier 2 (Store Setup)

**Files:**
- Modify: `markium-be/routes/api.php:141-154`
- Modify: `markium-be/tests/Feature/Api/MiddlewareTest.php`

- [ ] **Step 1: Update the test to expect unverified users CAN access store setup**

In `tests/Feature/Api/MiddlewareTest.php`, replace the `unverified_user_blocked_from_store_setup` test:

```php
#[Test]
public function unverified_user_can_access_store_setup(): void
{
    $client = Client::factory()->unverified()->withoutStore()->create();

    $endpoints = [
        ['method' => 'GET', 'url' => "/api/{$this->apiVersion}/store/setup/status"],
        ['method' => 'GET', 'url' => "/api/{$this->apiVersion}/categories"],
    ];

    foreach ($endpoints as $endpoint) {
        $response = $this->actingAs($client, 'api')
            ->json($endpoint['method'], $endpoint['url']);

        // Should NOT return 403 PHONE_NOT_VERIFIED
        $this->assertNotEquals(403, $response->getStatusCode(), sprintf(
            'Expected %s %s to be accessible for unverified users, got 403',
            $endpoint['method'],
            $endpoint['url']
        ));
    }
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd /Users/cinex/repo/markium/markium-be && php artisan test --filter=unverified_user_can_access_store_setup`

Expected: FAIL — unverified user gets 403 because `phone-verified` middleware is still applied.

- [ ] **Step 3: Remove `phone-verified` middleware from Tier 2 routes**

In `routes/api.php`, change line 144 from:

```php
Route::middleware(['auth:api', 'phone-verified'])->group(function () {
```

to:

```php
Route::middleware(['auth:api'])->group(function () {
```

Update the comment block above it (lines 141-143):

```php
// =========================================================================
// Tier 2: auth:api only (store setup wizard, no phone verification needed)
// Store setup wizard, global categories list
// =========================================================================
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd /Users/cinex/repo/markium/markium-be && php artisan test --filter=unverified_user_can_access_store_setup`

Expected: PASS

- [ ] **Step 5: Run full middleware test suite to check nothing else broke**

Run: `cd /Users/cinex/repo/markium/markium-be && php artisan test --filter=MiddlewareTest`

Expected: All tests pass. The `verified_user_without_store_can_access_setup` test should still pass since verified users also don't need `phone-verified` middleware anymore (it's removed).

- [ ] **Step 6: Commit**

```bash
cd /Users/cinex/repo/markium/markium-be
git add routes/api.php tests/Feature/Api/MiddlewareTest.php
git commit -m "feat: allow unverified users to access store setup (Tier 2)

Remove phone-verified middleware from store setup and categories
routes so unverified users can complete onboarding without SMS."
```

---

## Task 2: Backend — Split Tier 3 into Read/Write Groups

**Files:**
- Modify: `markium-be/routes/api.php:157-358`
- Modify: `markium-be/tests/Feature/Api/MiddlewareTest.php`

- [ ] **Step 1: Add test for unverified user reading Tier 3 GET endpoints**

In `tests/Feature/Api/MiddlewareTest.php`, add a new test:

```php
#[Test]
public function unverified_user_with_store_can_read_protected_routes(): void
{
    $client = Client::factory()->unverified()->create();

    $readEndpoints = [
        ['method' => 'GET', 'url' => "/api/{$this->apiVersion}/products"],
        ['method' => 'GET', 'url' => "/api/{$this->apiVersion}/orders"],
        ['method' => 'GET', 'url' => "/api/{$this->apiVersion}/inventory"],
        ['method' => 'GET', 'url' => "/api/{$this->apiVersion}/categories/list"],
        ['method' => 'GET', 'url' => "/api/{$this->apiVersion}/subscriptions/packages"],
    ];

    foreach ($readEndpoints as $endpoint) {
        $response = $this->actingAs($client, 'api')
            ->json($endpoint['method'], $endpoint['url']);

        $this->assertNotEquals(403, $response->getStatusCode(), sprintf(
            'Expected %s %s to be readable by unverified users, got 403',
            $endpoint['method'],
            $endpoint['url']
        ));
    }
}
```

- [ ] **Step 2: Add test for unverified user blocked from Tier 3 write endpoints**

```php
#[Test]
public function unverified_user_with_store_blocked_from_write_routes(): void
{
    $client = Client::factory()->unverified()->create();

    $writeEndpoints = [
        ['method' => 'POST', 'url' => "/api/{$this->apiVersion}/products"],
        ['method' => 'POST', 'url' => "/api/{$this->apiVersion}/categories"],
        ['method' => 'POST', 'url' => "/api/{$this->apiVersion}/store"],
    ];

    foreach ($writeEndpoints as $endpoint) {
        $response = $this->actingAs($client, 'api')
            ->json($endpoint['method'], $endpoint['url']);

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'error' => [
                    'code' => 'PHONE_NOT_VERIFIED',
                ],
            ]);
    }
}
```

- [ ] **Step 3: Run both new tests to verify they fail**

Run: `cd /Users/cinex/repo/markium/markium-be && php artisan test --filter="unverified_user_with_store_can_read|unverified_user_with_store_blocked_from_write"`

Expected: Both FAIL — reads return 403 (wrong), writes might pass or fail depending on validation.

- [ ] **Step 4: Split Tier 3 into read and write groups**

In `routes/api.php`, replace the single Tier 3 group (lines 157-358) with two groups. Keep every route exactly as-is, just split by HTTP method:

```php
// =========================================================================
// Tier 3a: auth:api + store-setup (read-only, no phone verification)
// Unverified users can browse all data after completing store setup
// =========================================================================
Route::middleware(['auth:api', 'store-setup'])->group(function () {

    // Order management - read
    Route::get('orders', [OrderController::class, 'listAll']);
    Route::get('orders/{order}', [OrderController::class, 'show']);

    // Subscription management - read
    Route::prefix('subscriptions')->group(function () {
        Route::get('packages', [SubscriptionController::class, 'packages']);
        Route::get('current', [SubscriptionController::class, 'current']);
        Route::get('usage', [SubscriptionController::class, 'usage']);
        Route::get('usage/alerts', [SubscriptionController::class, 'usageAlerts']);
        Route::get('usage/history', [SubscriptionController::class, 'usageHistory']);
        Route::get('usage/top-features', [SubscriptionController::class, 'topFeatures']);
        Route::post('check-feature-access', [SubscriptionController::class, 'checkFeatureAccess']);
        Route::get('payments', [SubscriptionController::class, 'paymentHistory']);
        Route::get('payments/{payment}', [SubscriptionController::class, 'paymentDetail']);
    });

    // Wallet - read
    Route::prefix('wallet')->group(function () {
        Route::get('balance', [WalletController::class, 'balance']);
        Route::get('transactions', [WalletController::class, 'transactions']);
    });

    // Add-ons - read
    Route::prefix('add-ons')->group(function () {
        Route::get('/', [AddOnController::class, 'index']);
        Route::get('active', [AddOnController::class, 'active']);
    });

    // Category management - read
    Route::prefix('categories')->group(function () {
        Route::get('/list', [CategoryController::class, 'list']);
        Route::get('/{category}', [CategoryController::class, 'show']);
    });

    // Media management - read
    Route::prefix('media')->group(function () {
        Route::get('/', [MediaController::class, 'index']);
        Route::get('{media}', [MediaController::class, 'show']);
    });

    // Product management - read
    Route::prefix('products')->group(function () {
        Route::get('/', [ProductController::class, 'index']);
        Route::prefix('{product}/costs')->group(function () {
            Route::get('/', [ProductCostController::class, 'index']);
        });
    });

    // Inventory management - read
    Route::prefix('inventory')->group(function () {
        Route::get('/', [InventoryController::class, 'index']);
        Route::get('/low-stock', [InventoryController::class, 'lowStock']);
        Route::get('/{id}', [InventoryController::class, 'show']);
        Route::get('/{id}/transactions', [InventoryController::class, 'transactions']);
    });

    // Store analytics - read (all GET)
    Route::prefix('analytics')->group(function () {
        Route::get('capabilities', [AnalyticsController::class, 'capabilities']);
        Route::get('overview', [AnalyticsController::class, 'overview']);
        Route::get('traffic', [AnalyticsController::class, 'traffic']);
        Route::get('funnel', [AnalyticsController::class, 'funnel']);
        Route::get('top-products', [AnalyticsController::class, 'topProducts']);
        Route::get('traffic-sources', [AnalyticsController::class, 'trafficSources']);
        Route::get('conversion', [AnalyticsController::class, 'conversion']);
        Route::get('orders-geography', [AnalyticsController::class, 'ordersGeography']);
        Route::get('cart-abandonment', [AnalyticsController::class, 'cartAbandonment']);
        Route::get('device-breakdown', [AnalyticsController::class, 'deviceBreakdown']);
        Route::get('visitor-types', [AnalyticsController::class, 'visitorTypes']);
        Route::get('landing-pages', [AnalyticsController::class, 'landingPages']);
        Route::get('bounce-rate', [AnalyticsController::class, 'bounceRate']);
        Route::get('session-duration', [AnalyticsController::class, 'sessionDuration']);
        Route::get('aov', [AnalyticsController::class, 'aov']);
        Route::get('customer-insights', [AnalyticsController::class, 'customerInsights']);
        Route::get('delivery-performance', [AnalyticsController::class, 'deliveryPerformance']);
        Route::get('revenue-breakdown', [AnalyticsController::class, 'revenueBreakdown']);
        Route::get('export', [AnalyticsController::class, 'export']);

        Route::prefix('profitability')->group(function () {
            Route::get('/', [AnalyticsController::class, 'profitability']);
            Route::get('products', [AnalyticsController::class, 'profitabilityProducts']);
            Route::get('products/{product}', [AnalyticsController::class, 'profitabilityProduct']);
            Route::get('campaigns', [AnalyticsController::class, 'profitabilityCampaigns']);
            Route::get('channels', [AnalyticsController::class, 'profitabilityChannels']);
            Route::get('channels/{channel}', [AnalyticsController::class, 'profitabilityChannel']);
        });
    });

    // Conversion tracking - read
    Route::get('conversion-tracking', [ConversionTrackingController::class, 'show']);

    // Shipping - read
    Route::prefix('shipping')->group(function () {
        Route::get('providers', [ShippingProviderController::class, 'providers']);
        Route::get('connections', [ShippingProviderController::class, 'index']);
        Route::get('connections/{connection}', [ShippingProviderController::class, 'show']);
        Route::get('orders/{order}/rates', [ShippingRateController::class, 'index']);
        Route::get('orders/{order}/rates/cheapest', [ShippingRateController::class, 'cheapest']);
        Route::get('orders/{order}/rates/fastest', [ShippingRateController::class, 'fastest']);
        Route::get('orders/{order}/rates/by-provider', [ShippingRateController::class, 'byProvider']);
        Route::get('shipments', [ShipmentController::class, 'index']);
        Route::get('shipments/{shipment}', [ShipmentController::class, 'show']);
        Route::get('shipments/{shipment}/tracking', [ShipmentController::class, 'tracking']);
        Route::get('shipments/{shipment}/label', [ShipmentController::class, 'label']);
    });

    // Notification preferences - read
    Route::get('notifications/preferences', [NotificationPreferenceController::class, 'index']);

});

// =========================================================================
// Tier 3b: auth:api + phone-verified + store-setup (write operations)
// Phone verification required for all mutations
// =========================================================================
Route::middleware(['auth:api', 'phone-verified', 'store-setup'])->group(function () {

    // Order management - write
    Route::patch('orders/{order}', [OrderController::class, 'update']);

    // Subscription management - write
    Route::prefix('subscriptions')->group(function () {
        Route::post('subscribe-free', [SubscriptionController::class, 'subscribeFree']);
        Route::post('checkout', [SubscriptionController::class, 'checkout']);
    });

    // Wallet - write
    Route::post('wallet/topup', [WalletController::class, 'topup']);

    // Add-ons - write
    Route::prefix('add-ons')->group(function () {
        Route::post('checkout', [AddOnController::class, 'checkout']);
        Route::post('{clientAddOn}/cancel', [AddOnController::class, 'cancel']);
    });

    // Store management - write
    Route::prefix('store')->group(function () {
        Route::post('/', [StoreController::class, 'update']);
        Route::post('reset', [StoreController::class, 'reset']);
    });

    // Category management - write
    Route::prefix('categories')->group(function () {
        Route::post('/', [CategoryController::class, 'store']);
        Route::put('/{category}', [CategoryController::class, 'update']);
        Route::delete('/{category}', [CategoryController::class, 'destroy']);
        Route::post('/{category}/select', [CategoryController::class, 'select']);
        Route::post('/{category}/deselect', [CategoryController::class, 'deselect']);
    });

    // Media management - write
    Route::prefix('media')->group(function () {
        Route::post('/', [MediaController::class, 'store']);
        Route::put('{media}', [MediaController::class, 'update']);
        Route::delete('{media}', [MediaController::class, 'destroy']);
    });

    // Product management - write
    Route::prefix('products')->group(function () {
        Route::post('/', [ProductController::class, 'store'])
            ->middleware('subscription:'.FeatureKey::Products->value.',track')
            ->name('products.store');
        Route::post('{product}/update', [ProductController::class, 'update']);
        Route::delete('{product}', [ProductController::class, 'destroy']);
        Route::post('{product}/restore', [ProductController::class, 'restore']);
        Route::put('{product}/variants/{variant}', [ProductController::class, 'updateVariant']);
        Route::post('{product}/variants/add-option-value', [ProductController::class, 'addOptionValue']);
        Route::post('{product}/deploy', [ProductController::class, 'deploy'])
            ->middleware('subscription:'.FeatureKey::Deployments->value);
        Route::post('{product}/assets', [ProductController::class, 'uploadAssets']);

        Route::prefix('{product}/costs')->group(function () {
            Route::post('/', [ProductCostController::class, 'store']);
            Route::post('bulk', [ProductCostController::class, 'bulkStore']);
            Route::put('{cost}', [ProductCostController::class, 'update']);
            Route::delete('{cost}', [ProductCostController::class, 'destroy']);
        });
    });

    // Inventory management - write
    Route::post('inventory/{id}/adjust', [InventoryController::class, 'adjust']);

    // Conversion tracking - write
    Route::prefix('conversion-tracking')->group(function () {
        Route::put('/', [ConversionTrackingController::class, 'update']);
        Route::post('test-meta', [ConversionTrackingController::class, 'testMeta'])->middleware('throttle:5,1');
        Route::post('test-tiktok', [ConversionTrackingController::class, 'testTikTok'])->middleware('throttle:5,1');
    });

    // Shipping - write
    Route::prefix('shipping')->group(function () {
        Route::post('connections', [ShippingProviderController::class, 'store']);
        Route::put('connections/{connection}', [ShippingProviderController::class, 'update']);
        Route::delete('connections/{connection}', [ShippingProviderController::class, 'destroy']);
        Route::post('connections/{connection}/validate', [ShippingProviderController::class, 'validate']);
        Route::post('connections/{connection}/set-default', [ShippingProviderController::class, 'setDefault']);
        Route::post('orders/{order}/rates/refresh', [ShippingRateController::class, 'refresh']);
        Route::post('orders/{order}/ship', [ShipmentController::class, 'store']);
        Route::post('shipments/{shipment}/cancel', [ShipmentController::class, 'cancel']);
    });

    // Notifications - write
    Route::prefix('notifications')->group(function () {
        Route::post('subscriptions', [NotificationSubscriptionController::class, 'store']);
        Route::delete('subscriptions/{token}', [NotificationSubscriptionController::class, 'destroy']);
        Route::put('preferences', [NotificationPreferenceController::class, 'update']);
    });

});
```

- [ ] **Step 5: Run both new tests to verify they pass**

Run: `cd /Users/cinex/repo/markium/markium-be && php artisan test --filter="unverified_user_with_store_can_read|unverified_user_with_store_blocked_from_write"`

Expected: Both PASS

- [ ] **Step 6: Run full middleware test suite**

Run: `cd /Users/cinex/repo/markium/markium-be && php artisan test --filter=MiddlewareTest`

Expected: All tests pass. The existing `fully_setup_user_can_access_protected_routes` test should still pass since verified users still have full access.

- [ ] **Step 7: Commit**

```bash
cd /Users/cinex/repo/markium/markium-be
git add routes/api.php tests/Feature/Api/MiddlewareTest.php
git commit -m "feat: split Tier 3 routes into read/write groups

Unverified users with completed store setup can now read all
dashboard data. Write operations still require phone verification.
This enables the deferred phone verification flow."
```

---

## Task 3: Frontend — Remove OTP Blocking from Guards

**Files:**
- Modify: `markium-client/src/auth/guard/auth-guard.jsx`
- Modify: `markium-client/src/auth/guard/guest-guard.jsx`
- Delete: `markium-client/src/auth/guard/phone-verified-guard.jsx`
- Modify: `markium-client/src/auth/guard/index.js`
- Modify: `markium-client/src/routes/sections/onboarding.jsx`

- [ ] **Step 1: Update `auth-guard.jsx` — remove OTP modal logic**

Replace the entire file content with:

```jsx
import PropTypes from 'prop-types';
import { useState, useEffect, useCallback } from 'react';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { SplashScreen } from 'src/components/loading-screen';

import { useAuthContext } from '../hooks';

// ----------------------------------------------------------------------

const loginPaths = {
  jwt: paths.auth.jwt.login,
  auth0: paths.auth.auth0.login,
  amplify: paths.auth.amplify.login,
  firebase: paths.auth.firebase.login,
  supabase: paths.auth.supabase.login,
};

// ----------------------------------------------------------------------

export default function AuthGuard({ children }) {
  const { loading } = useAuthContext();

  return <>{loading ? <SplashScreen /> : <Container> {children}</Container>}</>;
}

AuthGuard.propTypes = {
  children: PropTypes.node,
};

// ----------------------------------------------------------------------

function Container({ children }) {
  const router = useRouter();

  const { authenticated, method, user } = useAuthContext();

  const [checked, setChecked] = useState(false);

  const check = useCallback(() => {
    if (!authenticated) {
      const returnTo = window.location.pathname + window.location.search;
      const searchParams = new URLSearchParams({ returnTo }).toString();
      const loginPath = loginPaths[method];
      const href = `${loginPath}?${searchParams}`;
      router.replace(href);
      return;
    }

    // Store not set up -> onboarding wizard (works for both verified and unverified users)
    if (!user?.has_store || !user?.store_setup_complete) {
      router.replace(paths.onboarding.storeSetup);
      return;
    }

    setChecked(true);
  }, [authenticated, method, user, router]);

  useEffect(() => {
    check();
  }, [check]);

  if (!checked) {
    return null;
  }

  return <>{children}</>;
}

Container.propTypes = {
  children: PropTypes.node,
};
```

Key changes:
- Removed `OtpVerifyModal` import
- Removed `logout` from destructured auth context
- Removed `is_phone_verified` check (lines 54-57 old)
- Removed `handleOtpClose` callback
- Removed OTP modal render block (lines 82-84 old)
- Unverified users now fall through to the store setup check

- [ ] **Step 2: Update `guest-guard.jsx` — remove OTP modal logic**

Replace the entire file content with:

```jsx
import PropTypes from 'prop-types';
import { useEffect, useCallback } from 'react';

import { paths } from 'src/routes/paths';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { PATH_AFTER_LOGIN } from 'src/config-global';

import { SplashScreen } from 'src/components/loading-screen';

import { useAuthContext } from '../hooks';

// ----------------------------------------------------------------------

export default function GuestGuard({ children }) {
  const { loading } = useAuthContext();

  return <>{loading ? <SplashScreen /> : <Container> {children}</Container>}</>;
}

GuestGuard.propTypes = {
  children: PropTypes.node,
};

// ----------------------------------------------------------------------

function Container({ children }) {
  const router = useRouter();

  const searchParams = useSearchParams();

  const returnTo = searchParams.get('returnTo');

  const { authenticated, user } = useAuthContext();

  const check = useCallback(() => {
    if (authenticated) {
      // No store -> onboarding wizard (works for both verified and unverified users)
      if (!user?.has_store || !user?.store_setup_complete) {
        router.replace(paths.onboarding.storeSetup);
        return;
      }

      router.replace(returnTo || PATH_AFTER_LOGIN);
    }
  }, [authenticated, user, returnTo, router]);

  useEffect(() => {
    check();
  }, [check]);

  return <>{children}</>;
}

Container.propTypes = {
  children: PropTypes.node,
};
```

Key changes:
- Removed `OtpVerifyModal` import
- Removed `logout` from destructured auth context
- Removed `is_phone_verified` early return (lines 40-42 old)
- Removed `handleOtpClose` callback
- Removed OTP modal render block (lines 64-71 old)
- Unverified authenticated users now redirect to store setup or dashboard

- [ ] **Step 3: Delete `phone-verified-guard.jsx`**

```bash
cd /Users/cinex/repo/markium/markium-client
rm src/auth/guard/phone-verified-guard.jsx
```

- [ ] **Step 4: Update `src/auth/guard/index.js` — remove PhoneVerifiedGuard export**

Replace with:

```js
export { default as AuthGuard } from './auth-guard';
export { default as GuestGuard } from './guest-guard';
export { default as RoleBasedGuard } from './role-based-guard';
```

- [ ] **Step 5: Update `src/routes/sections/onboarding.jsx` — remove PhoneVerifiedGuard**

Replace with:

```jsx
import { lazy, Suspense } from 'react';

import { AuthGuard } from 'src/auth/guard';
import AuthMinimalLayout from 'src/layouts/auth/minimal';

import { SplashScreen } from 'src/components/loading-screen';

// ----------------------------------------------------------------------

const StoreSetupPage = lazy(() => import('src/pages/onboarding/store-setup'));

// ----------------------------------------------------------------------

export const onboardingRoutes = [
  {
    path: 'onboarding',
    children: [
      {
        path: 'store-setup',
        element: (
          <Suspense fallback={<SplashScreen />}>
            <AuthGuard>
              <AuthMinimalLayout maxWidth={960}>
                <StoreSetupPage />
              </AuthMinimalLayout>
            </AuthGuard>
          </Suspense>
        ),
      },
    ],
  },
];
```

Key changes:
- Import `AuthGuard` instead of `PhoneVerifiedGuard`
- Wrap with `AuthGuard` (ensures authenticated) instead of `PhoneVerifiedGuard`

- [ ] **Step 6: Verify the app builds**

Run: `cd /Users/cinex/repo/markium/markium-client && npm run build`

Expected: Build succeeds with no errors. No references to `PhoneVerifiedGuard` remain.

- [ ] **Step 7: Commit**

```bash
cd /Users/cinex/repo/markium/markium-client
git add src/auth/guard/auth-guard.jsx src/auth/guard/guest-guard.jsx src/auth/guard/index.js src/routes/sections/onboarding.jsx
git rm src/auth/guard/phone-verified-guard.jsx
git commit -m "feat: remove OTP blocking from auth guards

Unverified users now pass through to store setup and dashboard
without being blocked by OTP modal. PhoneVerifiedGuard deleted."
```

---

## Task 4: Frontend — Update OtpVerifyModal (Add "Later" Button)

**Files:**
- Modify: `markium-client/src/sections/auth/jwt/jwt-verify-view.jsx`

- [ ] **Step 1: Update `OtpVerifyModal` to support non-blocking usage**

The modal currently forces logout on close. Update it to support both blocking (legacy, if ever needed) and non-blocking usage. The key changes:

1. The close button now just calls `onClose` directly (no logout)
2. Add a "Later" button at the bottom
3. Add optional `showValueProp` prop for value proposition text

In `jwt-verify-view.jsx`, make these edits:

Add the `showValueProp` prop to the component signature:

```jsx
export default function OtpVerifyModal({ open, onClose, showValueProp = false }) {
```

Remove the `confirmingClose` state and its related `useEffect` (lines 38, 81-85). Remove the `handleClose` callback (lines 137-151).

Replace the close button section (lines 169-205) with a simpler version:

```jsx
        {/* Close button — hidden during loading to prevent interrupting verification */}
        {onClose && !loading && (
          <Box sx={{ position: 'absolute', top: 10, left: 10, zIndex: 1 }}>
            <IconButton
              onClick={() => onClose()}
              aria-label={t('go_back')}
              size="small"
              sx={{
                color: 'text.disabled',
                '&:hover': {
                  color: 'text.secondary',
                  bgcolor: 'action.hover',
                },
              }}
            >
              <Iconify icon="eva:arrow-back-fill" width={20} />
            </IconButton>
          </Box>
        )}
```

After the phone number display (line 236), add the value proposition block:

```jsx
            {showValueProp && (
              <Stack spacing={0.5} sx={{ px: 1 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {t('verification_gate_description')}
                </Typography>
              </Stack>
            )}
```

After the resend section (after line 300), add the "Later" button:

```jsx
          {onClose && (
            <Link
              component="button"
              type="button"
              variant="body2"
              onClick={() => onClose()}
              sx={{ color: 'text.secondary', cursor: 'pointer' }}
            >
              {t('verify_later')}
            </Link>
          )}
```

Update PropTypes:

```jsx
OtpVerifyModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func,
  showValueProp: PropTypes.bool,
};
```

- [ ] **Step 2: Verify the app builds**

Run: `cd /Users/cinex/repo/markium/markium-client && npm run build`

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
cd /Users/cinex/repo/markium/markium-client
git add src/sections/auth/jwt/jwt-verify-view.jsx
git commit -m "feat: add Later button and value prop to OtpVerifyModal

Modal can now be dismissed without logging out. Added showValueProp
prop for use with VerificationGate context."
```

---

## Task 5: Frontend — Create VerificationGate Component

**Files:**
- Create: `markium-client/src/components/verification-gate/verification-gate.jsx`

- [ ] **Step 1: Create the VerificationGate component**

```jsx
import PropTypes from 'prop-types';
import { cloneElement, useState, useCallback } from 'react';

import { useAuthContext } from 'src/auth/hooks';
import { OtpVerifyModal } from 'src/sections/auth/jwt';

// ----------------------------------------------------------------------

export default function VerificationGate({ children }) {
  const { user, refreshUser } = useAuthContext();

  const [otpOpen, setOtpOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const handleClick = useCallback(
    (originalOnClick) => (event) => {
      if (user?.is_phone_verified) {
        originalOnClick?.(event);
        return;
      }

      // Store the original action to execute after verification
      setPendingAction(() => () => originalOnClick?.(event));
      setOtpOpen(true);
    },
    [user?.is_phone_verified]
  );

  const handleOtpClose = useCallback(() => {
    setOtpOpen(false);
    setPendingAction(null);
  }, []);

  const handleVerificationSuccess = useCallback(async () => {
    await refreshUser();
    setOtpOpen(false);

    // Execute the pending action after successful verification
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  }, [refreshUser, pendingAction]);

  // If user is verified, render children as-is
  if (user?.is_phone_verified) {
    return children;
  }

  // Clone child and intercept its onClick
  const child = cloneElement(children, {
    onClick: handleClick(children.props.onClick),
  });

  return (
    <>
      {child}

      <OtpVerifyModal
        open={otpOpen}
        onClose={handleOtpClose}
        showValueProp
      />
    </>
  );
}

VerificationGate.propTypes = {
  children: PropTypes.element.isRequired,
};
```

Note: The `handleVerificationSuccess` callback is not currently wired as a prop to `OtpVerifyModal` because the modal already calls `refreshUser()` internally on successful verification. When `refreshUser()` updates the context, `user.is_phone_verified` becomes `true`, and on the next render `VerificationGate` will render children as-is (the early return on line 50). The `pendingAction` won't execute automatically in this case — the user will simply click the button again (now ungated). This is acceptable UX since the gate disappears and the button works normally.

If you want auto-execution after verification, you'd need to add an `onSuccess` prop to `OtpVerifyModal` — but that's optional complexity.

- [ ] **Step 2: Verify the app builds**

Run: `cd /Users/cinex/repo/markium/markium-client && npm run build`

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
cd /Users/cinex/repo/markium/markium-client
git add src/components/verification-gate/verification-gate.jsx
git commit -m "feat: create VerificationGate component

Wraps write-action entry points and intercepts clicks for
unverified users, showing OTP verification modal."
```

---

## Task 6: Frontend — Create VerificationBanner Component

**Files:**
- Create: `markium-client/src/components/verification-banner/verification-banner.jsx`
- Modify: `markium-client/src/layouts/dashboard/index.jsx`

- [ ] **Step 1: Create the VerificationBanner component**

```jsx
import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';

import { useAuthContext } from 'src/auth/hooks';
import { OtpVerifyModal } from 'src/sections/auth/jwt';
import { useTranslation } from 'react-i18next';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

const DISMISSED_KEY = 'markium-verification-banner-dismissed';

// ----------------------------------------------------------------------

export default function VerificationBanner() {
  const { user } = useAuthContext();
  const { t } = useTranslation();

  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem(DISMISSED_KEY) === 'true'
  );
  const [otpOpen, setOtpOpen] = useState(false);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    sessionStorage.setItem(DISMISSED_KEY, 'true');
  }, []);

  const handleVerifyClick = useCallback(() => {
    setOtpOpen(true);
  }, []);

  const handleOtpClose = useCallback(() => {
    setOtpOpen(false);
  }, []);

  // Don't render if user is verified or banner was dismissed this session
  if (user?.is_phone_verified || dismissed) {
    return null;
  }

  const isFirstSession = !localStorage.getItem('markium-has-visited-dashboard');

  // Mark that user has visited dashboard (for progressive messaging)
  if (!localStorage.getItem('markium-has-visited-dashboard')) {
    localStorage.setItem('markium-has-visited-dashboard', 'true');
  }

  const message = isFirstSession
    ? t('verification_banner_full')
    : t('verification_banner_short');

  return (
    <>
      <Box sx={{ px: { xs: 2, lg: 0 }, pt: { xs: 1, lg: 0 }, pb: 1 }}>
        <Alert
          severity="info"
          action={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                color="info"
                size="small"
                variant="contained"
                onClick={handleVerifyClick}
              >
                {t('verify_now')}
              </Button>
              <IconButton
                size="small"
                color="inherit"
                onClick={handleDismiss}
              >
                <Iconify icon="mingcute:close-line" width={18} />
              </IconButton>
            </Box>
          }
          sx={{ alignItems: 'center' }}
        >
          {message}
        </Alert>
      </Box>

      <OtpVerifyModal open={otpOpen} onClose={handleOtpClose} />
    </>
  );
}
```

Uses `sessionStorage` for dismiss (cleared when browser closes) and `localStorage` for progressive messaging (persists across sessions).

- [ ] **Step 2: Add VerificationBanner to DashboardLayout**

In `src/layouts/dashboard/index.jsx`, add the import at the top (after existing imports):

```jsx
import VerificationBanner from 'src/components/verification-banner/verification-banner';
```

Then add `<VerificationBanner />` before `<Main>` in all three layout variants.

In the horizontal layout (around line 48), change:

```jsx
        <Main>{children}</Main>
```

to:

```jsx
        <VerificationBanner />
        <Main>{children}</Main>
```

In the mini layout (around line 71), change:

```jsx
          <Main>{children}</Main>
```

to:

```jsx
          <Main>
            <VerificationBanner />
            {children}
          </Main>
```

In the default/vertical layout (around line 94), change:

```jsx
          <Main>{children}</Main>
```

to:

```jsx
          <Main>
            <VerificationBanner />
            {children}
          </Main>
```

Note: For horizontal layout, the banner goes outside `<Main>` since it's a full-width element. For mini and vertical layouts, it goes inside `<Main>` so it respects the sidebar width.

- [ ] **Step 3: Verify the app builds**

Run: `cd /Users/cinex/repo/markium/markium-client && npm run build`

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
cd /Users/cinex/repo/markium/markium-client
git add src/components/verification-banner/verification-banner.jsx src/layouts/dashboard/index.jsx
git commit -m "feat: add VerificationBanner to dashboard layout

Shows dismissible banner prompting unverified users to verify
their phone number. Progressive messaging across sessions."
```

---

## Task 7: Frontend — Add Axios Interceptor for 403 PHONE_NOT_VERIFIED

**Files:**
- Modify: `markium-client/src/utils/axios.js`

- [ ] **Step 1: Add 403 PHONE_NOT_VERIFIED handler to response interceptor**

In `src/utils/axios.js`, add a new block after the 401 handler (after line 31) and before the 422 handler:

```js
    // Handle 403 PHONE_NOT_VERIFIED — emit event for UI to show OTP modal
    if (error.response?.status === 403 && error.response?.data?.error?.code === 'PHONE_NOT_VERIFIED') {
      window.dispatchEvent(new CustomEvent('phone-not-verified'));
      return Promise.reject(error.response.data);
    }
```

This dispatches a custom DOM event that the `VerificationBanner` or a global listener can pick up to show the OTP modal. This is the defense-in-depth layer — catches cases where the frontend gate was bypassed.

- [ ] **Step 2: Verify the app builds**

Run: `cd /Users/cinex/repo/markium/markium-client && npm run build`

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
cd /Users/cinex/repo/markium/markium-client
git add src/utils/axios.js
git commit -m "feat: intercept 403 PHONE_NOT_VERIFIED in axios

Dispatches custom event for defense-in-depth when backend
rejects a request from an unverified user."
```

---

## Task 8: Frontend — Add Translation Keys

**Files:**
- Modify: `markium-client/src/locales/langs/en.json`
- Modify: `markium-client/src/locales/langs/ar.json`
- Modify: `markium-client/src/locales/langs/fr.json`

- [ ] **Step 1: Add keys to `en.json`**

Add the following keys (place near other verification-related keys like `verify_your_phone`):

```json
"verification_banner_full": "Verify your phone number to start selling — it takes 30 seconds",
"verification_banner_short": "Verify to unlock all features",
"verify_now": "Verify Now",
"verify_later": "Later",
"verification_gate_title": "Verify your phone to continue",
"verification_gate_description": "Verify your phone number to unlock creating products, processing orders, and deploying your store."
```

- [ ] **Step 2: Add keys to `ar.json`**

```json
"verification_banner_full": "قم بتأكيد رقم هاتفك لبدء البيع — يستغرق 30 ثانية فقط",
"verification_banner_short": "أكد رقم هاتفك لفتح جميع الميزات",
"verify_now": "تأكيد الآن",
"verify_later": "لاحقاً",
"verification_gate_title": "أكد رقم هاتفك للمتابعة",
"verification_gate_description": "قم بتأكيد رقم هاتفك لفتح إنشاء المنتجات ومعالجة الطلبات ونشر متجرك."
```

- [ ] **Step 3: Add keys to `fr.json`**

```json
"verification_banner_full": "Vérifiez votre numéro de téléphone pour commencer à vendre — ça prend 30 secondes",
"verification_banner_short": "Vérifiez pour débloquer toutes les fonctionnalités",
"verify_now": "Vérifier maintenant",
"verify_later": "Plus tard",
"verification_gate_title": "Vérifiez votre téléphone pour continuer",
"verification_gate_description": "Vérifiez votre numéro de téléphone pour débloquer la création de produits, le traitement des commandes et le déploiement de votre boutique."
```

- [ ] **Step 4: Commit**

```bash
cd /Users/cinex/repo/markium/markium-client
git add src/locales/langs/en.json src/locales/langs/ar.json src/locales/langs/fr.json
git commit -m "feat: add phone verification translation keys (en, ar, fr)

Banner, gate, and verification modal translations for the
deferred phone verification flow."
```

---

## Task 9: Frontend — Wrap Write-Action Entry Points with VerificationGate

**Files:**
- Modify: ~35-40 files across `src/sections/`

This is the largest task. It involves finding every write-action entry point button and wrapping it with `<VerificationGate>`.

- [ ] **Step 1: Find all write-action entry points**

Run a search to identify all "Add", "Create", navigation-to-new, deploy, delete, and save action buttons:

```bash
cd /Users/cinex/repo/markium/markium-client
grep -rn "onClick.*handleCreate\|onClick.*handleAdd\|onClick.*handleSave\|onClick.*handleDeploy\|onClick.*handleDelete\|onClick.*handlePublish\|onClick.*handleUpdate\|onClick.*handleSubmit\|RouterLink.*to.*new\|RouterLink.*to.*create" src/sections/ --include="*.jsx" | head -60
```

This gives you the full list of entry points. For each one:

- [ ] **Step 2: Wrap each entry point with VerificationGate**

The pattern for every file is the same. Add the import at the top:

```jsx
import VerificationGate from 'src/components/verification-gate/verification-gate';
```

Then wrap the button:

```jsx
// Before:
<Button onClick={handleCreate}>Create Product</Button>

// After:
<VerificationGate>
  <Button onClick={handleCreate}>Create Product</Button>
</VerificationGate>
```

For `RouterLink` buttons (navigation to create/new pages):

```jsx
// Before:
<Button component={RouterLink} href={paths.dashboard.product.new}>
  New Product
</Button>

// After:
<VerificationGate>
  <Button component={RouterLink} href={paths.dashboard.product.new}>
    New Product
  </Button>
</VerificationGate>
```

Work through each section systematically:
- **Products**: list view (create button), detail view (deploy, delete)
- **Orders**: list view (status update, delete)
- **Settings**: each settings form (save button)
- **Categories**: list view (create, edit, delete)
- **Media**: upload button
- **Inventory**: adjust button
- **Shipping**: connection create/edit/delete
- **Subscriptions**: checkout, subscribe-free
- **Wallet**: topup

- [ ] **Step 3: Verify the app builds after all wrapping**

Run: `cd /Users/cinex/repo/markium/markium-client && npm run build`

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
cd /Users/cinex/repo/markium/markium-client
git add src/sections/
git commit -m "feat: wrap write-action entry points with VerificationGate

All create, update, delete, deploy, and save actions across the
dashboard are now gated behind phone verification for unverified users."
```

---

## Task 10: End-to-End Smoke Test

No code changes. Manual verification of the complete flow.

- [ ] **Step 1: Test new user registration flow**

1. Register a new user
2. Verify you are NOT blocked by OTP modal
3. Verify you are redirected to store setup
4. Complete store setup (basics, branding, categories)
5. Verify you land on dashboard with VerificationBanner visible

- [ ] **Step 2: Test read-only access**

1. Browse products list, orders list, analytics pages
2. Verify data loads correctly (no 403 errors in console)

- [ ] **Step 3: Test write-action gating**

1. Click "Add Product" → verify OTP modal appears
2. Click "Later" → verify modal closes
3. Click deploy/save/delete buttons → verify OTP modal appears

- [ ] **Step 4: Test verification flow**

1. Click "Verify Now" on the banner
2. Complete OTP verification
3. Verify banner disappears
4. Verify write actions now work without gating

- [ ] **Step 5: Test banner dismiss**

1. Log in as unverified user
2. Dismiss the banner
3. Navigate between pages → verify banner stays dismissed
4. Close browser and reopen → verify banner reappears

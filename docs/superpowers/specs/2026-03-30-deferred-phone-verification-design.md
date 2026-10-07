# Deferred Phone Verification Design

## Problem

Phone OTP verification currently blocks registration. If the SMS provider fails, users cannot enter the app at all. This creates a single point of failure in the signup flow.

Additionally, phone verification serves as an anti-abuse measure to prevent users from creating multiple accounts to exploit free-tier features. The verification gate should protect write actions (features that cost money or provide free-tier value), not the ability to explore the product.

## Solution

Move phone verification from a registration blocker to a post-registration gate on write actions. Users register, enter the app, set up their store, and explore freely. Write actions (creating products, deploying storefront, processing orders, etc.) are gated behind phone verification.

## Design Decisions

- **Approach:** Guard-based (frontend + backend, leveraging existing `is_phone_verified` flag)
- **Access model:** Unverified = read-only + store setup; Verified = full free tier (read/write)
- **Onboarding:** Store setup is the only write action open to unverified users (intentional exception — users must not get stuck immediately after registration)
- **Interception point:** Entry-point level (before the user sees a form, not after they fill one out)
- **Phasing:** SMS only for now; WhatsApp/Telegram fallback channels deferred to Phase 2
- **Defense in depth:** Both frontend (VerificationGate) and backend (`phone-verified` middleware) enforce write restrictions

## Backend Changes (`markium-be/routes/api.php`)

The current backend has 3 tiers of middleware. All Tier 2 and Tier 3 routes require `phone-verified`, which blocks unverified users from even reading data. This must change.

### Current Structure

| Tier | Middleware | Routes |
|------|-----------|--------|
| 1 | `auth:api` | OTP, logout, `/auth/me` |
| 2 | `auth:api` + `phone-verified` | Store setup, categories |
| 3 | `auth:api` + `phone-verified` + `store-setup` | Everything else (products, orders, analytics, etc.) |

### New Structure

| Tier | Middleware | Routes |
|------|-----------|--------|
| 1 | `auth:api` | OTP, logout, `/auth/me` (unchanged) |
| 2 | `auth:api` | Store setup wizard + categories (remove `phone-verified`) |
| 3-read | `auth:api` + `store-setup` | All GET endpoints (remove `phone-verified`) |
| 3-write | `auth:api` + `phone-verified` + `store-setup` | All POST/PUT/PATCH/DELETE endpoints (unchanged) |

### Specific Route Changes

**Tier 2 — Remove `phone-verified`:**
- `POST /store/setup/basics` — intentional exception (onboarding)
- `PATCH /store/setup/branding` — intentional exception (onboarding)
- `PATCH /store/setup/categories` — intentional exception (onboarding)
- `GET /store/setup/status` — read, should be open
- `GET /categories` — read, needed for onboarding wizard

**Tier 3 — Split by HTTP method:**

Read routes (remove `phone-verified`, keep `store-setup`):
- `GET /orders`, `GET /orders/{order}`
- `GET /products`
- `GET /inventory`, `GET /inventory/low-stock`, `GET /inventory/{id}`, `GET /inventory/{id}/transactions`
- `GET /categories/list`, `GET /categories/{category}`
- `GET /media`, `GET /media/{media}`
- `GET /analytics/*` (all analytics GET routes)
- `GET /conversion-tracking`
- `GET /shipping/providers`, `GET /shipping/connections`, `GET /shipping/connections/{connection}`
- `GET /shipping/orders/{order}/rates/*`, `GET /shipments/*`
- `GET /subscriptions/*` (packages, current, usage, etc.)
- `GET /wallet/balance`, `GET /wallet/transactions`
- `GET /add-ons`, `GET /add-ons/active`
- `GET /notifications/preferences`
- `GET /products/{product}/costs`

Write routes (keep `phone-verified` + `store-setup`):
- All `POST`, `PUT`, `PATCH`, `DELETE` routes in Tier 3

### Implementation Approach

Rather than moving individual routes, restructure the Tier 3 group into two sub-groups:

```php
// Tier 3a: Read-only (no phone verification required)
Route::middleware(['auth:api', 'store-setup'])->group(function () {
    Route::get('orders', [OrderController::class, 'listAll']);
    Route::get('orders/{order}', [OrderController::class, 'show']);
    Route::get('products', [ProductController::class, 'index']);
    // ... all other GET routes
});

// Tier 3b: Write operations (phone verification required)
Route::middleware(['auth:api', 'phone-verified', 'store-setup'])->group(function () {
    Route::patch('orders/{order}', [OrderController::class, 'update']);
    Route::post('products', [ProductController::class, 'store']);
    // ... all other POST/PUT/PATCH/DELETE routes
});
```

### Frontend Axios Interceptor (`src/utils/axios.js`)

Add a response interceptor to handle `403 PHONE_NOT_VERIFIED` errors gracefully. If an unverified user somehow reaches a write endpoint (e.g., bypassing the frontend gate), the interceptor should catch the 403 and trigger the OTP modal rather than showing a generic error.

```js
// In response error interceptor, add:
if (error.response?.status === 403 && error.response?.data?.error?.code === 'PHONE_NOT_VERIFIED') {
  // Emit event or call callback to show OTP modal
}
```

This provides defense in depth — the frontend gate prevents most cases, the backend enforces as a safety net, and the interceptor handles edge cases gracefully.

## Frontend Components

### 1. Auth Guard Changes (`src/auth/guard/auth-guard.jsx`)

Remove the OTP modal blocking logic from `Container`:

- **Current:** If `is_phone_verified === false` → render `OtpVerifyModal` (blocks app entry)
- **New:** If `is_phone_verified === false` → let the user through to the normal flow

The existing checks remain:
- Not authenticated → redirect to login
- No store / store setup incomplete → redirect to `/onboarding/store-setup`
- Phone not verified → proceed to dashboard (NEW)

### 2. Guest Guard Changes (`src/auth/guard/guest-guard.jsx`)

The guest guard (used on login/register pages) also checks `is_phone_verified` and renders an `OtpVerifyModal` overlay for authenticated-but-unverified users.

**Current behavior (lines 38-71):**
- If authenticated and phone not verified → stays on login page, renders OTP modal overlay
- If authenticated and phone verified but no store → redirects to onboarding
- If authenticated and fully set up → redirects to dashboard

**New behavior:**
- If authenticated and phone not verified → redirect to onboarding (store setup) or dashboard, same as a verified user. No OTP modal.
- Remove the `OtpVerifyModal` import and rendering logic (lines 64-71)
- Remove the `handleOtpClose` callback (lines 58-61)
- In `check()`, remove the early return for unverified users (lines 40-42) — let them fall through to the store/dashboard redirect logic

### 3. Onboarding Route (`src/routes/sections/onboarding.jsx`)

Remove `PhoneVerifiedGuard` wrapper from the store setup route. Users can complete store setup without verifying their phone first.

### 4. PhoneVerifiedGuard Removal (`src/auth/guard/phone-verified-guard.jsx`)

Delete this guard. It is no longer used anywhere after the onboarding route change.

Remove its export from `src/auth/guard/index.js`.

### 5. VerificationBanner (New Component)

**Location:** `src/components/verification-banner/verification-banner.jsx`

**Rendered in:** `DashboardLayout` (`src/layouts/dashboard/index.jsx`), placed above the `<Main>` content area.

**Visibility:** Only when `user.is_phone_verified === false`.

**Behavior:**
- Displays a full-width banner with a value-oriented message and a "Verify Now" CTA button
- Progressive messaging:
  - First session: Full message — "Verify your phone number to start selling — it takes 30 seconds"
  - Returning sessions: Condensed — "Verify to unlock all features"
- Dismissible per session via localStorage flag (`markium-verification-banner-dismissed`)
  - Reappears on next session (new browser session / cleared storage)
- Clicking "Verify Now" opens the `OtpVerifyModal`
- After successful verification, banner disappears (auth context refresh triggers re-render)

**Styling:** MUI `Alert` component with `severity="info"` or a custom styled `Box` with the primary color palette. Includes a close (dismiss) icon button on the right.

### 6. VerificationGate (New Component)

**Location:** `src/components/verification-gate/verification-gate.jsx`

**Purpose:** Wraps write-action entry point buttons. Intercepts clicks for unverified users.

**API:**
```jsx
<VerificationGate>
  <Button onClick={handleAddProduct}>Add Product</Button>
</VerificationGate>
```

**Behavior:**
- If `is_phone_verified === true` → passes the click through to the child's `onClick` handler
- If `is_phone_verified === false` → prevents the click and opens a verification modal

**Verification modal content (when triggered from gate):**
- Value proposition: what the user is unlocking (create products, process orders, deploy store)
- Phone number display
- OTP input (reuses `OtpVerifyModal`)
- "Later" button to dismiss without verifying
- On successful verification: closes modal, then executes the original click action

### 7. OtpVerifyModal Updates (`src/sections/auth/jwt/jwt-verify-view.jsx`)

Minimal changes to the existing modal:

- Add a **"Later" button** — allows dismissing without logging out
- `onClose` prop behavior change:
  - When used from `VerificationBanner` or `VerificationGate`: close the modal (no logout)
  - The forced-logout-on-close behavior is removed entirely (no longer needed since verification doesn't block app entry)
- Add optional `showValueProp` prop — when true, displays the value proposition text above the OTP input (used by `VerificationGate`)

### 8. Write-Action Entry Points to Gate

All write-action entry point buttons must be wrapped with `VerificationGate`:

- **Products:** "Add Product" / "Create Product" button
- **Orders:** Order processing action buttons
- **Storefront:** "Deploy" / "Publish" buttons
- **Settings:** Save buttons in COD settings, shipping integrations, pixel configuration
- **Inventory:** Create/update inventory actions
- **Any other** create/update/delete entry point buttons

The gate wraps the button that **starts** the flow (e.g., "Add Product"), NOT the save button inside a form.

### 9. Translation Keys

New keys in `ar.json`, `en.json`, `fr.json`:

| Key | EN value |
|-----|----------|
| `verification_banner_full` | "Verify your phone number to start selling — it takes 30 seconds" |
| `verification_banner_short` | "Verify to unlock all features" |
| `verify_now` | "Verify Now" |
| `verify_later` | "Later" |
| `verification_gate_title` | "Verify your phone to continue" |
| `verification_gate_description` | "Verify your phone number to unlock creating products, processing orders, and deploying your store." |

## Flow Diagrams

### Registration Flow (New)

```
Register → JWT issued (is_phone_verified: false)
  → Store setup (open, no verification needed)
  → Dashboard (read-only, banner visible)
  → User clicks write action → VerificationGate intercepts
  → OTP modal → verify → refreshUser() → full access
```

### Returning Unverified User

```
Login → Dashboard (read-only, banner visible)
  → Browse freely, see all UI
  → Attempt write action → VerificationGate → OTP modal
  → Verify → full free tier unlocked
```

## Write-Action Entry Points (Enumerated)

All entry points that must be wrapped with `VerificationGate` on the frontend (backend also enforces via `phone-verified` middleware):

### Products (~8 actions)
- Create Product button (navigates to `/dashboard/product/new`)
- Edit Product button (navigates to `/dashboard/product/edit`)
- Deploy/Publish product action
- Delete product action
- Upload assets action
- Add/Update variant actions
- Add/Update product costs
- Restore deleted product

### Orders (~2 actions)
- Update order status
- Delete orders (batch)

### Settings (~14+ actions)
- Store update (name, logo, template, language, etc.)
- COD automation settings save
- Marketing pixels (CAPI) configuration save
- Conversion tracking update
- Shipping provider connections (create, update, delete, set-default)
- Notification preferences update

### Categories (~4 actions)
- Create, update, delete category
- Select/deselect category

### Media (~3 actions)
- Upload, update, delete media

### Inventory (~1 action)
- Adjust inventory

### Subscriptions & Wallet (~3 actions)
- Subscribe free, checkout, wallet topup

**Total: ~35-40 entry points across the dashboard.**

## Deployment Sequence

Backend and frontend changes have a strict ordering dependency. Deploying frontend changes before backend changes will break the registration flow — unverified users will be let through by the frontend but hit 403 errors from the backend on store setup and read endpoints.

### Order

1. **Backend: Remove `phone-verified` from Tier 2** (store setup + categories routes)
   - Deploy to staging, test that unverified users can complete store setup
2. **Backend: Split Tier 3 into read/write groups**
   - Move all GET routes to `auth:api` + `store-setup` (no `phone-verified`)
   - Keep all POST/PUT/PATCH/DELETE routes with `phone-verified`
   - Deploy to staging, test that unverified users can browse dashboard data
3. **Frontend: Deploy all changes together**
   - Auth guard, guest guard, PhoneVerifiedGuard removal
   - VerificationBanner, VerificationGate, OtpVerifyModal updates
   - Axios interceptor for 403 PHONE_NOT_VERIFIED fallback
4. **End-to-end test on staging**
   - Register new user → complete store setup → browse dashboard (read-only) → attempt write action → verify phone → full access

### Rollback

- Frontend rollback is safe — reverting to the old guards will re-enable OTP blocking, which works with both old and new backend
- Backend rollback (re-adding `phone-verified` to reads) is also safe if frontend is still on old version
- If only backend is rolled back while frontend is on new version: the axios interceptor catches 403 PHONE_NOT_VERIFIED and shows OTP modal, so users won't see raw errors

## Out of Scope (Phase 2)

- WhatsApp / Telegram as alternative OTP delivery channels
- Progressive banner that shrinks over multiple sessions (start with two-level: full/condensed)
- Disabled-with-tooltip styling on gated buttons (start with interception on click)

# Deferred Phone Verification Design

## Problem

Phone OTP verification currently blocks registration. If the SMS provider fails, users cannot enter the app at all. This creates a single point of failure in the signup flow.

Additionally, phone verification serves as an anti-abuse measure to prevent users from creating multiple accounts to exploit free-tier features. The verification gate should protect write actions (features that cost money or provide free-tier value), not the ability to explore the product.

## Solution

Move phone verification from a registration blocker to a post-registration gate on write actions. Users register, enter the app, set up their store, and explore freely. Write actions (creating products, deploying storefront, processing orders, etc.) are gated behind phone verification.

## Design Decisions

- **Approach:** Guard-based (frontend-driven, leveraging existing `is_phone_verified` flag)
- **Access model:** Unverified = read-only; Verified = full free tier (read/write)
- **Onboarding:** Store setup remains open to unverified users (part of exploration)
- **Interception point:** Entry-point level (before the user sees a form, not after they fill one out)
- **Phasing:** SMS only for now; WhatsApp/Telegram fallback channels deferred to Phase 2

## Components

### 1. Auth Guard Changes (`src/auth/guard/auth-guard.jsx`)

Remove the OTP modal blocking logic from `Container`:

- **Current:** If `is_phone_verified === false` → render `OtpVerifyModal` (blocks app entry)
- **New:** If `is_phone_verified === false` → let the user through to the normal flow

The existing checks remain:
- Not authenticated → redirect to login
- No store / store setup incomplete → redirect to `/onboarding/store-setup`
- Phone not verified → proceed to dashboard (NEW)

### 2. Onboarding Route (`src/routes/sections/onboarding.jsx`)

Remove `PhoneVerifiedGuard` wrapper from the store setup route. Users can complete store setup without verifying their phone first.

### 3. PhoneVerifiedGuard Removal (`src/auth/guard/phone-verified-guard.jsx`)

Delete this guard. It is no longer used anywhere after the onboarding route change.

Remove its export from `src/auth/guard/index.js`.

### 4. VerificationBanner (New Component)

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

### 5. VerificationGate (New Component)

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

### 6. OtpVerifyModal Updates (`src/sections/auth/jwt/jwt-verify-view.jsx`)

Minimal changes to the existing modal:

- Add a **"Later" button** — allows dismissing without logging out
- `onClose` prop behavior change:
  - When used from `VerificationBanner` or `VerificationGate`: close the modal (no logout)
  - The forced-logout-on-close behavior is removed entirely (no longer needed since verification doesn't block app entry)
- Add optional `showValueProp` prop — when true, displays the value proposition text above the OTP input (used by `VerificationGate`)

### 7. Write-Action Entry Points to Gate

All write-action entry point buttons must be wrapped with `VerificationGate`:

- **Products:** "Add Product" / "Create Product" button
- **Orders:** Order processing action buttons
- **Storefront:** "Deploy" / "Publish" buttons
- **Settings:** Save buttons in COD settings, shipping integrations, pixel configuration
- **Inventory:** Create/update inventory actions
- **Any other** create/update/delete entry point buttons

The gate wraps the button that **starts** the flow (e.g., "Add Product"), NOT the save button inside a form.

### 8. Translation Keys

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

## Out of Scope (Phase 2)

- WhatsApp / Telegram as alternative OTP delivery channels
- Progressive banner that shrinks over multiple sessions (start with two-level: full/condensed)
- Disabled-with-tooltip styling on gated buttons (start with interception on click)

# Sidebar Redesign

## Context

The dashboard sidebar needs restructuring to fix UX issues:
- User avatar duplicated between header AccountPopover and sidebar bottom
- No Markium branding in sidebar
- Welcome message adds clutter without value
- Sidebar bottom needs store info and subscription context

## Design

### Sidebar Top
- **Markium logo** (from `Logo` component) + "Markium" text
- Clicking navigates to `/dashboard`
- Replaces current store avatar + store name + welcome message

### Navigation
- Unchanged — nav items with existing dimming logic for new users

### Sidebar Bottom (stacked sections with dashed dividers)

**Section 1: Store Info**
- Store logo avatar + store name
- Separated by dashed divider above and below

**Section 2: Subscription**
- **Paid users**: Plan badge with crown icon (e.g. "Pro Monthly")
- **Free/PAYG users**: Plan badge + "Upgrade to Pro" CTA button linking to `/dashboard/subscription`

### Wallet
- Stays in header only (`SubscriptionWalletWidget`) — not duplicated in sidebar

```
+-------------------------+
| [Markium Logo] Markium  |  <- click -> /dashboard
|                         |
| - - - - - - - - - - -  |
|                         |
| [Nav items...]          |
|                         |
|       (spacer)          |
|                         |
| - - - - - - - - - - -  |
| [Store Logo] StoreName  |
| - - - - - - - - - - -  |
| Crown Pro Monthly       |  <- paid user
| - - - - - - - - - - -  |
| Crown Free Trial        |  <- free user
| [ Upgrade to Pro    ]   |
+-------------------------+
```

## Files Affected

| File | Change |
|------|--------|
| `src/layouts/dashboard/nav-vertical.jsx` | Replace top section (store avatar + welcome) with Markium Logo + text. Remove welcome block. Restructure bottom. |
| `src/layouts/common/nav-user-profile.jsx` | Rewrite: store info section + subscription section. Remove user avatar. |
| `src/components/logo/logo.jsx` | Possibly reuse as-is via import. |

## Components Reused
- `Logo` — existing Markium logo component (theme-color-aware `.webp` image)
- `Label` — existing MUI label for plan badge
- `Iconify` — crown icon for plan badge
- `useGetCurrentSubscription` — already used in `nav-user-profile.jsx`
- `useAuthContext` — for store info (logo, name)

# Markium Theme Engine — Flexibility Assessment (executed)

**Date:** 2026-07-04 · **Assessor:** engineering session audit against `shopify-theme-engine-assessment.md`
**Method:** every claim backed by a code pointer or a reproduction from this session — no "should work."

---

## Architectural framing (read this first)

Markium does **not** have a multi-theme engine in Shopify's marketplace sense. It has **one first-party parameterized theme** (the React storefront) whose look is driven entirely by data:

- **Layout JSON** per store (`store_layouts`: ordered sections + settings + version)
- **Curated palette** (`config.appearance.palette`, 12 ids)
- **Curated design style** (`config.appearance.style`: display font + radius tokens)

"Themes" in the gallery are **presets** of (palette, style, sections) — not separate codebases. This is closer to Shopify's *Dawn + settings* model than to its theme marketplace. That framing determines every score below: the data spine is genuinely Shopify-shaped; the ceiling is what the single codebase can structurally express.

**Empirical test already run (2026-07-04):** attempted to reproduce three real Algerian templates (lithium/example/duolingo @ feeef.store). Result: lithium+example = same template recolored → expressible with current tokens. **Duolingo = structurally inexpressible** (announcement-bar header, category chips, buy-button cards, wavy footer, gamified section). This is a completed Part-I Test-1 data point: **structural range fails**.

---

## Scoring worksheet (Part J rubric, 0–4)

| Dimension | Level | Key evidence | Worst gap | Action |
|-----------|-------|--------------|-----------|--------|
| A. Data/Presentation | **3** | Closed `SectionProps{settings, ctx, index}` contract (`sections/types.ts`); data only via public API; `publicConfig()` secret-stripping; origin middleware + storefront token | **No ErrorBoundary — a throwing section white-screens the store** (hit for real in Phase 1) | Per-section ErrorBoundary (1 day) |
| B. Composition | **2** | Layout-as-data w/ stable ids, versioning, 409 conflicts; MAX_SECTIONS=20, 64KB/section (`ReplaceLayoutRequest`); same type repeatable | **Only `home` is composable** — product/cart/contact hardcoded (the exact "pre-OS 2.0" red flag); **no blocks**; no alternate templates; no structural variants | Product page → layout page w/ static COD section; blocks system |
| C. Schema/Settings | **3** (narrow) | Catalog metadata → auto-generated editor UI (`SectionField`); defaults/hints/localized labels/max | Missing types: **resource picker (product!)**, number, checkbox, color, richtext, video; no presets; no escape-hatch policy; settings values not schema-validated server-side (tolerated by design) | Product picker next; document validation stance |
| D. Styling/Tokens | **2–3** | 12 curated palettes (HSL vars) + 4 styles (`--font-display`, `--radius`); server allow-lists block CSS injection; one-setting-recolors-everything verified | Dual color system (legacy `--color-*` hex + HSL) bridged not unified; no per-section color schemes | Unify color systems opportunistically |
| E. Behavior | **2** | Engine-owned cart/order/tracking shared by all sections; live preview re-renders in place (postMessage, verified E2E); `isPreview` flag exists | Preview sessions likely **fire real analytics** (sections don't check `isPreview`) | Suppress tracking in preview (hours) |
| F. Merchant UX | **3−** | Visual editor + live preview (desktop/mobile), add/reorder/enable/remove, ar/fr/en incl. RTL inputs, ≥1-section guardrail, non-destructive theme apply, real thumbnails | **No draft/publish (save = live)**; undo = discard-all; remove is instant (no confirm); mobile editor usability unmeasured; time-to-first-customization unmeasured (activation metric!) | Measure with a real merchant on a phone |
| G. Evolution | **1–2** | Schema-tolerant both ways: PageRenderer merges defaults + skips unknown types; editor round-trips unknown keys; migration precedent (hero reduction) | **No snapshot regression harness** (Test 5); no contract changelog | Build harness (an afternoon, pays forever) |
| H. MENA/COD | **2** | `document.dir` engine-switched (LanguageContext:88); `{ar,en,fr}` settings resolved per visitor; COD form engine-owned (name/phone/wilaya/commune + turnstile + anti-fake); ~5 physical-CSS props total in sections (small) | **(1) Zero Arabic-capable display fonts** — all 4 style fonts are Latin-only, so style differentiation collapses for Arabic stores (majority market). **(2) No per-wilaya shipping fee shown pre-submit** (`wilaya.json` is names only; total = price×qty) — the framework's "conversion variable". Landing archetype not composable; no trust blocks | Arabic font per style; wilaya fee data + display |

---

## Part I test status

| Test | Status | Result |
|------|--------|--------|
| 2. Swap | **Passes (degenerate)** | One theme renders every store daily with zero per-store code (41 prod stores, all test stores). The reverse direction is inapplicable — there is only one theme codebase. No data leaks found (no store ids/handles in section code). |
| 1. Three divergent themes | **Run informally — FAIL on structure** | feeef reproduction: 2/3 expressible (recolors), Duolingo inexpressible without engine changes (structural variants needed). Friction log = the gap list above. |
| 3. Merchant request audit | **FAIL: (a)=5, (c)=9** vs bar (a)≥8, (c)≤2 | (a): colors/fonts, reorder home, AR/RTL switch, 2nd announcement bar (marquee ×2 works), hide-prices≈. (c): WhatsApp float, product-card layout, countdown-on-product, one-product landing, wilaya fee display, testimonials, size-guide, form field control, TikTok embed, campaign homepage variant. **This is the single most honest flexibility number.** |
| 4. Stranger | Deferred (correctly — Level-4/ecosystem concern) | — |
| 5. Upgrade regression | **Not run — harness doesn't exist** | Highest-leverage cheap build. |

---

## What's genuinely strong (don't rebuild)

1. **The data spine is right.** Layout-as-JSON + stable ids + optimistic versioning + schema-driven editor + tolerant merges is exactly Shopify's OS-2.0 shape. Everything that failed above fails on *coverage*, not architecture.
2. **Security posture beats typical DIY engines:** curated-ids-only for anything reaching CSS; link-scheme sanitization write+read; secret-stripping in public config; origin + token + turnstile on writes.
3. **Live preview** (postMessage draft channel, trusted origins, unsaved-state preview) is real and verified E2E — many platforms fake this.
4. **Bounded flexibility** (20 sections, 64KB settings) — a deliberate design choice the framework explicitly rewards.

## The flexibility ceiling (ranked by market impact)

1. **Only `home` is composable.** The product page — where Algerian COD conversion actually happens — is hardcoded. This blocks: single-product landing archetype, countdowns, testimonials near the form, per-product templates. *The single biggest unlock.*
2. **Arabic display fonts absent** — undermines the differentiation we just shipped for the majority market.
3. **No wilaya shipping-fee display pre-submit** — the market's #1 conversion variable is invisible.
4. **No blocks (repeatable items)** — testimonials, FAQ, feature lists inexpressible.
5. **No resource pickers** — "feature this product" impossible.
6. **No structural variants** (header/footer/card/product-page) — Duolingo-class templates inexpressible.
7. **No ErrorBoundary** — one bad section = dead store.
8. **No regression harness** — every engine change is a blind ship.
9. **No draft/publish** — merchants experiment on the live store.

## Recommended order of operations

**Now (days, high certainty):**
1. Per-section ErrorBoundary (A2) — 1 day, removes the worst failure mode.
2. Arabic-capable display font per style (H1) — e.g. pair each Latin display font with an Arabic partner (Cairo/Tajawal/Changa/Baloo Bhaijaan 2) selected by `lang`; protects the style investment.
3. Suppress analytics in preview (E).
4. Snapshot regression harness (G/Test 5) — an afternoon; makes everything after safe.

**Next (the real flexibility work, in order):**
5. **Product page as a layout page** with the COD form as a *static* (non-deletable) engine-owned section — unlocks the COD-landing archetype, Test-3 items 5/7/9-adjacent, and is the precondition for per-product templates.
6. **Wilaya shipping-fee data + pre-submit display** (backend zones + injected object + form UI).
7. **Blocks (items[])** — one repeatable-items widget in the editor unlocks testimonials/FAQ/features/trust-badges as sections.
8. **Product resource picker** setting type → featured-product section.
9. **Structural variants** (`theme.layout` → Header/Footer/ProductCard/ProductDetail variant, allow-listed like palette/style) → Duolingo-class templates.

**Defer (agreed with framework Part K):** third-party sandboxing, Stranger Test, escape hatches, marketplace mechanics, multi-generation versioning.

**Bottom line:** the engine is a solid Level-3 *data* platform wearing a Level-1 *structural* wardrobe. Don't add more themes until items 5–9 exist — every new theme built before then inherits the same ceiling the merchant already noticed ("all themes look the same").

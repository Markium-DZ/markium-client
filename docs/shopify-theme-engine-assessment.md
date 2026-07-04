# Markium Theme Engine — Flexibility Assessment Framework

**Purpose:** A structured, evidence-based protocol to assess whether Markium's theme engine is flexible enough to support a wide variety of themes — benchmarked against Shopify's architecture (Liquid + sections/blocks + JSON templates + schema-driven settings), but scoped to what a COD-first MENA e-commerce SaaS actually needs.

**How to use this document:**
1. Run the audits in Part A–H against your actual engine. Answer every checklist item honestly with evidence (a code pointer, a screenshot, or a reproduction), not with "should work."
2. Execute the practical test protocols in Part I. These are the ground truth — checklists lie, builds don't.
3. Score each dimension on the maturity rubric in Part J.
4. Use Part K to decide what actually matters at Markium's current stage vs. what is deferred maturity work.

**Scoring convention used throughout:** Each checklist item is marked ✅ (verified true), ⚠️ (partially true / works with hacks), or ❌ (false). A dimension's health is the ratio and severity of ❌/⚠️ items, mapped to the rubric in Part J.

---

## The Assessment Model

Flexibility is not one property. This framework decomposes it into 8 dimensions, each independently assessable:

| # | Dimension | Core question |
|---|-----------|---------------|
| A | Data/Presentation Separation | Can any theme render any store's data without knowing anything about that specific store? |
| B | Composition & Layout | Can pages be assembled, reordered, and restructured as data rather than code? |
| C | Schema & Settings Expressiveness | Can theme developers declare configuration, and does the platform generate the merchant UI from it? |
| D | Styling & Design Tokens | Is visual identity centralized and swappable, or scattered and hardcoded? |
| E | Behavior & Interactivity | Can themes ship dynamic behavior without engine changes? |
| F | Merchant Editing Experience | Can a non-technical merchant exercise the flexibility that exists? |
| G | Evolution & Backward Compatibility | Does the engine change without breaking existing themes? |
| H | Market-Fit Flexibility (MENA/COD) | Does the flexibility cover the archetypes and constraints of your actual market? |

Shopify reference points are noted per dimension so you know what "proven at scale" looks like — including where Shopify deliberately **constrains** flexibility (e.g., max 25 sections per template, 50 blocks per section). Bounded flexibility is a design choice that protects performance and editor usability; unbounded flexibility is usually a symptom of no design.

---

# PART A — Data/Presentation Separation

**Why this is the foundation:** Every other dimension collapses if themes can reach into store-specific data structures or mutate state. Shopify enforces this with Liquid: themes receive read-only objects (product, collection, cart, customer) at render time and cannot query or write anything. A theme is portable *because* it is powerless.

## A1. Rendering contract audit

- [ ] There is a **documented, closed set of objects** the engine injects into a theme at render time (e.g., `store`, `product`, `collection`, `cart`, `order_form`, `page`, `settings`).
- [ ] Themes **cannot execute arbitrary queries** against the database or call internal APIs directly. All data access goes through the injected objects.
- [ ] Themes **cannot mutate** anything — no writes, no side effects during render. Actions (add to cart, submit COD order) go through defined engine endpoints/forms, not theme logic.
- [ ] The rendering contract is **versioned** (even informally — a changelog counts).
- [ ] Tenant isolation is enforced at the engine layer, not trusted to the theme. A malicious or buggy theme cannot read another tenant's data. (You already enforce tenant isolation at the Action/policy layer for MCP — the theme render path needs the same guarantee.)

## A2. Template language safety

- [ ] The templating layer is **sandboxed** — no arbitrary code execution (no raw PHP/Python/JS evaluation inside templates). Liquid's whole value is that it's a *restricted* language.
- [ ] Infinite loops / oversized renders are bounded (timeouts, iteration limits, output size caps).
- [ ] A theme error degrades gracefully (broken section renders an error placeholder) rather than white-screening the storefront.

## A3. The Swap Test (executable — see Part I, Test 2)

- [ ] One store's data renders correctly through 2+ different themes with **zero data changes**.
- [ ] One theme renders correctly on 2+ very different stores (different product counts, categories, languages) with **zero theme-code changes**.

**Red flags:** theme files containing store IDs, hardcoded product handles, direct DB/ORM calls, or conditional logic keyed on a specific merchant.

---

# PART B — Composition & Layout Flexibility

**Shopify reference:** Pages are JSON files listing sections + their settings + an order array. Sections contain blocks. Merchants add/remove/reorder both. Sections declare `presets` in their schema to become addable in the editor; sections without presets can only be placed manually in the template and can't be removed by merchants. Statically rendered sections exist for fixed content. Section groups handle shared regions (header/footer).

## B1. Page-as-data

- [ ] A page layout is stored as **data** (JSON or equivalent), not as code. Reordering the homepage is a data write, not a deploy.
- [ ] The layout data references sections by type + instance settings, and instances have stable IDs (so settings survive reorders).
- [ ] **Any section can appear on any page type** — or, if restricted, restrictions are declared per-section (Shopify's `enabled_on`/`disabled_on` pattern), not hardcoded in the engine.
- [ ] The same section type can appear **multiple times on one page** with independent settings.
- [ ] Alternate templates exist: a merchant can have `product.default` and `product.landing` and assign products to either.

## B2. Section/block hierarchy

- [ ] Two levels minimum: sections (layout units) and blocks (repeatable content units inside sections).
- [ ] Blocks are add/remove/reorderable by merchants within a section.
- [ ] Block types can be constrained per section ("this Slideshow section accepts only Slide blocks") or open ("any text/image/button block").
- [ ] There are sensible **limits** (Shopify: 25 sections/template, 50 blocks/section). If you have no limits, that's a ⚠️, not a ✅ — unbounded pages will destroy editor performance and page speed on the mid-range Android phones your Algerian buyers actually use.

## B3. Fixed vs. free composition

- [ ] The engine supports **statically placed sections** — content the merchant can configure but not delete or move. Critical for you: the **COD order form** should almost certainly be a static section on product/landing templates so a merchant can't accidentally delete their only revenue mechanism.
- [ ] Shared regions (header, footer, announcement bar) are composed once and applied across templates (section-group equivalent), not duplicated per page.

## B4. Structural range (verified by Part I, Test 1)

- [ ] The engine can express a **single-page COD landing** (one product, long-form sections, sticky order CTA) without hacks.
- [ ] The engine can express a **multi-page catalog store** (collections, filtering, search).
- [ ] The engine can express an **editorial/brand layout** (asymmetric sections, mixed media, unusual ordering).

**Red flags:** page structure defined in code per theme; "homepage sections" as a special case while other pages are fixed (that is exactly pre-OS 2.0 Shopify — the architecture they spent years escaping); section settings lost when reordering.

---

# PART C — Schema & Settings Expressiveness

**Shopify reference:** Every section/block embeds a JSON schema declaring its settings; the platform parses it at theme load and auto-generates the editor UI. Theme-level settings live in `settings_schema.json`. Developers never build settings panels.

## C1. Setting type coverage

Verify your schema system supports (or has a roadmap for) these primitive types — this list is roughly Shopify's core set:

- [ ] text / textarea / rich text
- [ ] number / range slider
- [ ] checkbox / toggle
- [ ] select / radio
- [ ] color picker (and ideally color *scheme* — named palettes, see Part D)
- [ ] image picker (from the merchant's media library)
- [ ] URL / link picker (internal pages, collections, external)
- [ ] **resource pickers**: product, collection, page — a section that says "feature this product" must let the merchant pick from *their* products
- [ ] font picker (or curated font list — with Arabic-capable fonts, see Part H)
- [ ] video / video URL

## C2. Schema mechanics

- [ ] Settings are **declared by the theme, rendered by the platform**. If theme developers write settings-panel UI code, this dimension fails.
- [ ] Settings have defaults, labels, help text, and (ideally) conditional visibility ("show this setting only if that toggle is on").
- [ ] Setting **values are validated** against the schema on save (type, range, required).
- [ ] Labels/help text are **localizable** — your merchants operate in Arabic and French; a settings panel that only speaks English is a real adoption barrier in your market.
- [ ] Sections declare **presets** (default configurations) that make them addable from the editor with sensible starting content.

## C3. Escape hatch policy

- [ ] There is a deliberate answer to "what happens when a merchant needs something the schema can't express?" Options, in order of increasing risk: custom CSS field (Shopify exposes this at theme and section level, stored per-instance), custom HTML/Liquid block, full code editing. Pick your line consciously — "no escape hatch" frustrates power users; "raw code for everyone" destroys upgradability and safety.

**Red flags:** settings hardcoded as engine-known keys (engine must be redeployed to add a setting to a theme); one global settings blob with no per-section instances; schema exists but the editor UI is hand-built per section anyway.

---

# PART D — Styling & Design Tokens

**Shopify reference:** Dawn (the reference theme) defines color schemes as named palettes on CSS custom properties in theme settings; sections reference schemes rather than raw colors. Typography, spacing, and corner radii are theme-level tokens.

- [ ] Themes define **design tokens** (colors, fonts, spacing scale, radii, shadows) in one place, exposed as theme-level settings.
- [ ] Sections consume tokens (CSS variables or equivalent) instead of hardcoding values. Test: change the primary color in one setting — does *everything* update?
- [ ] **Color schemes** (named palettes assignable per section) exist or are on the roadmap — this is what lets one theme ship light/dark/brand variants for free.
- [ ] Theme CSS/JS is asset-scoped per theme; two themes' styles cannot collide, and switching themes swaps assets atomically.
- [ ] Per-section styling loads efficiently (section CSS scoped/deferred; Shopify-world best practice is that a below-the-fold section's heavy assets must not block first render — decisive for 3G/mid-range-Android audiences).

**Red flags:** colors repeated as literals across sections; global stylesheet edited per merchant; theme switch leaves residual styles.

---

# PART E — Behavior & Interactivity

- [ ] Themes can ship their own JS (scoped, sandboxed to reasonable limits) for interactivity — carousels, sticky CTAs, quantity steppers — **without engine changes**.
- [ ] Engine-owned behaviors (cart ops, COD order submission, form validation, analytics events) are exposed as a **stable JS API / documented endpoints** that any theme can call, rather than each theme reimplementing them.
- [ ] Editor live-preview and theme JS coexist: when a merchant edits a section, the section re-renders in place without a full page reload, and theme JS re-initializes correctly (Shopify re-renders edited sections directly onto the DOM; themes must handle re-init — if your engine ignores this, every interactive section will silently break in the editor).
- [ ] A theme can detect "I'm rendering inside the editor" to suppress side effects (analytics, timers, popups).

**Red flags:** interactivity only possible by patching engine code; cart/order logic duplicated inside each theme; editor preview requires full reload for every change.

---

# PART F — Merchant Editing Experience

Flexibility that merchants can't operate doesn't exist commercially. Your buyer is an Algerian COD seller who likely runs their business from a phone and Instagram DMs — not a developer.

- [ ] Visual editor with **live preview**: add/remove/reorder sections and blocks by direct manipulation, see changes immediately.
- [ ] Editor works per-template (edit the product template, the homepage, a landing page) with a template switcher.
- [ ] **Draft vs. published** states: merchants can experiment without breaking the live store; changes are previewable before publish.
- [ ] Undo, or at minimum "discard changes."
- [ ] **Mobile-usable editor**, or at least mobile preview — given your market, assume the merchant is on a phone.
- [ ] Editor is fully functional in **Arabic (RTL) and French**.
- [ ] Guardrails: merchants cannot delete required sections (COD form), cannot produce an invalid layout, get warnings before destructive actions.
- [ ] Time-to-first-customization: a new merchant can change logo, colors, hero image, and reorder the homepage in **under 10 minutes without documentation**. Measure this with a real user — it's an activation metric, and activation is your current business bottleneck.

---

# PART G — Evolution & Backward Compatibility

**Shopify reference:** Shopify runs three theme architecture generations simultaneously ("vintage", OS 2.0, and theme-blocks/Horizon). Old themes keep rendering; features are gated by architecture version. That's what a real compatibility posture looks like.

- [ ] Theme data (layout JSON, settings values) is **versioned or schema-tolerant**: adding a new setting to a section doesn't invalidate stores using the old settings (missing keys fall back to defaults).
- [ ] Engine upgrades are tested against a **regression suite of existing themes** — render every template of every theme before/after, diff the output.
- [ ] Removing/renaming a setting or section type has a defined migration path (deprecation, aliasing, automatic migration) rather than silent breakage.
- [ ] New engine capabilities are **additive and opt-in** for themes (feature detection / capability flags), not forced rewrites.
- [ ] Theme updates vs. merchant customizations are reconcilable: when a theme author ships v2, merchant settings and layout survive the update (this is one of Shopify's historically weakest points — you can do better, but only if you separate theme *code* from merchant *data* cleanly, which is Part A+B done right).

**Red flags:** merchant settings stored inside theme files; engine releases that require "re-save all themes"; no way to know which themes use a feature you want to change.

---

# PART H — Market-Fit Flexibility (MENA / COD Specific)

This is the dimension Shopify's docs won't give you, and for Markium it outranks several of the generic ones.

## H1. RTL and localization as first-class

- [ ] Every layout primitive works in **RTL**: section alignment, block ordering, carousels, icons with directionality, spacing logic (use logical CSS properties — `margin-inline-start`, not `margin-left`).
- [ ] A theme can be **bidirectional**: same theme, store in Arabic (RTL) or French (LTR), switched by a setting — not two theme forks.
- [ ] Font stack includes quality **Arabic typefaces**, and the font picker doesn't offer Latin-only fonts for an Arabic store.
- [ ] All theme strings go through a **locale file system** (Shopify's `locales/` pattern): merchants can override any label ("Ajouter au panier" → "أضف إلى السلة" → or the Darija phrasing their customers actually use).
- [ ] Numbers, currency (DZD), and date formatting are locale-aware at the engine level.

**RTL is a launch gate, not a nice-to-have.** If your section primitives assume LTR today, every theme built on them inherits the bug, and retrofitting after you have a theme catalog is 10x the cost.

## H2. COD-native archetypes

- [ ] The **single-product landing page** is a first-class template archetype: hero → proof → offer → sticky COD form, buildable purely from sections.
- [ ] The **COD order form is an engine-owned section** (name, phone, wilaya/commune, address, quantity, shipping-fee display) that every theme styles but none reimplements — form logic, validation, and anti-fake-order measures belong in the engine.
- [ ] Wilaya/commune selection and per-zone **shipping fee display** are available to themes as data (injected objects), since delivery cost is *the* conversion variable in Algerian COD.
- [ ] Trust elements common to the market are available as blocks: WhatsApp contact button, delivery-company logos, countdown/urgency, review/testimonial blocks with photos.
- [ ] Themes render acceptably on **low-end Android + 3G/4G**: set a performance budget (e.g., LCP < 3s on a throttled mid-range device) and test there, not on your dev machine.

## H3. Instagram/DM-seller onboarding compatibility

- [ ] A theme can be **fully populated programmatically** — your automated onboarding flow (agent scrapes social page → configures store → imports products → publishes) must be able to write layout JSON and settings via the same contract the editor uses. If the editor and the API write different formats, you have two engines.
- [ ] Default theme presets look good with **sparse data** (few products, no logo, phone-photo images) — the state a scraped DM-seller store starts in.

---

# PART I — Practical Test Protocols

Checklists assess claims; these tests assess reality. Budget: roughly 1–2 weeks of focused effort for all five. If forced to pick two, run Tests 1 and 2.

## Test 1 — The Three Divergent Themes Test *(primary test)*

**Protocol:** Design three maximally different themes and build all three on the engine **without modifying the engine**.

1. **"Sahla"** — minimal single-product COD landing: hero, benefit sections, photo testimonials, sticky order form, WhatsApp button. Arabic, RTL.
2. **"Souk"** — dense catalog: collection grids, filters, search, promo banners, multi-level nav. Bilingual AR/FR.
3. **"Récit"** — editorial brand storytelling: full-bleed imagery, asymmetric layouts, long-form content mixed with shoppable sections. French, LTR.

**Logging:** every friction point goes into a table: *what I tried → what happened → workaround used → severity (blocker / hack / annoyance)*.

**Pass criteria:**
- ✅ **Pass:** all three built; zero engine changes; zero severity-blocker entries; hacks < 5 total.
- ⚠️ **Partial:** built with hacks that a third-party developer wouldn't discover on their own.
- ❌ **Fail:** any theme required engine modification or was inexpressible.

The friction log **is** your engine roadmap, pre-prioritized by severity × frequency.

## Test 2 — The Swap Test

**Protocol:** Take Store A's real data. Render through Theme 1 and Theme 2 (from Test 1). Then take Theme 1 and apply to Store A and Store B (different language, product count, categories).

**Pass criteria:** all four combinations render correctly with zero data changes and zero theme-code changes. Any leak = Part A failure, fix before anything else.

## Test 3 — The Merchant Request Audit

**Protocol:** Take these 15 realistic requests and classify each: **(a)** merchant does it in the editor, **(b)** theme developer does it in theme code, **(c)** requires engine changes.

1. Change brand colors and fonts
2. Reorder homepage sections
3. Add a WhatsApp floating button
4. Change product card layout (image ratio, info shown)
5. Add a countdown timer to a product page
6. Switch store language FR → AR (with RTL)
7. Create a dedicated landing page for one product
8. Show shipping fee by wilaya before order submission
9. Add photo testimonials
10. Hide prices, show "اطلب الآن" (order now) only
11. Add a size-guide popup
12. Change the order-form field order / make a field required
13. Add a second announcement bar
14. Embed a TikTok/Instagram video in a section
15. Duplicate the homepage as a Ramadan-campaign variant

**Pass criteria:** ≥ 8 in (a), ≤ 2 in (c). Every (c) item is a named backlog entry with a decision: fix, or consciously out-of-scope.

## Test 4 — The Stranger Test

**Protocol:** Give a developer who has never seen Markium your theme docs + engine, and the "Sahla" spec from Test 1. Measure time-to-working-theme; log every question they ask you.

**Pass criteria:** working theme in ≤ 3 days; questions are about *preferences*, not about undocumented engine behavior. Every question they had to ask you is a documentation or API-design defect. Even if third-party themes are a distant goal, this test exposes coupling you've gone blind to as the engine's author.

## Test 5 — The Upgrade Regression Test

**Protocol:** Snapshot rendered HTML of every template of the Test-1 themes. Ship one real engine change (add a setting type, change section rendering internals). Re-render, diff.

**Pass criteria:** zero unintended diffs; old themes unaware of the new feature behave identically. Then automate this — it becomes your permanent theme-regression CI (this is very much in your wheelhouse: a snapshot-diff harness is an afternoon of FastAPI/pytest work and pays forever).

---

# PART J — Scoring Rubric

Score each dimension A–H on this maturity scale, justified by checklist evidence + test results:

| Level | Name | Meaning |
|-------|------|---------|
| 0 | Hardcoded | Capability requires engine code changes per theme/merchant |
| 1 | Developer-flexible | Theme developers can achieve it in theme code; merchants cannot |
| 2 | Configurable | Merchants achieve it through settings, but structure is fixed |
| 3 | Composable | Merchants restructure via sections/blocks/data; developers extend via schema; engine untouched |
| 4 | Ecosystem-ready | Level 3 + versioned contracts, third-party developer viability (Stranger Test pass), regression-protected evolution |

**Interpretation:**
- **Shopify operates at Level 4** across A–G. That is a decade of work and not your target this year.
- **Markium's launch bar:** Level 3 on A, B, C, F, H · Level 2 acceptable on D, E · Level 1 acceptable on G *if* Test 5's regression harness exists (the harness is what makes later G-investment safe).
- Any dimension at Level 0 is a structural problem — fix before adding features on top.

### Scoring worksheet

| Dimension | Level (0–4) | Key evidence | Worst gap found | Action |
|-----------|------------|--------------|-----------------|--------|
| A. Data/Presentation |  |  |  |  |
| B. Composition |  |  |  |  |
| C. Schema/Settings |  |  |  |  |
| D. Styling/Tokens |  |  |  |  |
| E. Behavior |  |  |  |  |
| F. Merchant UX |  |  |  |  |
| G. Evolution |  |  |  |  |
| H. MENA/COD fit |  |  |  |  |

---

# PART K — Stage-Appropriate Prioritization

A caution baked into the framework: **Markium has registered users and zero paying customers. The theme engine is not your activation bottleneck unless Tests 1–3 fail.** Order of operations:

**Do now (this quarter):**
1. **Test 2 (Swap)** — one day; if it fails, everything else is built on sand.
2. **Test 1 (Three Themes)** — with "Sahla" (the COD landing page) first, because it's the archetype closest to what converts your actual market.
3. **Part H checklist in full** — RTL, COD form as engine-owned section, wilaya shipping data. These are launch gates, not maturity work.
4. **Test 3 (Merchant Audit)** — the (a)-column count is effectively an activation metric.

**Do soon (next quarter):**
5. Test 5's regression harness (cheap now, priceless later).
6. Part F merchant-UX items, measured with a real Algerian merchant, on a phone.

**Explicitly defer:**
7. Stranger Test / ecosystem readiness (Level 4 anything) — third-party theme developers are a scale problem; you have a zero-to-one problem.
8. Exotic setting types, theme marketplace mechanics, multi-generation architecture versioning.

**The one-sentence version:** Shopify's flexibility exists to serve millions of heterogeneous merchants; yours needs to serve the 5–10 storefront archetypes Algerian COD sellers actually buy — assessed by building them, not by matching Shopify feature-for-feature.

---

## Appendix — Shopify reference sources

Architectural claims in this framework are grounded in Shopify's official documentation: theme architecture overview, Sections, JSON templates, and Templates pages on shopify.dev, plus the Help Center pages on theme architecture versions and sections & blocks. Key verified facts used as benchmarks: JSON templates as merchant-reorderable section lists; 25-section/50-block limits; preset-gated editor availability; static vs. dynamic section rendering; schema-driven settings UI; section groups for shared regions; the vintage → OS 2.0 → theme-blocks generational model.
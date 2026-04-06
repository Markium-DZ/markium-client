# Unified "Appearance" Settings Page

## Goal

Replace the separate "Store Template" and "Color Palette" settings pages with a single "Appearance" page. The current color palette page is overly complex (650+ lines, 30+ editable fields). The new page keeps template selection as-is and reduces color customization to a single primary color picker with preset swatches.

## Architecture

The existing `store-template-form.jsx` becomes the foundation. A new primary color section is added below the template grid. The complex `color-palette-form.jsx` is deleted, but its color generation algorithms are extracted into a utility and reused to auto-generate the full palette from one primary color input.

Both template and color are saved in a single API call to `updateStoreConfig()`. The storefront is unaffected — it still reads `config.theme_name` and `config.colorPalette`.

## Scope

### Changes

1. **Sidebar**: Rename "Store Template" item to "Appearance" (`store_template` → `appearance`). Remove "Color Palette" item.
2. **Route**: Keep `/settings/store-template` (or rename to `/settings/appearance`). Remove `/settings/color-palette`.
3. **Form component**: Extend `store-template-form.jsx` to include a "Primary Color" section below the template grid.
4. **Color section UI**:
   - Section header with icon + title + "Reset to default" button (right-aligned, text button)
   - Row of 8-10 preset color swatches (circles, ~36px diameter, border highlight on active)
   - Presets: pink `#E91E63`, purple `#9C27B0`, blue `#2196F3`, cyan `#00BCD4`, green `#4CAF50`, orange `#FF9800`, red `#F44336`, slate `#607D8B`, black `#212121`, teal `#009688`
   - A "custom" swatch with `+` icon that opens a native `<input type="color">` picker
   - Selected swatch (preset or custom) determines the primary color
5. **Palette generation**: Extract the `generatePalette(primaryHex)` logic from `color-palette-form.jsx` into a utility function. Call it when the user picks a color.
6. **Save behavior**: Single sticky save button at top. On save, call `updateStoreConfig({ config: { theme_name, colorPalette } })`.
7. **Reset to default**: Clears the custom `colorPalette` from config (sets it to `null`), so the storefront falls back to the template's built-in palette.

### Deletions

- `src/sections/settings/color-palette-form.jsx` — replaced by simplified inline section
- `src/pages/dashboard/settings/color-palette-view.jsx` — no longer needed
- Route entry for `color-palette` in `dashboard.jsx`
- Path entry for `color_palette` in `paths.js`
- Sidebar item for "Color Palette" in `view.jsx` TABS

### No changes

- Storefront color consumption (`StoreContext.tsx`, `colorPalette.ts`) — unchanged
- Template preview images and data — unchanged
- Backend API — unchanged (same `config` object shape)

## i18n keys

New/changed keys (ar/fr/en):
- `appearance` — "المظهر" / "Apparence" / "Appearance"
- `appearance_description` — if needed for sidebar
- `primary_color` — "اللون الأساسي" / "Couleur principale" / "Primary Color"
- `preset_colors` — "ألوان مقترحة" / "Couleurs suggérées" / "Preset Colors"  
- `custom_color` — "لون مخصص" / "Couleur personnalisée" / "Custom Color"
- `reset_to_default` — "إعادة تعيين" / "Réinitialiser" / "Reset to Default"

Rename existing:
- `store_template` label key → `appearance`

## Data flow

```
User picks template → sets `theme_name` state
User picks color → generatePalette(hex) → sets `colorPalette` state  
User clicks "Reset to default" → sets `colorPalette` to null
User clicks "Save" → POST /store { config: { theme_name, colorPalette } }
```

Storefront resolution (unchanged):
```
getColorPalette(theme_name, colorPalette)
  → if colorPalette exists, merge with template defaults
  → if null, use template defaults only
```

## UI layout (top to bottom)

1. Sticky save button (right-aligned, disabled until dirty)
2. **Template section**: header ("Store Template" with icon) → grid of template cards with radio selection
3. **Color section**: header ("Primary Color" with icon + "Reset to default" button) → preset swatches row → custom color swatch

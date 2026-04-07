# Unified Appearance Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge "Store Template" and "Color Palette" settings into a single "Appearance" page with simplified color selection.

**Architecture:** Extend `store-template-form.jsx` into a new `appearance-form.jsx` that combines the template grid with a simple primary color picker (preset swatches + custom). Extract the `generatePalette()` function from `color-palette-form.jsx` into a utility. Remove the standalone color palette page and route.

**Tech Stack:** React, MUI, react-hook-form, existing store API

---

### Task 1: Extract palette generation utility

**Files:**
- Create: `src/utils/generate-palette.js`
- Reference: `src/sections/settings/color-palette-form.jsx:30-451`

- [ ] **Step 1: Create the utility file**

Extract all color manipulation functions and the `generatePalette` function from `color-palette-form.jsx` into a standalone utility:

```js
// src/utils/generate-palette.js

// --- Color Manipulation Utilities (HSL Color Space) ---

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    }
    : null;
};

const rgbToHex = (r, g, b) => {
  const toHex = (value) => {
    const hex = Math.round(Math.min(255, Math.max(0, value))).toString(16);
    return hex.length === 1 ? `0${hex}` : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const rgbToHsl = (r, g, b) => {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h;
  let s;
  const l = (max + min) / 2;

  if (max === min) {
    h = 0;
    s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
      default: h = 0;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
};

const hslToRgb = (h, s, l) => {
  h /= 360;
  s /= 100;
  l /= 100;
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return { r: r * 255, g: g * 255, b: b * 255 };
};

const hexToHsl = (hex) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return { h: 0, s: 0, l: 0 };
  return rgbToHsl(rgb.r, rgb.g, rgb.b);
};

const hslToHex = (h, s, l) => {
  const rgb = hslToRgb(h, s, l);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
};

const detectEmotionalTone = (hex) => {
  const hsl = hexToHsl(hex);
  if ((hsl.h >= 0 && hsl.h <= 60) || hsl.h >= 330) return hsl.s > 40 ? 'energetic' : 'warm';
  if (hsl.h >= 180 && hsl.h <= 270) return hsl.s > 40 ? 'calm' : 'cool';
  return 'balanced';
};

const adjustBrightness = (hex, percent, saturationAdjust = 0) => {
  const hsl = hexToHsl(hex);
  const newL = hsl.l + (100 - hsl.l) * (percent / 100);
  const newS = Math.min(100, Math.max(0, hsl.s + saturationAdjust));
  return hslToHex(hsl.h, newS, newL);
};

const adjustDarkness = (hex, percent, saturationAdjust = 0) => {
  const hsl = hexToHsl(hex);
  const newL = hsl.l * (1 - percent / 100);
  const newS = Math.min(100, Math.max(0, hsl.s + saturationAdjust));
  return hslToHex(hsl.h, newS, newL);
};

const getRelativeLuminance = (hex) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((val) => {
    val /= 255;
    return val <= 0.03928 ? val / 12.92 : ((val + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const getContrastRatio = (hex1, hex2) => {
  const lum1 = getRelativeLuminance(hex1);
  const lum2 = getRelativeLuminance(hex2);
  return (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);
};

const getContrastColor = (hex) => (getRelativeLuminance(hex) > 0.5 ? '#000000' : '#FFFFFF');

const rotateHue = (hex, degrees) => {
  const hsl = hexToHsl(hex);
  return hslToHex((hsl.h + degrees + 360) % 360, hsl.s, hsl.l);
};

const generateHoverState = (hex) => {
  const hsl = hexToHsl(hex);
  return hslToHex((hsl.h + 10) % 360, hsl.s, Math.min(100, hsl.l + 10));
};

const generatePressedState = (hex) => {
  const hsl = hexToHsl(hex);
  return hslToHex((hsl.h - 10 + 360) % 360, hsl.s, Math.max(0, hsl.l - 15));
};

const generateMutedState = (hex) => {
  const hsl = hexToHsl(hex);
  return hslToHex(hsl.h, Math.max(0, hsl.s - 5), Math.min(100, hsl.l + 25));
};

const generateTintedNeutral = (hex, targetLightness, saturationPercent = 5) => {
  const hsl = hexToHsl(hex);
  return hslToHex(hsl.h, saturationPercent, targetLightness);
};

const generateBorderColor = (hex, desaturate, lightnessAdjust) => {
  const hsl = hexToHsl(hex);
  const newS = hsl.s * (1 - desaturate / 100);
  const newL = Math.min(100, Math.max(0, hsl.l + lightnessAdjust));
  return hslToHex(hsl.h, newS, newL);
};

// --- Main Export ---

export default function generatePalette(baseColor) {
  const tone = detectEmotionalTone(baseColor);
  const complementaryColor = rotateHue(baseColor, 180);

  const primary = {
    main: baseColor,
    light: adjustBrightness(baseColor, 25, 5),
    lighter: adjustBrightness(baseColor, 50, -10),
    dark: adjustDarkness(baseColor, 20, 10),
    darker: adjustDarkness(baseColor, 40, -5),
    contrast: getContrastColor(baseColor),
  };

  const secondary = {
    main: complementaryColor,
    light: adjustBrightness(complementaryColor, 25, 5),
    lighter: adjustBrightness(complementaryColor, 50, -10),
    dark: adjustDarkness(complementaryColor, 20, 10),
    darker: adjustDarkness(complementaryColor, 40, -5),
    contrast: getContrastColor(complementaryColor),
  };

  const tertiary = {
    main: baseColor,
    hover: generateHoverState(baseColor),
    pressed: generatePressedState(baseColor),
    muted: generateMutedState(baseColor),
    light: adjustBrightness(baseColor, 20),
    dark: adjustDarkness(baseColor, 15),
    contrast: getContrastColor(baseColor),
  };

  const background = {
    default: '#FFFFFF',
    paper: generateTintedNeutral(baseColor, 98, 3),
    elevated: generateTintedNeutral(baseColor, 95, 5),
    subtle: generateTintedNeutral(baseColor, 97, 2),
  };

  const text = {
    primary: '#212B36',
    secondary: '#637381',
    disabled: '#919EAB',
    hint: '#C4CDD5',
  };

  const border = {
    light: generateBorderColor(baseColor, 70, 60),
    main: generateBorderColor(baseColor, 60, -10),
    dark: generateBorderColor(baseColor, 40, -25),
  };

  const gradients = {
    hero: `linear-gradient(135deg, ${primary.main} 0%, ${primary.dark} 100%)`,
    accent: tone === 'energetic'
      ? `linear-gradient(90deg, ${primary.light} 0%, ${primary.main} 100%)`
      : `linear-gradient(135deg, ${primary.light} 0%, ${primary.main} 100%)`,
    calm: `linear-gradient(180deg, ${tertiary.muted} 0%, ${adjustBrightness(primary.dark, 30)} 100%)`,
    subtle: `linear-gradient(135deg, ${background.paper} 0%, ${background.elevated} 100%)`,
  };

  const rgb = hexToRgb(baseColor);
  const darkRgb = hexToRgb(primary.dark);
  const darkerRgb = hexToRgb(primary.darker);

  const shadows = {
    soft: `0 1px 3px 0 rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.12)`,
    medium: `0 4px 6px -1px rgba(${darkRgb.r}, ${darkRgb.g}, ${darkRgb.b}, 0.24)`,
    heavy: `0 10px 15px -3px rgba(${darkerRgb.r}, ${darkerRgb.g}, ${darkerRgb.b}, 0.36)`,
  };

  const accessibility = {
    primaryTextContrast: getContrastRatio(primary.main, '#FFFFFF').toFixed(2),
    primaryBgContrast: getContrastRatio(primary.main, text.primary).toFixed(2),
    wcagCompliant: getContrastRatio(primary.main, '#FFFFFF') >= 4.5,
  };

  return {
    metadata: { emotionalTone: tone, baseColor, harmony: 'complementary', accessibility },
    primary,
    secondary,
    tertiary,
    background,
    text,
    border,
    gradients,
    shadows,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/generate-palette.js
git commit -m "refactor: extract palette generation into reusable utility"
```

---

### Task 2: Create the unified Appearance form

**Files:**
- Create: `src/sections/settings/appearance-form.jsx`
- Reference: `src/sections/settings/store-template-form.jsx` (template grid)
- Reference: `src/utils/generate-palette.js` (palette generation)

- [ ] **Step 1: Create the appearance form component**

This combines the template grid from `store-template-form.jsx` with a new simplified color section:

```jsx
// src/sections/settings/appearance-form.jsx
import { useState, useContext, useRef } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import Grid from '@mui/material/Grid';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Radio from '@mui/material/Radio';
import Tooltip from '@mui/material/Tooltip';
import { alpha, useTheme } from '@mui/material/styles';

import { useTranslate } from 'src/locales';
import { useSnackbar } from 'src/components/snackbar';
import showError from 'src/utils/show_error';
import { AuthContext } from 'src/auth/context/jwt';
import Iconify from 'src/components/iconify';
import { SingleFilePreview } from 'src/components/upload';
import { updateTheme } from 'src/api/theme';
import { updateStoreConfig, useGetMyStore } from 'src/api/store';
import generatePalette from 'src/utils/generate-palette';

// ----------------------------------------------------------------------

const TEMPLATES = [
  { id: 'clothing', image: '/assets/templates/clothing.webp' },
  { id: 'shoes', image: '/assets/templates/shoes.webp' },
  { id: 'furniture', image: '/assets/templates/furniture.webp' },
  { id: 'kitchen', image: '/assets/templates/kitchen.webp' },
  { id: 'jewellery', image: '/assets/templates/jewellery.webp' },
  { id: 'autoparts', image: '/assets/templates/autoparts.webp' },
  { id: 'islamic-lib', image: '/assets/templates/islamic-lib.webp' },
  { id: 'islamic-lib2', image: '/assets/templates/islamic-lib2.webp' },
  { id: 'spices', image: '/assets/templates/spices.webp' },
  { id: 'bags', image: '/assets/templates/bags.webp' },
  { id: 'hardware-store', image: '/assets/templates/hardware-store.webp' },
  { id: 'electronics', image: '/assets/templates/electronics.webp' },
  { id: 'health-cosmetics', image: '/assets/templates/health.webp' },
  { id: 'women-fashion', image: '/assets/templates/women-fashion.webp' },
  { id: 'default', image: '/assets/templates/default.webp' },
];

const PRESET_COLORS = [
  { hex: '#E91E63', name: 'pink' },
  { hex: '#9C27B0', name: 'purple' },
  { hex: '#2196F3', name: 'blue' },
  { hex: '#00BCD4', name: 'cyan' },
  { hex: '#4CAF50', name: 'green' },
  { hex: '#FF9800', name: 'orange' },
  { hex: '#F44336', name: 'red' },
  { hex: '#607D8B', name: 'slate' },
  { hex: '#212121', name: 'black' },
  { hex: '#009688', name: 'teal' },
];

// ----------------------------------------------------------------------

export default function AppearanceForm() {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslate();
  const { user } = useContext(AuthContext);
  const { store } = useGetMyStore(user?.store?.slug);

  const colorInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(user?.store?.theme_name);

  const storedPrimaryColor = store?.config?.colorPalette?.primary?.main || null;
  const [selectedColor, setSelectedColor] = useState(storedPrimaryColor);
  const [customColor, setCustomColor] = useState(
    storedPrimaryColor && !PRESET_COLORS.some((p) => p.hex === storedPrimaryColor)
      ? storedPrimaryColor
      : null
  );

  const isDirty =
    selectedTemplate !== user?.store?.theme_name ||
    selectedColor !== storedPrimaryColor;

  const handleSubmit = async () => {
    try {
      setLoading(true);

      await updateTheme({ theme_name: selectedTemplate });

      const config = { theme_name: selectedTemplate };

      if (selectedColor) {
        config.colorPalette = generatePalette(selectedColor);
      } else {
        config.colorPalette = '';
      }

      await updateStoreConfig({ config });

      enqueueSnackbar(t('appearance_saved'), { variant: 'success' });
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetColor = () => {
    setSelectedColor(null);
    setCustomColor(null);
  };

  const handlePresetClick = (hex) => {
    setSelectedColor(hex);
    setCustomColor(null);
  };

  const handleCustomColorChange = (e) => {
    const hex = e.target.value;
    setCustomColor(hex);
    setSelectedColor(hex);
  };

  const isPresetSelected = (hex) => selectedColor === hex && !customColor;
  const isCustomSelected = customColor && selectedColor === customColor;

  return (
    <Stack spacing={3}>
      {/* Sticky save button */}
      <Stack
        direction="row"
        justifyContent="flex-end"
        sx={{
          position: 'sticky',
          top: 0,
          py: 2,
          bgcolor: 'background.default',
          zIndex: 1,
        }}
      >
        <LoadingButton
          size="large"
          variant="contained"
          loading={loading}
          onClick={handleSubmit}
          disabled={!isDirty}
          startIcon={<Iconify icon="solar:check-circle-bold" />}
        >
          {t('save_changes')}
        </LoadingButton>
      </Stack>

      {/* Section 1: Store Template */}
      <Card sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(theme.palette.primary.main, 0.1),
              }}
            >
              <Iconify icon="solar:palette-round-bold-duotone" width={22} sx={{ color: 'primary.dark' }} />
            </Box>
            <Box>
              <Typography variant="h6">{t('choose_your_store_template')}</Typography>
              <Typography variant="body2" color="text.secondary">
                {t('select_template_description')}
              </Typography>
            </Box>
          </Stack>

          <Grid container spacing={2}>
            {TEMPLATES.map((tpl) => (
              <Grid item xs={6} sm={4} md={3} key={tpl.id}>
                <Card
                  sx={{
                    position: 'relative',
                    border: selectedTemplate === tpl.id
                      ? `2px solid ${theme.palette.primary.main}`
                      : `1px solid ${theme.palette.divider}`,
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: theme.customShadows?.z12 || theme.shadows[6],
                    },
                  }}
                >
                  <CardActionArea onClick={() => setSelectedTemplate(tpl.id)}>
                    <SingleFilePreview
                      imgUrl={tpl.image}
                      alt={tpl.id}
                      sx={{ height: 120, bgcolor: 'grey.200' }}
                    />
                    <CardContent sx={{ py: 1.5, px: 2 }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography variant="subtitle2" noWrap>
                          {t(`template_${tpl.id}`)}
                        </Typography>
                        <Radio checked={selectedTemplate === tpl.id} value={tpl.id} sx={{ p: 0 }} />
                      </Stack>
                    </CardContent>
                  </CardActionArea>

                  {selectedTemplate === tpl.id && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: 'primary.main',
                        color: 'white',
                        borderRadius: '50%',
                        width: 28,
                        height: 28,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Iconify icon="eva:checkmark-fill" width={18} />
                    </Box>
                  )}
                </Card>
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Card>

      {/* Section 2: Primary Color */}
      <Card sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: alpha(theme.palette.warning.main, 0.1),
                }}
              >
                <Iconify icon="solar:pallete-2-bold-duotone" width={22} sx={{ color: 'warning.dark' }} />
              </Box>
              <Box>
                <Typography variant="h6">{t('primary_color')}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('primary_color_description')}
                </Typography>
              </Box>
            </Stack>

            {selectedColor && (
              <Button
                size="small"
                color="inherit"
                startIcon={<Iconify icon="solar:restart-bold" width={18} />}
                onClick={handleResetColor}
              >
                {t('reset_to_default')}
              </Button>
            )}
          </Stack>

          {/* Preset swatches */}
          <Stack direction="row" flexWrap="wrap" gap={1.5}>
            {PRESET_COLORS.map((preset) => (
              <Tooltip key={preset.hex} title={preset.name} arrow>
                <Box
                  onClick={() => handlePresetClick(preset.hex)}
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    bgcolor: preset.hex,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    outline: isPresetSelected(preset.hex)
                      ? `3px solid ${preset.hex}`
                      : '3px solid transparent',
                    outlineOffset: 2,
                    '&:hover': {
                      transform: 'scale(1.15)',
                    },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isPresetSelected(preset.hex) && (
                    <Iconify
                      icon="eva:checkmark-fill"
                      width={18}
                      sx={{ color: preset.hex === '#212121' || preset.hex === '#607D8B' ? '#fff' : '#fff' }}
                    />
                  )}
                </Box>
              </Tooltip>
            ))}

            {/* Custom color swatch */}
            <Tooltip title={t('custom_color')} arrow>
              <Box
                onClick={() => colorInputRef.current?.click()}
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  border: `2px dashed ${theme.palette.grey[400]}`,
                  bgcolor: isCustomSelected ? customColor : 'transparent',
                  outline: isCustomSelected
                    ? `3px solid ${customColor}`
                    : '3px solid transparent',
                  outlineOffset: 2,
                  '&:hover': {
                    transform: 'scale(1.15)',
                    borderColor: theme.palette.grey[600],
                  },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {isCustomSelected ? (
                  <Iconify icon="eva:checkmark-fill" width={18} sx={{ color: '#fff' }} />
                ) : (
                  <Iconify icon="eva:plus-fill" width={18} sx={{ color: 'text.secondary' }} />
                )}
                <input
                  ref={colorInputRef}
                  type="color"
                  value={customColor || '#E91E63'}
                  onChange={handleCustomColorChange}
                  style={{
                    position: 'absolute',
                    width: 0,
                    height: 0,
                    opacity: 0,
                    pointerEvents: 'none',
                  }}
                />
              </Box>
            </Tooltip>
          </Stack>

          {/* Color preview */}
          {selectedColor && (
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: 0.75,
                  bgcolor: selectedColor,
                  border: `1px solid ${alpha(theme.palette.grey[500], 0.24)}`,
                }}
              />
              <Typography variant="body2" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>
                {selectedColor.toUpperCase()}
              </Typography>
            </Stack>
          )}
        </Stack>
      </Card>
    </Stack>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/sections/settings/appearance-form.jsx
git commit -m "feat: create unified appearance form with template grid and color picker"
```

---

### Task 3: Create the appearance view page

**Files:**
- Create: `src/pages/dashboard/settings/appearance-view.jsx`

- [ ] **Step 1: Create the page wrapper**

```jsx
// src/pages/dashboard/settings/appearance-view.jsx
import AppearanceForm from 'src/sections/settings/appearance-form';

// ----------------------------------------------------------------------

export default function AppearanceView() {
  return <AppearanceForm />;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/dashboard/settings/appearance-view.jsx
git commit -m "feat: add appearance settings page view"
```

---

### Task 4: Update routes, paths, and sidebar

**Files:**
- Modify: `src/routes/paths.js` — add `appearance` path, keep `store_template` for backward compat
- Modify: `src/routes/sections/dashboard.jsx` — add lazy import + route, remove color-palette route
- Modify: `src/pages/dashboard/settings/view.jsx` — update TABS: rename template → appearance, remove color palette item

- [ ] **Step 1: Add appearance path in paths.js**

In `src/routes/paths.js`, inside the `settings` object, add:

```js
      appearance: `${ROOTS.DASHBOARD}/settings/appearance`,
```

Keep `store_template` and `color_palette` paths for now (they won't break anything).

- [ ] **Step 2: Update dashboard.jsx routes**

In `src/routes/sections/dashboard.jsx`:

Add the lazy import near the other settings imports:

```js
const AppearanceView = lazy(() => import('src/pages/dashboard/settings/appearance-view'));
```

Add the route inside the settings children array:

```js
          { path: 'appearance', element: <AppearanceView /> },
```

Remove the `store-template` and `color-palette` route entries:

```js
// DELETE these two lines:
//   { path: 'store-template', element: <StoreTemplateView /> },
//   { path: 'color-palette', element: <ColorPaletteView /> },
```

Also remove the lazy imports for `StoreTemplateView` and `ColorPaletteView`.

- [ ] **Step 3: Update sidebar TABS in view.jsx**

In `src/pages/dashboard/settings/view.jsx`, inside the `store` tab's `items` array, replace the `template` and `colors` entries with a single `appearance` entry:

Remove:
```js
      {
        key: 'template',
        titleKey: 'store_template',
        icon: 'solar:palette-round-bold-duotone',
        href: paths?.dashboard.settings.store_template,
      },
      {
        key: 'colors',
        titleKey: 'color_palette',
        icon: 'solar:tuning-2-bold-duotone',
        href: paths?.dashboard.settings.color_palette,
      },
```

Add in their place:
```js
      {
        key: 'appearance',
        titleKey: 'appearance',
        icon: 'solar:palette-round-bold-duotone',
        href: paths?.dashboard.settings.appearance,
      },
```

- [ ] **Step 4: Commit**

```bash
git add src/routes/paths.js src/routes/sections/dashboard.jsx src/pages/dashboard/settings/view.jsx
git commit -m "feat: wire appearance route, remove template and color-palette routes from sidebar"
```

---

### Task 5: Add i18n translation keys

**Files:**
- Modify: `src/locales/langs/en.json`
- Modify: `src/locales/langs/ar.json`
- Modify: `src/locales/langs/fr.json`

- [ ] **Step 1: Add translation keys to all three locale files**

Add near the existing `store_template` key in each file:

**en.json:**
```json
  "appearance": "Appearance",
  "appearance_saved": "Appearance settings saved",
  "primary_color": "Primary Color",
  "primary_color_description": "Choose your store's main brand color",
  "custom_color": "Custom color",
  "reset_to_default": "Reset to default",
```

**ar.json:**
```json
  "appearance": "المظهر",
  "appearance_saved": "تم حفظ إعدادات المظهر",
  "primary_color": "اللون الأساسي",
  "primary_color_description": "اختر اللون الرئيسي لعلامتك التجارية",
  "custom_color": "لون مخصص",
  "reset_to_default": "إعادة تعيين",
```

**fr.json:**
```json
  "appearance": "Apparence",
  "appearance_saved": "Paramètres d'apparence enregistrés",
  "primary_color": "Couleur principale",
  "primary_color_description": "Choisissez la couleur principale de votre boutique",
  "custom_color": "Couleur personnalisée",
  "reset_to_default": "Réinitialiser",
```

- [ ] **Step 2: Commit**

```bash
git add src/locales/langs/en.json src/locales/langs/ar.json src/locales/langs/fr.json
git commit -m "feat: add i18n keys for appearance settings"
```

---

### Task 6: Delete old files

**Files:**
- Delete: `src/sections/settings/color-palette-form.jsx`
- Delete: `src/pages/dashboard/settings/color-palette-view.jsx`
- Delete: `src/pages/dashboard/settings/store-template-view.jsx`
- Delete: `src/sections/settings/store-template-form.jsx`

- [ ] **Step 1: Verify no other imports reference these files**

Run:
```bash
grep -r "color-palette-form\|color-palette-view\|store-template-form\|store-template-view\|StoreTemplateForm\|ColorPaletteForm\|StoreTemplateView\|ColorPaletteView" src/ --include="*.jsx" --include="*.js"
```

Expected: Only the files being deleted and any already-removed route references.

- [ ] **Step 2: Delete the files**

```bash
rm src/sections/settings/color-palette-form.jsx
rm src/pages/dashboard/settings/color-palette-view.jsx
rm src/pages/dashboard/settings/store-template-view.jsx
rm src/sections/settings/store-template-form.jsx
```

- [ ] **Step 3: Commit**

```bash
git add -u
git commit -m "chore: remove old template and color palette pages (replaced by appearance)"
```

---

### Task 7: Verify and test manually

- [ ] **Step 1: Start dev server and navigate to settings**

```bash
npm run dev
```

Navigate to `/dashboard/settings/appearance`.

- [ ] **Step 2: Verify the following**

1. Sidebar shows "Appearance" (not "Store Template" or "Color Palette")
2. Template grid renders with all 15 templates
3. Selecting a template highlights it and enables the save button
4. Preset color swatches render (10 circles)
5. Clicking a preset selects it (checkmark + outline)
6. Clicking the `+` custom swatch opens the native color picker
7. "Reset to default" button appears when a color is selected, and clears it
8. Save button is disabled when nothing changed, enabled when dirty
9. Saving works (no console errors, success snackbar)
10. Old routes `/settings/store-template` and `/settings/color-palette` return 404 or redirect

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix: appearance settings polish"
```

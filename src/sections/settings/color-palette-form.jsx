import { useState, useEffect, useContext, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';

import { useTranslate } from 'src/locales';
import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';
import FormProvider from 'src/components/hook-form';
import { updateStoreConfig, useGetMyStore } from 'src/api/store';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { AuthContext } from 'src/auth/context/jwt';

// ----------------------------------------------------------------------

// Advanced Color Manipulation Utilities using HSL Color Space

// Convert HEX to RGB
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

// Convert RGB to HEX
const rgbToHex = (r, g, b) => {
  const toHex = (value) => {
    const hex = Math.round(Math.min(255, Math.max(0, value))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

// Convert RGB to HSL
const rgbToHsl = (r, g, b) => {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
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

// Convert HSL to RGB
const hslToRgb = (h, s, l) => {
  h /= 360;
  s /= 100;
  l /= 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
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

// Convert HEX to HSL
const hexToHsl = (hex) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return { h: 0, s: 0, l: 0 };
  return rgbToHsl(rgb.r, rgb.g, rgb.b);
};

// Convert HSL to HEX
const hslToHex = (h, s, l) => {
  const rgb = hslToRgb(h, s, l);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
};

// Detect emotional tone of color
const detectEmotionalTone = (hex) => {
  const hsl = hexToHsl(hex);
  const { h, s } = hsl;

  // Warm colors: red, orange, yellow (0-60°)
  if ((h >= 0 && h <= 60) || h >= 330) {
    return s > 40 ? 'energetic' : 'warm';
  }
  // Cool colors: blue, cyan, green (180-270°)
  if (h >= 180 && h <= 270) {
    return s > 40 ? 'calm' : 'cool';
  }
  // Neutral/balanced
  return 'balanced';
};

// Adjust brightness using HSL (proper algorithm)
const adjustBrightness = (hex, percent, saturationAdjust = 0) => {
  const hsl = hexToHsl(hex);

  // L' = L + (100 - L) * (percent / 100)
  const newL = hsl.l + (100 - hsl.l) * (percent / 100);
  const newS = Math.min(100, Math.max(0, hsl.s + saturationAdjust));

  return hslToHex(hsl.h, newS, newL);
};

// Adjust darkness using HSL (proper algorithm)
const adjustDarkness = (hex, percent, saturationAdjust = 0) => {
  const hsl = hexToHsl(hex);

  // L' = L * (1 - percent / 100)
  const newL = hsl.l * (1 - percent / 100);
  const newS = Math.min(100, Math.max(0, hsl.s + saturationAdjust));

  return hslToHex(hsl.h, newS, newL);
};

// Calculate relative luminance (WCAG formula)
const getRelativeLuminance = (hex) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(val => {
    val /= 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

// Calculate WCAG contrast ratio
const getContrastRatio = (hex1, hex2) => {
  const lum1 = getRelativeLuminance(hex1);
  const lum2 = getRelativeLuminance(hex2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
};

// Get accessible contrast text color
const getContrastColor = (hex) => {
  const luminance = getRelativeLuminance(hex);
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

// Rotate hue by degrees
const rotateHue = (hex, degrees) => {
  const hsl = hexToHsl(hex);
  const newH = (hsl.h + degrees + 360) % 360;
  return hslToHex(newH, hsl.s, hsl.l);
};

// Generate complementary color (180° rotation)
const generateComplementary = (hex) => {
  return rotateHue(hex, 180);
};

// Generate analogous colors (±30°)
const generateAnalogous = (hex) => {
  return {
    minus: rotateHue(hex, -30),
    plus: rotateHue(hex, 30),
  };
};

// Generate triadic colors (±120°)
const generateTriadic = (hex) => {
  return {
    first: rotateHue(hex, 120),
    second: rotateHue(hex, 240),
  };
};

// Generate hover state (+10° hue, +10% brightness)
const generateHoverState = (hex) => {
  const hsl = hexToHsl(hex);
  const newH = (hsl.h + 10) % 360;
  const newL = Math.min(100, hsl.l + 10);
  return hslToHex(newH, hsl.s, newL);
};

// Generate pressed state (-10° hue, -15% brightness)
const generatePressedState = (hex) => {
  const hsl = hexToHsl(hex);
  const newH = (hsl.h - 10 + 360) % 360;
  const newL = Math.max(0, hsl.l - 15);
  return hslToHex(newH, hsl.s, newL);
};

// Generate muted state (-5% saturation, +25% brightness)
const generateMutedState = (hex) => {
  const hsl = hexToHsl(hex);
  const newS = Math.max(0, hsl.s - 5);
  const newL = Math.min(100, hsl.l + 25);
  return hslToHex(hsl.h, newS, newL);
};

// Generate brand-tinted neutral
const generateTintedNeutral = (hex, targetLightness, saturationPercent = 5) => {
  const hsl = hexToHsl(hex);
  return hslToHex(hsl.h, saturationPercent, targetLightness);
};

// Generate adaptive border color
const generateBorderColor = (hex, desaturate, lightnessAdjust) => {
  const hsl = hexToHsl(hex);
  const newS = hsl.s * (1 - desaturate / 100);
  let newL = hsl.l;

  if (lightnessAdjust > 0) {
    newL = Math.min(100, hsl.l + lightnessAdjust);
  } else {
    newL = Math.max(0, hsl.l + lightnessAdjust);
  }

  return hslToHex(hsl.h, newS, newL);
};

// ----------------------------------------------------------------------

export default function ColorPaletteForm() {
  const { user } = useContext(AuthContext)
  const { store } = useGetMyStore(user?.store?.slug);
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslate();
  const [loading, setLoading] = useState(false);
  const [generatedPalette, setGeneratedPalette] = useState(store?.config?.colorPalette || null);
  const [DEFAULT_PRIMARY_COLOR, setDEFAULT_PRIMARY_COLOR] = useState( store?.config?.colorPalette?.primary?.main || '#E91E63');
  const [openConfirm, setOpenConfirm] = useState(false);

  // const DEFAULT_PRIMARY_COLOR = store?.config?.colorPalette?.primary?.main || '#E91E63';

  const methods = useForm({
    defaultValues: {
      primaryColor: DEFAULT_PRIMARY_COLOR,
      palette: null,
    },
  });

  const {
    control,
    watch,
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = methods;

  const handleOpenConfirm = () => {
    setOpenConfirm(true);
  };

  const handleCloseConfirm = () => {
    setOpenConfirm(false);
  };

  const handleResetToDefault = async () => {
    try {
      setLoading(true);
      setOpenConfirm(false);

      await updateStoreConfig({ config: { colorPalette: "" } })

      enqueueSnackbar(t('color_palette_reset_successfully'), { variant: 'success' });
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error(error);
    }
  };

  const primaryColor = watch('primaryColor');
  const palette = watch('palette');

  // Generate palette whenever primary color changes
  useEffect(() => {
    generatePalette(primaryColor);
  }, [primaryColor]);

  // Update generatedPalette when individual colors are edited
  useEffect(() => {
    if (palette) {
      setGeneratedPalette(palette);
    }
  }, [palette]);

   useEffect(() => {
    if (store?.config?.colorPalette) {
      setGeneratedPalette(store.config.colorPalette);
      setDEFAULT_PRIMARY_COLOR(store.config.colorPalette?.primary?.main);
      // Also set the palette form field with the stored palette
      setValue('palette', store.config.colorPalette);
      // Set the primary color field
      if (store.config.colorPalette?.primary?.main) {
        setValue('primaryColor', store.config.colorPalette.primary.main);
      }
    }
  }, [store, setValue]);

  const generatePalette = (baseColor) => {
    // Detect emotional tone
    const tone = detectEmotionalTone(baseColor);

    // Generate complementary color for secondary
    const complementaryColor = generateComplementary(baseColor);

    // Generate primary colors with proper HSL adjustments
    const primary = {
      main: baseColor,
      light: adjustBrightness(baseColor, 25, 5),        // +25% brightness, +5% saturation
      lighter: adjustBrightness(baseColor, 50, -10),    // +50% brightness, -10% saturation
      dark: adjustDarkness(baseColor, 20, 10),          // -20% brightness, +10% saturation
      darker: adjustDarkness(baseColor, 40, -5),        // -40% brightness, -5% saturation
      contrast: getContrastColor(baseColor),
    };

    // Generate secondary colors (complementary harmony)
    const secondary = {
      main: complementaryColor,
      light: adjustBrightness(complementaryColor, 25, 5),
      lighter: adjustBrightness(complementaryColor, 50, -10),
      dark: adjustDarkness(complementaryColor, 20, 10),
      darker: adjustDarkness(complementaryColor, 40, -5),
      contrast: getContrastColor(complementaryColor),
    };

    // Generate tertiary colors (UI states)
   
    const tertiary = {
      main: baseColor,
      hover: generateHoverState(baseColor),           // +10° hue, +10% brightness
      pressed: generatePressedState(baseColor),       // -10° hue, -15% brightness
      muted: generateMutedState(baseColor),           // -5% saturation, +25% brightness
      light: adjustBrightness(baseColor, 20),
      dark: adjustDarkness(baseColor, 15),
      contrast: getContrastColor(baseColor),
    };
    // Generate adaptive background colors (brand-tinted neutrals)
    const background = {
      default: '#FFFFFF',
      paper: generateTintedNeutral(baseColor, 98, 3),      // 98% lightness, 3% saturation
      elevated: generateTintedNeutral(baseColor, 95, 5),   // 95% lightness, 5% saturation
      subtle: generateTintedNeutral(baseColor, 97, 2),     // 97% lightness, 2% saturation
    };

    // Text colors with accessibility check
     

    const text = {
      primary: '#212B36',
      secondary: '#637381',
      disabled: '#919EAB',
      hint: '#C4CDD5',
    };

    // Adaptive border colors (derived from brand hue)
    const border = {
      light: generateBorderColor(baseColor, 70, 60),     // desaturate 70%, brighten 60%
      main: generateBorderColor(baseColor, 60, -10),     // desaturate 60%, darken 10%
      dark: generateBorderColor(baseColor, 40, -25),     // desaturate 40%, darken 25%
    };
    // Emotional gradients
    const gradients = {
      hero: `linear-gradient(135deg, ${primary.main} 0%, ${primary.dark} 100%)`,
      accent: tone === 'energetic'
        ? `linear-gradient(90deg, ${primary.light} 0%, ${primary.main} 100%)`
        : `linear-gradient(135deg, ${primary.light} 0%, ${primary.main} 100%)`,
      calm: `linear-gradient(180deg, ${tertiary.muted} 0%, ${adjustBrightness(primary.dark, 30)} 100%)`,
      subtle: `linear-gradient(135deg, ${background.paper} 0%, ${background.elevated} 100%)`,
    };

    // Brand-tinted shadows with transparency
    const rgb = hexToRgb(baseColor);
    const darkRgb = hexToRgb(primary.dark);
    const darkerRgb = hexToRgb(primary.darker);

    const shadows = {
      soft: `0 1px 3px 0 rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.12)`,
      medium: `0 4px 6px -1px rgba(${darkRgb.r}, ${darkRgb.g}, ${darkRgb.b}, 0.24)`,
      heavy: `0 10px 15px -3px rgba(${darkerRgb.r}, ${darkerRgb.g}, ${darkerRgb.b}, 0.36)`,
    };

    // Calculate accessibility metrics
    const accessibility = {
      primaryTextContrast: getContrastRatio(primary.main, '#FFFFFF').toFixed(2),
      primaryBgContrast: getContrastRatio(primary.main, text.primary).toFixed(2),
      wcagCompliant: getContrastRatio(primary.main, '#FFFFFF') >= 4.5,
    };

    const palette = {
      metadata: {
        emotionalTone: tone,
        baseColor,
        harmony: 'complementary',
        accessibility,
      },
      primary,
      secondary,
      tertiary,
      background,
      text,
      border,
      gradients,
      shadows,
    };

    setGeneratedPalette(palette);
    // Also save to form field for individual color editing
    setValue('palette', palette);
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      setLoading(true);

      console.log('🚀 SUBMIT TRIGGERED');
      console.log('📋 Full form data:', data);
      console.log('🎨 data.palette:', data.palette);
      console.log('🌈 generatedPalette state:', generatedPalette);

      // Use the palette from form data (which includes all manual edits)
      const paletteToSubmit = data.palette || generatedPalette;

      console.log('📤 Palette being submitted to backend:', paletteToSubmit);
      console.log('📤 Full config object:', { config: { colorPalette: paletteToSubmit } });

      const response = await updateStoreConfig({ config: { colorPalette: paletteToSubmit } });
      console.log('✅ Backend response:', response);

      enqueueSnackbar(t('color_palette_generated_successfully'), { variant: 'success' });
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error('❌ Submit error:', error);
    }
  });

  const ColorPreview = ({ label, color, showText = false, fieldPath = null }) => {
    const inputRef = useRef(null);

    // Watch the entire palette to get live updates
    const currentPalette = watch('palette');

    // Extract the color from the palette if fieldPath is provided
    let displayColor = color;
    if (fieldPath && currentPalette) {
      const pathParts = fieldPath.split('.');
      let value = currentPalette;
      for (let i = 1; i < pathParts.length; i++) {
        value = value?.[pathParts[i]];
      }
      displayColor = value || color;
    }

    const handleColorBoxClick = () => {
      // Trigger the hidden color input
      if (inputRef.current) {
        inputRef.current.click();
      }
    };

    const handleColorChange = (event) => {
      const newColor = event.target.value;
      console.log('🎨 Color changed:', { fieldPath, newColor });

      if (fieldPath) {
        // Get current palette
        const currentPalette = watch('palette') || generatedPalette;
        console.log('📦 Current palette before update:', currentPalette);

        // Parse the field path (e.g., "palette.primary.main" -> ["palette", "primary", "main"])
        const pathParts = fieldPath.split('.');
        console.log('🗺️ Field path parts:', pathParts);

        // Create a deep copy of the palette
        const updatedPalette = JSON.parse(JSON.stringify(currentPalette));

        // Navigate to the nested property and update it
        let current = updatedPalette;
        for (let i = 1; i < pathParts.length - 1; i++) {
          current = current[pathParts[i]];
        }
        current[pathParts[pathParts.length - 1]] = newColor;

        console.log('✅ Updated palette:', updatedPalette);
        console.log('🎯 Specific field value:', current[pathParts[pathParts.length - 1]]);

        // Update the entire palette object in the form
        setValue('palette', updatedPalette, { shouldDirty: true });

        // Verify the value was set
        setTimeout(() => {
          const verifyPalette = watch('palette');
          console.log('✔️ Verification - palette after setValue:', verifyPalette);
        }, 100);
      } else {
        // Fallback: update primary color
        setValue('primaryColor', newColor);
      }
    };

    return (
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{
          cursor: 'pointer',
          p: 1,
          borderRadius: 1,
          transition: 'all 0.2s',
          '&:hover': {
            bgcolor: 'action.hover',
            transform: 'scale(1.02)',
            '& .color-box': {
              transform: 'scale(1.1)',
              boxShadow: 3,
            },
          },
        }}
      >
        <Box
          className="color-box"
          onClick={handleColorBoxClick}
          sx={{
            width: 40,
            height: 40,
            borderRadius: 1,
            bgcolor: displayColor,
            border: (theme) => `1px solid ${theme.palette.divider}`,
            boxShadow: 1,
            transition: 'all 0.2s',
            position: 'relative',
            cursor: 'pointer',
          }}
        >
          {/* Hidden color input */}
          <input
            ref={inputRef}
            type="color"
            value={displayColor}
            onChange={handleColorChange}
            style={{
              opacity: 0,
              position: 'absolute',
              width: '100%',
              height: '100%',
              cursor: 'pointer',
            }}
          />
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="body2" fontWeight={600}>
            {displayColor}
          </Typography>
          {showText && (
            <Typography variant="caption" sx={{ color: displayColor }}>
              Sample Text
            </Typography>
          )}
        </Box>
      </Stack>
    );
  };

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        {/* Information Alert */}
        <Grid xs={12}>
          <Alert severity="info" icon={<Iconify icon="solar:palette-bold" width={24} />}>
            <Typography variant="body2">
              {t('color_palette_info_message')}
            </Typography>
            {generatedPalette?.metadata && (
              <Box sx={{ mt: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
                <Chip
                  label={`${t('tone')}: ${generatedPalette.metadata.emotionalTone}`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  label={`${t('harmony')}: ${generatedPalette.metadata.harmony}`}
                  size="small"
                  color="secondary"
                  variant="outlined"
                />
                <Chip
                  label={generatedPalette.metadata.accessibility.wcagCompliant ? 'WCAG ✓' : 'WCAG ✗'}
                  size="small"
                  color={generatedPalette.metadata.accessibility.wcagCompliant ? 'success' : 'warning'}
                  variant="outlined"
                />
              </Box>
            )}
          </Alert>
        </Grid>

        {/* Color Picker Section */}
        <Grid xs={12} md={4}>
          <Card sx={{ p: 3, position: 'sticky', top: 80 }}>
            <Stack spacing={3}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  {t('choose_primary_color')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('primary_color_description')}
                </Typography>
              </Box>

              <Controller
                name="primaryColor"
                control={control}
                render={({ field }) => (
                  <Stack spacing={2}>
                    <Box
                      sx={{
                        width: '100%',
                        height: 120,
                        borderRadius: 2,
                        bgcolor: field.value,
                        border: (theme) => `2px solid ${theme.palette.divider}`,
                        boxShadow: 3,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography
                        variant="h4"
                        sx={{
                          color: getContrastColor(field.value),
                          fontWeight: 700,
                        }}
                      >
                        {field.value}
                      </Typography>
                    </Box>

                    <TextField
                      {...field}
                      type="color"
                      fullWidth
                      label={t('pick_color')}
                      InputProps={{
                        sx: { height: 56 },
                      }}
                    />

                    <TextField
                      {...field}
                      type="text"
                      fullWidth
                      label={t('hex_code')}
                      placeholder="#E91E63"
                    />
                  </Stack>
                )}
              />

              <Divider />

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  {t('quick_presets')}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                  {['#E91E63', '#9C27B0', '#3F51B5', '#00BCD4', '#4CAF50', '#FF9800', '#F44336', '#607D8B'].map(
                    (color) => (
                      <Box
                        key={color}
                        onClick={() => methods.setValue('primaryColor', color)}
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 1,
                          bgcolor: color,
                          border: (theme) => `2px solid ${theme.palette.divider}`,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          '&:hover': {
                            transform: 'scale(1.1)',
                            boxShadow: 3,
                          },
                        }}
                      />
                    )
                  )}
                </Stack>
              </Box>

              <Divider />

              <Button
                fullWidth
                variant="outlined"
                color="inherit"
                onClick={handleOpenConfirm}
                startIcon={<Iconify icon="solar:restart-bold" />}
              >
                {t('reset_to_default')}
              </Button>
            </Stack>
          </Card>
        </Grid>

        {/* Generated Palette Preview */}
        <Grid xs={12} md={8}>
          <Stack spacing={3}>
            {/* Primary Colors */}
            <Card sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <Iconify icon="solar:star-bold" width={24} sx={{ color: 'primary.main' }} />
                <Typography variant="h6">{t('primary_colors')}</Typography>
                <Chip label={t('brand_identity')} size="small" color="primary" />
              </Stack>
              <Grid container spacing={2}>
                {generatedPalette?.primary &&
                  Object.entries(generatedPalette.primary).map(([key, value]) => (
                    <Grid xs={12} sm={6} md={4} key={key}>
                      <ColorPreview label={key} color={value} fieldPath={`palette.primary.${key}`} />
                    </Grid>
                  ))}
              </Grid>
            </Card>

            {/* Secondary Colors */}
            <Card sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <Iconify icon="solar:crown-bold" width={24} sx={{ color: 'secondary.main' }} />
                <Typography variant="h6">{t('secondary_colors')}</Typography>
                <Chip label={t('accent')} size="small" color="secondary" />
              </Stack>
              <Grid container spacing={2}>
                {generatedPalette?.secondary &&
                  Object.entries(generatedPalette.secondary).map(([key, value]) => (
                    <Grid xs={12} sm={6} md={4} key={key}>
                      <ColorPreview label={key} color={value} fieldPath={`palette.secondary.${key}`} />
                    </Grid>
                  ))}
              </Grid>
            </Card>

            {/* Tertiary Colors (UI States) */}
            <Card sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <Iconify icon="solar:mouse-circle-bold" width={24} sx={{ color: 'primary.main' }} />
                <Typography variant="h6">{t('tertiary_colors')}</Typography>
                <Chip label="UI States" size="small" color="info" />
              </Stack>
              <Grid container spacing={2}>
                {generatedPalette?.tertiary &&
                  Object.entries(generatedPalette.tertiary).map(([key, value]) => (
                    <Grid xs={12} sm={6} md={4} key={key}>
                      <ColorPreview label={key} color={value} fieldPath={`palette.tertiary.${key}`} />
                    </Grid>
                  ))}
              </Grid>
            </Card>

            {/* Background & Text Colors */}
            <Grid container spacing={3}>
              <Grid xs={12} md={6}>
                <Card sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h6" gutterBottom>
                    {t('background_colors')}
                  </Typography>
                  <Stack spacing={2}>
                    {generatedPalette?.background &&
                      Object.entries(generatedPalette.background).map(([key, value]) => (
                        <ColorPreview key={key} label={key} color={value} fieldPath={`palette.background.${key}`} />
                      ))}
                  </Stack>
                </Card>
              </Grid>

              <Grid xs={12} md={6}>
                <Card sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h6" gutterBottom>
                    {t('text_colors')}
                  </Typography>
                  <Stack spacing={2}>
                    {generatedPalette?.text &&
                      Object.entries(generatedPalette.text).map(([key, value]) => (
                        <ColorPreview key={key} label={key} color={value} showText fieldPath={`palette.text.${key}`} />
                      ))}
                  </Stack>
                </Card>
              </Grid>
            </Grid>

            {/* Gradients Preview */}
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                {t('gradients')}
              </Typography>
              <Stack spacing={2}>
                {generatedPalette?.gradients &&
                  Object.entries(generatedPalette.gradients).map(([key, value]) => (
                    <Paper
                      key={key}
                      sx={{
                        p: 3,
                        background: value,
                        color: getContrastColor(primaryColor),
                        borderRadius: 2,
                      }}
                    >
                      <Typography variant="subtitle2">{key}</Typography>
                      <Typography variant="caption">{value}</Typography>
                    </Paper>
                  ))}
              </Stack>
            </Card>
          </Stack>
        </Grid>

        {/* Actions */}
        <Grid xs={12}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            spacing={2}
            sx={{
              p: 2.5,
              borderRadius: 2,
              bgcolor: 'background.neutral',
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Iconify icon="solar:code-bold" width={20} sx={{ color: 'info.main' }} />
              <Typography variant="body2" color="text.secondary">
                {t('palette_will_be_logged_to_console')}
              </Typography>
            </Stack>
            <LoadingButton
              type="submit"
              variant="contained"
              size="large"
              loading={isSubmitting || loading}
              startIcon={<Iconify icon="solar:download-bold" />}
            >
              {t('submit')}
            </LoadingButton>
          </Stack>
        </Grid>
      </Grid>

      <ConfirmDialog
        open={openConfirm}
        onClose={handleCloseConfirm}
        title={t('confirm_reset')}
        content={t('confirm_reset_color_palette_message')}
        action={
          <Button
            variant="contained"
            color="error"
            onClick={handleResetToDefault}
            disabled={loading}
          >
            {t('reset')}
          </Button>
        }
      />
    </FormProvider>
  );
}

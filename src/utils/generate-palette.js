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
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
      default:
        h = 0;
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
    accent:
      tone === 'energetic'
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

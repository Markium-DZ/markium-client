import { keyframes } from '@mui/system';

// ----------------------------------------------------------------------

// Sci-fi "AI powered" look: the FULL violet -> fuchsia -> cyan gradient is
// visible across the button at all times (small background-size drift keeps it
// alive without ever collapsing to a flat color), plus a pulsing neon glow.

const gradientShift = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const pulseGlow = keyframes`
  0%, 100% { box-shadow: 0 0 12px rgba(168, 85, 247, 0.55), 0 0 26px rgba(34, 211, 238, 0.25); }
  50% { box-shadow: 0 0 20px rgba(217, 70, 239, 0.7), 0 0 38px rgba(34, 211, 238, 0.45); }
`;

// NOTE: no explicit 0%/100% edge stops — the app's RTL transform (stylis rtl)
// flips '0%' to '100%' inside gradients, clamping all stops and rendering a
// SOLID color in Arabic. Edge-stop-free syntax survives the RTL pass intact.
const AI_GRADIENT =
  'linear-gradient(100deg, #7C3AED, #A855F7 25%, #D946EF 50%, #3B82F6 75%, #22D3EE)';

export const aiButtonSx = {
  color: '#fff',
  fontWeight: 700,
  border: 'none',
  background: AI_GRADIENT,
  backgroundSize: '150% 150%',
  animation: `${gradientShift} 4s ease infinite, ${pulseGlow} 3s ease-in-out infinite`,
  transition: 'transform 0.2s ease, filter 0.2s ease',
  '&:hover': {
    background: AI_GRADIENT,
    backgroundSize: '150% 150%',
    filter: 'brightness(1.12) saturate(1.15)',
    transform: 'translateY(-1px)',
  },
};

import { keyframes } from '@mui/system';

// ----------------------------------------------------------------------

// Sci-fi "AI powered" look for the import entry points: an animated
// indigo -> violet -> cyan gradient with a soft neon glow and a slow shimmer.

const gradientShift = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const pulseGlow = keyframes`
  0%, 100% { box-shadow: 0 0 10px rgba(124, 77, 255, 0.45), 0 0 22px rgba(0, 229, 255, 0.18); }
  50% { box-shadow: 0 0 16px rgba(124, 77, 255, 0.65), 0 0 32px rgba(0, 229, 255, 0.35); }
`;

export const aiButtonSx = {
  color: '#fff',
  fontWeight: 700,
  border: 'none',
  background: 'linear-gradient(120deg, #5B2EFF 0%, #7C4DFF 30%, #2979FF 65%, #00E5FF 100%)',
  backgroundSize: '220% 220%',
  animation: `${gradientShift} 6s ease infinite, ${pulseGlow} 3.2s ease-in-out infinite`,
  transition: 'transform 0.2s ease, filter 0.2s ease',
  '&:hover': {
    background: 'linear-gradient(120deg, #5B2EFF 0%, #7C4DFF 30%, #2979FF 65%, #00E5FF 100%)',
    backgroundSize: '220% 220%',
    filter: 'brightness(1.15)',
    transform: 'translateY(-1px)',
  },
};

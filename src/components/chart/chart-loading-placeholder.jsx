import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { useTranslate } from 'src/locales';

// ----------------------------------------------------------------------

function LoadingSpinner() {
  return (
    <Box
      sx={{
        width: 13,
        height: 13,
        borderRadius: '50%',
        border: '2px solid',
        borderColor: (theme) => alpha(theme.palette.text.disabled, 0.2),
        borderTopColor: 'text.disabled',
        animation: 'chartSpinner 0.8s linear infinite',
        '@keyframes chartSpinner': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
      }}
    />
  );
}

function LoadingFooter({ label }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1} justifyContent="center" sx={{ mt: 1.5 }}>
      <LoadingSpinner />
      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
        {label}
      </Typography>
    </Stack>
  );
}

LoadingFooter.propTypes = {
  label: PropTypes.string,
};

// ----------------------------------------------------------------------

function LineVariant({ height, theme, label }) {
  const primary = theme.palette.primary.main;

  const wavePath = 'M0,110 C60,75 120,125 180,90 C240,55 300,115 360,80 C420,45 480,100 540,65';
  const areaPath = `${wavePath} L540,160 L0,160 Z`;

  const dotPositions = [
    { x: 0, y: 110 },
    { x: 90, y: 100 },
    { x: 180, y: 90 },
    { x: 270, y: 85 },
    { x: 360, y: 80 },
    { x: 450, y: 72 },
    { x: 540, y: 65 },
  ];

  return (
    <Stack alignItems="center" justifyContent="center" sx={{ width: '100%', height, px: 3 }}>
      <Box sx={{ width: '100%' }}>
        <svg
          viewBox="0 0 600 160"
          preserveAspectRatio="none"
          width="100%"
          height="160px"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="clp-line-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={primary} stopOpacity="0.10" />
              <stop offset="100%" stopColor={primary} stopOpacity="0.01" />
            </linearGradient>
          </defs>

          <path
            d={areaPath}
            fill="url(#clp-line-gradient)"
            style={{
              animation: 'clpPulseArea 2s ease-in-out infinite',
            }}
          />
          <path
            d={wavePath}
            fill="none"
            stroke={alpha(primary, 0.18)}
            strokeWidth="2.5"
            strokeLinecap="round"
            style={{
              animation: 'clpPulseArea 2s ease-in-out infinite',
            }}
          />

          {dotPositions.map((dot, i) => (
            <circle
              key={i}
              cx={dot.x}
              cy={dot.y}
              r="3"
              fill={alpha(primary, 0.45)}
              style={{
                animation: `clpPulseDot 2s ease-in-out ${i * 0.15}s infinite`,
              }}
            />
          ))}

          <style>{`
            @keyframes clpPulseArea {
              0%, 100% { opacity: 0.35; }
              50% { opacity: 1; }
            }
            @keyframes clpPulseDot {
              0%, 100% { r: 3; opacity: 0.3; }
              50% { r: 5; opacity: 0.6; }
            }
          `}</style>
        </svg>
      </Box>
      <LoadingFooter label={label} />
    </Stack>
  );
}

LineVariant.propTypes = {
  height: PropTypes.number,
  label: PropTypes.string,
  theme: PropTypes.object,
};

// ----------------------------------------------------------------------

function BarVariant({ height, theme, label }) {
  const primary = theme.palette.primary.main;
  const barHeights = [45, 72, 35, 88, 55, 42, 92, 60, 78, 48];

  return (
    <Stack sx={{ width: '100%', height, px: 3, pb: 1 }} justifyContent="flex-end">
      <Stack
        direction="row"
        alignItems="flex-end"
        spacing="10px"
        sx={{ flex: 1, width: '100%' }}
      >
        {barHeights.map((barH, i) => {
          const isEven = i % 2 === 0;
          return (
            <Box
              key={i}
              sx={{
                flex: 1,
                height: `${barH}%`,
                borderRadius: '4px 4px 0 0',
                background: `linear-gradient(180deg, ${alpha(primary, isEven ? 0.16 : 0.12)} 0%, ${alpha(primary, isEven ? 0.04 : 0.03)} 100%)`,
                animation: `clpPulseBar 1.8s ease-in-out ${i * 0.1}s infinite`,
                position: 'relative',
                overflow: 'hidden',
                '@keyframes clpPulseBar': {
                  '0%, 100%': { opacity: 0.45 },
                  '50%': { opacity: 1 },
                },
                '& .bar-shimmer': {
                  position: 'absolute',
                  inset: 0,
                  background: `linear-gradient(90deg, transparent 0%, ${alpha(primary, 0.08)} 50%, transparent 100%)`,
                  animation: `clpShimmer 2.2s ease-in-out ${i * 0.1}s infinite`,
                  '@keyframes clpShimmer': {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(200%)' },
                  },
                },
              }}
            >
              <Box className="bar-shimmer" />
            </Box>
          );
        })}
      </Stack>
      <LoadingFooter label={label} />
    </Stack>
  );
}

BarVariant.propTypes = {
  height: PropTypes.number,
  label: PropTypes.string,
  theme: PropTypes.object,
};

// ----------------------------------------------------------------------

function PieVariant({ height, theme, label }) {
  const segments = [
    { dasharray: '95 283', dashoffset: 0, color: alpha(theme.palette.success.main, 0.12) },
    { dasharray: '75 283', dashoffset: -100, color: alpha(theme.palette.primary.main, 0.12) },
    { dasharray: '55 283', dashoffset: -180, color: alpha(theme.palette.warning.main, 0.12) },
    { dasharray: '40 283', dashoffset: -240, color: alpha(theme.palette.error.main, 0.10) },
  ];

  const legendColors = [
    alpha(theme.palette.success.main, 0.55),
    alpha(theme.palette.primary.main, 0.55),
    alpha(theme.palette.warning.main, 0.55),
    alpha(theme.palette.error.main, 0.50),
  ];

  return (
    <Stack alignItems="center" justifyContent="center" sx={{ width: '100%', height }}>
      <Box sx={{ position: 'relative', width: 180, height: 180 }}>
        <svg
          viewBox="0 0 200 200"
          width="180"
          height="180"
          xmlns="http://www.w3.org/2000/svg"
        >
          {segments.map((seg, i) => (
            <circle
              key={i}
              cx="100"
              cy="100"
              r="45"
              fill="none"
              stroke={seg.color}
              strokeWidth="28"
              strokeDasharray={seg.dasharray}
              strokeDashoffset={seg.dashoffset}
              style={{
                animation: `clpPulsePie 2s ease-in-out ${i * 0.3}s infinite`,
              }}
            />
          ))}

          <style>{`
            @keyframes clpPulsePie {
              0%, 100% { opacity: 0.4; }
              50% { opacity: 1; }
            }
            @keyframes clpRotateSweep {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </svg>

        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 180,
            height: 180,
            borderRadius: '50%',
            background: 'conic-gradient(transparent 0%, transparent 15%, rgba(255,255,255,0.06) 50%, transparent 65%, transparent 100%)',
            animation: 'clpRotateSweep 3s linear infinite',
          }}
        />
      </Box>

      <Stack direction="row" spacing={1.5} justifyContent="center" flexWrap="wrap" sx={{ mt: 1.5 }}>
        {legendColors.map((color, i) => (
          <Stack key={i} direction="row" alignItems="center" spacing={0.75}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '3px',
                bgcolor: color,
              }}
            />
            <Box
              sx={{
                width: 40,
                height: 8,
                borderRadius: '4px',
                bgcolor: (t) => alpha(t.palette.grey[500], 0.2),
              }}
            />
          </Stack>
        ))}
      </Stack>

      <LoadingFooter label={label} />
    </Stack>
  );
}

PieVariant.propTypes = {
  height: PropTypes.number,
  label: PropTypes.string,
  theme: PropTypes.object,
};

// ----------------------------------------------------------------------

export default function ChartLoadingPlaceholder({ variant = 'line', height = 364, sx }) {
  const theme = useTheme();
  const { t } = useTranslate();
  const label = t('loading_data');

  const content = (() => {
    if (variant === 'bar') return <BarVariant height={height} theme={theme} label={label} />;
    if (variant === 'pie') return <PieVariant height={height} theme={theme} label={label} />;
    return <LineVariant height={height} theme={theme} label={label} />;
  })();

  return (
    <Box
      sx={{
        width: '100%',
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...sx,
      }}
    >
      {content}
    </Box>
  );
}

ChartLoadingPlaceholder.propTypes = {
  height: PropTypes.number,
  sx: PropTypes.object,
  variant: PropTypes.oneOf(['line', 'bar', 'pie']),
};

import PropTypes from 'prop-types';
import { memo, useCallback, useMemo, useRef, useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { useTranslate } from 'src/locales';

// ----------------------------------------------------------------------

function WilayasMapSvg({ wilayas, mode, viewBox, neutralColor }) {
  const theme = useTheme();
  const { t } = useTranslate();

  const containerRef = useRef(null);
  const [hover, setHover] = useState(null);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });

  const handlePointerMove = useCallback((e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setPointer({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  const handleEnter = useCallback((wilaya) => () => setHover(wilaya), []);
  const handleLeave = useCallback(() => setHover(null), []);

  const hoveredKey = hover?.code;

  const sortedForRender = useMemo(() => {
    // render hovered last so its stroke is always on top
    if (!hoveredKey) return wilayas;
    return [...wilayas].sort((a, b) => (a.code === hoveredKey ? 1 : b.code === hoveredKey ? -1 : 0));
  }, [wilayas, hoveredKey]);

  return (
    <Box
      ref={containerRef}
      onPointerMove={handlePointerMove}
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: 360,
      }}
    >
      <Box
        component="svg"
        viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}
        preserveAspectRatio="xMidYMid meet"
        sx={{
          width: '100%',
          height: '100%',
          display: 'block',
          filter: `drop-shadow(0 8px 24px ${alpha(theme.palette.common.black, 0.08)})`,
        }}
      >
        <defs>
          <radialGradient id="wilaya-glow" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor={alpha(theme.palette.background.default, 0)} />
            <stop offset="100%" stopColor={alpha(theme.palette.grey[500], 0.04)} />
          </radialGradient>
        </defs>

        <rect
          x={0}
          y={0}
          width={viewBox.width}
          height={viewBox.height}
          fill="url(#wilaya-glow)"
        />

        {sortedForRender.map((w) => {
          const isHovered = w.code === hoveredKey;
          const fill = w.color || neutralColor;
          return (
            <path
              key={w.code}
              d={w.pathD}
              fill={fill}
              stroke={isHovered ? theme.palette.common.white : alpha(theme.palette.common.white, 0.85)}
              strokeWidth={isHovered ? 2.2 : 0.9}
              vectorEffect="non-scaling-stroke"
              onPointerEnter={handleEnter(w)}
              onPointerLeave={handleLeave}
              style={{
                cursor: 'pointer',
                transition: 'fill 0.25s ease, stroke-width 0.15s ease, opacity 0.25s ease',
                opacity: hoveredKey && !isHovered ? 0.78 : 1,
                filter: isHovered
                  ? `drop-shadow(0 4px 14px ${alpha(theme.palette.common.black, 0.22)})`
                  : 'none',
              }}
            >
              <title>
                {w.nameFr}
                {mode === 'orders'
                  ? ` — ${w.orderCount} ${t('orders_label')}`
                  : ` — ${w.returnRate.toFixed(0)}% ${t('analytics_return_rate')}`}
              </title>
            </path>
          );
        })}
      </Box>

      {hover && (
        <HoverCard
          wilaya={hover}
          mode={mode}
          x={pointer.x}
          y={pointer.y}
          containerWidth={containerRef.current?.clientWidth || 0}
        />
      )}
    </Box>
  );
}

WilayasMapSvg.propTypes = {
  wilayas: PropTypes.array.isRequired,
  mode: PropTypes.oneOf(['orders', 'returns']).isRequired,
  viewBox: PropTypes.shape({ width: PropTypes.number, height: PropTypes.number }).isRequired,
  neutralColor: PropTypes.string.isRequired,
};

export default memo(WilayasMapSvg);

// ----------------------------------------------------------------------

function HoverCard({ wilaya, mode, x, y, containerWidth }) {
  const theme = useTheme();
  const { t } = useTranslate();
  const isRtl = theme.direction === 'rtl';

  const CARD_WIDTH = 232;
  const flip = x + CARD_WIDTH + 24 > containerWidth;
  const cardX = flip ? x - CARD_WIDTH - 14 : x + 14;
  const cardY = Math.max(8, y - 8);

  return (
    <Box
      sx={{
        position: 'absolute',
        top: cardY,
        left: cardX,
        width: CARD_WIDTH,
        pointerEvents: 'none',
        zIndex: 2,
        borderRadius: 1.5,
        overflow: 'hidden',
        bgcolor: 'background.paper',
        boxShadow: (th) => `0 12px 32px ${alpha(th.palette.common.black, 0.18)}`,
        border: (th) => `1px solid ${alpha(th.palette.grey[500], 0.12)}`,
        transition: 'transform 0.08s ease-out',
      }}
    >
      <Box
        sx={{
          px: 1.5,
          py: 1,
          background: (th) =>
            mode === 'orders'
              ? `linear-gradient(135deg, ${alpha(th.palette.success.main, 0.22)} 0%, ${alpha(th.palette.success.main, 0.04)} 100%)`
              : `linear-gradient(135deg, ${alpha(th.palette.info.main, 0.22)} 0%, ${alpha(th.palette.info.main, 0.04)} 100%)`,
          borderBottom: (th) => `1px solid ${alpha(th.palette.grey[500], 0.08)}`,
        }}
      >
        <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600, letterSpacing: 0.4 }}>
          {String(wilaya.code).padStart(2, '0')}
        </Typography>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.15 }}>
          {wilaya.nameFr}
        </Typography>
        {wilaya.nameAr && (
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary', fontWeight: 500, direction: 'rtl', display: 'block', textAlign: isRtl ? 'left' : 'right' }}
          >
            {wilaya.nameAr}
          </Typography>
        )}
      </Box>

      <Stack spacing={0.75} sx={{ px: 1.5, py: 1.25 }}>
        <Row label={t('total_orders')} value={wilaya.orderCount} accent="text.primary" emphasize />
        <Row
          label={t('successful_orders')}
          value={wilaya.successCount}
          accent="success.main"
          sub={wilaya.deliveryRate != null ? `${wilaya.deliveryRate.toFixed(0)}%` : null}
        />
        <Row
          label={t('returned_orders')}
          value={wilaya.returnCount}
          accent="error.main"
          sub={wilaya.returnRate != null ? `${wilaya.returnRate.toFixed(0)}%` : null}
        />
      </Stack>
    </Box>
  );
}

HoverCard.propTypes = {
  wilaya: PropTypes.object.isRequired,
  mode: PropTypes.oneOf(['orders', 'returns']).isRequired,
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  containerWidth: PropTypes.number,
};

// ----------------------------------------------------------------------

function Row({ label, value, accent, sub, emphasize }) {
  return (
    <Stack direction="row" alignItems="baseline" justifyContent="space-between" spacing={1}>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {label}
      </Typography>
      <Stack direction="row" alignItems="baseline" spacing={0.5}>
        {sub && (
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            {sub}
          </Typography>
        )}
        <Typography
          variant={emphasize ? 'subtitle2' : 'body2'}
          sx={{ color: accent, fontWeight: emphasize ? 700 : 600 }}
        >
          {value ?? 0}
        </Typography>
      </Stack>
    </Stack>
  );
}

Row.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.number,
  accent: PropTypes.string,
  sub: PropTypes.string,
  emphasize: PropTypes.bool,
};

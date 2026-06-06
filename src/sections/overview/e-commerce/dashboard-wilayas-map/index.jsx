import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { useTranslate } from 'src/locales';

import Iconify from 'src/components/iconify';

import wilayasGeoJson from 'src/assets/maps/algeria-wilayas.json';

import WilayasMapSvg from './wilayas-map-svg';
import WilayasSidePanel from './wilayas-side-panel';
import {
  buildProjection,
  featureToPathD,
  normalizeName,
  ordersColorFor,
  returnsColorFor,
  ORDERS_STOPS,
  RETURNS_STOPS,
} from './utils';

// ----------------------------------------------------------------------

const PROJECTION = buildProjection(wilayasGeoJson.features);

const PRE_PROJECTED = wilayasGeoJson.features.map((feature) => {
  const codeRaw = feature.properties?.city_code;
  const code = String(codeRaw ?? '').padStart(2, '0');
  return {
    code,
    nameFr: feature.properties?.name || code,
    nameAr: feature.properties?.name_ar || '',
    normalized: normalizeName(feature.properties?.name),
    pathD: featureToPathD(feature, PROJECTION),
  };
});

const STATUS_SUCCESS = 'delivered';
const STATUS_RETURN = 'cancelled';

// ----------------------------------------------------------------------

export default function DashboardWilayasMap({ orders = [], loading = false }) {
  const { t } = useTranslate();
  const theme = useTheme();

  const [mode, setMode] = useState('orders');

  const aggByCode = useMemo(() => {
    const map = new Map();
    (orders || []).forEach((o) => {
      const codeRaw = o?.address?.wilaya?.code;
      if (codeRaw == null || codeRaw === '') return;
      const key = String(codeRaw).padStart(2, '0');
      const status = o?.status?.key || o?.status || '';
      const entry = map.get(key) || { total: 0, delivered: 0, cancelled: 0 };
      entry.total += 1;
      if (status === STATUS_SUCCESS) entry.delivered += 1;
      else if (status === STATUS_RETURN) entry.cancelled += 1;
      map.set(key, entry);
    });
    return map;
  }, [orders]);

  const aggByName = useMemo(() => {
    // Fallback path: some legacy orders may have no wilaya.code but have a name.
    const map = new Map();
    (orders || []).forEach((o) => {
      const w = o?.address?.wilaya;
      if (!w || w.code) return;
      const key = normalizeName(w.name || w.name_ar);
      if (!key) return;
      const status = o?.status?.key || o?.status || '';
      const entry = map.get(key) || { total: 0, delivered: 0, cancelled: 0 };
      entry.total += 1;
      if (status === STATUS_SUCCESS) entry.delivered += 1;
      else if (status === STATUS_RETURN) entry.cancelled += 1;
      map.set(key, entry);
    });
    return map;
  }, [orders]);

  const { wilayas, maxOrders, maxReturnRate } = useMemo(() => {
    let maxOrd = 0;
    let maxRet = 0;
    const enriched = PRE_PROJECTED.map((p) => {
      const stats =
        aggByCode.get(p.code) || aggByName.get(p.normalized) || { total: 0, delivered: 0, cancelled: 0 };
      const orderCount = stats.total;
      const successCount = stats.delivered;
      const returnCount = stats.cancelled;
      const deliveryRate = orderCount > 0 ? (successCount / orderCount) * 100 : 0;
      const returnRate = orderCount > 0 ? (returnCount / orderCount) * 100 : 0;
      if (orderCount > maxOrd) maxOrd = orderCount;
      if (returnRate > maxRet) maxRet = returnRate;
      return {
        ...p,
        orderCount,
        successCount,
        returnCount,
        deliveryRate,
        returnRate,
      };
    });

    const withColors = enriched.map((p) => {
      const ordersT = maxOrd > 0 ? p.orderCount / maxOrd : 0;
      const retScale = maxRet > 0 ? maxRet : 30;
      const returnsT = Math.min(1, p.returnRate / retScale);
      const ordersColor = p.orderCount > 0 ? ordersColorFor(0.18 + ordersT * 0.82) : null;
      const returnsColor = p.returnRate > 0 ? returnsColorFor(0.22 + returnsT * 0.78) : null;
      return {
        ...p,
        ordersColor,
        returnsColor,
        color: mode === 'orders' ? ordersColor : returnsColor,
      };
    });

    return { wilayas: withColors, maxOrders: maxOrd, maxReturnRate: maxRet };
  }, [aggByCode, aggByName, mode]);

  const totalLoadedOrders = orders?.length || 0;
  const matchedOrders = wilayas.reduce((sum, w) => sum + w.orderCount, 0);
  const hasMatched = matchedOrders > 0;
  const neutralColor = alpha(theme.palette.grey[500], 0.12);

  return (
    <Card sx={{ position: 'relative', overflow: 'hidden' }}>
      <CardHeader
        title={t('wilayas_map_title')}
        subheader={t('wilayas_map_subtitle')}
        action={
          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={(_, next) => next && setMode(next)}
            size="small"
            sx={{
              borderRadius: 2,
              '& .MuiToggleButton-root': {
                px: 1.5,
                py: 0.5,
                textTransform: 'none',
                fontWeight: 600,
                border: 'none',
                gap: 0.75,
                '&.Mui-selected': {
                  bgcolor: (th) =>
                    alpha(mode === 'orders' ? th.palette.success.main : th.palette.info.main, 0.16),
                  color: mode === 'orders' ? 'success.main' : 'info.main',
                },
              },
            }}
          >
            <ToggleButton value="orders">
              <Iconify icon="solar:cart-check-bold-duotone" width={16} />
              {t('mode_orders')}
            </ToggleButton>
            <ToggleButton value="returns">
              <Iconify icon="solar:arrow-down-bold-duotone" width={16} />
              {t('mode_returns')}
            </ToggleButton>
          </ToggleButtonGroup>
        }
      />

      <Box
        sx={{
          display: 'grid',
          gap: { xs: 2, md: 3 },
          gridTemplateColumns: { xs: '1fr', md: '1.6fr 1fr' },
          alignItems: 'stretch',
          p: { xs: 2, md: 3 },
          pt: 0,
        }}
      >
        <Box
          sx={{
            position: 'relative',
            borderRadius: 2,
            bgcolor: (th) => alpha(th.palette.grey[500], 0.04),
            border: (th) => `1px solid ${alpha(th.palette.grey[500], 0.08)}`,
            minHeight: 380,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {loading ? (
            <Skeleton variant="rectangular" sx={{ flexGrow: 1, minHeight: 380, borderRadius: 2 }} />
          ) : (
            <WilayasMapSvg
              wilayas={wilayas}
              mode={mode}
              viewBox={{ width: PROJECTION.width, height: PROJECTION.height }}
              neutralColor={neutralColor}
            />
          )}

          {!loading && !hasMatched && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                bgcolor: (th) => alpha(th.palette.background.paper, 0.7),
                backdropFilter: 'blur(2px)',
              }}
            >
              <Stack spacing={1} alignItems="center" sx={{ p: 3, textAlign: 'center', maxWidth: 360 }}>
                <Iconify icon="solar:map-bold-duotone" width={32} sx={{ color: 'text.disabled' }} />
                <Typography variant="subtitle2" color="text.secondary">
                  {totalLoadedOrders === 0
                    ? t('no_orders_yet')
                    : t('wilayas_missing_address')}
                </Typography>
              </Stack>
            </Box>
          )}

          <Legend mode={mode} maxOrders={maxOrders} maxReturnRate={maxReturnRate} />
        </Box>

        <Box>
          {loading ? (
            <Stack spacing={2}>
              <Skeleton variant="text" width="60%" height={28} />
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} variant="rounded" height={36} />
              ))}
            </Stack>
          ) : (
            <WilayasSidePanel wilayas={wilayas} />
          )}
        </Box>
      </Box>
    </Card>
  );
}

DashboardWilayasMap.propTypes = {
  orders: PropTypes.array,
  loading: PropTypes.bool,
};

// ----------------------------------------------------------------------

function Legend({ mode, maxOrders, maxReturnRate }) {
  const { t } = useTranslate();
  const stops = mode === 'orders' ? ORDERS_STOPS : RETURNS_STOPS;
  const gradient = `linear-gradient(90deg, ${stops.join(', ')})`;

  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: 10,
        left: 10,
        right: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
        pointerEvents: 'none',
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 0.5 }}>
        <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600 }}>
          {mode === 'orders' ? t('legend_orders_low') : t('legend_returns_low')}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600 }}>
          {mode === 'orders'
            ? `${maxOrders || 0} ${t('orders_label')}`
            : `${Math.round(maxReturnRate || 0)}%`}
        </Typography>
      </Stack>
      <Box
        sx={{
          height: 8,
          borderRadius: 999,
          background: gradient,
          boxShadow: '0 0 0 1px rgba(0,0,0,0.04) inset',
        }}
      />
    </Box>
  );
}

Legend.propTypes = {
  mode: PropTypes.oneOf(['orders', 'returns']).isRequired,
  maxOrders: PropTypes.number,
  maxReturnRate: PropTypes.number,
};

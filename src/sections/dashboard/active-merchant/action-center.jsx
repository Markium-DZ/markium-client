import PropTypes from 'prop-types';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import LinearProgress from '@mui/material/LinearProgress';
import { alpha, useTheme } from '@mui/material/styles';

import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

const ACTION_TYPES = [
  {
    key: 'confirm',
    labelKey: 'orders_to_confirm',
    descKey: 'orders_to_confirm_desc',
    icon: 'solar:clock-circle-bold',
    color: 'warning',
    prop: 'pendingOrders',
    getPath: () => paths.dashboard.order.root,
    hasFakeAction: true,
  },
  {
    key: 'ship',
    labelKey: 'orders_to_ship',
    descKey: 'orders_to_ship_desc',
    icon: 'solar:box-bold',
    color: 'info',
    prop: 'ordersToShip',
    getPath: () => paths.dashboard.order.root,
  },
  {
    key: 'lowStock',
    labelKey: 'low_stock_items',
    descKey: 'low_stock_items_desc',
    icon: 'solar:danger-triangle-bold',
    color: 'error',
    prop: 'lowStockCount',
    getPath: () => paths.dashboard.inventory.lowStock,
  },
  {
    key: 'drafts',
    labelKey: 'draft_products',
    descKey: 'draft_products_desc',
    icon: 'solar:document-bold',
    color: 'secondary',
    prop: 'draftProducts',
    getPath: () => paths.dashboard.product.root,
  },
];

// ----------------------------------------------------------------------

export default function ActionCenter({ pendingOrders = 0, ordersToShip = 0, lowStockCount = 0, draftProducts = 0 }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();

  const counts = useMemo(
    () => ({
      pendingOrders,
      ordersToShip,
      lowStockCount,
      draftProducts,
    }),
    [pendingOrders, ordersToShip, lowStockCount, draftProducts]
  );

  // Only show actions that have items requiring attention
  const activeActions = useMemo(
    () => ACTION_TYPES.filter((a) => counts[a.prop] > 0),
    [counts]
  );

  const totalActions = ACTION_TYPES.length;
  const completedActions = ACTION_TYPES.filter((a) => counts[a.prop] === 0).length;
  const progressPct = (completedActions / totalActions) * 100;
  const allClear = completedActions === totalActions;

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title={t('action_center')}
        titleTypographyProps={{ variant: 'h6', component: 'h2' }}
        sx={{ px: 2.5, pt: 2.5, pb: 0 }}
      />

      {/* Progress bar */}
      <Stack spacing={0.75} sx={{ px: 2.5, pt: 1.5, pb: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            {t('actions_progress', { done: completedActions, total: totalActions })}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {Math.round(progressPct)}%
          </Typography>
        </Stack>

        <LinearProgress
          variant="determinate"
          value={progressPct}
          sx={{
            height: 6,
            borderRadius: 1,
            bgcolor: alpha(allClear ? theme.palette.success.main : theme.palette.primary.main, 0.12),
            '& .MuiLinearProgress-bar': {
              bgcolor: allClear ? theme.palette.success.main : theme.palette.primary.main,
              borderRadius: 1,
            },
          }}
        />
      </Stack>

      {/* Notification list */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', px: 1, py: 1 }}>
        {allClear ? (
          <Stack alignItems="center" justifyContent="center" spacing={1.5} sx={{ py: 4 }}>
            <Box
              sx={{
                width: 52,
                height: 52,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                bgcolor: alpha(theme.palette.success.main, 0.12),
              }}
            >
              <Iconify icon="solar:check-circle-bold" width={28} sx={{ color: theme.palette.success.main }} />
            </Box>
            <Typography variant="subtitle2" sx={{ color: 'success.dark', fontWeight: 700 }}>
              {t('all_actions_clear')}
            </Typography>
          </Stack>
        ) : (
          <Stack spacing={0.5}>
            {activeActions.map((action) => {
              const count = counts[action.prop];
              const paletteColor = theme.palette[action.color]?.main || theme.palette.grey[500];

              return (
                <Stack
                  key={action.key}
                  direction="row"
                  alignItems="center"
                  spacing={1.5}
                  sx={{
                    px: 1.5,
                    py: 1.25,
                    borderRadius: 1.5,
                    bgcolor: alpha(paletteColor, 0.06),
                    transition: 'background 0.15s',
                    '&:hover': {
                      bgcolor: alpha(paletteColor, 0.1),
                    },
                  }}
                >
                  {/* Icon */}
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 1,
                      bgcolor: alpha(paletteColor, 0.14),
                      flexShrink: 0,
                    }}
                  >
                    <Iconify icon={action.icon} width={20} sx={{ color: paletteColor }} />
                  </Box>

                  {/* Label + count */}
                  <Stack sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" noWrap sx={{ lineHeight: 1.3 }}>
                      {count} {t(action.labelKey)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.3 }} noWrap>
                      {t(action.descKey)}
                    </Typography>
                  </Stack>

                  {/* Action buttons */}
                  <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                    <Button
                      size="small"
                      variant="soft"
                      color={action.color}
                      onClick={() => router.push(action.getPath())}
                      sx={{
                        minWidth: 0,
                        px: 1.5,
                        py: 0.5,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      {t('view')}
                    </Button>

                    {action.hasFakeAction && (
                      <Button
                        size="small"
                        variant="soft"
                        color="error"
                        disabled
                        sx={{
                          minWidth: 0,
                          px: 1.5,
                          py: 0.5,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                        }}
                      >
                        {t('mark_fake')}
                      </Button>
                    )}
                  </Stack>
                </Stack>
              );
            })}
          </Stack>
        )}
      </Box>
    </Card>
  );
}

ActionCenter.propTypes = {
  pendingOrders: PropTypes.number,
  ordersToShip: PropTypes.number,
  lowStockCount: PropTypes.number,
  draftProducts: PropTypes.number,
};

import { useMemo, useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Skeleton from '@mui/material/Skeleton';
import Collapse from '@mui/material/Collapse';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import IconButton from '@mui/material/IconButton';
import { alpha, useTheme } from '@mui/material/styles';

import FormProvider from 'src/components/hook-form';
import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';
import { useTranslate } from 'src/locales';
import {
  useGetNotificationPreferences,
  updateNotificationPreferences,
} from 'src/api/notifications';

// ----------------------------------------------------------------------

const PREFERENCE_GROUPS = [
  {
    subheaderKey: 'notif_group_orders',
    captionKey: 'notif_group_orders_caption',
    icon: 'solar:bag-check-bold',
    color: 'primary',
    keys: [
      { key: 'order.placed', labelKey: 'notif_order_placed', icon: 'solar:add-circle-bold' },
      { key: 'order.status.confirmed', labelKey: 'notif_order_confirmed', icon: 'solar:check-circle-bold' },
      { key: 'order.status.shipped', labelKey: 'notif_order_shipped', icon: 'solar:box-bold' },
      { key: 'order.status.delivered', labelKey: 'notif_order_delivered', icon: 'solar:verified-check-bold' },
      { key: 'order.status.cancelled', labelKey: 'notif_order_cancelled', icon: 'solar:close-circle-bold' },
      { key: 'order.status.returned', labelKey: 'notif_order_returned', icon: 'solar:undo-left-round-bold' },
    ],
  },
  {
    subheaderKey: 'notif_group_shipments',
    captionKey: 'notif_group_shipments_caption',
    icon: 'solar:delivery-bold',
    color: 'info',
    keys: [
      { key: 'shipment.status.created', labelKey: 'notif_shipment_created', icon: 'solar:document-add-bold' },
      { key: 'shipment.status.in_transit', labelKey: 'notif_shipment_in_transit', icon: 'solar:route-bold' },
      { key: 'shipment.status.out_for_delivery', labelKey: 'notif_shipment_out_for_delivery', icon: 'solar:scooter-bold' },
      { key: 'shipment.status.delivered', labelKey: 'notif_shipment_delivered', icon: 'solar:verified-check-bold' },
      { key: 'shipment.status.failed', labelKey: 'notif_shipment_failed', icon: 'solar:danger-triangle-bold' },
      { key: 'shipment.status.returned', labelKey: 'notif_shipment_returned', icon: 'solar:undo-left-round-bold' },
    ],
  },
  {
    subheaderKey: 'notif_group_inventory',
    captionKey: 'notif_group_inventory_caption',
    icon: 'solar:box-minimalistic-bold',
    color: 'warning',
    keys: [{ key: 'inventory.low_stock', labelKey: 'notif_low_stock', icon: 'solar:danger-triangle-bold' }],
  },
  {
    subheaderKey: 'notif_group_payments',
    captionKey: 'notif_group_payments_caption',
    icon: 'solar:card-bold',
    color: 'success',
    keys: [
      { key: 'subscription.expiring_soon', labelKey: 'notif_subscription_expiring', icon: 'solar:clock-circle-bold' },
      { key: 'subscription.expired', labelKey: 'notif_subscription_expired', icon: 'solar:close-circle-bold' },
    ],
  },
];

const buildDefaultValues = (preferences) => {
  const map = {};
  preferences.forEach(({ event_key, enabled }) => {
    map[event_key] = enabled;
  });
  return map;
};

// ----------------------------------------------------------------------

function NotificationGroup({ group, control, t, watch }) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(true);

  const colorMain = theme.palette[group.color]?.main || theme.palette.primary.main;
  const colorDark = theme.palette[group.color]?.dark || theme.palette.primary.dark;

  // Count enabled toggles in this group
  const enabledCount = group.keys.filter(({ key }) => watch(key)).length;
  const totalCount = group.keys.length;

  return (
    <Card
      variant="outlined"
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        overflow: 'hidden',
        transition: 'border-color 0.2s',
        '&:hover': {
          borderColor: alpha(colorMain, 0.4),
        },
      }}
    >
      {/* Group header */}
      <Stack
        direction="row"
        alignItems="center"
        onClick={() => setExpanded(!expanded)}
        sx={{
          px: 2.5,
          py: 2,
          cursor: 'pointer',
          userSelect: 'none',
          '&:hover': { bgcolor: alpha(colorMain, 0.04) },
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(colorMain, 0.1),
            flexShrink: 0,
          }}
        >
          <Iconify icon={group.icon} width={22} sx={{ color: colorDark }} />
        </Box>

        <Box sx={{ ml: 1.5, minWidth: 0, flexGrow: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="subtitle2" fontWeight={700} noWrap>
              {t(group.subheaderKey)}
            </Typography>
            <Box
              sx={{
                px: 0.75,
                py: 0.15,
                borderRadius: 0.75,
                bgcolor: enabledCount === totalCount
                  ? alpha(theme.palette.success.main, 0.12)
                  : alpha(theme.palette.grey[500], 0.12),
                display: 'inline-flex',
              }}
            >
              <Typography
                variant="caption"
                fontWeight={700}
                sx={{
                  color: enabledCount === totalCount ? 'success.dark' : 'text.secondary',
                  fontSize: 11,
                }}
              >
                {enabledCount}/{totalCount}
              </Typography>
            </Box>
          </Stack>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t(group.captionKey)}
          </Typography>
        </Box>

        <IconButton size="small" sx={{ color: 'text.secondary' }}>
          <Iconify
            icon="eva:chevron-down-fill"
            width={20}
            sx={{
              transition: 'transform 0.2s',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        </IconButton>
      </Stack>

      {/* Toggle items */}
      <Collapse in={expanded}>
        <Stack
          sx={{
            px: 1,
            pb: 1,
          }}
        >
          {group.keys.map(({ key, labelKey, icon }) => (
            <Controller
              key={key}
              name={key}
              control={control}
              render={({ field }) => (
                <Stack
                  direction="row"
                  alignItems="center"
                  onClick={() => field.onChange(!field.value)}
                  sx={{
                    px: 1.5,
                    py: 1,
                    mx: 0.5,
                    borderRadius: 1.5,
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.grey[500], 0.08),
                    },
                  }}
                >
                  <Iconify
                    icon={icon}
                    width={18}
                    sx={{
                      color: field.value ? colorMain : 'text.disabled',
                      transition: 'color 0.2s',
                      flexShrink: 0,
                    }}
                  />

                  <Typography
                    variant="subtitle2"
                    sx={{
                      ml: 1.5,
                      flexGrow: 1,
                      color: field.value ? 'text.primary' : 'text.secondary',
                      fontWeight: field.value ? 600 : 400,
                      transition: 'color 0.2s',
                    }}
                  >
                    {t(labelKey)}
                  </Typography>

                  <Switch
                    size="small"
                    checked={!!field.value}
                    onChange={(e) => {
                      e.stopPropagation();
                      field.onChange(e.target.checked);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    color={group.color}
                  />
                </Stack>
              )}
            />
          ))}
        </Stack>
      </Collapse>
    </Card>
  );
}

// ----------------------------------------------------------------------

export default function AccountNotifications() {
  const { t } = useTranslate();
  const { enqueueSnackbar } = useSnackbar();

  const { preferences, preferencesLoading } = useGetNotificationPreferences();

  const defaultValues = useMemo(() => buildDefaultValues(preferences), [preferences]);

  const methods = useForm({ defaultValues });

  const {
    reset,
    watch,
    control,
    handleSubmit,
    formState: { isSubmitting, isDirty },
  } = methods;

  useEffect(() => {
    if (preferences.length) {
      reset(buildDefaultValues(preferences));
    }
  }, [preferences, reset]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      const payload = Object.entries(data).map(([event_key, enabled]) => ({
        event_key,
        enabled,
      }));
      await updateNotificationPreferences(payload);
      reset(data);
      enqueueSnackbar(t('notif_preferences_saved'));
    } catch (error) {
      enqueueSnackbar(error?.message || t('operation_failed'), { variant: 'error' });
    }
  });

  if (preferencesLoading) {
    return (
      <Stack spacing={2}>
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} variant="rounded" height={64} sx={{ borderRadius: 2 }} />
        ))}
      </Stack>
    );
  }

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Stack spacing={2} sx={{ maxWidth: 560 }}>
        {/* Sticky save button at top */}
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
            type="submit"
            variant="contained"
            size="large"
            loading={isSubmitting}
            disabled={!isDirty}
            startIcon={<Iconify icon="solar:check-circle-bold" />}
          >
            {t('save_changes')}
          </LoadingButton>
        </Stack>

        {PREFERENCE_GROUPS.map((group) => (
          <NotificationGroup
            key={group.subheaderKey}
            group={group}
            control={control}
            watch={watch}
            t={t}
          />
        ))}
      </Stack>
    </FormProvider>
  );
}

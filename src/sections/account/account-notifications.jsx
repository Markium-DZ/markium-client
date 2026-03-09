import { useMemo, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import ListItemText from '@mui/material/ListItemText';
import FormControlLabel from '@mui/material/FormControlLabel';

import FormProvider from 'src/components/hook-form';
import { useSnackbar } from 'src/components/snackbar';
import {
  useGetNotificationPreferences,
  updateNotificationPreferences,
} from 'src/api/notifications';

// ----------------------------------------------------------------------

const PREFERENCE_GROUPS = [
  {
    subheader: 'Orders',
    caption: 'Notifications related to your store orders',
    keys: [
      { key: 'order.placed', label: 'New order placed' },
      { key: 'order.status.confirmed', label: 'Order confirmed' },
      { key: 'order.status.shipped', label: 'Order shipped' },
      { key: 'order.status.delivered', label: 'Order delivered' },
      { key: 'order.status.cancelled', label: 'Order cancelled' },
      { key: 'order.status.returned', label: 'Order returned' },
    ],
  },
  {
    subheader: 'Shipments',
    caption: 'Notifications about shipment status updates',
    keys: [
      { key: 'shipment.status.created', label: 'Shipment created' },
      { key: 'shipment.status.in_transit', label: 'Shipment in transit' },
      { key: 'shipment.status.out_for_delivery', label: 'Out for delivery' },
      { key: 'shipment.status.delivered', label: 'Shipment delivered' },
      { key: 'shipment.status.failed', label: 'Delivery failed' },
      { key: 'shipment.status.returned', label: 'Shipment returned' },
    ],
  },
  {
    subheader: 'Inventory',
    caption: 'Alerts about your product stock levels',
    keys: [{ key: 'inventory.low_stock', label: 'Low stock alert' }],
  },
  {
    subheader: 'Payments',
    caption: 'Notifications about subscription and payments',
    keys: [
      { key: 'subscription.expiring_soon', label: 'Subscription expiring soon' },
      { key: 'subscription.expired', label: 'Subscription expired' },
    ],
  },
];

// Build a flat default values map: { 'order.placed': true, ... }
const buildDefaultValues = (preferences) => {
  const map = {};
  preferences.forEach(({ event_key, enabled }) => {
    map[event_key] = enabled;
  });
  return map;
};

// ----------------------------------------------------------------------

export default function AccountNotifications() {
  const { enqueueSnackbar } = useSnackbar();

  const { preferences, preferencesLoading } = useGetNotificationPreferences();

  const defaultValues = useMemo(() => buildDefaultValues(preferences), [preferences]);

  const methods = useForm({ defaultValues });

  const {
    reset,
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  // Sync form when API data loads
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
      enqueueSnackbar('Notification preferences saved');
    } catch (error) {
      enqueueSnackbar(error?.message || 'Failed to save preferences', { variant: 'error' });
    }
  });

  if (preferencesLoading) {
    return (
      <Card sx={{ p: 3 }}>
        <Stack spacing={2}>
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} height={40} />
          ))}
        </Stack>
      </Card>
    );
  }

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Stack component={Card} spacing={0} divider={<Divider />}>
        {PREFERENCE_GROUPS.map((group) => (
          <Stack key={group.subheader} spacing={2} sx={{ p: 3 }}>
            <ListItemText
              primary={group.subheader}
              secondary={group.caption}
              primaryTypographyProps={{ typography: 'h6', mb: 0.5 }}
              secondaryTypographyProps={{ component: 'span', color: 'text.secondary' }}
            />

            <Stack spacing={0.5} sx={{ pl: 1 }}>
              {group.keys.map(({ key, label }) => (
                <Controller
                  key={key}
                  name={key}
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      label={<Typography variant="body2">{label}</Typography>}
                      labelPlacement="start"
                      control={
                        <Switch
                          checked={!!field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          size="small"
                        />
                      }
                      sx={{ m: 0, width: 1, justifyContent: 'space-between' }}
                    />
                  )}
                />
              ))}
            </Stack>
          </Stack>
        ))}

        <Stack sx={{ p: 3 }} alignItems="flex-end">
          <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
            Save Changes
          </LoadingButton>
        </Stack>
      </Stack>
    </FormProvider>
  );
}

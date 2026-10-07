import PropTypes from 'prop-types';
import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { alpha } from '@mui/material/styles';

import { useTranslate, useLocales } from 'src/locales';
import { useCopyToClipboard } from 'src/hooks/use-copy-to-clipboard';
import { useSnackbar } from 'src/components/snackbar';
import { fToNow } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

const STATUS_COLOR_MAP = {
  pending: 'warning',
  in_transit: 'info',
  out_for_delivery: 'primary',
  delivered: 'success',
  failed: 'error',
  returned: 'error',
  processing: 'info',
  preparing: 'warning',
};

const STATUS_ICON_MAP = {
  pending: 'solar:clock-circle-bold',
  in_transit: 'solar:delivery-bold',
  out_for_delivery: 'solar:map-point-wave-bold',
  delivered: 'solar:verified-check-bold',
  failed: 'solar:close-circle-bold',
  returned: 'solar:undo-left-bold',
};

function getShipmentStatus(shipment) {
  return shipment?.status?.key || shipment?.status || 'pending';
}

// ----------------------------------------------------------------------

export default function OrderTracking({ order, onRefresh }) {
  const { t, i18n } = useTranslate();
  const { currentLang } = useLocales();
  const langValue = currentLang?.value || 'en';
  const { enqueueSnackbar } = useSnackbar();
  const { copy } = useCopyToClipboard();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const shipment = order?.active_shipment;
  const provider = { ...(shipment?.connection?.provider || {}), ...(shipment?.provider || {}) };
  const trackingNumber = shipment?.tracking_number;
  const trackingUrl = shipment?.tracking_url;
  const labelUrl = shipment?.label_url;
  const cost = shipment?.cost;
  const issueType = shipment?.metadata?.issue_type;
  const lastUpdated = shipment?.timestamps?.updated_at || shipment?.timestamps?.shipped_at;
  const serviceName = shipment?.service?.name || shipment?.service_name;

  const shipmentStatus = getShipmentStatus(shipment);
  const statusColor = STATUS_COLOR_MAP[shipmentStatus] || 'info';

  const customerPhone = order?.customer?.phone;

  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return;
    try {
      setIsRefreshing(true);
      await onRefresh();
      enqueueSnackbar(t('tracking_refreshed'), { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(t('error_refreshing_tracking'), { variant: 'error' });
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh, enqueueSnackbar, t]);

  const handleCopyTracking = useCallback(() => {
    if (!trackingNumber) return;
    copy(trackingNumber);
    enqueueSnackbar(t('tracking_number_copied'));
  }, [trackingNumber, copy, enqueueSnackbar, t]);

  const handleWhatsAppShare = useCallback(() => {
    if (!customerPhone || !trackingNumber) return;
    const orderNumber = order?.id ? `ORD-${order.id}` : '';
    const msg = t('tracking_share_message', { orderNumber, trackingNumber });
    window.open(`https://wa.me/${customerPhone}?text=${encodeURIComponent(msg)}`);
  }, [customerPhone, trackingNumber, order?.id, t]);

  const handleContactCustomer = useCallback(() => {
    if (!customerPhone) return;
    window.open(`https://wa.me/${customerPhone}`);
  }, [customerPhone]);

  // Read localized status label directly from API status object
  const statusObj = shipment?.status;
  const statusLabel = (() => {
    if (typeof statusObj === 'object' && statusObj !== null) {
      if (langValue === 'ar' && statusObj.name_ar) return statusObj.name_ar;
      return statusObj.name || statusObj.key || shipmentStatus;
    }
    return shipmentStatus;
  })();

  if (!shipment) return null;

  return (
    <Stack spacing={2}>
      {/* Row 1: Status + last updated + refresh */}
      <Stack direction="row" alignItems="center" spacing={1}>
        <Label variant="soft" color={statusColor}>
          {statusLabel}
        </Label>

        {lastUpdated && (
          <Typography variant="caption" sx={{ color: 'text.disabled', flexGrow: 1 }}>
            {fToNow(lastUpdated, i18n.language)}
          </Typography>
        )}

        {onRefresh && (
          <Button
            size="small"
            color="inherit"
            onClick={handleRefresh}
            disabled={isRefreshing}
            startIcon={
              <Iconify
                icon={isRefreshing ? 'svg-spinners:ring-resize' : 'eva:refresh-fill'}
                width={16}
              />
            }
          >
            {t('refresh_tracking')}
          </Button>
        )}
      </Stack>

      {/* Issue Alert (compact) */}
      {issueType && (
        <Alert
          severity={issueType === 'failed' ? 'error' : 'warning'}
          sx={{ py: 0.5 }}
          action={
            customerPhone && (
              <Button
                size="small"
                color="inherit"
                startIcon={<Iconify icon="ic:round-whatsapp" width={16} />}
                onClick={handleContactCustomer}
              >
                {t('contact_customer')}
              </Button>
            )
          }
        >
          <Typography variant="caption">
            {issueType === 'failed'
              ? t('delivery_failed_message')
              : t('customer_unreachable_message')}
          </Typography>
        </Alert>
      )}

      {/* Row 2: Provider + Tracking number */}
      <Stack direction="row" alignItems="center" spacing={2}>
        {/* Provider */}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0, flexShrink: 0 }}>
          <Avatar
            src={provider.logo}
            alt={provider.name}
            variant="rounded"
            sx={{ width: 32, height: 32, bgcolor: 'background.neutral' }}
          />
          <Stack sx={{ minWidth: 0 }}>
            <Typography variant="caption" fontWeight={600} noWrap>
              {provider.name || t('not_available')}
            </Typography>
            {serviceName && (
              <Typography variant="caption" color="text.disabled" noWrap>
                {serviceName}
              </Typography>
            )}
          </Stack>
        </Stack>

        {/* Tracking number */}
        {trackingNumber && (
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.5}
            sx={{
              ml: 'auto',
              px: 1.5,
              py: 0.75,
              borderRadius: 0.75,
              bgcolor: (theme) => theme.palette.grey[100],
            }}
          >
            <Typography variant="caption" fontFamily="monospace" fontWeight={600} noWrap>
              {trackingNumber}
            </Typography>
            <IconButton size="small" onClick={handleCopyTracking} sx={{ p: 0.25 }}>
              <Iconify icon="eva:copy-fill" width={16} />
            </IconButton>
          </Stack>
        )}
      </Stack>

      {/* Row 3: Cost + Label download */}
      {(cost?.amount || labelUrl) && (
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          {cost?.amount ? (
            <Typography variant="body2" color="text.secondary">
              {t('shipping_cost')}:{' '}
              <Box component="span" fontWeight={600} color="text.primary">
                {cost.formatted || fCurrency(cost.amount)}
              </Box>
            </Typography>
          ) : (
            <Box />
          )}

          {labelUrl && (
            <Button
              size="small"
              variant="soft"
              color="inherit"
              component="a"
              href={labelUrl}
              target="_blank"
              rel="noopener"
              startIcon={<Iconify icon="solar:document-bold" width={16} />}
            >
              {t('download_label')}
            </Button>
          )}
        </Stack>
      )}
    </Stack>
  );
}

OrderTracking.propTypes = {
  order: PropTypes.object.isRequired,
  onRefresh: PropTypes.func,
};

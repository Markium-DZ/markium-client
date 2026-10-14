import PropTypes from 'prop-types';
import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { useCopyToClipboard } from 'src/hooks/use-copy-to-clipboard';

import { fToNow } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

import { useLocales, useTranslate } from 'src/locales';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';

import { formatOrderNumber } from './utils/order-share-message';

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

function getShipmentStatus(shipment) {
  return shipment?.status?.key || shipment?.status || 'pending';
}

// ----------------------------------------------------------------------

export default function OrderTracking({ order, onRefresh, onPrintLabel, printingLabel }) {
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
    const orderNumber = formatOrderNumber(order);
    const msg = t('tracking_share_message', { orderNumber, trackingNumber });
    window.open(`https://wa.me/${customerPhone}?text=${encodeURIComponent(msg)}`);
  }, [customerPhone, trackingNumber, order, t]);

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

  // Carrier hasn't confirmed the parcel yet (job still running) → no tracking number
  const isCreating = !trackingNumber;
  const stopDeskName = shipment?.metadata?.stopdesk_name;

  const details = [
    cost?.amount ? { label: t('shipping_cost'), value: cost.formatted || fCurrency(cost.amount) } : null,
    stopDeskName ? { label: t('shipment_stop_desk'), value: stopDeskName } : null,
    lastUpdated ? { label: t('shipment_last_update'), value: fToNow(lastUpdated, i18n.language) } : null,
  ].filter(Boolean);

  return (
    <Stack spacing={2.5}>
      {/* 1. Carrier · status · refresh */}
      <Stack direction="row" alignItems="center" spacing={1.5}>
        {provider.logo ? (
          // Full logo (wide carrier logos must not be cropped into a square)
          <Box
            component="img"
            src={provider.logo}
            alt={provider.name}
            sx={{
              height: 40,
              width: 'auto',
              maxWidth: 112,
              flexShrink: 0,
              objectFit: 'contain',
              borderRadius: 0.75,
              bgcolor: 'common.white',
              border: (theme) => `1px solid ${theme.palette.divider}`,
              p: 0.5,
            }}
          />
        ) : (
          <Avatar variant="rounded" sx={{ width: 40, height: 40, bgcolor: 'background.neutral' }}>
            <Iconify icon="solar:delivery-bold" width={22} />
          </Avatar>
        )}
        <Stack sx={{ minWidth: 0, flexGrow: 1 }}>
          <Typography variant="subtitle2" noWrap>
            {provider.name || t('not_available')}
          </Typography>
          {serviceName && (
            <Typography variant="caption" color="text.secondary" noWrap>
              {serviceName}
            </Typography>
          )}
        </Stack>
        <Label variant="soft" color={isCreating ? 'default' : statusColor} sx={{ flexShrink: 0 }}>
          {isCreating ? t('shipment_creating') : statusLabel}
        </Label>
        {onRefresh && (
          <Tooltip title={t('refresh_tracking')}>
            <span>
              <IconButton size="small" onClick={handleRefresh} disabled={isRefreshing}>
                <Iconify icon={isRefreshing ? 'svg-spinners:ring-resize' : 'eva:refresh-fill'} width={18} />
              </IconButton>
            </span>
          </Tooltip>
        )}
      </Stack>

      {/* 2. Tracking number */}
      <Box
        sx={{
          p: 1.5,
          borderRadius: 1,
          bgcolor: 'background.neutral',
        }}
      >
        <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 0.5 }}>
          {t('tracking_number')}
        </Typography>
        {isCreating ? (
          <Stack direction="row" alignItems="center" spacing={1}>
            <Iconify icon="svg-spinners:ring-resize" width={16} sx={{ color: 'text.disabled' }} />
            <Typography variant="body2" color="text.secondary">
              {t('shipment_creating_hint')}
            </Typography>
          </Stack>
        ) : (
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Typography
              variant="subtitle1"
              fontFamily="monospace"
              noWrap
              sx={{ flexGrow: 1, minWidth: 0, direction: 'ltr', textAlign: 'start' }}
            >
              {trackingNumber}
            </Typography>
            <Tooltip title={t('copy')}>
              <IconButton size="small" onClick={handleCopyTracking}>
                <Iconify icon="eva:copy-fill" width={18} />
              </IconButton>
            </Tooltip>
            {customerPhone && (
              <Tooltip title={t('shipment_share_with_customer')}>
                <IconButton size="small" onClick={handleWhatsAppShare} sx={{ color: '#25D366' }}>
                  <Iconify icon="ic:round-whatsapp" width={20} />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        )}
      </Box>

      {/* 3. Details */}
      {details.length > 0 && (
        <Stack spacing={1}>
          {details.map((row) => (
            <Stack key={row.label} direction="row" justifyContent="space-between" spacing={2}>
              <Typography variant="body2" color="text.secondary">
                {row.label}
              </Typography>
              <Typography variant="body2" fontWeight={600} sx={{ textAlign: 'end' }}>
                {row.value}
              </Typography>
            </Stack>
          ))}
        </Stack>
      )}

      {/* 4. Delivery issue */}
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
            {issueType === 'failed' ? t('delivery_failed_message') : t('customer_unreachable_message')}
          </Typography>
        </Alert>
      )}

      {/* 5. Actions */}
      {(onPrintLabel || labelUrl || trackingUrl) && (
        <Stack direction="row" spacing={1}>
          {onPrintLabel && (
            <Button
              fullWidth
              variant="contained"
              onClick={onPrintLabel}
              disabled={!!printingLabel || isCreating}
              startIcon={
                <Iconify
                  icon={printingLabel ? 'svg-spinners:ring-resize' : 'solar:printer-minimalistic-bold'}
                  width={18}
                />
              }
            >
              {t('print_label')}
            </Button>
          )}

          {!onPrintLabel && labelUrl && (
            <Button
              fullWidth
              variant="contained"
              component="a"
              href={labelUrl}
              target="_blank"
              rel="noopener"
              startIcon={<Iconify icon="solar:document-bold" width={18} />}
            >
              {t('download_label')}
            </Button>
          )}

          {trackingUrl && (
            <Button
              variant="outlined"
              color="inherit"
              component="a"
              href={trackingUrl}
              target="_blank"
              rel="noopener"
              startIcon={<Iconify icon="solar:map-point-wave-bold" width={18} />}
              sx={{ flexShrink: 0 }}
            >
              {t('shipment_track')}
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
  onPrintLabel: PropTypes.func,
  printingLabel: PropTypes.bool,
};

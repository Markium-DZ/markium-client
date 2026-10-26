import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Radio from '@mui/material/Radio';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import RadioGroup from '@mui/material/RadioGroup';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControlLabel from '@mui/material/FormControlLabel';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { openExternalUrl, reserveExternalTab, getApiErrorMessage } from 'src/utils/open-external';

import { useTranslate } from 'src/locales';
import {
  useGetShippingHubs,
  createBulkShipments,
  generateShippingLabels,
  useGetShippingConnections,
} from 'src/api/shipping';

import Iconify from 'src/components/iconify';

import SelectionActionButton from './selection-action-button';
import { formatOrderNumber } from '../utils/order-share-message';
import {
  isOrderShippable,
  shipmentSupports,
  connectionSupports,
  shipmentProviderName,
} from '../utils/shipping-capabilities';

// ----------------------------------------------------------------------

const MAX_BULK_ORDERS = 500;
const MAX_LABELS = 250;

const hubLabel = (hub) =>
  [hub?.name, [hub?.commune_name, hub?.wilaya_name].filter(Boolean).join(', ')]
    .filter(Boolean)
    .join(' — ');

function ResultRow({ icon, color, primary, secondary }) {
  return (
    <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ py: 0.75 }}>
      <Iconify icon={icon} width={18} sx={{ color, mt: 0.25, flexShrink: 0 }} />
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="subtitle2">{primary}</Typography>
        {secondary && (
          <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
            {secondary}
          </Typography>
        )}
      </Box>
    </Stack>
  );
}

ResultRow.propTypes = {
  icon: PropTypes.string,
  color: PropTypes.string,
  primary: PropTypes.node,
  secondary: PropTypes.node,
};

// ----------------------------------------------------------------------

export default function OrdersBulkShippingActions({ selectedOrders, onRefresh, onClear, compact = false }) {
  const { t } = useTranslate();
  const { connections } = useGetShippingConnections();

  // ---- Ship with… ----
  const [shipOpen, setShipOpen] = useState(false);
  const [connectionId, setConnectionId] = useState('');
  const [deliveryType, setDeliveryType] = useState('as_ordered');
  const [stopdeskMode, setStopdeskMode] = useState('auto');
  const [hub, setHub] = useState(null);
  const [shipping, setShipping] = useState(false);
  const [shipResult, setShipResult] = useState(null);

  // ---- Print labels ----
  const [printing, setPrinting] = useState(false);
  const [labelsResult, setLabelsResult] = useState(null);

  const orderLabel = useCallback(
    (orderId) => {
      const order = selectedOrders.find((o) => o.id === orderId);
      return order ? formatOrderNumber(order) || `#${orderId}` : `#${orderId}`;
    },
    [selectedOrders]
  );

  const bulkConnections = useMemo(
    () =>
      // Every connected carrier: ones without a bulk API are shipped order by order by the backend
      (connections || []).filter((c) => c.is_active && !!c.credentials_validated_at),
    [connections]
  );

  const { shippable, skipped } = useMemo(() => {
    const ok = [];
    const ko = [];
    selectedOrders.forEach((o) => (isOrderShippable(o) ? ok : ko).push(o));
    return { shippable: ok, skipped: ko };
  }, [selectedOrders]);

  // Selected orders whose label can be printed in one batch document
  const printableCount = useMemo(
    () =>
      selectedOrders.filter(
        (o) => o.active_shipment?.id && shipmentSupports(o.active_shipment, 'bulk_label')
      ).length,
    [selectedOrders]
  );

  const needsHubs = shipOpen && deliveryType === 'stop_desk' && stopdeskMode === 'specific';
  const { hubs, hubsLoading, hubsError } = useGetShippingHubs(needsHubs ? connectionId : null);

  // Pre-select the default (or only) bulk-capable connection when the dialog opens
  useEffect(() => {
    if (!shipOpen || connectionId || !bulkConnections.length) return;
    const preferred = bulkConnections.find((c) => c.is_default) || bulkConnections[0];
    setConnectionId(preferred.id);
  }, [shipOpen, connectionId, bulkConnections]);

  const handleOpenShip = () => {
    setDeliveryType('as_ordered');
    setStopdeskMode('auto');
    setHub(null);
    setShipOpen(true);
  };

  const handleCloseShip = () => {
    if (!shipping) setShipOpen(false);
  };

  const handleChangeConnection = (event) => {
    setConnectionId(event.target.value);
    setHub(null);
  };

  const handleConfirmShip = async () => {
    if (!connectionId || !shippable.length) return;
    try {
      setShipping(true);
      const result = await createBulkShipments({
        orderIds: shippable.map((o) => o.id),
        connectionId,
        deliveryType,
        stopdeskId:
          deliveryType === 'stop_desk' && stopdeskMode === 'specific' ? hub?.center_id : undefined,
      });
      setShipOpen(false);
      setShipResult({ ...result, skipped });
      onRefresh?.();
    } catch (error) {
      enqueueSnackbar(getApiErrorMessage(error, t('bulk_ship_failed')), { variant: 'error' });
    } finally {
      setShipping(false);
    }
  };

  const handleCloseShipResult = () => {
    setShipResult(null);
    // Selection rows are snapshots; clear them so stale (now shipped) orders aren't reused.
    onClear?.();
  };

  // ---- Labels ----
  const handlePrintLabels = async () => {
    const withShipment = selectedOrders.filter((o) => o.active_shipment?.id);
    const supported = withShipment.filter((o) => shipmentSupports(o.active_shipment, 'bulk_label'));
    const noShipmentCount = selectedOrders.length - withShipment.length;
    const unsupportedCount = withShipment.length - supported.length;

    if (!supported.length) {
      enqueueSnackbar(t('labels_none_printable'), { variant: 'warning' });
      return;
    }

    // The backend only merges labels of one connection at a time.
    const groupsMap = new Map();
    supported.forEach((o) => {
      const key = o.active_shipment.connection?.id ?? 'unknown';
      if (!groupsMap.has(key)) {
        groupsMap.set(key, { name: shipmentProviderName(o.active_shipment), orders: [] });
      }
      groupsMap.get(key).orders.push(o);
    });
    const groups = [...groupsMap.values()];

    const tab = groups.length === 1 ? reserveExternalTab() : null;
    setPrinting(true);

    const shipmentToOrder = new Map(supported.map((o) => [o.active_shipment.id, o]));
    const files = [];
    const failed = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const group of groups) {
      const ids = group.orders.map((o) => o.active_shipment.id).slice(0, MAX_LABELS);
      try {
        // eslint-disable-next-line no-await-in-loop
        const data = await generateShippingLabels(ids, { inline: !!tab });
        if (data?.file_url) {
          files.push({ name: group.name, count: ids.length, url: data.file_url, html: data.html || null });
        }
        (data?.failed || []).forEach((f) => {
          const order = shipmentToOrder.get(f.shipment_id);
          failed.push({
            label: order ? formatOrderNumber(order) : `#${f.shipment_id}`,
            reason: [f.tracking_number, f.reason].filter(Boolean).join(' — '),
          });
        });
      } catch (error) {
        group.orders.forEach((o) =>
          failed.push({
            label: formatOrderNumber(o),
            reason: getApiErrorMessage(error, t('labels_failed')),
          })
        );
      }
    }

    setPrinting(false);

    if (tab) {
      // One document with every label, opened with the print dialog (print or "Save as PDF")
      if (files.length && files[0].html) tab.openHtml(files[0].html, files[0].url);
      else if (files.length) tab.open(files[0].url);
      else tab.cancel();
    }

    const openedDirectly = !!tab && files.length === 1;
    const needsDialog = !openedDirectly || failed.length || noShipmentCount || unsupportedCount;
    if (needsDialog) {
      setLabelsResult({
        files: openedDirectly ? [] : files,
        failed,
        noShipmentCount,
        unsupportedCount,
      });
    }
  };

  const selectedConnection = bulkConnections.find((c) => c.id === connectionId);
  // Choosing one specific stop desk needs the carrier's hubs list (ZR new platform)
  const canPickSpecificDesk = connectionSupports(selectedConnection, 'bulk_create_order');

  // Switching carrier: a stop desk chosen for another carrier doesn't apply anymore
  useEffect(() => {
    setHub(null);
    if (!canPickSpecificDesk) setStopdeskMode('auto');
  }, [connectionId, canPickSpecificDesk]);
  const tooMany = shippable.length > MAX_BULK_ORDERS;
  const canConfirm =
    !!selectedConnection &&
    shippable.length > 0 &&
    !tooMany &&
    !(deliveryType === 'stop_desk' && stopdeskMode === 'specific' && !hub);

  return (
    <>
      <SelectionActionButton
        primary
        compact={compact}
        icon="solar:delivery-bold"
        label={t('ship_with')}
        count={shippable.length}
        disabledHint={t('bulk_ship_nothing')}
        onClick={handleOpenShip}
      />

      <SelectionActionButton
        compact={compact}
        icon="solar:printer-minimalistic-bold"
        label={t('print_labels')}
        count={printableCount}
        loading={printing}
        disabledHint={t('labels_none_printable')}
        onClick={handlePrintLabels}
      />

      {/* Ship with… dialog */}
      <Dialog open={shipOpen} onClose={handleCloseShip} maxWidth="sm" fullWidth>
        <DialogTitle>{t('bulk_ship_title')}</DialogTitle>
        <DialogContent>
          {!bulkConnections.length ? (
            <Alert
              severity="info"
              action={
                <Button
                  size="small"
                  color="inherit"
                  component={RouterLink}
                  href={paths.dashboard.settings.delivery_companies}
                >
                  {t('bulk_ship_go_to_settings')}
                </Button>
              }
            >
              {t('bulk_ship_no_connection')}
            </Alert>
          ) : (
            <Stack spacing={2.5} sx={{ pt: 1 }}>
              <TextField
                select
                fullWidth
                size="small"
                label={t('bulk_ship_connection')}
                value={connectionId}
                onChange={handleChangeConnection}
              >
                {bulkConnections.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.provider?.name || c.name}
                  </MenuItem>
                ))}
              </TextField>

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                  {t('bulk_ship_delivery_type')}
                </Typography>
                <RadioGroup
                  row
                  value={deliveryType}
                  onChange={(e) => setDeliveryType(e.target.value)}
                >
                  <FormControlLabel
                    value="as_ordered"
                    control={<Radio size="small" />}
                    label={t('bulk_ship_as_ordered')}
                  />
                  <FormControlLabel value="home" control={<Radio size="small" />} label={t('bulk_ship_home')} />
                  <FormControlLabel
                    value="stop_desk"
                    control={<Radio size="small" />}
                    label={t('bulk_ship_stop_desk')}
                  />
                </RadioGroup>
              </Box>

              {deliveryType === 'stop_desk' && (
                <Stack spacing={1.5}>
                  <RadioGroup value={stopdeskMode} onChange={(e) => setStopdeskMode(e.target.value)}>
                    <FormControlLabel
                      value="auto"
                      control={<Radio size="small" />}
                      label={<Typography variant="body2">{t('bulk_ship_stopdesk_auto')}</Typography>}
                    />
                    {canPickSpecificDesk && (
                      <FormControlLabel
                        value="specific"
                        control={<Radio size="small" />}
                        label={<Typography variant="body2">{t('bulk_ship_stopdesk_specific')}</Typography>}
                      />
                    )}
                  </RadioGroup>

                  {canPickSpecificDesk && stopdeskMode === 'specific' && (
                    <Autocomplete
                      size="small"
                      options={hubs}
                      loading={hubsLoading}
                      value={hub}
                      onChange={(_, value) => setHub(value)}
                      getOptionLabel={hubLabel}
                      isOptionEqualToValue={(a, b) => String(a.center_id) === String(b.center_id)}
                      renderOption={(props, option) => (
                        <li {...props} key={String(option.center_id)}>
                          <Stack sx={{ minWidth: 0 }}>
                            <Typography variant="body2">{option.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {[option.address, option.commune_name, option.wilaya_name]
                                .filter(Boolean)
                                .join(' · ')}
                            </Typography>
                          </Stack>
                        </li>
                      )}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label={t('bulk_ship_select_hub')}
                          error={!!hubsError}
                          helperText={hubsError ? getApiErrorMessage(hubsError, t('bulk_ship_hubs_error')) : ''}
                        />
                      )}
                    />
                  )}
                </Stack>
              )}

              <Divider />

              {shippable.length ? (
                <Typography variant="body2">{t('bulk_ship_will_ship', { count: shippable.length })}</Typography>
              ) : (
                <Alert severity="warning">{t('bulk_ship_nothing')}</Alert>
              )}

              {!!skipped.length && !!shippable.length && (
                <Alert severity="info">{t('bulk_ship_skipped_note', { count: skipped.length })}</Alert>
              )}

              {tooMany && (
                <Alert severity="error">{t('bulk_ship_too_many', { max: MAX_BULK_ORDERS })}</Alert>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={handleCloseShip} disabled={shipping}>
            {t('cancel')}
          </Button>
          {!!bulkConnections.length && (
            <LoadingButton
              variant="contained"
              loading={shipping}
              disabled={!canConfirm}
              onClick={handleConfirmShip}
              startIcon={<Iconify icon="solar:delivery-bold" />}
            >
              {t('bulk_ship_confirm', { count: shippable.length })}
            </LoadingButton>
          )}
        </DialogActions>
      </Dialog>

      {/* Bulk ship result */}
      <Dialog open={!!shipResult} onClose={handleCloseShipResult} maxWidth="sm" fullWidth>
        <DialogTitle>{t('bulk_ship_result_title')}</DialogTitle>
        <DialogContent>
          {shipResult && (
            <Stack spacing={2}>
              <Alert severity={shipResult.failure_count ? 'warning' : 'success'}>
                {t('bulk_ship_result_summary', {
                  success: shipResult.success_count ?? 0,
                  total: shipResult.total ?? 0,
                })}
              </Alert>

              {shipResult.results?.some((r) => r.success) && (
                <Box>
                  <Typography variant="overline" color="success.main">
                    {t('bulk_ship_succeeded')}
                  </Typography>
                  {shipResult.results
                    .filter((r) => r.success)
                    .map((r) => (
                      <ResultRow
                        key={r.order_id}
                        icon="eva:checkmark-circle-2-fill"
                        color="success.main"
                        primary={orderLabel(r.order_id)}
                        secondary={r.tracking_number}
                      />
                    ))}
                </Box>
              )}

              {shipResult.results?.some((r) => !r.success) && (
                <Box>
                  <Typography variant="overline" color="error.main">
                    {t('bulk_ship_failures')}
                  </Typography>
                  {shipResult.results
                    .filter((r) => !r.success)
                    .map((r) => (
                      <ResultRow
                        key={r.order_id}
                        icon="eva:close-circle-fill"
                        color="error.main"
                        primary={orderLabel(r.order_id)}
                        secondary={r.error}
                      />
                    ))}
                </Box>
              )}

              {!!shipResult.skipped?.length && (
                <Typography variant="caption" color="text.secondary">
                  {t('bulk_ship_skipped_note', { count: shipResult.skipped.length })}
                </Typography>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={handleCloseShipResult}>
            {t('close')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Labels result */}
      <Dialog open={!!labelsResult} onClose={() => setLabelsResult(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('labels_result_title')}</DialogTitle>
        <DialogContent>
          {labelsResult && (
            <Stack spacing={2}>
              {labelsResult.files.map((file) => (
                <Button
                  key={file.url}
                  variant="contained"
                  startIcon={<Iconify icon="solar:printer-minimalistic-bold" />}
                  onClick={() => openExternalUrl(file.url)}
                >
                  {t('labels_open')}
                  {file.name ? ` — ${file.name}` : ''} ({file.count})
                </Button>
              ))}

              {!!labelsResult.noShipmentCount && (
                <Alert severity="info">
                  {t('labels_skipped_no_shipment', { count: labelsResult.noShipmentCount })}
                </Alert>
              )}

              {!!labelsResult.unsupportedCount && (
                <Alert severity="info">
                  {t('labels_skipped_unsupported', { count: labelsResult.unsupportedCount })}
                </Alert>
              )}

              {!!labelsResult.failed.length && (
                <Box>
                  <Typography variant="overline" color="error.main">
                    {t('labels_failed_list')}
                  </Typography>
                  {labelsResult.failed.map((f, index) => (
                    <ResultRow
                      key={`${f.label}-${index}`}
                      icon="eva:close-circle-fill"
                      color="error.main"
                      primary={f.label}
                      secondary={f.reason}
                    />
                  ))}
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setLabelsResult(null)}>
            {t('close')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

OrdersBulkShippingActions.propTypes = {
  compact: PropTypes.bool,
  selectedOrders: PropTypes.array.isRequired,
  onRefresh: PropTypes.func,
  onClear: PropTypes.func,
};

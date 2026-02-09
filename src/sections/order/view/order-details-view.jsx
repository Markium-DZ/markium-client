import PropTypes from 'prop-types';
import { useState, useCallback, useEffect, useRef } from 'react';

import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Unstable_Grid2';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import StepConnector, { stepConnectorClasses } from '@mui/material/StepConnector';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import { alpha, styled } from '@mui/material/styles';

import { paths } from 'src/routes/paths';

import { useGetOrder, updateOrder } from 'src/api/orders';
import { useGetShippingRates, refreshShippingRates, createShipment } from 'src/api/shipping';

import { RouterLink } from 'src/routes/components';

import { useSettingsContext } from 'src/components/settings';
import { useSnackbar } from 'src/components/snackbar';
import { useTranslate } from 'src/locales';
import Iconify from 'src/components/iconify';
import Label from 'src/components/label';
import EmptyContent from 'src/components/empty-content';
import { getOrderStatus, getOrderStatusColor } from 'src/constants/order-status';
import { fToNow } from 'src/utils/format-time';

import OrderDetailsInfo from '../order-details-info';
import OrderDetailsItems from '../order-details-item';
import OrderDetailsToolbar from '../order-details-toolbar';
import OrderDetailsHistory from '../order-details-history';
import OrderShipping from '../order-shipping';
import OrderDetailsSkeleton from '../order-details-skeleton';

// ----------------------------------------------------------------------

const STATUS_STEPS = ['pending', 'confirmed', 'shipment_created', 'shipped', 'delivered'];

function getActiveStep(order) {
  const status = order?.status?.key || order?.status;
  if (status === 'cancelled') return -1;
  const shipment = order?.active_shipment;

  // If order has an active shipment but status is still confirmed/pending, show shipment_created as active
  if (shipment && (status === 'confirmed' || status === 'pending')) {
    return STATUS_STEPS.indexOf('shipment_created');
  }

  const index = STATUS_STEPS.indexOf(status);
  return index >= 0 ? index : 0;
}

function getStepDate(order, stepStatus) {
  if (!order) return null;
  const ts = order.active_shipment?.timestamps;
  switch (stepStatus) {
    case 'pending': return order.created_at;
    case 'confirmed': return order.confirmed_at;
    case 'shipment_created': return ts?.created_at;
    case 'shipped': return ts?.shipped_at;
    case 'delivered': return ts?.delivered_at;
    default: return null;
  }
}

// Styled stepper connector
const StatusConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 20,
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      background: theme.palette.primary.main,
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      background: theme.palette.success.main,
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    backgroundColor: theme.palette.divider,
    borderRadius: 1,
  },
}));

function OrderStepIcon({ active, completed, status }) {
  const statusConfig = getOrderStatus(status);

  return (
    <Box
      sx={{
        width: 42,
        height: 42,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        bgcolor: (theme) => {
          if (completed) return alpha(theme.palette.success.main, 0.12);
          if (active) return alpha(theme.palette.primary.main, 0.12);
          return theme.palette.grey[100];
        },
        color: (theme) => {
          if (completed) return theme.palette.success.main;
          if (active) return theme.palette.primary.main;
          return theme.palette.grey[400];
        },
      }}
    >
      {completed ? (
        <Iconify icon="solar:check-circle-bold" width={24} />
      ) : (
        <Iconify icon={statusConfig?.icon || 'solar:question-circle-bold'} width={24} />
      )}
    </Box>
  );
}

// ----------------------------------------------------------------------

export default function OrderDetailsView({ id }) {
  const settings = useSettingsContext();
  const { enqueueSnackbar } = useSnackbar();
  const { t, i18n } = useTranslate();

  const { order: orderData, orderLoading, orderError, mutate } = useGetOrder(id);
  const currentOrder = orderData;

  const { quotes, quotesGroupedByProvider, ratesLoading, ratesError, mutate: mutateRates } = useGetShippingRates(id);

  const [status, setStatus] = useState(currentOrder?.status?.key || currentOrder?.status);
  const [selectedQuoteId, setSelectedQuoteId] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const shippingRatesRef = useRef(null);

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({ open: false, newStatus: null });

  useEffect(() => {
    if (currentOrder?.status) {
      setStatus(currentOrder.status?.key || currentOrder.status);
    }
  }, [currentOrder?.status]);

  // Open confirmation dialog instead of changing immediately
  const handleRequestStatusChange = useCallback((newValue) => {
    setConfirmDialog({ open: true, newStatus: newValue });
  }, []);

  // Execute status change after confirmation
  const handleConfirmStatusChange = useCallback(async () => {
    const newValue = confirmDialog.newStatus;
    setConfirmDialog({ open: false, newStatus: null });

    try {
      setIsUpdatingStatus(true);
      setStatus(newValue);

      await updateOrder(id, { status: newValue });
      mutate();

      enqueueSnackbar(t('operation_success'), { variant: 'success' });
    } catch (error) {
      setStatus(currentOrder?.status?.key || currentOrder?.status);
      enqueueSnackbar(t('failed_update_order_status'), { variant: 'error' });
    } finally {
      setIsUpdatingStatus(false);
    }
  }, [id, confirmDialog.newStatus, currentOrder?.status, mutate, enqueueSnackbar, t]);

  const handleCancelStatusChange = useCallback(() => {
    setConfirmDialog({ open: false, newStatus: null });
  }, []);

  const handleRefreshRates = useCallback(async () => {
    try {
      setIsRefreshing(true);
      // Sync mode blocks until backend fetches rates from all providers
      await refreshShippingRates(id);
      // Revalidate SWR to load the fresh rates in the correct shape
      await mutateRates();
      enqueueSnackbar(t('shipping_refreshed'), { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(t('error_loading_shipping'), { variant: 'error' });
    } finally {
      setIsRefreshing(false);
    }
  }, [id, mutateRates, enqueueSnackbar, t]);

  const handleSelectQuote = useCallback((quoteId) => {
    setSelectedQuoteId(Number(quoteId));
  }, []);

  // Stop desk dialog state
  const [stopdeskDialog, setStopdeskDialog] = useState({ open: false, quote: null, selectedCenterId: null });

  const executeShipment = useCallback(async (quote, metadata) => {
    try {
      await createShipment(id, {
        connectionId: quote.connection?.id,
        quoteId: quote.id,
        metadata,
      });
      // Update order status to shipped
      await updateOrder(id, { status: 'shipped' });
      setStatus('shipped');
      mutate();
      mutateRates();
      enqueueSnackbar(t('shipment_created_successfully'), { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(t('error_creating_shipment'), { variant: 'error' });
    }
  }, [id, mutate, mutateRates, enqueueSnackbar, t]);

  const handleShipOrder = useCallback(async () => {
    if (!selectedQuoteId) return;
    const selectedQuote = quotes.find(q => q.id === selectedQuoteId);
    if (!selectedQuote) return;

    // If quote has stop desk centers, show selection dialog
    const centers = selectedQuote.metadata?.centers;
    if (centers?.length > 0) {
      setStopdeskDialog({ open: true, quote: selectedQuote, selectedCenterId: null });
      return;
    }

    await executeShipment(selectedQuote, null);
  }, [selectedQuoteId, quotes, executeShipment]);

  const handleConfirmStopdesk = useCallback(async () => {
    const { quote, selectedCenterId } = stopdeskDialog;
    setStopdeskDialog({ open: false, quote: null, selectedCenterId: null });
    await executeShipment(quote, { stopdesk_id: selectedCenterId });
  }, [stopdeskDialog, executeShipment]);

  const handleCancelStopdesk = useCallback(() => {
    setStopdeskDialog({ open: false, quote: null, selectedCenterId: null });
  }, []);

  const handleScrollToShipping = useCallback(() => {
    shippingRatesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  const shippingCost = currentOrder?.total_price && currentOrder?.subtotal
    ? currentOrder.total_price - currentOrder.subtotal
    : 0;

  const activeStep = getActiveStep(currentOrder);
  const isCancelled = status === 'cancelled';

  if (orderLoading) {
    return (
      <Container maxWidth={settings.themeStretch ? false : 'lg'}>
        <OrderDetailsSkeleton />
      </Container>
    );
  }

  if (orderError || !currentOrder) {
    return (
      <Container maxWidth={settings.themeStretch ? false : 'lg'}>
        <EmptyContent
          filled
          title={t('order_not_found')}
          action={
            <Button
              component={RouterLink}
              href={paths.dashboard.order.root}
              startIcon={<Iconify icon="eva:arrow-ios-back-fill" width={16} />}
              sx={{ mt: 3 }}
            >
              {t('back_to_list')}
            </Button>
          }
          sx={{ py: 10 }}
        />
      </Container>
    );
  }

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <OrderDetailsToolbar
        backLink={paths.dashboard.order.root}
        orderNumber={currentOrder?.id ? `ORD-${currentOrder.id}` : ''}
        createdAt={currentOrder?.created_at}
        status={status}
        onChangeStatus={handleRequestStatusChange}
        onShipOrder={handleScrollToShipping}
        loading={isUpdatingStatus}
      />

      {/* Order Status Stepper */}
      <Card sx={{ mb: 3, p: 3 }}>
        {isCancelled ? (
          <Alert
            severity="error"
            icon={<Iconify icon="solar:close-circle-bold" />}
          >
            <Typography variant="subtitle2">{t('cancelled')}</Typography>
          </Alert>
        ) : (
          <Stepper
            activeStep={activeStep}
            alternativeLabel
            connector={<StatusConnector />}
          >
            {STATUS_STEPS.map((stepStatus, index) => {
              const stepDate = getStepDate(currentOrder, stepStatus);
              return (
                <Step key={stepStatus} completed={index < activeStep}>
                  <StepLabel
                    StepIconComponent={(props) => (
                      <OrderStepIcon
                        {...props}
                        status={stepStatus}
                      />
                    )}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: index <= activeStep ? 600 : 400,
                        color: index <= activeStep ? 'text.primary' : 'text.disabled',
                      }}
                    >
                      {t(stepStatus)}
                    </Typography>
                    {stepDate && (
                      <Typography
                        variant="caption"
                        sx={{ display: 'block', color: 'text.disabled', fontSize: '0.675rem' }}
                      >
                        {fToNow(stepDate, i18n.language)}
                      </Typography>
                    )}
                  </StepLabel>
                </Step>
              );
            })}
          </Stepper>
        )}
      </Card>

      {/* Main Content: Items + Shipping on left, Customer + Timeline on right */}
      <Grid container spacing={3}>
        <Grid xs={12} md={8}>
          <Stack spacing={3}>
            <OrderDetailsItems
              items={currentOrder?.items}
              shipping={shippingCost}
              discount={currentOrder?.discount || 0}
              subTotal={currentOrder?.subtotal}
              totalAmount={currentOrder?.total_price}
            />

            {(status === 'confirmed' || status === 'pending') && (
              <div ref={shippingRatesRef}>
                <OrderShipping
                  quotesGroupedByProvider={quotesGroupedByProvider}
                  loading={ratesLoading || isRefreshing}
                  error={ratesError}
                  onRefresh={handleRefreshRates}
                  onSelect={handleSelectQuote}
                  selectedQuoteId={selectedQuoteId}
                  onShip={handleShipOrder}
                />
              </div>
            )}
          </Stack>
        </Grid>

        <Grid xs={12} md={4}>
          <Stack spacing={3}>
            <OrderDetailsInfo
              customer={currentOrder?.customer}
              shippingAddress={currentOrder?.address}
            />

            <OrderDetailsHistory currentOrder={currentOrder} />
          </Stack>
        </Grid>
      </Grid>

      {/* Status Change Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={handleCancelStatusChange}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          {t('confirm')}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {t('confirm_status_change', {
                order: currentOrder?.id ? `ORD-${currentOrder.id}` : '',
                status: t(confirmDialog.newStatus),
              })}
            </Typography>

            {confirmDialog.newStatus && (
              <Stack direction="row" spacing={1} alignItems="center">
                <Label variant="soft" color={getOrderStatusColor(status)}>
                  {t(status)}
                </Label>
                <Iconify icon="eva:arrow-forward-fill" width={16} sx={{ color: 'text.disabled' }} />
                <Label variant="soft" color={getOrderStatusColor(confirmDialog.newStatus)}>
                  {t(confirmDialog.newStatus)}
                </Label>
              </Stack>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelStatusChange} color="inherit">
            {t('cancel')}
          </Button>
          <Button
            onClick={handleConfirmStatusChange}
            variant="contained"
            color={confirmDialog.newStatus === 'cancelled' ? 'error' : 'primary'}
          >
            {t('confirm')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Stop Desk Center Selection Dialog */}
      <Dialog
        open={stopdeskDialog.open}
        onClose={handleCancelStopdesk}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('select_stopdesk')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {stopdeskDialog.quote?.service_name}
          </Typography>

          <RadioGroup
            value={stopdeskDialog.selectedCenterId ?? ''}
            onChange={(e) =>
              setStopdeskDialog((prev) => ({ ...prev, selectedCenterId: Number(e.target.value) }))
            }
          >
            <Stack spacing={1.5}>
              {stopdeskDialog.quote?.metadata?.centers?.map((center) => (
                <Box
                  key={center.center_id}
                  onClick={() =>
                    setStopdeskDialog((prev) => ({ ...prev, selectedCenterId: center.center_id }))
                  }
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    cursor: 'pointer',
                    border: (theme) =>
                      `1px solid ${
                        stopdeskDialog.selectedCenterId === center.center_id
                          ? theme.palette.primary.main
                          : theme.palette.divider
                      }`,
                    bgcolor:
                      stopdeskDialog.selectedCenterId === center.center_id
                        ? 'action.selected'
                        : 'background.paper',
                    transition: 'all 0.2s',
                    '&:hover': { bgcolor: 'action.hover', borderColor: 'primary.main' },
                  }}
                >
                  <FormControlLabel
                    value={center.center_id}
                    control={<Radio size="small" />}
                    sx={{ m: 0, width: '100%', alignItems: 'flex-start' }}
                    label={
                      <Stack spacing={0.5} sx={{ ml: 0.5 }}>
                        <Typography variant="subtitle2">{center.name}</Typography>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <Iconify icon="solar:map-point-bold" width={14} sx={{ color: 'text.disabled' }} />
                          <Typography variant="caption" color="text.secondary">
                            {center.address}
                          </Typography>
                        </Stack>
                        <Typography variant="caption" color="text.disabled">
                          {center.commune_name}
                        </Typography>
                      </Stack>
                    }
                  />
                </Box>
              ))}
            </Stack>
          </RadioGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelStopdesk} color="inherit">
            {t('cancel')}
          </Button>
          <Button
            onClick={handleConfirmStopdesk}
            variant="contained"
            disabled={!stopdeskDialog.selectedCenterId}
            startIcon={<Iconify icon="solar:delivery-bold" />}
          >
            {t('ship_order')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

OrderDetailsView.propTypes = {
  id: PropTypes.string,
};

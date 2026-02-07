import PropTypes from 'prop-types';
import { useState, useCallback, useEffect } from 'react';

import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Unstable_Grid2';
import Card from '@mui/material/Card';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Box from '@mui/material/Box';

import { paths } from 'src/routes/paths';

import { ORDER_STATUS_OPTIONS } from 'src/_mock';
import { useGetOrder, updateOrder } from 'src/api/orders';
import { useGetShippingRates, refreshShippingRates, createShipment } from 'src/api/shipping';

import { useSettingsContext } from 'src/components/settings';
import { useSnackbar } from 'src/components/snackbar';
import { useTranslate } from 'src/locales';
import Iconify from 'src/components/iconify';

import OrderDetailsInfo from '../order-details-info';
import OrderDetailsItems from '../order-details-item';
import OrderDetailsToolbar from '../order-details-toolbar';
import OrderDetailsHistory from '../order-details-history';
import OrderShippingRates from '../order-shipping-rates';

// ----------------------------------------------------------------------

export default function OrderDetailsView({ id }) {
  const settings = useSettingsContext();
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslate();

  const { order: orderData, orderLoading, mutate } = useGetOrder(id);
  const currentOrder = orderData;

  // Fetch shipping rates for this order
  const { quotes, quotesGroupedByProvider, ratesLoading, ratesError, mutate: mutateRates } = useGetShippingRates(id);

  const [status, setStatus] = useState(currentOrder?.status);
  const [selectedQuoteId, setSelectedQuoteId] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);

  // Update status state when order data loads
  useEffect(() => {
    if (currentOrder?.status) {
      setStatus(currentOrder.status);
    }
  }, [currentOrder?.status]);

  const handleChangeStatus = useCallback(async (newValue) => {
    try {
      setStatus(newValue);

      await updateOrder(id, { status: newValue });

      // Refresh order data
      mutate();

      enqueueSnackbar(t("operation_success"), { variant: 'success' });
    } catch (error) {
      // Revert status on error
      setStatus(currentOrder?.status);

      enqueueSnackbar(t('failed_update_order_status'), { variant: 'error' });
    }
  }, [id, currentOrder?.status, mutate, enqueueSnackbar]);

  // Handle shipping rate refresh
  const handleRefreshRates = useCallback(async () => {
    try {
      setIsRefreshing(true);
      // Call the refresh API endpoint to fetch new rates
      await refreshShippingRates(id);
      // Then refresh the local data
      await mutateRates();
      enqueueSnackbar(t('shipping_rates_refreshed'), { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(t('error_loading_shipping_rates'), { variant: 'error' });
    } finally {
      setIsRefreshing(false);
    }
  }, [id, mutateRates, enqueueSnackbar, t]);

  // Handle shipping rate selection
  const handleSelectQuote = useCallback((quoteId) => {
    setSelectedQuoteId(quoteId);
  }, []);

  // Handle ship order
  const handleShipOrder = useCallback(async () => {
    if (!selectedQuoteId) return;
    const selectedQuote = quotes.find(q => q.id === selectedQuoteId);
    if (!selectedQuote) return;
    try {
      await createShipment(id, {
        connectionId: selectedQuote.connection?.id,
        quoteId: selectedQuoteId,
      });
      mutate();
      mutateRates();
      enqueueSnackbar(t('shipment_created_successfully'), { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(t('error_creating_shipment'), { variant: 'error' });
    }
  }, [id, selectedQuoteId, quotes, mutate, mutateRates, enqueueSnackbar, t]);

  // Handle tab change
  const handleTabChange = useCallback((event, newValue) => {
    setCurrentTab(newValue);
  }, []);

  // Calculate shipping cost (difference between total_price and subtotal)
  const shippingCost = currentOrder?.total_price && currentOrder?.subtotal
    ? currentOrder.total_price - currentOrder.subtotal
    : 0;

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <OrderDetailsToolbar
        backLink={paths.dashboard.order.root}
        orderNumber={currentOrder?.id ? `ORD-${currentOrder.id}` : ''}
        createdAt={currentOrder?.created_at}
        status={status}
        onChangeStatus={handleChangeStatus}
        statusOptions={ORDER_STATUS_OPTIONS}
      />

      {/* Tabs Navigation */}
      <Card sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          aria-label="order details tabs"
          textColor="primary"
        >
          <Tab
            icon={<Iconify icon="solar:bag-4-bold-duotone" />}
            iconPosition="start"
            label={t('order_items')}
          />
          <Tab
            icon={<Iconify icon="solar:user-bold-duotone" />}
            iconPosition="start"
            label={t('customer_info')}
          />
          <Tab
            icon={<Iconify icon="solar:delivery-bold-duotone" />}
            iconPosition="start"
            label={t('shipping_rates')}
          />
        </Tabs>
      </Card>

      {/* Tab Content */}
      <Box>
        {currentTab === 0 && (
          <OrderDetailsItems
            items={currentOrder?.items}
            shipping={shippingCost}
            discount={currentOrder?.discount || 0}
            subTotal={currentOrder?.subtotal}
            totalAmount={currentOrder?.total_price}
          />
        )}

        {currentTab === 1 && (
          <Grid container spacing={3}>
            <Grid xs={12} md={6}>
              <OrderDetailsInfo
                customer={currentOrder?.customer}
                shippingAddress={currentOrder?.address}
              />
            </Grid>
            <Grid xs={12} md={6}>
              <OrderDetailsHistory currentOrder={currentOrder} history={currentOrder?.history} />
            </Grid>
          </Grid>
        )}

        {currentTab === 2 && (
          <OrderShippingRates
            quotesGroupedByProvider={quotesGroupedByProvider}
            loading={ratesLoading || isRefreshing}
            error={ratesError}
            onRefresh={handleRefreshRates}
            onSelect={handleSelectQuote}
            selectedQuoteId={selectedQuoteId}
            onShip={handleShipOrder}
          />
        )}
      </Box>
    </Container>
  );
}

OrderDetailsView.propTypes = {
  id: PropTypes.string,
};

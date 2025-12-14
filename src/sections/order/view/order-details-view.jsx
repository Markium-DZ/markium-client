import PropTypes from 'prop-types';
import { useState, useCallback, useEffect } from 'react';

import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Unstable_Grid2';

import { paths } from 'src/routes/paths';

import { ORDER_STATUS_OPTIONS } from 'src/_mock';
import { useGetOrder, updateOrder } from 'src/api/orders';

import { useSettingsContext } from 'src/components/settings';
import { useSnackbar } from 'src/components/snackbar';

import OrderDetailsInfo from '../order-details-info';
import OrderDetailsItems from '../order-details-item';
import OrderDetailsToolbar from '../order-details-toolbar';
import OrderDetailsHistory from '../order-details-history';

// ----------------------------------------------------------------------

export default function OrderDetailsView({ id }) {
  const settings = useSettingsContext();
  const { enqueueSnackbar } = useSnackbar();

  const { order: orderData, orderLoading, mutate } = useGetOrder(id);
  const currentOrder = orderData;

  const [status, setStatus] = useState(currentOrder?.status);

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
      console.error('Failed to update order status:', error);

      // Revert status on error
      setStatus(currentOrder?.status);

      enqueueSnackbar('Failed to update order status', { variant: 'error' });
    }
  }, [id, currentOrder?.status, mutate, enqueueSnackbar]);

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

      <Grid container spacing={3}>
        <Grid xs={12} md={8}>
          <Stack spacing={3} direction={{ xs: 'column-reverse', md: 'column' }}>
            <OrderDetailsItems
              items={currentOrder?.items}
              shipping={shippingCost}
              discount={currentOrder?.discount || 0}
              subTotal={currentOrder?.subtotal}
              totalAmount={currentOrder?.total_price}
            />

            <OrderDetailsHistory history={currentOrder?.history} />
          </Stack>
        </Grid>

        <Grid xs={12} md={4}>
          <OrderDetailsInfo
            customer={currentOrder?.customer}
            shippingAddress={currentOrder?.address}
          />
        </Grid>
      </Grid>
    </Container>
  );
}

OrderDetailsView.propTypes = {
  id: PropTypes.string,
};

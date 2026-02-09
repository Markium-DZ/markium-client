import { useState } from 'react';
import { useParams } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { alpha } from '@mui/material/styles';

import { useTranslate } from 'src/locales';
import { useGetInventoryItem, updateInventoryQuantity } from 'src/api/inventory';
import { paths } from 'src/routes/paths';
import { LoadingScreen } from 'src/components/loading-screen';
import { useSnackbar } from 'src/components/snackbar';
import Iconify from 'src/components/iconify';
import ZaityHeadContainer from 'src/sections/ZaityTables/ZaityHeadContainer';
import InventoryAdjustmentDialog from 'src/sections/inventory/inventory-adjustment-dialog';
import { fCurrency } from 'src/utils/format-number';
import { fDateTime } from 'src/utils/format-time';
import { RouterLink } from 'src/routes/components';
import { useRouter } from 'src/routes/hooks';

// ----------------------------------------------------------------------

export default function InventoryDetailsView() {
  const { t } = useTranslate();
  const { id } = useParams();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const [newQuantity, setNewQuantity] = useState('');
  const [updating, setUpdating] = useState(false);
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);

  const { inventoryItem, inventoryItemLoading, inventoryItemError, mutate } = useGetInventoryItem(id);

  // Get stock status
  const getStockStatus = (item) => {
    if (!item) return null;
    if (item.is_out_of_stock) {
      return { label: t('out_of_stock'), color: 'error' };
    }
    if (item.is_low_stock) {
      return { label: t('low_stock'), color: 'warning' };
    }
    return { label: t('in_stock'), color: 'success' };
  };

  // Handle quantity update
  const handleUpdateQuantity = async () => {
    if (!newQuantity || newQuantity < 0) {
      enqueueSnackbar(t('please_enter_valid_quantity'), { variant: 'error' });
      return;
    }

    try {
      setUpdating(true);
      await updateInventoryQuantity(id, parseInt(newQuantity, 10));
      await mutate();
      enqueueSnackbar(t('inventory_updated_successfully'), { variant: 'success' });
      setNewQuantity('');
    } catch (error) {
      console.error('Failed to update inventory:', error);
      enqueueSnackbar(error.message || t('failed_to_update_inventory'), { variant: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  if (inventoryItemLoading) {
    return <LoadingScreen />;
  }

  if (inventoryItemError || !inventoryItem) {
    return (
      <ZaityHeadContainer
        heading={t('inventory')}
        links={[
          { name: t('dashboard'), href: paths.dashboard.root },
          { name: t('inventory'), href: paths.dashboard.inventory.root },
          { name: t('details') },
        ]}
      >
        <Card sx={{ p: 5, textAlign: 'center' }}>
          <Iconify icon="solar:box-bold" width={64} sx={{ color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            {t('inventory_item_not_found')}
          </Typography>
          <Button
            component={RouterLink}
            href={paths.dashboard.inventory.root}
            startIcon={<Iconify icon="eva:arrow-ios-back-fill" width={16} />}
            sx={{ mt: 2 }}
          >
            {t('back_to_list')}
          </Button>
        </Card>
      </ZaityHeadContainer>
    );
  }

  const stockStatus = getStockStatus(inventoryItem);

  return (
    <ZaityHeadContainer
      heading={inventoryItem.product?.name || t('inventory_details')}
      links={[
        { name: t('dashboard'), href: paths.dashboard.root },
        { name: t('inventory'), href: paths.dashboard.inventory.root },
        { name: inventoryItem.product?.name || t('details') },
      ]}
      action={
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="solar:box-bold" />}
            onClick={() => router.push(paths.dashboard.inventory.items(id))}
          >
            {t('view_items')}
          </Button>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="solar:history-bold" />}
            onClick={() => router.push(paths.dashboard.inventory.tracking(id))}
          >
            {t('view_tracking')}
          </Button>
        </Stack>
      }
    >
      <Grid container spacing={3}>
        {/* Product Image and Basic Info */}
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3 }}>
            <Stack spacing={3}>
              {/* Product Image */}
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  paddingTop: '100%',
                  bgcolor: (theme) => alpha(theme.palette.grey[500], 0.08),
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                {(() => {
                  // Handle media as array or single object
                  const mediaArray = Array.isArray(inventoryItem.variant?.media)
                    ? inventoryItem.variant.media
                    : (inventoryItem.variant?.media ? [inventoryItem.variant.media] : []);
                  const mediaUrl = mediaArray.length > 0 ? mediaArray[0]?.full_url : null;

                  return mediaUrl ? (
                    <Box
                      component="img"
                      src={mediaUrl}
                      alt={inventoryItem.product?.name}
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      <Iconify icon="solar:box-bold" width={64} sx={{ color: 'text.disabled' }} />
                    </Box>
                  );
                })()}
              </Box>

              {/* Product Name */}
              <Box>
                <Typography variant="overline" color="text.secondary">
                  {t('product')}
                </Typography>
                <Typography variant="h6">{inventoryItem.product?.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('ref')}: {inventoryItem.product?.ref}
                </Typography>
              </Box>

              {/* Stock Status */}
              {stockStatus && (
                <Box>
                  <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    {t('status')}
                  </Typography>
                  <Chip label={stockStatus.label} color={stockStatus.color} variant="soft" />
                </Box>
              )}
            </Stack>
          </Card>
        </Grid>

        {/* Inventory Details */}
        <Grid item xs={12} md={8}>
          <Stack spacing={3}>
            {/* Variant Information */}
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3 }}>
                {t('variant')} {t('details')}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="overline" color="text.secondary">
                    {t('sku')}
                  </Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                    {inventoryItem.sku}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="overline" color="text.secondary">
                    {t('price')}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {fCurrency(inventoryItem.variant?.price)}
                  </Typography>
                </Grid>
                {inventoryItem.variant?.options && inventoryItem.variant.options.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                      {t('options')}
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                      {inventoryItem.variant.options.map((option, index) => (
                        <Chip
                          key={index}
                          label={`${option.name}: ${option.value}`}
                          size="small"
                          sx={{
                            bgcolor: option.color_hex || undefined,
                            color: option.color_hex ? 'white' : undefined,
                          }}
                        />
                      ))}
                    </Stack>
                  </Grid>
                )}
              </Grid>
            </Card>

            {/* Inventory Quantities */}
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3 }}>
                {t('inventory')} {t('information')}
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                  <Stack spacing={1}>
                    <Typography variant="overline" color="text.secondary">
                      {t('total')} {t('quantity')}
                    </Typography>
                    <Typography variant="h4">{inventoryItem.quantity}</Typography>
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Stack spacing={1}>
                    <Typography variant="overline" color="text.secondary">
                      {t('reserved')}
                    </Typography>
                    <Typography variant="h4" color="warning.main">
                      {inventoryItem.reserved_quantity}
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Stack spacing={1}>
                    <Typography variant="overline" color="text.secondary">
                      {t('available')}
                    </Typography>
                    <Typography variant="h4" color="primary.main">
                      {inventoryItem.available_quantity}
                    </Typography>
                  </Stack>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              {/* Adjust Quantity */}
              <Box>
                <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="subtitle2">
                      {t('adjust_inventory')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('adjust_inventory_description')}
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={<Iconify icon="solar:slider-vertical-bold" />}
                    onClick={() => setAdjustmentDialogOpen(true)}
                  >
                    {t('adjust')}
                  </Button>
                </Stack>
              </Box>
            </Card>

            {/* Additional Settings */}
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3 }}>
                {t('settings')}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="overline" color="text.secondary">
                    {t('track_quantity')}
                  </Typography>
                  <Typography variant="body1">
                    {inventoryItem.track_quantity ? t('yes') : t('no')}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="overline" color="text.secondary">
                    {t('allow_backorder')}
                  </Typography>
                  <Typography variant="body1">
                    {inventoryItem.allow_backorder ? t('yes') : t('no')}
                  </Typography>
                </Grid>
                {inventoryItem.low_stock_threshold && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="overline" color="text.secondary">
                      {t('low_stock_threshold')}
                    </Typography>
                    <Typography variant="body1">{inventoryItem.low_stock_threshold}</Typography>
                  </Grid>
                )}
              </Grid>
            </Card>

            {/* Timestamps */}
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3 }}>
                {t('history')}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="overline" color="text.secondary">
                    {t('created_at')}
                  </Typography>
                  <Typography variant="body2">{fDateTime(inventoryItem.created_at)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="overline" color="text.secondary">
                    {t('updated_at')}
                  </Typography>
                  <Typography variant="body2">{fDateTime(inventoryItem.updated_at)}</Typography>
                </Grid>
              </Grid>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      <InventoryAdjustmentDialog
        open={adjustmentDialogOpen}
        onClose={() => setAdjustmentDialogOpen(false)}
        inventoryItem={inventoryItem}
        onSuccess={mutate}
      />
    </ZaityHeadContainer>
  );
}

import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import { alpha } from '@mui/material/styles';

import { useTranslate } from 'src/locales';
import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function InventoryDetailsInfo({ inventoryItem }) {
  const { t } = useTranslate();

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

  const stockStatus = getStockStatus(inventoryItem);

  const renderProduct = (
    <Card sx={{ mb: 3 }}>
      <CardHeader title={t('product')} />
      <Stack spacing={3} sx={{ p: 3 }}>
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
          {inventoryItem?.variant?.media?.full_url ? (
            <Box
              component="img"
              src={inventoryItem.variant.media.full_url}
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
          )}
        </Box>

        {/* Product Name */}
        <Box>
          <Typography variant="overline" color="text.secondary">
            {t('product')}
          </Typography>
          <Typography variant="h6">{inventoryItem?.product?.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('ref')}: {inventoryItem?.product?.ref}
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
  );

  const renderSettings = (
    <Card>
      <CardHeader title={t('settings')} />
      <Stack spacing={2} sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="body2" color="text.secondary">
            {t('track_quantity')}
          </Typography>
          <Typography variant="subtitle2">
            {inventoryItem?.track_quantity ? t('yes') : t('no')}
          </Typography>
        </Stack>

        <Stack direction="row" justifyContent="space-between">
          <Typography variant="body2" color="text.secondary">
            {t('allow_backorder')}
          </Typography>
          <Typography variant="subtitle2">
            {inventoryItem?.allow_backorder ? t('yes') : t('no')}
          </Typography>
        </Stack>

        {inventoryItem?.low_stock_threshold && (
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">
              {t('low_stock_threshold')}
            </Typography>
            <Typography variant="subtitle2">{inventoryItem.low_stock_threshold}</Typography>
          </Stack>
        )}
      </Stack>
    </Card>
  );

  return (
    <>
      {renderProduct}
      {renderSettings}
    </>
  );
}

InventoryDetailsInfo.propTypes = {
  inventoryItem: PropTypes.object,
};

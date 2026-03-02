import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';

import { fCurrency } from 'src/utils/format-number';
import { useTranslate } from 'src/locales';
import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

// ----------------------------------------------------------------------

export default function InventoryMobileCard({ row, onOpenAdjustment }) {
  const { t } = useTranslate();

  // Get image from variant media
  const mediaArray = Array.isArray(row.variant?.media)
    ? row.variant.media
    : (row.variant?.media ? [row.variant.media] : []);
  const imageUrl = mediaArray.length > 0 ? (mediaArray[0]?.full_url || mediaArray[0]?.url || '') : '';

  // Get stock status
  const getStockStatus = () => {
    if (row.is_out_of_stock) return { label: t('out_of_stock'), color: 'error' };
    if (row.is_low_stock) return { label: t('low_stock'), color: 'warning' };
    return { label: t('in_stock'), color: 'success' };
  };

  const stockStatus = getStockStatus();

  // Format variant options
  const optionsText = row.variant?.options
    ?.map((opt) => `${opt.name}: ${opt.value}`)
    .join(' / ') || '';

  return (
    <Card
      component={RouterLink}
      to={paths.dashboard.inventory.details(row.id)}
      sx={{
        p: 2,
        mb: 1.5,
        textDecoration: 'none',
        color: 'inherit',
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      <Stack direction="row" spacing={1.5}>
        {/* Product image */}
        <Avatar
          src={imageUrl}
          alt={row.product?.name}
          variant="rounded"
          sx={{ width: 52, height: 52, flexShrink: 0 }}
        />

        {/* Info */}
        <Stack sx={{ flexGrow: 1, minWidth: 0 }} spacing={0.5}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Typography variant="subtitle2" noWrap sx={{ flexGrow: 1, mr: 1 }}>
              {row.product?.name}
            </Typography>

            <Chip
              label={stockStatus.label}
              color={stockStatus.color}
              size="small"
              variant="soft"
              sx={{ height: 22, fontSize: 11, flexShrink: 0 }}
            />
          </Stack>

          {optionsText && (
            <Typography variant="caption" color="text.secondary" noWrap>
              {optionsText}
            </Typography>
          )}

          {/* Quantity row */}
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="caption" color="text.secondary">
              {t('quantity')}: <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>{row.quantity}</Box>
            </Typography>

            <Typography variant="caption" color="text.secondary">
              {t('available')}: <Box component="span" sx={{ fontWeight: 700, color: 'primary.main' }}>{row.available_quantity}</Box>
            </Typography>

            {row.variant?.price && (
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {fCurrency(row.variant.price)}
              </Typography>
            )}
          </Stack>
        </Stack>
      </Stack>
    </Card>
  );
}

InventoryMobileCard.propTypes = {
  row: PropTypes.object,
  onOpenAdjustment: PropTypes.func,
};

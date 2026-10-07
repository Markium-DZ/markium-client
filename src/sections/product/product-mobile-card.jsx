import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';

import { fCurrency } from 'src/utils/format-number';
import { fDate } from 'src/utils/format-time';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import CustomPopover, { usePopover } from 'src/components/custom-popover';
import { useTranslate } from 'src/locales';

// ----------------------------------------------------------------------

export default function ProductMobileCard({ product, onViewRow, onEditRow, onDeleteRow }) {
  const { t } = useTranslate();
  const popover = usePopover();

  const defaultVariant = product.variants?.find((v) => v.is_default) || product.variants?.[0];
  const variantMedia = defaultVariant?.media;
  let imageUrl = '';

  if (Array.isArray(variantMedia) && variantMedia.length > 0) {
    imageUrl = variantMedia[0]?.full_url || variantMedia[0]?.url || '';
  } else if (variantMedia && typeof variantMedia === 'object') {
    imageUrl = variantMedia.full_url || variantMedia.url || '';
  } else if (product.images?.[0]) {
    imageUrl = product.images[0];
  }

  return (
    <>
      <Card sx={{ p: 1.5, mb: 1 }}>
        <Stack direction="row" spacing={2}>
          {/* Product image */}
          <Avatar
            alt={product.name}
            src={imageUrl}
            variant="rounded"
            sx={{ width: 64, height: 64, flexShrink: 0 }}
          />

          {/* Product info */}
          <Stack sx={{ flexGrow: 1, minWidth: 0 }} spacing={0.5}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Typography
                variant="subtitle2"
                onClick={onViewRow}
                sx={{
                  cursor: 'pointer',
                  '&:hover': { textDecoration: 'underline' },
                  flexGrow: 1,
                  mr: 1,
                }}
              >
                {product.name}
              </Typography>

              <IconButton size="small" onClick={popover.onOpen} sx={{ flexShrink: 0 }}>
                <Iconify icon="eva:more-vertical-fill" width={18} />
              </IconButton>
            </Stack>

            {/* Price row */}
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="subtitle2" color="primary.main">
                {fCurrency(product.sale_price)}
              </Typography>

              {product.has_discount && (
                <Typography
                  variant="caption"
                  sx={{ textDecoration: 'line-through', color: 'text.disabled' }}
                >
                  {fCurrency(product.real_price)}
                </Typography>
              )}

              {product.has_discount && (
                <Label variant="soft" color="success" sx={{ height: 20, fontSize: 10 }}>
                  -{product.discount_percentage}%
                </Label>
              )}
            </Stack>

            {/* Status chips row */}
            <Stack direction="row" spacing={0.75} flexWrap="wrap" sx={{ mt: 0.5 }}>
              <Label
                variant="soft"
                color={product.is_in_stock ? 'success' : 'error'}
                sx={{ height: 22, fontSize: 11 }}
              >
                {product.is_in_stock ? t('in_stock') : t('out_of_stock')}
              </Label>

              <Label
                variant="soft"
                color={product.status === 'deployed' ? 'success' : 'warning'}
                sx={{ height: 22, fontSize: 11 }}
              >
                {product.status}
              </Label>

              {product.quantity != null && (
                <Typography variant="caption" color="text.secondary">
                  {t('quantity')}: {product.quantity}
                </Typography>
              )}
            </Stack>

            {product.created_at && (
              <Typography variant="caption" color="text.disabled">
                {fDate(product.created_at)}
              </Typography>
            )}
          </Stack>
        </Stack>
      </Card>

      <CustomPopover open={popover.open} onClose={popover.onClose} arrow="right-top" sx={{ width: 140 }}>
        <MenuItem
          onClick={() => {
            onViewRow();
            popover.onClose();
          }}
        >
          <Iconify icon="solar:eye-bold" />
          {t('view')}
        </MenuItem>

        <MenuItem
          onClick={() => {
            onEditRow();
            popover.onClose();
          }}
        >
          <Iconify icon="solar:pen-bold" />
          {t('edit')}
        </MenuItem>

        <MenuItem
          onClick={() => {
            onDeleteRow();
            popover.onClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" />
          {t('delete')}
        </MenuItem>
      </CustomPopover>
    </>
  );
}

ProductMobileCard.propTypes = {
  product: PropTypes.object,
  onViewRow: PropTypes.func,
  onEditRow: PropTypes.func,
  onDeleteRow: PropTypes.func,
};

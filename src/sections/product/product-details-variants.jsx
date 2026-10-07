import PropTypes from 'prop-types';
import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import MenuItem from '@mui/material/MenuItem';

import { useTranslate } from 'src/locales';
import { fCurrency } from 'src/utils/format-number';
import Iconify from 'src/components/iconify';
import CustomPopover, { usePopover } from 'src/components/custom-popover';
import Label from 'src/components/label';

import ProductVariantEditDialog from './product-variant-edit-dialog';
import AddOptionValueDialog from './product-add-option-value-dialog';

// ----------------------------------------------------------------------

export default function ProductDetailsVariants({ product, optionDefinitions, onRefresh }) {
  const { t } = useTranslate();
  const variants = product?.variants || [];
  const hasOptionDefinitions = (product?.option_definitions || []).length > 0;

  const [selectedVariant, setSelectedVariant] = useState(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);

  const handleEditVariant = (variant) => {
    setSelectedVariant(variant);
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setSelectedVariant(null);
  };

  const handleEditSuccess = () => {
    onRefresh?.();
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header with Add button */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Typography variant="h6">{t('product_variants')}</Typography>
        {hasOptionDefinitions && (
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:add-circle-bold" width={16} />}
            onClick={() => setOpenAddDialog(true)}
          >
            {t('add_option_value')}
          </Button>
        )}
      </Stack>

      {/* Variants List */}
      <Stack spacing={2}>
        {variants.length > 0 ? (
          variants.map((variant, index) => (
            <VariantCard
              key={variant.id || index}
              variant={variant}
              optionDefinitions={optionDefinitions}
              onEdit={() => handleEditVariant(variant)}
            />
          ))
        ) : (
          <Card sx={{ p: 5, textAlign: 'center' }}>
            <Iconify icon="solar:box-bold" width={64} sx={{ color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              {t('no_variants_yet')}
            </Typography>
            <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
              {t('no_variants_description')}
            </Typography>
          </Card>
        )}
      </Stack>

      {/* Edit Variant Dialog */}
      <ProductVariantEditDialog
        open={openEditDialog}
        onClose={handleCloseEditDialog}
        variant={selectedVariant}
        productId={product?.id}
        onSuccess={handleEditSuccess}
      />

      {/* Add Option Value Dialog */}
      <AddOptionValueDialog
        open={openAddDialog}
        onClose={() => setOpenAddDialog(false)}
        product={product}
        onRefresh={onRefresh}
      />
    </Box>
  );
}

ProductDetailsVariants.propTypes = {
  product: PropTypes.object,
  optionDefinitions: PropTypes.array,
  onRefresh: PropTypes.func,
};

// ----------------------------------------------------------------------

function VariantCard({ variant, optionDefinitions, onEdit }) {
  const { t } = useTranslate();
  const popover = usePopover();

  const getOptionLabel = (option) => ({
    name: option.definition_name || option.name || '',
    value: option.value || '',
    colorHex: option.color_hex || null,
  });

  return (
    <Card sx={{ p: 3 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={3}
      >
        {/* Variant Image */}
        <Box
          sx={{
            flexShrink: 0,
            width: { xs: '100%', sm: 120 },
            height: { xs: 200, sm: 120 },
            borderRadius: 1.5,
            overflow: 'hidden',
            bgcolor: 'background.neutral',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          {variant.media && variant.media.length > 0 ? (
            <Box
              component="img"
              src={variant.media[0]?.full_url || ''}
              alt={variant.sku || ''}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          ) : (
            <Iconify icon="solar:camera-bold-duotone" width={32} sx={{ color: 'text.disabled' }} />
          )}
        </Box>

        {/* Variant Details */}
        <Box sx={{ flexGrow: 1 }}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
            <Box>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                sx={{ mb: 1 }}
              >
                <Typography variant="h6">{variant.sku || t('no_sku')}</Typography>
                <Stack direction="row" spacing={1}>
                  {variant.is_default && (
                    <Label color="info" variant="soft">
                      {t('default')}
                    </Label>
                  )}
                  {!variant.is_active && (
                    <Label color="error" variant="soft">
                      {t('inactive')}
                    </Label>
                  )}
                </Stack>
              </Stack>

              {/* Options */}
              <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
                {variant.options?.map((option, idx) => {
                  const { name, value, colorHex } = getOptionLabel(option);
                  if (!name && !value) return null;
                  return (
                    <Chip
                      key={idx}
                      size="small"
                      label={name && value ? `${name}: ${value}` : (name || value)}
                      icon={
                        colorHex ? (
                          <Box
                            sx={{
                              width: 16,
                              height: 16,
                              borderRadius: '50%',
                              bgcolor: colorHex,
                              border: '1px solid',
                              borderColor: 'divider',
                            }}
                          />
                        ) : undefined
                      }
                    />
                  );
                })}
              </Stack>

              {/* Price and Stock */}
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={{ xs: 2, sm: 3 }}
                sx={{ mb: 1 }}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {t('price')}
                  </Typography>
                  <Typography variant="subtitle2">{fCurrency(variant.price)}</Typography>
                </Box>

                {variant.compare_at_price && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {t('compare_at_price')}
                    </Typography>
                    <Typography variant="subtitle2" sx={{ textDecoration: 'line-through' }}>
                      {fCurrency(variant.compare_at_price)}
                    </Typography>
                  </Box>
                )}

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {t('quantity')}
                  </Typography>
                  <Typography variant="subtitle2">{variant.quantity || 0}</Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {t('available')}
                  </Typography>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      color: variant.available_quantity > 0 ? 'success.main' : 'error.main',
                    }}
                  >
                    {variant.available_quantity || 0}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {t('status')}
                  </Typography>
                  <Typography variant="subtitle2">
                    <Chip
                      size="small"
                      label={variant.is_in_stock ? t('in_stock') : t('out_of_stock')}
                      color={variant.is_in_stock ? 'success' : 'error'}
                      variant="soft"
                    />
                  </Typography>
                </Box>
              </Stack>
            </Box>

            {/* Actions Menu — edit only, no delete */}
            <Box>
              <IconButton onClick={popover.onOpen}>
                <Iconify icon="eva:more-vertical-fill" />
              </IconButton>

              <CustomPopover
                open={popover.open}
                onClose={popover.onClose}
                arrow="right-top"
                sx={{ width: 160 }}
              >
                <MenuItem
                  onClick={() => {
                    popover.onClose();
                    onEdit();
                  }}
                >
                  <Iconify icon="solar:pen-bold" />
                  {t('edit')}
                </MenuItem>
              </CustomPopover>
            </Box>
          </Stack>
        </Box>
      </Stack>
    </Card>
  );
}

VariantCard.propTypes = {
  variant: PropTypes.object,
  optionDefinitions: PropTypes.array,
  onEdit: PropTypes.func,
};

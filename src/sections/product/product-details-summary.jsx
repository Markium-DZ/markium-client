import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { fCurrency } from 'src/utils/format-number';

import { useTranslate } from 'src/locales';
import Label from 'src/components/label';

// ----------------------------------------------------------------------

export default function ProductDetailsSummary({ product, ...other }) {
  const { t } = useTranslate();

  const {
    name,
    variants = [],
    option_definitions = [],
    has_discount,
    discount_percentage,
    is_in_stock,
    description,
  } = product || {};

  const variantCount = variants?.length || 0;

  const activePrices = variants
    .map((v) => parseFloat(v.price))
    .filter((p) => !Number.isNaN(p) && p > 0);

  const minPrice = activePrices.length > 0 ? Math.min(...activePrices) : 0;
  const maxPrice = activePrices.length > 0 ? Math.max(...activePrices) : 0;
  const hasPriceRange = minPrice !== maxPrice;

  // Calculate total quantity across all variants
  const totalQuantity = variants?.reduce((sum, v) => sum + (v.available_quantity || 0), 0) || 0;

  const inventoryType = is_in_stock
    ? (totalQuantity > 10 ? 'in_stock' : 'low_stock')
    : 'out_of_stock';

  const newLabel = { enabled: false, content: '' };
  const saleLabel = has_discount
    ? { enabled: true, content: `${Math.round(discount_percentage || 0)}% OFF` }
    : { enabled: false, content: '' };

  const renderPrice = (
    <Stack spacing={0.5}>
      <Box sx={{ typography: 'h5' }}>
        {hasPriceRange ? (
          <>
            {fCurrency(minPrice)}
            <Box component="span" sx={{ mx: 0.75, color: 'text.disabled' }}>–</Box>
            {fCurrency(maxPrice)}
          </>
        ) : (
          fCurrency(minPrice)
        )}
      </Box>
      {variantCount > 0 && (
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {variantCount} {t('variants')}
        </Typography>
      )}
    </Stack>
  );

  const renderOptionsOverview = option_definitions?.length > 0 && (
    <Stack spacing={2}>
      {option_definitions.map((optDef) => {
        // Collect all unique values for this option across all variants
        const seen = new Set();
        const uniqueValues = [];
        variants.forEach((variant) => {
          const opt = variant.options?.find((o) => o.option_definition_id === optDef.id);
          if (opt && !seen.has(opt.value_id)) {
            seen.add(opt.value_id);
            uniqueValues.push(opt);
          }
        });

        return (
          <Stack key={optDef.id} direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Typography variant="subtitle2" sx={{ color: 'text.secondary', minWidth: 80 }}>
              {optDef.name}:
            </Typography>
            <Stack direction="row" spacing={0.75} flexWrap="wrap">
              {uniqueValues.map((opt) => (
                <Chip
                  key={opt.value_id}
                  size="small"
                  label={opt.value}
                  avatar={
                    opt.color_hex ? (
                      <Box
                        sx={{
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          bgcolor: opt.color_hex,
                          border: '1px solid',
                          borderColor: 'divider',
                          ml: '4px !important',
                        }}
                      />
                    ) : undefined
                  }
                  sx={{ height: 24, fontSize: '0.75rem' }}
                />
              ))}
            </Stack>
          </Stack>
        );
      })}
    </Stack>
  );

  const renderQuantity = (
    <Stack direction="row" spacing={2}>
      <Typography variant="subtitle2" sx={{ color: 'text.secondary', minWidth: 100 }}>
        {t('available')}:
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, color: totalQuantity > 0 ? 'success.main' : 'error.main' }}>
        {totalQuantity} {t('units')}
      </Typography>
    </Stack>
  );

  const renderSubDescription = (
    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
      {description}
    </Typography>
  );

  const renderLabels = (newLabel?.enabled || saleLabel?.enabled) && (
    <Stack direction="row" alignItems="center" spacing={1}>
      {newLabel.enabled && <Label color="info">{newLabel.content}</Label>}
      {saleLabel.enabled && <Label color="error">{saleLabel.content}</Label>}
    </Stack>
  );

  const renderInventoryType = (
    <Box
      component="span"
      sx={{
        typography: 'overline',
        color:
          (inventoryType === 'out_of_stock' && 'error.main') ||
          (inventoryType === 'low_stock' && 'warning.main') ||
          'success.main',
      }}
    >
      {t(inventoryType)}
    </Box>
  );

  if (!product) {
    return null;
  }

  return (
    <Stack spacing={3} sx={{ pt: 3 }} {...other}>
      <Stack spacing={2} alignItems="flex-start">
        {renderLabels}

        {renderInventoryType}

        <Typography variant="h5">{name}</Typography>

        {renderPrice}

        {renderSubDescription}
      </Stack>

      <Divider sx={{ borderStyle: 'dashed' }} />

      {renderOptionsOverview}

      {renderQuantity}
    </Stack>
  );
}

ProductDetailsSummary.propTypes = {
  product: PropTypes.object,
};

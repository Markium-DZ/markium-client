import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
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
    has_discount,
    discount_percentage,
    description,
  } = product || {};

  const variantCount = variants?.length || 0;

  const activePrices = variants
    .map((v) => parseFloat(v.price))
    .filter((p) => !Number.isNaN(p) && p > 0);

  const minPrice = activePrices.length > 0 ? Math.min(...activePrices) : 0;
  const maxPrice = activePrices.length > 0 ? Math.max(...activePrices) : 0;
  const hasPriceRange = minPrice !== maxPrice;

  const totalQuantity = variants?.reduce((sum, v) => sum + (v.available_quantity || 0), 0) || 0;

  const saleLabel = has_discount
    ? { enabled: true, content: `${Math.round(discount_percentage || 0)}% OFF` }
    : { enabled: false, content: '' };

  const inventoryType =
    totalQuantity === 0 ? 'out_of_stock' : totalQuantity <= 10 ? 'low_stock' : 'in_stock';

  // ── Renders ──────────────────────────────────────────────────────────

  const renderLabels = saleLabel.enabled && (
    <Label color="error">{saleLabel.content}</Label>
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

  const renderPrice = (
    <Stack spacing={0.5}>
      <Box sx={{ typography: 'h5' }}>
        {hasPriceRange ? (
          <>
            {fCurrency(minPrice)}
            <Box component="span" sx={{ mx: 0.75, color: 'text.disabled' }}>
              –
            </Box>
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

  const renderSubDescription = description && (
    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
      {description}
    </Typography>
  );

  // Group unique option values directly from variant.options[]
  // (variant options carry definition_name, value, color_hex directly)
  const optionGroups = {};
  variants.forEach((variant) => {
    (variant.options || []).forEach((opt) => {
      const defName = opt.definition_name || opt.name || '';
      if (!defName) return;
      if (!optionGroups[defName]) optionGroups[defName] = { values: [], seen: new Set() };
      const key = String(opt.value_id ?? opt.value);
      if (!optionGroups[defName].seen.has(key)) {
        optionGroups[defName].seen.add(key);
        optionGroups[defName].values.push(opt);
      }
    });
  });

  const groupEntries = Object.entries(optionGroups);

  const renderVariants = groupEntries.length > 0 && (
    <Stack spacing={1.5}>
      {groupEntries.map(([defName, { values }]) => (
        <Stack key={defName} direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', flexShrink: 0 }}>
            {defName}
          </Typography>
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            {values.map((opt) => (
              <Box
                key={opt.value_id ?? opt.value}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1,
                  py: 0.375,
                  borderRadius: 1,
                  bgcolor: 'action.selected',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                {opt.color_hex && (
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      bgcolor: opt.color_hex,
                      border: '1px solid',
                      borderColor: 'divider',
                      flexShrink: 0,
                    }}
                  />
                )}
                <Typography
                  component="span"
                  sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.primary', lineHeight: '18px' }}
                >
                  {opt.value}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Stack>
      ))}
    </Stack>
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

      {renderVariants}
    </Stack>
  );
}

ProductDetailsSummary.propTypes = {
  product: PropTypes.object,
};

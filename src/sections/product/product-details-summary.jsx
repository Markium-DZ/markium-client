import PropTypes from 'prop-types';
import { useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Rating from '@mui/material/Rating';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import { formHelperTextClasses } from '@mui/material/FormHelperText';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fCurrency, fShortenNumber } from 'src/utils/format-number';

import { useTranslate } from 'src/locales';
import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import { ColorPicker } from 'src/components/color-utils';
import FormProvider, { RHFSelect } from 'src/components/hook-form';

import IncrementerButton from './common/incrementer-button';

// ----------------------------------------------------------------------

export default function ProductDetailsSummary({
  items,
  product,
  selectedVariant,
  onVariantChange,
  onAddCart,
  onGotoStep,
  disabledActions,
  ...other
}) {
  const router = useRouter();
  const { t } = useTranslate();

  const {
    id,
    name,
    variants = [],
    option_definitions = [],
    has_discount,
    discount_percentage,
    is_in_stock,
    description,
  } = product || {};

  // Get current variant or default to first variant
  const currentVariant = selectedVariant || variants?.[0];

  const price = parseFloat(currentVariant?.price) || 0;
  const priceSale = has_discount && currentVariant?.compare_at_price
    ? parseFloat(currentVariant.compare_at_price)
    : null;
  const available = currentVariant?.available_quantity || 0;
  const quantity = currentVariant?.quantity || 0;
  // Handle media as array or single object
  const mediaArray = Array.isArray(currentVariant?.media)
    ? currentVariant.media
    : (currentVariant?.media ? [currentVariant.media] : []);
  const coverUrl = mediaArray.length > 0 ? (mediaArray[0]?.full_url || mediaArray[0]?.url || '') : '';
  const inventoryType = currentVariant?.is_in_stock
    ? (available > 10 ? 'in_stock' : 'low_stock')
    : 'out_of_stock';
  const subDescription = description;
  const totalRatings = 0;
  const totalReviews = 0;
  const newLabel = { enabled: false, content: '' };
  const saleLabel = has_discount
    ? { enabled: true, content: `${Math.round(discount_percentage || 0)}% OFF` }
    : { enabled: false, content: '' };

  const existProduct = !!items?.length && items.map((item) => item.id).includes(id);

  const isMaxQuantity =
    !!items?.length &&
    items.filter((item) => item.id === id).map((item) => item.quantity)[0] >= available;

  // Build initial selected options from current variant
  const initialOptions = {};
  option_definitions.forEach((optDef) => {
    const optionValue = currentVariant?.options?.find((opt) => opt.option_definition_id === optDef.id);
    if (optionValue) {
      initialOptions[`option_${optDef.id}`] = optionValue.value_id;
    }
  });

  const defaultValues = {
    id,
    name,
    coverUrl,
    available,
    price,
    variantId: currentVariant?.id,
    quantity: available < 1 ? 0 : 1,
    ...initialOptions,
  };

  const methods = useForm({
    defaultValues,
  });

  const { reset, watch, control, setValue, handleSubmit } = methods;

  const values = watch();

  useEffect(() => {
    if (product && currentVariant) {
      const newOptions = {};
      option_definitions.forEach((optDef) => {
        const optionValue = currentVariant?.options?.find((opt) => opt.option_definition_id === optDef.id);
        if (optionValue) {
          newOptions[`option_${optDef.id}`] = optionValue.value_id;
        }
      });

      reset({
        id,
        name,
        coverUrl,
        available,
        price,
        variantId: currentVariant?.id,
        quantity: available < 1 ? 0 : 1,
        ...newOptions,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, currentVariant]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (!existProduct) {
        onAddCart?.({
          ...data,
          variant: currentVariant,
          subTotal: data.price * data.quantity,
        });
      }
      onGotoStep?.(0);
      router.push(paths.product.checkout);
    } catch (error) {
      console.error(error);
    }
  });

  const handleAddCart = useCallback(() => {
    try {
      onAddCart?.({
        ...values,
        variant: currentVariant,
        subTotal: values.price * values.quantity,
      });
    } catch (error) {
      console.error(error);
    }
  }, [onAddCart, values, currentVariant]);

  // Handle option selection change
  const handleOptionChange = useCallback((optionDefId, valueId) => {
    // Build selected options map
    const selectedOptions = {};
    option_definitions.forEach((optDef) => {
      if (optDef.id === optionDefId) {
        selectedOptions[optDef.id] = valueId;
      } else {
        selectedOptions[optDef.id] = values[`option_${optDef.id}`];
      }
    });

    // Find matching variant
    const matchingVariant = variants.find((variant) => {
      if (!variant.is_active) return false;

      return option_definitions.every((optDef) => {
        const variantOption = variant.options?.find((opt) => opt.option_definition_id === optDef.id);
        return variantOption?.value_id === selectedOptions[optDef.id];
      });
    });

    if (matchingVariant && onVariantChange) {
      onVariantChange(matchingVariant);
    }
  }, [option_definitions, variants, values, onVariantChange]);

  const renderPrice = (
    <Box sx={{ typography: 'h5' }}>
      {priceSale && (
        <Box
          component="span"
          sx={{
            color: 'text.disabled',
            textDecoration: 'line-through',
            mr: 0.5,
          }}
        >
          {fCurrency(priceSale)}
        </Box>
      )}

      {fCurrency(price)}
    </Box>
  );

  // Removed share options

  // Render variant information including SKU and options
  const renderVariantInfo = (
    <Stack spacing={2}>
      {/* SKU */}
      {currentVariant?.sku && (
        <Stack direction="row" spacing={2}>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', minWidth: 100 }}>
            {t('sku')}:
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
            {currentVariant.sku}
          </Typography>
        </Stack>
      )}

      {/* Variant Options */}
      {currentVariant?.options && currentVariant.options.length > 0 && currentVariant.options.map((option, idx) => (
        <Stack direction="row" key={idx} spacing={2}>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', minWidth: 100 }}>
            {option.definition_name || option.name}:
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {option.color_hex && (
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  bgcolor: option.color_hex,
                  border: (theme) => `2px solid ${theme.palette.divider}`,
                }}
              />
            )}
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {option.value}
            </Typography>
          </Box>
        </Stack>
      ))}
    </Stack>
  );

  // Display available quantity as read-only
  const renderQuantity = (
    <Stack direction="row" spacing={2}>
      <Typography variant="subtitle2" sx={{ color: 'text.secondary', minWidth: 100 }}>
        {t('available')}:
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, color: available > 0 ? 'success.main' : 'error.main' }}>
        {available} {t('units')}
      </Typography>
    </Stack>
  );

  // Removed action buttons (add to cart, buy now)

  const renderSubDescription = (
    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
      {subDescription}
    </Typography>
  );

  // Removed rating display

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

      {renderVariantInfo}

      {renderQuantity}
    </Stack>
  );
}

ProductDetailsSummary.propTypes = {
  items: PropTypes.array,
  disabledActions: PropTypes.bool,
  onAddCart: PropTypes.func,
  onGotoStep: PropTypes.func,
  onVariantChange: PropTypes.func,
  product: PropTypes.object,
  selectedVariant: PropTypes.object,
};

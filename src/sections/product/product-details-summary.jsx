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
  const coverUrl = currentVariant?.media?.full_url || currentVariant?.media?.url || '';
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

  const renderShare = (
    <Stack direction="row" spacing={3} justifyContent="center">
      <Link
        variant="subtitle2"
        sx={{
          color: 'text.secondary',
          display: 'inline-flex',
          alignItems: 'center',
        }}
      >
        <Iconify icon="mingcute:add-line" width={16} sx={{ mr: 1 }} />
        {t('compare')}
      </Link>

      <Link
        variant="subtitle2"
        sx={{
          color: 'text.secondary',
          display: 'inline-flex',
          alignItems: 'center',
        }}
      >
        <Iconify icon="solar:heart-bold" width={16} sx={{ mr: 1 }} />
        {t('favorite')}
      </Link>

      <Link
        variant="subtitle2"
        sx={{
          color: 'text.secondary',
          display: 'inline-flex',
          alignItems: 'center',
        }}
      >
        <Iconify icon="solar:share-bold" width={16} sx={{ mr: 1 }} />
        {t('share')}
      </Link>
    </Stack>
  );

  // Render option definitions dynamically
  const renderOptionDefinitions = option_definitions.map((optionDef) => {
    const fieldName = `option_${optionDef.id}`;

    // Color style option
    if (optionDef.style === 'color') {
      const colors = optionDef.values?.map((val) => val.color_hex || val.value) || [];
      const colorValues = optionDef.values || [];

      return (
        <Stack direction="row" key={optionDef.id}>
          <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
            {optionDef.name}
          </Typography>

          <Controller
            name={fieldName}
            control={control}
            render={({ field }) => (
              <ColorPicker
                colors={colors}
                selected={colorValues.find((v) => v.id === field.value)?.color_hex || ''}
                onSelectColor={(color) => {
                  const selectedValue = colorValues.find((v) => v.color_hex === color);
                  if (selectedValue) {
                    field.onChange(selectedValue.id);
                    handleOptionChange(optionDef.id, selectedValue.id);
                  }
                }}
                limit={4}
              />
            )}
          />
        </Stack>
      );
    }

    // Dropdown/Button style option
    return (
      <Stack direction="row" key={optionDef.id}>
        <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
          {optionDef.name}
        </Typography>

        <RHFSelect
          name={fieldName}
          size="small"
          sx={{ maxWidth: 120 }}
          onChange={(e) => handleOptionChange(optionDef.id, e.target.value)}
        >
          {optionDef.values?.map((optValue) => (
            <MenuItem key={optValue.id} value={optValue.id}>
              {optValue.value}
            </MenuItem>
          ))}
        </RHFSelect>
      </Stack>
    );
  });

  const renderQuantity = (
    <Stack direction="row">
      <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
        {t('quantity')}
      </Typography>

      <Stack spacing={1}>
        <IncrementerButton
          name="quantity"
          quantity={values.quantity}
          disabledDecrease={values.quantity <= 1}
          disabledIncrease={values.quantity >= available}
          onIncrease={() => setValue('quantity', values.quantity + 1)}
          onDecrease={() => setValue('quantity', values.quantity - 1)}
        />

        <Typography variant="caption" component="div" sx={{ textAlign: 'right' }}>
          {t('available')}: {available}
        </Typography>
      </Stack>
    </Stack>
  );

  const renderActions = (
    <Stack direction="row" spacing={2}>
      <Button
        fullWidth
        disabled={isMaxQuantity || disabledActions}
        size="large"
        color="warning"
        variant="contained"
        startIcon={<Iconify icon="solar:cart-plus-bold" width={24} />}
        onClick={handleAddCart}
        sx={{ whiteSpace: 'nowrap' }}
      >
        {t('add_to_cart')}
      </Button>

      <Button fullWidth size="large" type="submit" variant="contained" disabled={disabledActions}>
        {t('buy_now')}
      </Button>
    </Stack>
  );

  const renderSubDescription = (
    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
      {subDescription}
    </Typography>
  );

  const renderRating = (
    <Stack
      direction="row"
      alignItems="center"
      sx={{
        color: 'text.disabled',
        typography: 'body2',
      }}
    >
      <Rating size="small" value={totalRatings} precision={0.1} readOnly sx={{ mr: 1 }} />
      {`(${fShortenNumber(totalReviews)} ${t('reviews')})`}
    </Stack>
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
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Stack spacing={3} sx={{ pt: 3 }} {...other}>
        <Stack spacing={2} alignItems="flex-start">
          {renderLabels}

          {renderInventoryType}

          <Typography variant="h5">{name}</Typography>

          {renderRating}

          {renderPrice}

          {renderSubDescription}
        </Stack>

        <Divider sx={{ borderStyle: 'dashed' }} />

        {renderOptionDefinitions}

        {renderQuantity}

        <Divider sx={{ borderStyle: 'dashed' }} />

        {renderActions}

        {renderShare}
      </Stack>
    </FormProvider>
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

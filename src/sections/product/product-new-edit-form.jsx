import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Unstable_Grid2';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';
import { alpha } from '@mui/material/styles';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useResponsive } from 'src/hooks/use-responsive';
import { useTranslate } from 'src/locales';

import { _tags } from 'src/_mock';

import { useSnackbar } from 'src/components/snackbar';
import FormProvider, {
  RHFSelect,
  RHFEditor,
  RHFUpload,
  RHFTextField,
  RHFAutocomplete,
} from 'src/components/hook-form';
import { createProduct, updateProduct, createMedia } from 'src/api/product';
import showError from 'src/utils/show_error';
import { useGetSystemCategories } from 'src/api/settings';
import { MenuItem } from '@mui/material';
import Iconify from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import OptionDefinitionBuilder from './components/option-definition-builder';
import ProductVariantsManager from './components/product-variants-manager';

// ----------------------------------------------------------------------

export default function ProductNewEditForm({ currentProduct }) {
  const router = useRouter();

  const mdUp = useResponsive('up', 'md');

  const { enqueueSnackbar } = useSnackbar();

  const { t } = useTranslate();

  const [advancedMode, setAdvancedMode] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, type: '' });
  const [optionDefinitions, setOptionDefinitions] = useState([]);
  const [variants, setVariants] = useState([
    {
      id: Date.now(),
      price: 0,
      compare_at_price: 0,
      quantity: 0,
      sku: '',
      option_values: [],
      media_id: null,
      is_default: true,
    },
  ]);

  const { items: categories } = useGetSystemCategories();

  // Recreate schema when advancedMode changes
  const NewProductSchema = useMemo(() => Yup.object().shape({
    name: Yup.string().required(t('name_is_required')),
    // Advanced mode validation
    ...(advancedMode
      ? {
          // In advanced mode, images are optional (uploaded per variant)
          images: Yup.array(),
          option_definitions: Yup.array(),
          // Note: variants validation is done manually in onSubmit
          // because variants are stored in state, not in form data
        }
      : {
          // Simple mode validation
          images: Yup.array().min(1, t('images_is_required')),
          sale_price: Yup.number().moreThan(0, t('sale_price_required')),
          real_price: Yup.number(),
          quantity: Yup.number(),
        }),
    // Common fields
    description: Yup.string(),
    content: Yup.string(),
    category_id: Yup.string(),
    tags: Yup.array(),
  }), [advancedMode, t]);

  const defaultValues = useMemo(() => {
    // Extract default variant for simple mode values
    const defaultVariant = currentProduct?.variants?.find(v => v.is_default) || currentProduct?.variants?.[0];

    return {
      name: currentProduct?.name || '',
      description: currentProduct?.description || '',
      content: currentProduct?.content || '',
      images: currentProduct?.images || [],
      category_id: currentProduct?.category_id || '',
      tags: currentProduct?.tags || [],
      // Simple mode fields - extracted from default variant
      quantity: defaultVariant?.quantity || 1,
      real_price: defaultVariant?.compare_at_price || 0,
      sale_price: defaultVariant?.price || 0,
      // Advanced mode fields
      option_definitions: currentProduct?.option_definitions || [],
      variants: currentProduct?.variants || [],
    };
  }, [currentProduct]);

  const methods = useForm({
    resolver: yupResolver(NewProductSchema),
    defaultValues,
  });

  const {
    reset,
    watch,
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const values = watch();

  useEffect(() => {
    if (currentProduct) {
      reset(defaultValues);

      // Set advanced mode if product has option_definitions
      if (currentProduct.option_definitions && currentProduct.option_definitions.length > 0) {
        setAdvancedMode(true);
        setOptionDefinitions(currentProduct.option_definitions);
      } else {
        setAdvancedMode(false);
        setOptionDefinitions([]);
      }

      // Load variants from backend
      if (currentProduct.variants && currentProduct.variants.length > 0) {
        // Map backend variants to frontend format
        const mappedVariants = currentProduct.variants.map(v => ({
          id: v.id || Date.now(),
          price: v.price || 0,
          compare_at_price: v.compare_at_price || 0,
          quantity: v.quantity || 0,
          sku: v.sku || '',
          // Extract option values from backend format: [{definition: "Size", value: "M"}] -> ["M"]
          option_values: v.option_values?.map(ov => ov.value) || v.options || [],
          media_id: v.media?.id || null,
          is_default: v.is_default || false,
        }));
        setVariants(mappedVariants);
      }
    }
  }, [currentProduct, defaultValues, reset]);

  const handleModeSwitch = () => {
    if (advancedMode) {
      // Switching to Simple Mode
      if (variants.length > 1) {
        setConfirmDialog({ open: true, type: 'toSimple' });
      } else {
        setAdvancedMode(false);
      }
    } else {
      // Switching to Advanced Mode
      setConfirmDialog({ open: true, type: 'toAdvanced' });
    }
  };

  const handleConfirmModeSwitch = () => {
    if (confirmDialog.type === 'toSimple') {
      // Keep only default variant
      const defaultVariant = variants.find((v) => v.is_default) || variants[0];
      setVariants([defaultVariant]);
      setOptionDefinitions([]);
      setAdvancedMode(false);
    } else if (confirmDialog.type === 'toAdvanced') {
      // Convert simple pricing to first variant
      const simpleVariant = {
        id: Date.now(),
        price: values.sale_price || 0,
        compare_at_price: values.real_price || 0,
        quantity: values.quantity || 0,
        sku: '',
        option_values: [],
        media_id: values.images?.[0]?.id || null,
        is_default: true,
      };
      setVariants([simpleVariant]);
      setAdvancedMode(true);
    }
    setConfirmDialog({ open: false, type: '' });
  };

  const onSubmit = handleSubmit(
    async (data) => {
    try {
      console.info('=== FORM SUBMISSION START ===');
      console.info('Advanced Mode:', advancedMode);
      console.info('Form data received:', data);
      console.info('Images:', data.images);
      console.info('Variants:', variants);

      // Manual validation for advanced mode variants
      if (advancedMode) {
        if (!variants || variants.length === 0) {
          enqueueSnackbar(t('at_least_one_variant_required'), { variant: 'error' });
          return;
        }
        if (!variants.some((v) => v.is_default)) {
          enqueueSnackbar(t('one_variant_must_be_default'), { variant: 'error' });
          return;
        }
        if (!variants.every((v) => v.price > 0)) {
          enqueueSnackbar(t('all_variants_must_have_price'), { variant: 'error' });
          return;
        }
        // Validate compare_at_price >= price for all variants
        const invalidPriceVariant = variants.find(
          (v) => v.compare_at_price > 0 && v.compare_at_price < v.price
        );
        if (invalidPriceVariant) {
          enqueueSnackbar(t('compare_at_price_must_be_greater_than_price'), { variant: 'error' });
          return;
        }
        // Validate option definitions have valid styles
        const validStyles = ['color', 'dropdown', 'text'];
        const invalidOption = optionDefinitions.find(
          (opt) => opt.style && !validStyles.includes(opt.style)
        );
        if (invalidOption) {
          enqueueSnackbar(t('invalid_option_style'), { variant: 'error' });
          return;
        }
      }

      // Step 1: Upload images and get media IDs (only for new products)
      let uploadedMedia = [];

      if (!currentProduct?.id) {
        // Collect all images to upload
        const imagesToUpload = [];

        // In advanced mode, collect variant-specific images
        if (advancedMode) {
          variants.forEach((variant) => {
            if (variant.image_file && variant.image_file instanceof File) {
              imagesToUpload.push({
                file: variant.image_file,
                variantId: variant.id,
              });
            }
          });
        }
        // In simple mode, use images from the main upload
        else if (data.images && data.images.length > 0) {
          const imageFiles = data.images.filter((img) => img instanceof File);
          imageFiles.forEach((file) => {
            imagesToUpload.push({ file, variantId: null });
          });
        }

        console.info('Images to upload:', imagesToUpload);

        // Upload all images at once if any
        if (imagesToUpload.length > 0) {
          console.info('Uploading', imagesToUpload.length, 'images to /media...');
          const files = imagesToUpload.map((item) => item.file);
          const mediaResponse = await createMedia(files);
          uploadedMedia = mediaResponse.data.data || [];
          console.info('Media uploaded successfully:', uploadedMedia);

          // Map uploaded media back to variants
          if (advancedMode) {
            imagesToUpload.forEach((item, index) => {
              const mediaId = uploadedMedia[index]?.id;
              if (mediaId && item.variantId) {
                // Find variant and update its media_id
                const variantIndex = variants.findIndex((v) => v.id === item.variantId);
                if (variantIndex !== -1) {
                  variants[variantIndex].media_id = mediaId;
                }
              }
            });
          }
        } else {
          console.warn('No images to upload');
        }
      }

      // Step 2: Build the payload structure
      const payload = {
        name: data.name,
        description: data.description || '',
        content: data.content || '',
        category_id: data.category_id || null,
        tags: data.tags || [],
      };

      if (advancedMode) {
        // Advanced mode: send option_definitions and variants
        payload.option_definitions = optionDefinitions
          .filter((opt) => opt.name && opt.values.length > 0)
          .map((opt) => ({
            name: opt.name,
            type: opt.type,
            style: opt.style,
            values: opt.values,
          }));

        payload.variants = variants.map((variant, index) => {
          const variantData = {
            price: parseFloat(variant.price) || 0,
            compare_at_price: parseFloat(variant.compare_at_price) || 0,
            quantity: parseInt(variant.quantity, 10) || 0,
            sku: variant.sku || '',
            option_values: variant.option_values || [],
            media_id: variant.media_id || null,
            is_default: variant.is_default || false,
            position: index, // Auto-assign position based on array index
            is_active: true, // Default to active
          };

          // Include variant ID if updating existing variant
          if (currentProduct?.id && variant.id && typeof variant.id === 'number') {
            variantData.id = variant.id;
          }

          return variantData;
        });
      } else {
        // Simple mode: create single variant from simple fields
        const simpleVariant = {
          price: parseFloat(data.sale_price) || 0,
          compare_at_price: parseFloat(data.real_price) || 0,
          quantity: parseInt(data.quantity, 10) || 0,
          sku: '',
          option_values: [],
          media_id: uploadedMedia[0]?.id || null,
          is_default: true,
          position: 0, // First variant
          is_active: true, // Default to active
        };

        // If editing, include the existing variant ID
        if (currentProduct?.id && variants[0]?.id && typeof variants[0].id === 'number') {
          simpleVariant.id = variants[0].id;
        }

        payload.variants = [simpleVariant];
      }

      console.info('Submitting product data:', payload);

      // Always use FormData when creating (for image upload support)
      const formData = new FormData();

      // Append basic fields
      formData.append('name', payload.name);
      formData.append('description', payload.description);
      formData.append('content', payload.content);

      if (payload.category_id) {
        formData.append('category_id', payload.category_id);
      }

      // Append tags as array
      if (payload.tags && payload.tags.length > 0) {
        payload.tags.forEach((tag) => {
          formData.append('tags[]', tag);
        });
      }

      // Append option_definitions - Laravel/PHP array format
      if (payload.option_definitions && payload.option_definitions.length > 0) {
        payload.option_definitions.forEach((option, index) => {
          formData.append(`option_definitions[${index}][name]`, option.name);
          formData.append(`option_definitions[${index}][type]`, option.type);
          formData.append(`option_definitions[${index}][style]`, option.style);

          option.values.forEach((val, valIndex) => {
            formData.append(`option_definitions[${index}][values][${valIndex}][value]`, val.value);
            if (val.color_hex) {
              formData.append(
                `option_definitions[${index}][values][${valIndex}][color_hex]`,
                val.color_hex
              );
            }
          });
        });
      }

      // Append variants - Laravel/PHP array format
      if (payload.variants && payload.variants.length > 0) {
        payload.variants.forEach((variant, index) => {
          // Include variant ID if updating
          if (variant.id) {
            formData.append(`variants[${index}][id]`, variant.id);
          }

          formData.append(`variants[${index}][price]`, variant.price);
          formData.append(`variants[${index}][compare_at_price]`, variant.compare_at_price);
          formData.append(`variants[${index}][quantity]`, variant.quantity);
          formData.append(`variants[${index}][sku]`, variant.sku);
          formData.append(`variants[${index}][is_default]`, variant.is_default ? '1' : '0');
          formData.append(`variants[${index}][position]`, variant.position);
          formData.append(`variants[${index}][is_active]`, variant.is_active ? '1' : '0');

          if (variant.media_id) {
            formData.append(`variants[${index}][media_id]`, variant.media_id);
          }

          // Append option_values array for this variant
          if (variant.option_values && variant.option_values.length > 0) {
            variant.option_values.forEach((optVal, optIndex) => {
              formData.append(`variants[${index}][option_values][${optIndex}]`, optVal);
            });
          }
        });
      }

      // NOTE: Images are already uploaded to /media and media_ids are attached to variants
      // No need to send images[] in FormData anymore

      console.info('FormData entries:');
      for (let pair of formData.entries()) {
        console.log(pair[0] + ':', pair[1]);
      }

      // Step 3: Submit product to API
      if (currentProduct?.id) {
        await updateProduct(currentProduct.id, formData);
      } else {
        await createProduct(formData);
      }

      enqueueSnackbar(currentProduct ? t('update_success') : t('create_success'));
      router.push(paths.dashboard.product.root);
    } catch (error) {
      console.log('Caught error:', error);
      showError(error);
    }
  },
  (errors) => {
    // Validation errors
    console.error('=== VALIDATION ERRORS ===');
    console.error('Errors:', errors);
    console.error('Advanced Mode:', advancedMode);
    console.error('Variants:', variants);

    // Show first validation error
    const firstError = Object.values(errors)[0];
    if (firstError?.message) {
      enqueueSnackbar(firstError.message, { variant: 'error' });
    }
  });

  const handleDrop = useCallback(
    (acceptedFiles) => {
      const files = values.images || [];

      const newFiles = acceptedFiles.map((file, index) =>
        Object.assign(file, {
          id: Date.now() + index,
          preview: URL.createObjectURL(file),
        })
      );

      setValue('images', [...files, ...newFiles], { shouldValidate: true });
    },
    [setValue, values.images]
  );

  const handleRemoveFile = useCallback(
    (inputFile) => {
      const filtered = values.images && values.images?.filter((file) => file !== inputFile);
      setValue('images', filtered);
    },
    [setValue, values.images]
  );

  const handleRemoveAllFiles = useCallback(() => {
    setValue('images', []);
  }, [setValue]);

  const renderModeToggle = (
    <Grid xs={12} md={10}>
      <Paper
        sx={{
          p: 3,
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
          border: (theme) => `2px solid ${alpha(theme.palette.primary.main, 0.16)}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" gutterBottom>
              {advancedMode ? t('advanced_mode') : t('simple_mode')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {advancedMode
                ? t('advanced_mode_description')
                : t('simple_mode_description')}
            </Typography>
          </Box>

          <FormControlLabel
            control={
              <Switch
                checked={advancedMode}
                onChange={handleModeSwitch}
                color="primary"
                size="medium"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {/* <Iconify
                  icon={advancedMode ? 'mdi:tune-variant' : 'mdi:toggle-switch-outline'}
                  width={20}
                /> */}
                <Typography variant="body2" fontWeight={600}>
                  {advancedMode ? t('switch_to_simple') : t('switch_to_advanced')}
                </Typography>
              </Box>
            }
            labelPlacement="start"
            sx={{ ml: 0 }}
          />
        </Box>
      </Paper>
    </Grid>
  );

  const renderDetails = (
    <>
      <Grid xs={12} md={10}>
        <Card>
          {!mdUp && <CardHeader title={t('details')} />}

          <Stack spacing={3} sx={{ p: 3 }}>
            <RHFTextField name="name" label={t('product_name')} />
            <RHFTextField name="description" label={t('description')} />

            <Stack spacing={1.5}>
              <Typography variant="subtitle2">{t('content')}</Typography>
              <RHFEditor simple name="content" />
            </Stack>

            {/* Only show main image upload in Simple Mode */}
            {!advancedMode && (
              <Stack spacing={1.5}>
                <Typography variant="subtitle2">{t('images')}</Typography>
                <RHFUpload
                  multiple
                  thumbnail
                  name="images"
                  maxSize={31457210}
                  onDrop={handleDrop}
                  onRemove={handleRemoveFile}
                  onRemoveAll={handleRemoveAllFiles}
                  onUpload={() => console.info('ON UPLOAD')}
                />
              </Stack>
            )}

            {/* In Advanced Mode, show note about per-variant images */}
            {advancedMode && (
              <Paper
                sx={{
                  p: 2,
                  bgcolor: (theme) => alpha(theme.palette.info.main, 0.08),
                  border: (theme) => `1px solid ${alpha(theme.palette.info.main, 0.24)}`,
                }}
              >
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                  <Iconify
                    icon="eva:info-fill"
                    width={20}
                    sx={{ color: 'info.main', mt: 0.25 }}
                  />
                  <Box>
                    <Typography variant="subtitle2" color="info.main" gutterBottom>
                      {t('variant_images_info_title')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('variant_images_info_description')}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            )}
          </Stack>
        </Card>
      </Grid>
    </>
  );

  const renderProperties = (
    <>
      <Grid xs={12} md={10}>
        <Card>
          {!mdUp && <CardHeader title={t('properties')} />}

          <Stack spacing={3} sx={{ p: 3 }}>
            <Box
              columnGap={2}
              rowGap={3}
              display="grid"
              gridTemplateColumns={{
                xs: 'repeat(1, 1fr)',
                md: 'repeat(1, 1fr)',
              }}
            >
              <RHFSelect name="category_id" label={t('category')}>
                <MenuItem value="">{t('select_category')}</MenuItem>
                <Divider sx={{ borderStyle: 'dashed' }} />
                {categories?.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category?.name}
                  </MenuItem>
                ))}
              </RHFSelect>
            </Box>

            <RHFAutocomplete
              name="tags"
              label={t('tags')}
              placeholder={`+ ${t('tags')}`}
              multiple
              freeSolo
              options={_tags.map((option) => t(`tag_${option.toLowerCase()}`))}
              getOptionLabel={(option) => option}
              renderOption={(props, option) => (
                <li {...props} key={option}>
                  {option}
                </li>
              )}
              renderTags={(selected, getTagProps) =>
                selected.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option}
                    label={option}
                    size="small"
                    color="info"
                    variant="soft"
                  />
                ))
              }
            />
          </Stack>
        </Card>
      </Grid>
    </>
  );

  const renderSimplePricing = (
    <>
      <Grid xs={12} md={10}>
        <Card>
          <CardHeader title={t('pricing_inventory')} />

          <Stack spacing={3} sx={{ p: 3 }}>
            <Box
              columnGap={2}
              rowGap={3}
              display="grid"
              gridTemplateColumns={{
                xs: 'repeat(1, 1fr)',
                md: 'repeat(2, 1fr)',
              }}
            >
              <RHFTextField
                name="sale_price"
                label={t('sale_price')}
                placeholder="0.00"
                type="number"
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box component="span" sx={{ color: 'text.disabled' }}>
                        DZD
                      </Box>
                    </InputAdornment>
                  ),
                }}
              />

              <RHFTextField
                name="real_price"
                label={t('compare_at_price')}
                placeholder="0.00"
                type="number"
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box component="span" sx={{ color: 'text.disabled' }}>
                        DZD
                      </Box>
                    </InputAdornment>
                  ),
                }}
              />

              <RHFTextField
                name="quantity"
                label={t('quantity')}
                placeholder="0"
                type="number"
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          </Stack>
        </Card>
      </Grid>
    </>
  );

  const renderAdvancedOptions = (
    <>
      <Grid xs={12} md={10}>
        <Card>
          <CardHeader title={t('product_options_variants')} />
          <Stack spacing={3} sx={{ p: 3 }}>
            <OptionDefinitionBuilder
              options={optionDefinitions}
              onChange={setOptionDefinitions}
              maxOptions={3}
            />
          </Stack>
        </Card>
      </Grid>

      <Grid xs={12} md={10}>
        <Card>
          <CardHeader title={t('variants')} />
          <Stack spacing={3} sx={{ p: 3 }}>
            <ProductVariantsManager
              options={optionDefinitions}
              variants={variants}
              onChange={setVariants}
              images={values.images}
            />
          </Stack>
        </Card>
      </Grid>
    </>
  );

  const renderActions = (
    <>
      {mdUp && <Grid md={4} />}
      <Grid
        xs={12}
        md={10}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}
      >
        <Button
          variant="outlined"
          color="inherit"
          size="large"
          startIcon={<Iconify icon="eva:arrow-back-fill" />}
          onClick={() => router.push(paths.dashboard.product.root)}
        >
          {t('cancel')}
        </Button>

        <LoadingButton
          type="submit"
          variant="contained"
          size="large"
          loading={isSubmitting}
          startIcon={<Iconify icon="eva:save-fill" />}
        >
          {!currentProduct ? t('create_product') : t('save_changes')}
        </LoadingButton>
      </Grid>
    </>
  );

  return (
    <div key={`product-form-container-${advancedMode ? 'advanced' : 'simple'}`}>
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <Grid container spacing={3}>
          {renderModeToggle}

          {renderDetails}

          {renderProperties}

          {!advancedMode && renderSimplePricing}

          {advancedMode && renderAdvancedOptions}

          {renderActions}
        </Grid>
      </FormProvider>

      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, type: '' })}
        title={t('confirm_mode_switch')}
        content={
          confirmDialog.type === 'toSimple'
            ? t('switch_to_simple_warning')
            : t('switch_to_advanced_warning')
        }
        action={
          <Button variant="contained" color="primary" onClick={handleConfirmModeSwitch}>
            {t('confirm')}
          </Button>
        }
      />
    </div>
  );
}

ProductNewEditForm.propTypes = {
  currentProduct: PropTypes.object,
};

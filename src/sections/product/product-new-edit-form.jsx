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
  RHFTextField,
  RHFAutocomplete,
} from 'src/components/hook-form';
import { createProduct, updateProduct, createMedia } from 'src/api/product';
import showError from 'src/utils/show_error';
import { useGetSystemCategories } from 'src/api/settings';
import { IconButton, ListSubheader, MenuItem } from '@mui/material';
import Iconify from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { MediaPickerDialog } from 'src/components/media-picker';
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
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [optionDefinitions, setOptionDefinitions] = useState([]);
  const [variants, setVariants] = useState([
    {
      id: Date.now(),
      price: 0,
      compare_at_price: 0,
      quantity: 0,
      sku: '',
      option_values: [],
      media_ids: [],
      is_default: true,
    },
  ]);

  const { items: categories } = useGetSystemCategories();

  // Categories now come with children already nested from the API
  const groupedCategories = useMemo(() => {
    if (!categories) return [];
    return categories;
  }, [categories]);

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
          // Simple mode validation - require at least 1 image
          images: Yup.array().min(1, t('image_is_required')),
          sale_price: Yup.number().moreThan(0, t('sale_price_required')),
          real_price: Yup.number().nullable().transform((value, originalValue) =>
            originalValue === '' || originalValue === null || originalValue === undefined ? null : value
          ),
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

    // For basic mode, use variant's media array as images
    let images = [];
    if (defaultVariant?.media && Array.isArray(defaultVariant.media)) {
      images = defaultVariant.media.map(mediaItem => ({
        id: mediaItem.id,
        preview: mediaItem.full_url || mediaItem.url,
        name: mediaItem.alt_text || `media-${mediaItem.id}`,
        size: mediaItem.file_size,
        full_url: mediaItem.full_url || mediaItem.url,
        media_id: mediaItem.id,
        isExisting: true,
      }));
    } else if (defaultVariant?.media && typeof defaultVariant.media === 'object') {
      // Fallback for single media object (backwards compatibility)
      images = [{
        id: defaultVariant.media.id,
        preview: defaultVariant.media.full_url || defaultVariant.media.url,
        name: defaultVariant.media.alt_text || `media-${defaultVariant.media.id}`,
        size: defaultVariant.media.file_size,
        full_url: defaultVariant.media.full_url || defaultVariant.media.url,
        media_id: defaultVariant.media.id,
        isExisting: true,
      }];
    }

    return {
      name: currentProduct?.name || '',
      description: currentProduct?.description || '',
      content: currentProduct?.content || '',
      images: images,
      category_id: currentProduct?.category_id || '',
      tags: currentProduct?.tags || [],
      // Simple mode fields - extracted from default variant
      quantity: defaultVariant?.quantity || 1,
      real_price: defaultVariant?.compare_at_price || '',
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
          // Support both media array and single media object
          media_ids: Array.isArray(v.media)
            ? v.media.map(m => m.id)
            : (v.media?.id ? [v.media.id] : []),
          selected_media: Array.isArray(v.media) ? v.media : (v.media ? [v.media] : []),
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
      const mediaIds = values.images
        ?.map(img => img.media_id || img.id)
        .filter(Boolean) || [];

      const simpleVariant = {
        id: Date.now(),
        price: values.sale_price || 0,
        compare_at_price: values.real_price || 0,
        quantity: values.quantity || 0,
        sku: '',
        option_values: [],
        media_ids: mediaIds,
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
                // Find variant and add media_id to its media_ids array
                const variantIndex = variants.findIndex((v) => v.id === item.variantId);
                if (variantIndex !== -1) {
                  if (!variants[variantIndex].media_ids) {
                    variants[variantIndex].media_ids = [];
                  }
                  variants[variantIndex].media_ids.push(mediaId);
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
            media_ids: variant.media_ids || [],
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
        // Get media_ids from either: existing media selection, newly uploaded media, or empty array
        const existingMediaIds = data.images
          ?.filter(img => img.isExisting && img.media_id)
          .map(img => img.media_id) || [];

        const uploadedMediaIds = uploadedMedia.map(media => media.id) || [];
        const mediaIds = [...existingMediaIds, ...uploadedMediaIds];

        const simpleVariant = {
          price: parseFloat(data.sale_price) || 0,
          compare_at_price: data.real_price ? parseFloat(data.real_price) : null,
          quantity: parseInt(data.quantity, 10) || 0,
          sku: '',
          option_values: [],
          media_ids: mediaIds,
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

      // Step 3: Submit product to API as JSON
      if (currentProduct?.id) {
        await updateProduct(currentProduct.id, payload);
      } else {
        await createProduct(payload);
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

  const handleMediaSelect = useCallback(
    (selectedMedia) => {
      // Handle both single media and array of media
      const mediaArray = Array.isArray(selectedMedia) ? selectedMedia : [selectedMedia];

      if (mediaArray.length === 0) return;

      // Convert all selected media to pseudo-File objects
      const mediaFiles = mediaArray.map(media => ({
        id: media.id,
        preview: media.full_url,
        name: media.alt_text || `media-${media.id}`,
        size: media.file_size,
        type: 'image/*',
        // Store the media ID so we can use it during form submission
        media_id: media.id,
        // Mark as existing media (not a new upload)
        isExisting: true,
      }));

      // Get existing images
      const existingImages = values.images || [];

      // Append new media to existing images
      setValue('images', [...existingImages, ...mediaFiles], { shouldValidate: true });
      setMediaPickerOpen(false);
    },
    [setValue, values.images]
  );

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

                {/* Selected Images Preview */}
                {values.images && values.images.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Grid container spacing={2}>
                      {values.images.map((image, index) => (
                        <Grid item xs={6} sm={4} md={3} key={image.id || index}>
                          <Card sx={{ position: 'relative' }}>
                            <Box
                              sx={{
                                position: 'relative',
                                width: '100%',
                                paddingTop: '100%',
                                overflow: 'hidden',
                              }}
                            >
                              <Box
                                component="img"
                                src={image.preview || image.full_url}
                                alt={image.name || image.alt_text}
                                sx={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                }}
                              />
                              <IconButton
                                size="small"
                                onClick={() => handleRemoveFile(image)}
                                sx={{
                                  position: 'absolute',
                                  top: 4,
                                  right: 4,
                                  bgcolor: 'rgba(0,0,0,0.6)',
                                  color: 'white',
                                  width: 24,
                                  height: 24,
                                  '&:hover': {
                                    bgcolor: 'rgba(0,0,0,0.8)',
                                  },
                                }}
                              >
                                <Iconify icon="eva:close-fill" width={16} />
                              </IconButton>
                            </Box>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>

                    <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                      <Button
                        variant="outlined"
                        color="inherit"
                        size="small"
                        onClick={handleRemoveAllFiles}
                      >
                        {t('remove_all')}
                      </Button>
                    </Stack>
                  </Box>
                )}

                {/* Add Images Button - Modern Placeholder */}
                <Box
                  onClick={() => setMediaPickerOpen(true)}
                  sx={{
                    p: 5,
                    outline: 'none',
                    borderRadius: 1,
                    cursor: 'pointer',
                    overflow: 'hidden',
                    position: 'relative',
                    bgcolor: (theme) => alpha(theme.palette.grey[500], 0.08),
                    border: (theme) => `1px dashed ${alpha(theme.palette.grey[500], 0.2)}`,
                    transition: (theme) => theme.transitions.create(['opacity', 'padding']),
                    '&:hover': { opacity: 0.72 },
                  }}
                >
                  <Stack spacing={2.5} alignItems="center">
                    {/* Upload Icon */}
                    <Box
                      sx={{
                        width: 80,
                        height: 80,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                      }}
                    >
                      <Iconify
                        icon="solar:gallery-bold"
                        width={40}
                        sx={{ color: 'primary.main' }}
                      />
                    </Box>

                    {/* Upload Text */}
                    <Stack spacing={0.5} alignItems="center">
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {t('click_to_browse_media_library')}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {t('select_from_existing_media_or_upload_new')}
                      </Typography>
                    </Stack>
                  </Stack>
                </Box>
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
                {groupedCategories?.map((parentCategory) => [
                  // Parent category as group header (also selectable)
                  <ListSubheader
                    key={`header-${parentCategory.id}`}
                    sx={{
                      bgcolor: 'background.neutral',
                      color: 'text.primary',
                      fontWeight: 600,
                      lineHeight: '36px',
                    }}
                  >
                    {parentCategory.name}
                  </ListSubheader>,
                  // If parent has no children, make it selectable
                  parentCategory.children?.length === 0 && (
                    <MenuItem
                      key={parentCategory.id}
                      value={parentCategory.id}
                      sx={{ pl: 3 }}
                    >
                      {parentCategory.name}
                    </MenuItem>
                  ),
                  // Children categories
                  ...(parentCategory.children?.map((child) => (
                    <MenuItem
                      key={child.id}
                      value={child.id}
                      sx={{ pl: 3 }}
                    >
                      {child.name}
                    </MenuItem>
                  )) || []),
                ])}
              </RHFSelect>
            </Box>

            <Stack spacing={1}>
              <RHFAutocomplete
                name="tags"
                label={`${t('tags')} (${t('optional')})`}
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
              <Typography variant="caption" sx={{ color: 'text.secondary', px: 1.5 }}>
                {t('tags_helper_text')}
              </Typography>
            </Stack>
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

              <Stack spacing={1}>
                <RHFTextField
                  name="real_price"
                  label={`${t('compare_at_price')} (${t('optional')})`}
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
                <Typography variant="caption" sx={{ color: 'text.secondary', px: 1.5 }}>
                  {t('compare_at_price_helper_text')}
                </Typography>
              </Stack>

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
          {!currentProduct && renderModeToggle}

          {renderDetails}

          {renderProperties}

          {!currentProduct && !advancedMode && renderSimplePricing}

          {!currentProduct && advancedMode && renderAdvancedOptions}

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

      <MediaPickerDialog
        open={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={handleMediaSelect}
        multiple={true}
        title={t('select_product_images')}
      />
    </div>
  );
}

ProductNewEditForm.propTypes = {
  currentProduct: PropTypes.object,
};

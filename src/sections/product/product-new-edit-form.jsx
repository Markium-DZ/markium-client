import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import LinearProgress from '@mui/material/LinearProgress';
import InputAdornment from '@mui/material/InputAdornment';
import { alpha } from '@mui/material/styles';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

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
import { captureEvent } from 'src/utils/posthog';
import { useGetSystemCategories } from 'src/api/settings';
import { IconButton, ListSubheader, MenuItem } from '@mui/material';
import Iconify from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { MediaPickerDialog } from 'src/components/media-picker';
import OptionDefinitionBuilder from './components/option-definition-builder';
import ProductVariantsManager from './components/product-variants-manager';

// ----------------------------------------------------------------------

const TIMELINE_LEFT = { xs: 40, md: 56 };
const TIMELINE_GAP = { xs: 2, md: 2.5 };

function FormTimelineStep({ stepNumber, icon, title, isLast, children }) {
  return (
    <Box sx={{ display: 'flex', gap: TIMELINE_GAP }}>
      {/* Left column: circle + connector */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: TIMELINE_LEFT,
          flexShrink: 0,
        }}
      >
        {/* Numbered circle */}
        <Box
          sx={{
            width: { xs: 36, md: 44 },
            height: { xs: 36, md: 44 },
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
            color: 'primary.main',
            flexShrink: 0,
            mt: 0.5,
          }}
        >
          <Iconify icon={icon} width={{ xs: 18, md: 22 }} />
        </Box>

        {/* Vertical connector line */}
        {!isLast && (
          <Box
            sx={{
              flex: 1,
              width: 2,
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.16),
              my: 1,
            }}
          />
        )}
      </Box>

      {/* Right column: title + content */}
      <Box sx={{ flex: 1, pb: isLast ? 0 : 3, minWidth: 0 }}>
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
          {stepNumber}. {title}
        </Typography>
        {children}
      </Box>
    </Box>
  );
}

FormTimelineStep.propTypes = {
  stepNumber: PropTypes.number.isRequired,
  icon: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  isLast: PropTypes.bool,
  children: PropTypes.node,
};

// ----------------------------------------------------------------------

export default function ProductNewEditForm({ currentProduct, drawerMode = false, onSuccess, onCancel, onDirtyChange }) {
  const router = useRouter();

  const { enqueueSnackbar } = useSnackbar();

  const { t } = useTranslate();

  const [advancedMode, setAdvancedMode] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, type: '' });
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
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
    formState: { isSubmitting, isDirty },
  } = methods;

  const values = watch();

  // Notify parent about dirty state changes (for unsaved-changes warning)
  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

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

        // Upload all images at once if any
        if (imagesToUpload.length > 0) {
          const files = imagesToUpload.map((item) => item.file);
          const mediaResponse = await createMedia(files, setUploadProgress);
          setUploadProgress(null);
          uploadedMedia = mediaResponse.data.data || [];

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

      // Step 3: Submit product to API as JSON
      if (currentProduct?.id) {
        await updateProduct(currentProduct.id, payload);
      } else {
        await createProduct(payload);
        captureEvent('product_created', { name: data.name, category_id: data.category_id, mode: advancedMode ? 'advanced' : 'simple' });
      }

      enqueueSnackbar(currentProduct ? t('update_success') : t('create_success'));
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(paths.dashboard.product.root);
      }
    } catch (error) {
      showError(error);
    }
  },
  (errors) => {
    // Scroll to first error field
    const firstErrorKey = Object.keys(errors)[0];
    if (firstErrorKey) {
      const el = document.querySelector(`[name="${firstErrorKey}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
    }

    // Show all validation errors
    const errorMessages = Object.values(errors)
      .map(err => err?.message)
      .filter(Boolean);

    if (errorMessages.length === 1) {
      enqueueSnackbar(errorMessages[0], { variant: 'error' });
    } else if (errorMessages.length > 1) {
      errorMessages.forEach((msg) => {
        enqueueSnackbar(msg, { variant: 'error' });
      });
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

  // ---- Render sections ----

  const renderModeToggle = (
    <Paper
      sx={{
        p: 3,
        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
        border: (theme) => `2px solid ${alpha(theme.palette.primary.main, 0.16)}`,
      }}
    >
      <Stack spacing={2} alignItems="center">
        <ToggleButtonGroup
          value={advancedMode ? 'advanced' : 'simple'}
          exclusive
          onChange={(_, val) => {
            if (val !== null && val !== (advancedMode ? 'advanced' : 'simple')) {
              handleModeSwitch();
            }
          }}
          aria-label={t('product_mode')}
          sx={{
            width: '100%',
            '& .MuiToggleButton-root': {
              flex: 1,
              py: 1.5,
              gap: 1,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              borderRadius: 1,
              '&.Mui-selected': {
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
              },
            },
          }}
        >
          <ToggleButton value="simple" aria-describedby="mode-desc-simple">
            <Iconify icon="solar:box-minimalistic-bold" width={20} />
            {t('simple_mode')}
          </ToggleButton>
          <ToggleButton value="advanced" aria-describedby="mode-desc-advanced">
            <Iconify icon="solar:tuning-2-bold" width={20} />
            {t('advanced_mode')}
          </ToggleButton>
        </ToggleButtonGroup>

        <Typography
          id={advancedMode ? 'mode-desc-advanced' : 'mode-desc-simple'}
          variant="body2"
          color="text.secondary"
          sx={{ textAlign: 'center' }}
        >
          {advancedMode
            ? t('advanced_mode_description')
            : t('simple_mode_description')}
        </Typography>
      </Stack>
    </Paper>
  );

  const renderProductInfo = (
    <Card>
      <Stack spacing={3} sx={{ p: 3 }}>
        <RHFTextField name="name" label={t('product_name')} />
        <RHFTextField name="description" label={t('description')} />

        <Stack spacing={1.5}>
          <Typography variant="subtitle2">{t('content')}</Typography>
          <RHFEditor simple name="content" />
        </Stack>

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
  );

  const renderMedia = (
    <Card>
      <Stack spacing={1.5} sx={{ p: 3 }}>
        <Typography variant="subtitle2">{t('images')}</Typography>

        {/* Selected Images Preview */}
        {values.images && values.images.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Box
              display="grid"
              gridTemplateColumns={{
                xs: 'repeat(2, 1fr)',
                sm: 'repeat(3, 1fr)',
                md: 'repeat(4, 1fr)',
              }}
              gap={2}
            >
              {values.images.map((image, index) => (
                <Card key={image.id || index} sx={{ position: 'relative' }}>
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
                      aria-label={t('remove_image')}
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
              ))}
            </Box>

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
          role="button"
          tabIndex={0}
          aria-label={t('click_to_browse_media_library')}
          onClick={() => setMediaPickerOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setMediaPickerOpen(true);
            }
          }}
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
            '&:focus-visible': {
              outline: (theme) => `2px solid ${theme.palette.primary.main}`,
              outlineOffset: 2,
            },
          }}
        >
          <Stack spacing={2.5} alignItems="center">
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
    </Card>
  );

  const renderProperties = (
    <Card>
      <Stack spacing={3} sx={{ p: 3 }}>
        <Box
          columnGap={2}
          rowGap={3}
          display="grid"
          gridTemplateColumns="repeat(1, 1fr)"
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
  );

  const renderSimplePricing = (
    <Card>
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
              endAdornment: (
                <InputAdornment position="end" sx={{ flexDirection: 'column', height: '100%', mr: -0.5 }}>
                  <IconButton
                    size="small"
                    onClick={() => setValue('sale_price', (parseFloat(values.sale_price) || 0) + 1)}
                    sx={{ p: 0, lineHeight: 1 }}
                  >
                    <Iconify icon="eva:arrow-ios-upward-fill" width={16} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => setValue('sale_price', Math.max(0, (parseFloat(values.sale_price) || 0) - 1))}
                    sx={{ p: 0, lineHeight: 1 }}
                  >
                    <Iconify icon="eva:arrow-ios-downward-fill" width={16} />
                  </IconButton>
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
                endAdornment: (
                  <InputAdornment position="end" sx={{ flexDirection: 'column', height: '100%', mr: -0.5 }}>
                    <IconButton
                      size="small"
                      onClick={() => setValue('real_price', (parseFloat(values.real_price) || 0) + 1)}
                      sx={{ p: 0, lineHeight: 1 }}
                    >
                      <Iconify icon="eva:arrow-ios-upward-fill" width={16} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => setValue('real_price', Math.max(0, (parseFloat(values.real_price) || 0) - 1))}
                      sx={{ p: 0, lineHeight: 1 }}
                    >
                      <Iconify icon="eva:arrow-ios-downward-fill" width={16} />
                    </IconButton>
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
            InputProps={{
              endAdornment: (
                <InputAdornment position="end" sx={{ flexDirection: 'column', height: '100%', mr: -0.5 }}>
                  <IconButton
                    size="small"
                    onClick={() => setValue('quantity', (values.quantity || 0) + 1)}
                    sx={{ p: 0, lineHeight: 1 }}
                  >
                    <Iconify icon="eva:arrow-ios-upward-fill" width={16} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => setValue('quantity', Math.max(0, (values.quantity || 0) - 1))}
                    sx={{ p: 0, lineHeight: 1 }}
                  >
                    <Iconify icon="eva:arrow-ios-downward-fill" width={16} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Stack>
    </Card>
  );

  const renderOptionsCard = (
    <Card>
      <Stack spacing={3} sx={{ p: 3 }}>
        <OptionDefinitionBuilder
          options={optionDefinitions}
          onChange={setOptionDefinitions}
          maxOptions={3}
        />
      </Stack>
    </Card>
  );

  const renderVariantsCard = (
    <Card>
      <Stack spacing={3} sx={{ p: 3 }}>
        <ProductVariantsManager
          options={optionDefinitions}
          variants={variants}
          onChange={setVariants}
          images={values.images}
        />
      </Stack>
    </Card>
  );

  const actionButtons = (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
      <Button
        variant="outlined"
        color="inherit"
        size="large"
        startIcon={<Iconify icon="eva:arrow-back-fill" />}
        onClick={() => (onCancel ? onCancel() : router.push(paths.dashboard.product.root))}
      >
        {t('cancel')}
      </Button>

      <LoadingButton
        type="submit"
        variant="contained"
        size="large"
        loading={isSubmitting}
        aria-busy={isSubmitting}
        startIcon={<Iconify icon="eva:save-fill" />}
      >
        {!currentProduct ? t('create_product') : t('save_changes')}
      </LoadingButton>

      {uploadProgress !== null && (
        <LinearProgress variant="determinate" value={uploadProgress} sx={{ mt: 1, borderRadius: 1, width: '100%' }} />
      )}
    </Box>
  );

  const renderActions = drawerMode ? (
    <Box
      sx={{
        position: 'sticky',
        bottom: 0,
        zIndex: 10,
        bgcolor: 'background.paper',
        borderTop: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
        borderRadius: 0,
        py: 2,
        px: 2.5,
        mx: -3,
        mb: -3,
        width: 'calc(100% + 48px)',
      }}
    >
      {actionButtons}
    </Box>
  ) : (
    <Box
      sx={{
        mt: 3,
        ml: { xs: `calc(${TIMELINE_LEFT.xs}px + 16px)`, md: `calc(${TIMELINE_LEFT.md}px + 20px)` },
      }}
    >
      {actionButtons}
    </Box>
  );

  // ---- Build timeline steps ----

  const buildTimelineSteps = () => {
    const steps = [];
    let stepNum = 1;

    // Step: Product Info (always)
    steps.push(
      <FormTimelineStep
        key="product-info"
        stepNumber={stepNum}
        icon="solar:document-text-bold"
        title={t('form_step_product_info')}
        isLast={false}
      >
        {renderProductInfo}
      </FormTimelineStep>
    );
    stepNum += 1;

    if (!advancedMode) {
      // Simple mode: Media → Category & Tags → Pricing
      steps.push(
        <FormTimelineStep
          key="media"
          stepNumber={stepNum}
          icon="solar:gallery-bold"
          title={t('form_step_media')}
          isLast={false}
        >
          {renderMedia}
        </FormTimelineStep>
      );
      stepNum += 1;

      steps.push(
        <FormTimelineStep
          key="category-tags"
          stepNumber={stepNum}
          icon="solar:tag-bold"
          title={t('form_step_category_tags')}
          isLast={!currentProduct ? false : true}
        >
          {renderProperties}
        </FormTimelineStep>
      );
      stepNum += 1;

      if (!currentProduct) {
        steps.push(
          <FormTimelineStep
            key="pricing"
            stepNumber={stepNum}
            icon="solar:wallet-money-bold"
            title={t('form_step_pricing')}
            isLast
          >
            {renderSimplePricing}
          </FormTimelineStep>
        );
        stepNum += 1;
      }
    } else {
      // Advanced mode: Category & Tags → Options → Variants
      steps.push(
        <FormTimelineStep
          key="category-tags"
          stepNumber={stepNum}
          icon="solar:tag-bold"
          title={t('form_step_category_tags')}
          isLast={false}
        >
          {renderProperties}
        </FormTimelineStep>
      );
      stepNum += 1;

      if (!currentProduct) {
        steps.push(
          <FormTimelineStep
            key="options"
            stepNumber={stepNum}
            icon="solar:settings-bold"
            title={t('form_step_options')}
            isLast={false}
          >
            {renderOptionsCard}
          </FormTimelineStep>
        );
        stepNum += 1;

        steps.push(
          <FormTimelineStep
            key="variants"
            stepNumber={stepNum}
            icon="solar:layers-bold"
            title={t('form_step_variants')}
            isLast
          >
            {renderVariantsCard}
          </FormTimelineStep>
        );
        stepNum += 1;
      }
    }

    // Fix isLast on the actual last step
    if (steps.length > 0) {
      const lastIdx = steps.length - 1;
      const lastStep = steps[lastIdx];
      steps[lastIdx] = { ...lastStep, props: { ...lastStep.props, isLast: true } };
    }

    return steps;
  };

  return (
    <div key={`product-form-container-${advancedMode ? 'advanced' : 'simple'}`}>
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <Stack spacing={0}>
          {!currentProduct && renderModeToggle}

          <Box sx={{ mt: !currentProduct ? 3 : 0 }}>
            {buildTimelineSteps()}
          </Box>

          {renderActions}
        </Stack>
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
  drawerMode: PropTypes.bool,
  onSuccess: PropTypes.func,
  onCancel: PropTypes.func,
  onDirtyChange: PropTypes.func,
};

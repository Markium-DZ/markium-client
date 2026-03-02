import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Collapse from '@mui/material/Collapse';
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
import { Alert, Checkbox, FormControlLabel, IconButton, ListSubheader, MenuItem } from '@mui/material';
import Iconify from 'src/components/iconify';
import OptionDefinitionBuilder from './components/option-definition-builder';
import ProductVariantsManager from './components/product-variants-manager';
import InlineMediaPicker from './components/inline-media-picker';

// ── Section Header ──────────────────────────────────────────────────────

function SectionHeader({ icon, title, subtitle, action }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1.5,
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Iconify icon={icon} width={20} sx={{ color: 'primary.main' }} />
        </Box>

        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Stack>

      {action}
    </Box>
  );
}

SectionHeader.propTypes = {
  icon: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  action: PropTypes.node,
};

// ── Main Form ───────────────────────────────────────────────────────────

export default function ProductNewEditForm({ currentProduct, drawerMode = false, onSuccess, onCancel, onDirtyChange }) {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslate();

  const [uploadProgress, setUploadProgress] = useState(null);
  const [showDiscount, setShowDiscount] = useState(false);
  const [optionDefinitions, setOptionDefinitions] = useState([]);
  const [variants, setVariants] = useState([
    {
      id: Date.now(),
      price: 0,
      compare_at_price: null,
      quantity: 0,
      sku: '',
      option_values: [],
      media_ids: [],
      is_default: true,
    },
  ]);

  // Derived: form has product options → show options builder + variant table
  const hasOptions = optionDefinitions.length > 0;

  const { items: categories } = useGetSystemCategories();
  const groupedCategories = useMemo(() => categories || [], [categories]);

  // ── Schema (adapts based on hasOptions) ──────────────────────────────

  const NewProductSchema = useMemo(
    () =>
      Yup.object().shape({
        name: Yup.string().required(t('name_is_required')),
        description: Yup.string(),
        content: Yup.string(),
        category_id: Yup.string(),
        tags: Yup.array(),
        ...(hasOptions
          ? {
              images: Yup.array(),
              option_definitions: Yup.array(),
            }
          : {
              images: Yup.array().min(1, t('image_is_required')),
              sale_price: Yup.number().moreThan(0, t('sale_price_required')),
              quantity: Yup.number(),
            }),
      }),
    [hasOptions, t]
  );

  // ── Default values ───────────────────────────────────────────────────

  const defaultValues = useMemo(() => {
    const defaultVariant = currentProduct?.variants?.find((v) => v.is_default) || currentProduct?.variants?.[0];

    let images = [];
    if (defaultVariant?.media && Array.isArray(defaultVariant.media)) {
      images = defaultVariant.media.map((m) => ({
        id: m.id,
        preview: m.full_url || m.url,
        name: m.alt_text || `media-${m.id}`,
        size: m.file_size,
        full_url: m.full_url || m.url,
        media_id: m.id,
        isExisting: true,
      }));
    } else if (defaultVariant?.media && typeof defaultVariant.media === 'object') {
      images = [
        {
          id: defaultVariant.media.id,
          preview: defaultVariant.media.full_url || defaultVariant.media.url,
          name: defaultVariant.media.alt_text || `media-${defaultVariant.media.id}`,
          size: defaultVariant.media.file_size,
          full_url: defaultVariant.media.full_url || defaultVariant.media.url,
          media_id: defaultVariant.media.id,
          isExisting: true,
        },
      ];
    }

    return {
      name: currentProduct?.name || '',
      description: currentProduct?.description || '',
      content: currentProduct?.content || '',
      images,
      category_id: currentProduct?.category_id || '',
      tags: currentProduct?.tags || [],
      quantity: defaultVariant?.quantity || 1,
      sale_price: defaultVariant?.price || 0,
      compare_at_price: defaultVariant?.compare_at_price || null,
      option_definitions: currentProduct?.option_definitions || [],
      variants: currentProduct?.variants || [],
    };
  }, [currentProduct]);

  // ── Form setup ───────────────────────────────────────────────────────

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

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  // Load existing product data
  useEffect(() => {
    if (currentProduct) {
      reset(defaultValues);

      const defVariant =
        currentProduct.variants?.find((v) => v.is_default) || currentProduct.variants?.[0];
      setShowDiscount(defVariant?.compare_at_price > 0);

      if (currentProduct.option_definitions?.length > 0) {
        setOptionDefinitions(currentProduct.option_definitions);
      } else {
        setOptionDefinitions([]);
      }

      if (currentProduct.variants?.length > 0) {
        setVariants(
          currentProduct.variants.map((v) => ({
            id: v.id || Date.now(),
            price: v.price || 0,
            compare_at_price: v.compare_at_price || null,
            quantity: v.quantity || 0,
            sku: v.sku || '',
            option_values: v.option_values?.map((ov) => ov.value) || v.options || [],
            media_ids: Array.isArray(v.media) ? v.media.map((m) => m.id) : v.media?.id ? [v.media.id] : [],
            selected_media: Array.isArray(v.media) ? v.media : v.media ? [v.media] : [],
            is_default: v.is_default || false,
          }))
        );
      }
    }
  }, [currentProduct, defaultValues, reset]);

  // ── Selected media IDs (for InlineMediaPicker) ───────────────────────

  const selectedMediaIds = useMemo(
    () => new Set((values.images || []).map((img) => img.media_id || img.id).filter(Boolean)),
    [values.images]
  );

  // ── Product media pool (for Options & Variants) ─────────────────────

  const productMediaPool = useMemo(
    () =>
      (values.images || [])
        .filter((img) => img.media_id || img.id)
        .map((img) => ({
          id: img.media_id || img.id,
          full_url: img.preview || img.full_url,
          alt_text: img.name || '',
        })),
    [values.images]
  );

  // ── Handlers ─────────────────────────────────────────────────────────

  const handleMediaToggle = useCallback(
    (mediaItem) => {
      const currentImages = values.images || [];
      const isSelected = currentImages.some((img) => (img.media_id || img.id) === mediaItem.id);

      if (isSelected) {
        setValue(
          'images',
          currentImages.filter((img) => (img.media_id || img.id) !== mediaItem.id),
          { shouldValidate: true }
        );
      } else {
        setValue(
          'images',
          [
            ...currentImages,
            {
              id: mediaItem.id,
              preview: mediaItem.full_url,
              name: mediaItem.alt_text || `media-${mediaItem.id}`,
              size: mediaItem.file_size,
              media_id: mediaItem.id,
              isExisting: true,
            },
          ],
          { shouldValidate: true }
        );
      }
    },
    [values.images, setValue]
  );

  const handleMediaAdd = useCallback(
    (uploadedItems) => {
      const newImages = uploadedItems.map((item) => ({
        id: item.id,
        preview: item.full_url,
        name: item.alt_text || `media-${item.id}`,
        size: item.file_size,
        media_id: item.id,
        isExisting: true,
      }));
      setValue('images', [...(values.images || []), ...newImages], { shouldValidate: true });
    },
    [values.images, setValue]
  );

  const handleAddFirstOption = useCallback(() => {
    setOptionDefinitions([
      {
        id: Date.now(),
        name: '',
        type: 'text',
        style: 'dropdown',
        values: [],
      },
    ]);
  }, []);

  // ── Submit ───────────────────────────────────────────────────────────

  const onSubmit = handleSubmit(
    async (data) => {
      try {
        // Validate variants in options mode
        if (hasOptions) {
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
          const invalidPriceVariant = variants.find(
            (v) => v.compare_at_price > 0 && v.compare_at_price < v.price
          );
          if (invalidPriceVariant) {
            enqueueSnackbar(t('compare_at_price_must_be_greater_than_price'), { variant: 'error' });
            return;
          }
          const validStyles = ['color', 'dropdown', 'text'];
          const invalidOption = optionDefinitions.find(
            (opt) => opt.style && !validStyles.includes(opt.style)
          );
          if (invalidOption) {
            enqueueSnackbar(t('invalid_option_style'), { variant: 'error' });
            return;
          }
        }

        // Validate compare_at_price in simple mode
        if (!hasOptions && showDiscount && data.compare_at_price > 0 && data.compare_at_price < data.sale_price) {
          enqueueSnackbar(t('compare_at_price_must_be_greater_than_price'), { variant: 'error' });
          return;
        }

        // Upload images (new products only)
        let uploadedMedia = [];

        if (!currentProduct?.id) {
          const imagesToUpload = [];

          if (hasOptions) {
            variants.forEach((variant) => {
              if (variant.image_file && variant.image_file instanceof File) {
                imagesToUpload.push({ file: variant.image_file, variantId: variant.id });
              }
            });
          } else if (data.images?.length > 0) {
            data.images.filter((img) => img instanceof File).forEach((file) => {
              imagesToUpload.push({ file, variantId: null });
            });
          }

          if (imagesToUpload.length > 0) {
            const files = imagesToUpload.map((item) => item.file);
            const mediaResponse = await createMedia(files, setUploadProgress);
            setUploadProgress(null);
            uploadedMedia = mediaResponse.data.data || [];

            if (hasOptions) {
              imagesToUpload.forEach((item, index) => {
                const mediaId = uploadedMedia[index]?.id;
                if (mediaId && item.variantId) {
                  const variantIndex = variants.findIndex((v) => v.id === item.variantId);
                  if (variantIndex !== -1) {
                    if (!variants[variantIndex].media_ids) variants[variantIndex].media_ids = [];
                    variants[variantIndex].media_ids.push(mediaId);
                  }
                }
              });
            }
          }
        }

        // Build payload
        const payload = {
          name: data.name,
          description: data.description || '',
          content: data.content || '',
          category_id: data.category_id || null,
          tags: data.tags || [],
        };

        if (hasOptions) {
          payload.option_definitions = optionDefinitions
            .filter((opt) => opt.name && opt.values.length > 0)
            .map((opt) => ({
              name: opt.name,
              type: opt.type,
              style: opt.style,
              values: opt.values.map((v) => {
                const cleaned = { value: v.value };
                if (v.color_hex) cleaned.color_hex = v.color_hex;
                return cleaned;
              }),
            }));

          payload.variants = variants.map((variant, index) => {
            const variantData = {
              price: parseFloat(variant.price) || 0,
              compare_at_price: variant.compare_at_price ? parseFloat(variant.compare_at_price) : null,
              quantity: parseInt(variant.quantity, 10) || 0,
              sku: variant.sku || '',
              option_values: variant.option_values || [],
              media_ids: variant.media_ids || [],
              is_default: variant.is_default || false,
              position: index,
              is_active: true,
            };

            if (currentProduct?.id && variant.id && typeof variant.id === 'number') {
              variantData.id = variant.id;
            }

            return variantData;
          });
        } else {
          const existingMediaIds =
            data.images?.filter((img) => img.isExisting && img.media_id).map((img) => img.media_id) || [];
          const uploadedMediaIds = uploadedMedia.map((m) => m.id) || [];
          const mediaIds = [...existingMediaIds, ...uploadedMediaIds];

          const simpleVariant = {
            price: parseFloat(data.sale_price) || 0,
            compare_at_price: showDiscount ? (parseFloat(data.compare_at_price) || 0) : null,
            quantity: parseInt(data.quantity, 10) || 0,
            sku: '',
            option_values: [],
            media_ids: mediaIds,
            is_default: true,
            position: 0,
            is_active: true,
          };

          if (currentProduct?.id && variants[0]?.id && typeof variants[0].id === 'number') {
            simpleVariant.id = variants[0].id;
          }

          payload.variants = [simpleVariant];
        }

        // Submit
        if (currentProduct?.id) {
          await updateProduct(currentProduct.id, payload);
        } else {
          await createProduct(payload);
          captureEvent('product_created', {
            name: data.name,
            category_id: data.category_id,
            mode: hasOptions ? 'advanced' : 'simple',
          });
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
      const firstErrorKey = Object.keys(errors)[0];
      if (firstErrorKey) {
        const el = document.querySelector(`[name="${firstErrorKey}"]`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.focus();
        }
      }

      Object.values(errors)
        .map((err) => err?.message)
        .filter(Boolean)
        .forEach((msg) => enqueueSnackbar(msg, { variant: 'error' }));
    }
  );

  // ── Render: Product Info ─────────────────────────────────────────────

  const renderProductInfo = (
    <Card>
      <Stack spacing={3} sx={{ p: 3 }}>
        <SectionHeader icon="solar:document-text-bold" title={t('form_step_product_info')} />

        <RHFTextField name="name" label={t('product_name')} required />
        <RHFTextField name="description" label={t('description')} />

        <Stack spacing={1.5}>
          <Typography variant="subtitle2">{t('content')}</Typography>
          <RHFEditor simple name="content" />
        </Stack>
      </Stack>
    </Card>
  );

  // ── Render: Media ────────────────────────────────────────────────────

  const renderMedia = (
    <Card>
      <Stack spacing={2.5} sx={{ p: 3 }}>
        <SectionHeader
          icon="solar:gallery-bold"
          title={t('form_step_media')}
          subtitle={
            (values.images?.length || 0) > 0
              ? `${values.images.length} ${t('selected')}`
              : undefined
          }
        />

        <InlineMediaPicker
          selectedIds={selectedMediaIds}
          onToggle={handleMediaToggle}
          onAdd={handleMediaAdd}
        />

        {(values.images?.length || 0) > 0 && (
          <Alert
            severity="info"
            icon={<Iconify icon="solar:info-circle-bold" width={20} />}
            sx={{
              '& .MuiAlert-message': { width: '100%' },
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.4 }}>
              {t('media_shared_hint')}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.25, display: 'block' }}>
              {t('media_shared_hint_detail')}
            </Typography>
          </Alert>
        )}
      </Stack>
    </Card>
  );

  // ── Render: Category & Tags ──────────────────────────────────────────

  const renderProperties = (
    <Card>
      <Stack spacing={3} sx={{ p: 3 }}>
        <SectionHeader icon="solar:tag-bold" title={t('form_step_category_tags')} />

        <RHFSelect name="category_id" label={t('category')}>
          <MenuItem value="">{t('select_category')}</MenuItem>
          <Divider sx={{ borderStyle: 'dashed' }} />
          {groupedCategories?.map((parentCategory) => [
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
            parentCategory.children?.length === 0 && (
              <MenuItem key={parentCategory.id} value={parentCategory.id} sx={{ pl: 3 }}>
                {parentCategory.name}
              </MenuItem>
            ),
            ...(parentCategory.children?.map((child) => (
              <MenuItem key={child.id} value={child.id} sx={{ pl: 3 }}>
                {child.name}
              </MenuItem>
            )) || []),
          ])}
        </RHFSelect>

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

  // ── Render: Pricing (simple — no options) ────────────────────────────

  const renderSimplePricing = (
    <Card>
      <Stack spacing={3} sx={{ p: 3 }}>
        <SectionHeader icon="solar:wallet-money-bold" title={t('form_step_pricing')} />

        <Box
          columnGap={2}
          rowGap={3}
          display="grid"
          gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)' }}
        >
          <RHFTextField
            name="sale_price"
            label={t('sale_price')}
            placeholder="0.00"
            type="number"
            required
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
                    onClick={() =>
                      setValue('sale_price', Math.max(0, (parseFloat(values.sale_price) || 0) - 1))
                    }
                    sx={{ p: 0, lineHeight: 1 }}
                  >
                    <Iconify icon="eva:arrow-ios-downward-fill" width={16} />
                  </IconButton>
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

        <FormControlLabel
          control={
            <Checkbox
              size="small"
              checked={showDiscount}
              onChange={(e) => {
                setShowDiscount(e.target.checked);
                if (!e.target.checked) {
                  setValue('compare_at_price', null);
                }
              }}
            />
          }
          label={
            <Typography variant="body2" color="text.secondary">
              {t('add_discount')}
            </Typography>
          }
        />

        <Collapse in={showDiscount} unmountOnExit>
          <RHFTextField
            name="compare_at_price"
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
            error={
              values.compare_at_price > 0 && values.compare_at_price <= values.sale_price
            }
            helperText={
              values.compare_at_price > 0 && values.compare_at_price <= values.sale_price
                ? t('compare_at_price_must_be_greater_than_price')
                : t('compare_at_price_helper_text')
            }
          />
        </Collapse>
      </Stack>
    </Card>
  );

  // ── Render: "Add options" trigger ────────────────────────────────────

  const renderOptionsTrigger = (
    <Paper
      onClick={handleAddFirstOption}
      sx={{
        p: 3,
        cursor: 'pointer',
        borderRadius: 2,
        border: (theme) => `2px dashed ${alpha(theme.palette.grey[500], 0.16)}`,
        bgcolor: (theme) => alpha(theme.palette.grey[500], 0.02),
        transition: 'all 0.25s ease',
        '&:hover': {
          borderColor: (theme) => alpha(theme.palette.primary.main, 0.3),
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.02),
          '& .trigger-icon': {
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
          },
        },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={2}>
        <Box
          className="trigger-icon"
          sx={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            bgcolor: (theme) => alpha(theme.palette.grey[500], 0.08),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'background-color 0.25s',
          }}
        >
          <Iconify icon="solar:tuning-2-bold-duotone" width={22} sx={{ color: 'text.secondary' }} />
        </Box>

        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {t('add_product_options_title')}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled', lineHeight: 1.4 }}>
            {t('add_product_options_description')}
          </Typography>
        </Box>

        <Iconify
          icon="solar:add-circle-bold"
          width={24}
          sx={{ color: 'text.disabled', flexShrink: 0 }}
        />
      </Stack>
    </Paper>
  );

  // ── Render: Options Builder ──────────────────────────────────────────

  const renderOptionsCard = (
    <Card>
      <Stack spacing={3} sx={{ p: 3 }}>
        <SectionHeader
          icon="solar:settings-bold"
          title={t('form_step_options')}
          action={
            <Button
              size="small"
              color="error"
              variant="soft"
              startIcon={<Iconify icon="solar:close-circle-bold" width={18} />}
              onClick={() => setOptionDefinitions([])}
              sx={{ fontWeight: 600, textTransform: 'none' }}
            >
              {t('remove_options')}
            </Button>
          }
        />

        <OptionDefinitionBuilder
          options={optionDefinitions}
          onChange={setOptionDefinitions}
          maxOptions={3}
          productMedia={productMediaPool}
        />
      </Stack>
    </Card>
  );

  // ── Render: Variants Table ───────────────────────────────────────────

  const renderVariantsCard = (
    <Card>
      <Stack spacing={3} sx={{ p: 3 }}>
        <SectionHeader icon="solar:layers-bold" title={t('form_step_variants')} />

        <ProductVariantsManager
          options={optionDefinitions}
          variants={variants}
          onChange={setVariants}
          images={values.images}
          productMedia={productMediaPool}
        />
      </Stack>
    </Card>
  );

  // ── Render: Actions ──────────────────────────────────────────────────

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
        <LinearProgress
          variant="determinate"
          value={uploadProgress}
          sx={{ mt: 1, borderRadius: 1, width: '100%' }}
        />
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
    <Box sx={{ mt: 1 }}>{actionButtons}</Box>
  );

  // ── Main Render ──────────────────────────────────────────────────────

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Stack spacing={3}>
        {/* 1. Product Info */}
        {renderProductInfo}

        {/* 2. Media (inline) */}
        {renderMedia}

        {/* 3. Category & Tags */}
        {renderProperties}

        {/* 4. Pricing — visible only in simple mode (no options) */}
        <Collapse in={!hasOptions} unmountOnExit>
          {renderSimplePricing}
        </Collapse>

        {/* 5. "Add options" trigger — visible only in simple mode for new products */}
        <Collapse in={!hasOptions && !currentProduct} unmountOnExit>
          {renderOptionsTrigger}
        </Collapse>

        {/* 6. Options Builder — visible when options exist */}
        <Collapse in={hasOptions} unmountOnExit>
          {renderOptionsCard}
        </Collapse>

        {/* 7. Variants Table — visible when options exist */}
        <Collapse in={hasOptions} unmountOnExit>
          {renderVariantsCard}
        </Collapse>

        {/* Actions */}
        {renderActions}
      </Stack>
    </FormProvider>
  );
}

ProductNewEditForm.propTypes = {
  currentProduct: PropTypes.object,
  drawerMode: PropTypes.bool,
  onSuccess: PropTypes.func,
  onCancel: PropTypes.func,
  onDirtyChange: PropTypes.func,
};

import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';

import { useTranslate } from 'src/locales';
import { useSnackbar } from 'src/components/snackbar';
import { updateProductVariant } from 'src/api/product';
import { MediaPickerDialog } from 'src/components/media-picker';
import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function ProductVariantEditDialog({ open, onClose, variant, productId, onSuccess }) {
  const { t } = useTranslate();
  const { enqueueSnackbar } = useSnackbar();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openMediaPicker, setOpenMediaPicker] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      price: variant?.price || '',
      compare_at_price: variant?.compare_at_price || '',
      cost: variant?.cost || '',
      quantity: variant?.quantity || '',
      sku: variant?.sku || '',
      media_ids: [],
      is_default: variant?.is_default || false,
      is_active: variant?.is_active ?? true,
      weight: variant?.weight || '',
      weight_unit: variant?.weight_unit || 'kg',
      requires_shipping: variant?.requires_shipping ?? true,
    },
  });

  const isDefault = watch('is_default');
  const isActive = watch('is_active');
  const requiresShipping = watch('requires_shipping');

  useEffect(() => {
    if (variant) {
      // Handle media as array
      const mediaArray = Array.isArray(variant.media) ? variant.media : (variant.media ? [variant.media] : []);

      reset({
        price: variant.price || '',
        compare_at_price: variant.compare_at_price || '',
        cost: variant.cost || '',
        quantity: variant.quantity || '',
        sku: variant.sku || '',
        media_ids: mediaArray.map(m => m.id) || [],
        is_default: variant.is_default || false,
        is_active: variant.is_active ?? true,
        weight: variant.weight || '',
        weight_unit: variant.weight_unit || 'kg',
        requires_shipping: variant.requires_shipping ?? true,
      });

      // Set selected media array from variant
      setSelectedMedia(mediaArray.map(m => ({
        id: m.id,
        full_url: m.full_url || m.url || '',
        alt_text: m.alt_text || '',
      })));
    }
  }, [variant, reset]);

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);

      // Prepare data - only send fields that have values
      const updateData = {};
      if (data.price !== '') updateData.price = parseFloat(data.price);
      if (data.compare_at_price !== '') updateData.compare_at_price = parseFloat(data.compare_at_price);
      if (data.cost !== '') updateData.cost = parseFloat(data.cost);
      if (data.quantity !== '') updateData.quantity = parseInt(data.quantity, 10);
      if (data.sku) updateData.sku = data.sku;
      if (data.media_ids && data.media_ids.length > 0) {
        updateData.media_ids = data.media_ids.map(id => parseInt(id, 10));
      }
      updateData.is_default = data.is_default;
      updateData.is_active = data.is_active;
      if (data.weight !== '') updateData.weight = parseFloat(data.weight);
      if (data.weight_unit) updateData.weight_unit = data.weight_unit;
      updateData.requires_shipping = data.requires_shipping;

      await updateProductVariant(productId, variant.id, updateData);

      enqueueSnackbar(t('variant_updated_successfully'), { variant: 'success' });
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error updating variant:', error);
      enqueueSnackbar(error?.message || t('error_updating_variant'), { variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      onClose();
    }
  };

  const handleOpenMediaPicker = () => {
    setOpenMediaPicker(true);
  };

  const handleMediaSelect = (media) => {
    // Handle both single and multiple media
    const mediaArray = Array.isArray(media) ? media : [media];
    setSelectedMedia(mediaArray);
    setValue('media_ids', mediaArray.map(m => m.id));
    setOpenMediaPicker(false);
  };

  const handleRemoveMedia = (mediaId) => {
    const updated = selectedMedia.filter(m => m.id !== mediaId);
    setSelectedMedia(updated);
    setValue('media_ids', updated.map(m => m.id));
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('edit_variant')}</DialogTitle>

      <DialogContent>
        <Box component="form" sx={{ mt: 2 }}>
          <Stack spacing={3}>
            {/* Variant Info */}
            {variant?.options?.length > 0 && (
              <Box>
                {variant.options.map((option, idx) => (
                  <Typography key={idx} variant="caption" color="text.secondary">
                    {option.name}: {option.value}
                  </Typography>
                ))}
              </Box>
            )}

            {/* SKU */}
            <TextField
              fullWidth
              label={t('sku')}
              {...register('sku')}
            />

            {/* Pricing */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                fullWidth
                label={t('price')}
                type="number"
                inputProps={{ step: '0.01', min: '0' }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                {...register('price', {
                  min: { value: 0, message: t('price_must_be_positive') },
                })}
                error={!!errors.price}
                helperText={errors.price?.message}
              />

              <TextField
                fullWidth
                label={t('compare_at_price')}
                type="number"
                inputProps={{ step: '0.01', min: '0' }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                {...register('compare_at_price', {
                  min: { value: 0, message: t('price_must_be_positive') },
                })}
                error={!!errors.compare_at_price}
                helperText={errors.compare_at_price?.message}
              />
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                fullWidth
                label={t('cost')}
                type="number"
                inputProps={{ step: '0.01', min: '0' }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                {...register('cost', {
                  min: { value: 0, message: t('price_must_be_positive') },
                })}
                error={!!errors.cost}
                helperText={errors.cost?.message}
              />

              <TextField
                fullWidth
                label={t('quantity')}
                type="number"
                inputProps={{ step: '1', min: '0' }}
                {...register('quantity', {
                  min: { value: 0, message: t('quantity_must_be_positive') },
                })}
                error={!!errors.quantity}
                helperText={errors.quantity?.message}
              />
            </Stack>

            <Divider />

            {/* Shipping */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                fullWidth
                label={t('weight')}
                type="number"
                inputProps={{ step: '0.01', min: '0' }}
                {...register('weight', {
                  min: { value: 0, message: t('weight_must_be_positive') },
                })}
                error={!!errors.weight}
                helperText={errors.weight?.message}
              />

              <TextField
                fullWidth
                select
                label={t('weight_unit')}
                defaultValue={variant?.weight_unit || 'kg'}
                {...register('weight_unit')}
              >
                <MenuItem value="kg">{t('kg')}</MenuItem>
                <MenuItem value="g">{t('g')}</MenuItem>
                <MenuItem value="lb">{t('lb')}</MenuItem>
                <MenuItem value="oz">{t('oz')}</MenuItem>
              </TextField>
            </Stack>

            <FormControlLabel
              control={
                <Switch
                  checked={requiresShipping}
                  onChange={(e) => setValue('requires_shipping', e.target.checked)}
                />
              }
              label={t('requires_shipping')}
            />

            <Divider />

            {/* Status toggles */}
            <Stack direction="row" spacing={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isActive}
                    onChange={(e) => setValue('is_active', e.target.checked)}
                  />
                }
                label={t('is_active')}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={isDefault}
                    onChange={(e) => setValue('is_default', e.target.checked)}
                  />
                }
                label={t('is_default')}
              />
            </Stack>

            <Divider />

            {/* Media Selection */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {t('variant_images')} ({selectedMedia.length})
              </Typography>

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Add Media Button */}
                <Button
                  variant="outlined"
                  startIcon={<Iconify icon="eva:plus-fill" />}
                  onClick={handleOpenMediaPicker}
                  sx={{ minHeight: 80 }}
                >
                  {t('select_images')}
                </Button>

                {/* Show all selected media */}
                {selectedMedia.map((media) => (
                  <Card key={media.id} sx={{ p: 1, position: 'relative' }}>
                    <Avatar
                      src={media.full_url}
                      variant="rounded"
                      sx={{ width: 80, height: 80 }}
                    />
                    <IconButton
                      onClick={() => handleRemoveMedia(media.id)}
                      size="small"
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
                  </Card>
                ))}
              </Box>
            </Box>
          </Stack>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={isSubmitting}>
          {t('cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          {isSubmitting ? t('saving') : t('save_changes')}
        </Button>
      </DialogActions>

      {/* Media Picker Dialog */}
      <MediaPickerDialog
        open={openMediaPicker}
        onClose={() => setOpenMediaPicker(false)}
        onSelect={handleMediaSelect}
        multiple={true}
        title={t('select_variant_images')}
      />
    </Dialog>
  );
}

ProductVariantEditDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  variant: PropTypes.object,
  productId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onSuccess: PropTypes.func,
};

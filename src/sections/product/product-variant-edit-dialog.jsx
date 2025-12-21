import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import InputAdornment from '@mui/material/InputAdornment';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Card from '@mui/material/Card';

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
  const [selectedMedia, setSelectedMedia] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      price: variant?.price || '',
      compare_at_price: variant?.compare_at_price || '',
      quantity: variant?.quantity || '',
      media_id: variant?.media?.id || '',
    },
  });

  useEffect(() => {
    if (variant) {
      reset({
        price: variant.price || '',
        compare_at_price: variant.compare_at_price || '',
        quantity: variant.quantity || '',
        media_id: variant.media?.id || '',
      });
      // Set selected media from variant
      if (variant.media && typeof variant.media === 'object') {
        setSelectedMedia({
          id: variant.media.id,
          full_url: variant.media.full_url || variant.media.url || '',
        });
      } else {
        setSelectedMedia(null);
      }
    }
  }, [variant, reset]);

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);

      // Prepare data - only send fields that have values
      const updateData = {};
      if (data.price) updateData.price = parseFloat(data.price);
      if (data.compare_at_price) updateData.compare_at_price = parseFloat(data.compare_at_price);
      if (data.quantity !== '') updateData.quantity = parseInt(data.quantity, 10);
      if (data.media_id) updateData.media_id = parseInt(data.media_id, 10);

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
    setSelectedMedia(media);
    setValue('media_id', media.id);
    setOpenMediaPicker(false);
  };

  const handleRemoveMedia = () => {
    setSelectedMedia(null);
    setValue('media_id', '');
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('edit_variant')}</DialogTitle>

      <DialogContent>
        <Box component="form" sx={{ mt: 2 }}>
          <Stack spacing={3}>
            {/* Variant Info */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {t('sku')}: {variant?.sku || t('no_sku')}
              </Typography>
              {variant?.options?.map((option, idx) => (
                <Typography key={idx} variant="caption" color="text.secondary">
                  {/* Display option values here if needed */}
                </Typography>
              ))}
            </Box>

            {/* Price */}
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

            {/* Compare At Price */}
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

            {/* Quantity */}
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

            {/* Media Selection */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {t('variant_image')}
              </Typography>

              {selectedMedia ? (
                <Card sx={{ p: 2, position: 'relative' }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar
                      src={selectedMedia.full_url}
                      variant="rounded"
                      sx={{ width: 80, height: 80 }}
                    />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2">{t('media_selected')}</Typography>
                    </Box>
                    <IconButton onClick={handleRemoveMedia} size="small">
                      <Iconify icon="eva:close-fill" />
                    </IconButton>
                  </Stack>
                </Card>
              ) : (
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Iconify icon="eva:image-outline" />}
                  onClick={handleOpenMediaPicker}
                >
                  {t('select_image')}
                </Button>
              )}
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
        multiple={false}
        title={t('select_variant_image')}
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

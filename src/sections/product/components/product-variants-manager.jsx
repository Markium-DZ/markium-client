import PropTypes from 'prop-types';
import { useState, useMemo, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Radio from '@mui/material/Radio';
import Collapse from '@mui/material/Collapse';
import InputAdornment from '@mui/material/InputAdornment';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import { alpha } from '@mui/material/styles';

import Iconify from 'src/components/iconify';
import { useTranslate } from 'src/locales';
import Image from 'src/components/image';
import { MediaPickerDialog } from 'src/components/media-picker';

// ----------------------------------------------------------------------

// Generate all possible variant combinations
function generateVariantCombinations(options) {
  if (!options || options.length === 0) return [];

  // Filter options that have values
  const validOptions = options.filter(opt => opt.values && opt.values.length > 0 && opt.name.trim());

  if (validOptions.length === 0) return [];

  // Generate combinations
  const combinations = validOptions.reduce(
    (acc, option) => {
      const newCombinations = [];
      acc.forEach((combination) => {
        option.values.forEach((value) => {
          newCombinations.push([...combination, { optionName: option.name, value: value.value }]);
        });
      });
      return newCombinations;
    },
    [[]]
  );

  return combinations.filter(combo => combo.length > 0);
}

// ----------------------------------------------------------------------

export default function ProductVariantsManager({ options, variants, onChange, images }) {
  const { t } = useTranslate();
  const [expandedVariant, setExpandedVariant] = useState(null);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkValues, setBulkValues] = useState({
    price: '',
    compare_at_price: '',
    quantity: '',
  });

  // Generate all possible variants based on options
  const possibleVariants = useMemo(() => generateVariantCombinations(options), [options]);

  // Sync variants with possible combinations
  const syncedVariants = useMemo(() => {
    if (possibleVariants.length === 0) {
      // No options defined, return single default variant
      return variants.length > 0 ? [variants[0]] : [{
        id: Date.now(),
        price: 0,
        compare_at_price: 0,
        quantity: 0,
        option_values: [],
        media_id: null,
        is_default: true,
      }];
    }

    // Map existing variants or create new ones
    return possibleVariants.map((combo, index) => {
      const optionValues = combo.map(c => c.value);
      const existingVariant = variants.find(
        v => JSON.stringify(v.option_values) === JSON.stringify(optionValues)
      );

      if (existingVariant) {
        return existingVariant;
      }

      return {
        id: Date.now() + index,
        price: 0,
        compare_at_price: 0,
        quantity: 0,
        option_values: optionValues,
        media_id: null,
        is_default: index === 0,
      };
    });
  }, [possibleVariants, variants]);

  // Update parent when synced variants change
  useMemo(() => {
    if (JSON.stringify(syncedVariants) !== JSON.stringify(variants)) {
      onChange(syncedVariants);
    }
  }, [syncedVariants, variants, onChange]);

  const handleUpdateVariant = useCallback((variantId, field, value) => {
    const updatedVariants = syncedVariants.map((variant) => {
      if (variant.id === variantId) {
        // Handle media_data special case - spread both fields at once
        if (field === 'media_data') {
          return { ...variant, ...value };
        }
        // If setting is_default to true, set all others to false
        if (field === 'is_default' && value === true) {
          return { ...variant, [field]: value };
        }
        return { ...variant, [field]: value };
      }
      // Unset other defaults
      if (field === 'is_default' && value === true) {
        return { ...variant, is_default: false };
      }
      return variant;
    });
    onChange(updatedVariants);
  }, [syncedVariants, onChange]);

  const handleBulkApply = () => {
    onChange(
      syncedVariants.map((variant) => ({
        ...variant,
        ...(bulkValues.price && { price: parseFloat(bulkValues.price) }),
        ...(bulkValues.compare_at_price && { compare_at_price: parseFloat(bulkValues.compare_at_price) }),
        ...(bulkValues.quantity && { quantity: parseInt(bulkValues.quantity, 10) }),
      }))
    );
    setBulkEditOpen(false);
    setBulkValues({ price: '', compare_at_price: '', quantity: '' });
  };


  if (possibleVariants.length === 0 && options.length > 0) {
    return (
      <Paper
        sx={{
          p: 5,
          textAlign: 'center',
          bgcolor: (theme) => alpha(theme.palette.info.main, 0.04),
          border: (theme) => `2px dashed ${alpha(theme.palette.info.main, 0.24)}`,
        }}
      >
        <Iconify
          icon="carbon:product"
          width={48}
          sx={{ color: 'info.main', mb: 2 }}
        />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {t('add_option_values_first')}
        </Typography>
        <Typography variant="body2" color="text.disabled">
          {t('add_option_values_description')}
        </Typography>
      </Paper>
    );
  }

  return (
    <Stack spacing={3}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Iconify icon="carbon:product" width={24} />
            {t('product_variants')}
            <Chip
              label={`${syncedVariants.length} ${t('variants')}`}
              size="small"
              color="primary"
              variant="soft"
            />
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {possibleVariants.length > 0
              ? t('variants_auto_generated')
              : t('single_variant_product')}
          </Typography>
        </Box>

        {syncedVariants.length > 1 && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              color="secondary"
              startIcon={<Iconify icon="mdi:table-edit" />}
              onClick={() => setBulkEditOpen(!bulkEditOpen)}
            >
              {t('bulk_edit')}
            </Button>
          </Box>
        )}
      </Box>

      {/* Bulk Edit Panel */}
      <Collapse in={bulkEditOpen}>
        <Card
          sx={{
            p: 3,
            bgcolor: (theme) => alpha(theme.palette.secondary.main, 0.04),
            border: (theme) => `1px solid ${alpha(theme.palette.secondary.main, 0.24)}`,
          }}
        >
          <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Iconify icon="mdi:table-edit" width={20} />
            {t('bulk_edit_variants')}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
            {t('bulk_edit_description')}
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
              mb: 2,
            }}
          >
            <TextField
              size="small"
              label={t('price')}
              type="number"
              value={bulkValues.price}
              onChange={(e) => setBulkValues({ ...bulkValues, price: e.target.value })}
              InputProps={{
                startAdornment: <InputAdornment position="start">DZD</InputAdornment>,
              }}
            />
            <TextField
              size="small"
              label={t('compare_at_price')}
              type="number"
              value={bulkValues.compare_at_price}
              onChange={(e) => setBulkValues({ ...bulkValues, compare_at_price: e.target.value })}
              InputProps={{
                startAdornment: <InputAdornment position="start">DZD</InputAdornment>,
              }}
            />
            <TextField
              size="small"
              label={t('quantity')}
              type="number"
              value={bulkValues.quantity}
              onChange={(e) => setBulkValues({ ...bulkValues, quantity: e.target.value })}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button size="small" onClick={() => setBulkEditOpen(false)}>
              {t('cancel')}
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={handleBulkApply}
              disabled={!bulkValues.price && !bulkValues.compare_at_price && !bulkValues.quantity}
            >
              {t('apply_to_all')}
            </Button>
          </Box>
        </Card>
      </Collapse>

      {/* Variants List */}
      <Card sx={{ overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: (theme) => alpha(theme.palette.grey[500], 0.04) }}>
                <TableCell padding="checkbox" sx={{ width: 50 }}>
                  <Typography variant="caption" fontWeight={700}>
                    {t('default')}
                  </Typography>
                </TableCell>
                <TableCell sx={{ minWidth: 180 }}>
                  <Typography variant="caption" fontWeight={700}>
                    {t('variant')}
                  </Typography>
                </TableCell>
                <TableCell sx={{ width: 120 }}>
                  <Typography variant="caption" fontWeight={700}>
                    {t('price')}
                  </Typography>
                </TableCell>
                <TableCell sx={{ width: 120 }}>
                  <Typography variant="caption" fontWeight={700}>
                    {t('compare_price')}
                  </Typography>
                </TableCell>
                <TableCell sx={{ width: 100 }}>
                  <Typography variant="caption" fontWeight={700}>
                    {t('stock')}
                  </Typography>
                </TableCell>
                <TableCell sx={{ width: 80, textAlign: 'center' }}>
                  <Typography variant="caption" fontWeight={700}>
                    {t('image')}
                  </Typography>
                </TableCell>
                <TableCell sx={{ width: 60 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {syncedVariants.map((variant, index) => (
                <VariantRow
                  key={variant.id}
                  variant={variant}
                  index={index}
                  expanded={expandedVariant === variant.id}
                  onToggleExpand={() => setExpandedVariant(expandedVariant === variant.id ? null : variant.id)}
                  onUpdate={handleUpdateVariant}
                  images={images}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Stack>
  );
}

ProductVariantsManager.propTypes = {
  options: PropTypes.array.isRequired,
  variants: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
  images: PropTypes.array,
};

// ----------------------------------------------------------------------

function VariantRow({ variant, index, expanded, onToggleExpand, onUpdate, images }) {
  const { t } = useTranslate();
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  const variantLabel = variant.option_values.length > 0
    ? variant.option_values.join(' / ')
    : t('default_variant');

  // Show variant's own uploaded image first, then selected_media from gallery, then fall back to images array
  const selectedImage = variant.image_file || variant.selected_media || images?.find((img) => img.id === variant.media_id || img.preview);

  const handleMediaSelect = useCallback((selectedMedia) => {
    // Handle both array and single object
    let media;
    if (Array.isArray(selectedMedia)) {
      media = selectedMedia[0];
    } else {
      media = selectedMedia;
    }

    if (media) {
      // Update variant with both media_id and the media object
      onUpdate(variant.id, 'media_data', { media_id: media.id, selected_media: media });
    }
    setMediaPickerOpen(false);
  }, [variant.id, onUpdate]);

  return (
    <>
      <TableRow
        hover
        sx={{
          cursor: 'pointer',
          bgcolor: variant.is_default ? (theme) => alpha(theme.palette.primary.main, 0.04) : 'transparent',
          '&:hover': {
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
          },
        }}
      >
        {/* Default Radio */}
        <TableCell padding="checkbox">
          <Radio
            size="small"
            checked={variant.is_default}
            onChange={() => onUpdate(variant.id, 'is_default', true)}
            color="primary"
          />
        </TableCell>

        {/* Variant Name */}
        <TableCell onClick={onToggleExpand}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" fontWeight={variant.is_default ? 600 : 400}>
              {variantLabel}
            </Typography>
            {variant.is_default && (
              <Chip label={t('default')} size="small" color="primary" sx={{ height: 20 }} />
            )}
          </Box>
        </TableCell>

        {/* Price */}
        <TableCell>
          <Typography variant="body2" fontWeight={500}>
            DZD {variant.price || '0.00'}
          </Typography>
        </TableCell>

        {/* Compare Price */}
        <TableCell>
          <Typography variant="body2" color="text.secondary">
            DZD {variant.compare_at_price || '0.00'}
          </Typography>
        </TableCell>

        {/* Stock */}
        <TableCell>
          <Chip
            label={variant.quantity || 0}
            size="small"
            color={variant.quantity > 0 ? 'success' : 'error'}
            variant="soft"
          />
        </TableCell>

        {/* Image */}
        <TableCell align="center">
          {selectedImage ? (
            <Image
              src={selectedImage.preview || selectedImage.full_url || selectedImage.url}
              alt={variantLabel}
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1,
                objectFit: 'cover',
              }}
            />
          ) : (
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1,
                bgcolor: (theme) => alpha(theme.palette.grey[500], 0.12),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Iconify icon="mdi:image-off-outline" width={20} color="text.disabled" />
            </Box>
          )}
        </TableCell>

        {/* Expand Button */}
        <TableCell>
          <IconButton size="small" onClick={onToggleExpand}>
            <Iconify
              icon={expanded ? 'eva:arrow-ios-upward-fill' : 'eva:arrow-ios-downward-fill'}
            />
          </IconButton>
        </TableCell>
      </TableRow>

      {/* Expanded Details */}
      <TableRow>
        <TableCell colSpan={7} sx={{ p: 0, border: 'none' }}>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box
              sx={{
                p: 3,
                bgcolor: (theme) => alpha(theme.palette.grey[500], 0.04),
              }}
            >
              <Stack spacing={2}>
                <Box
                  sx={{
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                  }}
                >
                  <TextField
                    size="small"
                    label={t('price')}
                    type="number"
                    value={variant.price}
                    onChange={(e) => onUpdate(variant.id, 'price', parseFloat(e.target.value) || 0)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">DZD</InputAdornment>,
                    }}
                  />
                  <TextField
                    size="small"
                    label={t('compare_at_price')}
                    type="number"
                    value={variant.compare_at_price}
                    onChange={(e) => onUpdate(variant.id, 'compare_at_price', parseFloat(e.target.value) || 0)}
                    error={variant.compare_at_price > 0 && variant.compare_at_price < variant.price}
                    helperText={
                      variant.compare_at_price > 0 && variant.compare_at_price < variant.price
                        ? t('compare_at_price_must_be_greater_than_price')
                        : ''
                    }
                    InputProps={{
                      startAdornment: <InputAdornment position="start">DZD</InputAdornment>,
                    }}
                  />
                  <TextField
                    size="small"
                    label={t('quantity')}
                    type="number"
                    value={variant.quantity}
                    onChange={(e) => onUpdate(variant.id, 'quantity', parseInt(e.target.value, 10) || 0)}
                  />
                </Box>

                {/* Image Upload & Selection */}
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    {t('variant_image')}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Media Picker Button */}
                    <Box
                      onClick={() => setMediaPickerOpen(true)}
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: 1,
                        border: (theme) => `2px dashed ${alpha(theme.palette.grey[500], 0.32)}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        bgcolor: (theme) => alpha(theme.palette.grey[500], 0.04),
                        '&:hover': {
                          borderColor: 'primary.main',
                          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
                        },
                      }}
                    >
                      <Iconify icon="eva:plus-fill" width={24} color="text.disabled" />
                    </Box>

                    {/* Show selected media if any */}
                    {variant.media_id && variant.selected_media && (
                      <Box
                        sx={{
                          position: 'relative',
                          border: (theme) => `2px solid ${theme.palette.primary.main}`,
                          borderRadius: 1,
                          overflow: 'hidden',
                        }}
                      >
                        <Image
                          src={variant.selected_media.full_url}
                          alt={variant.selected_media.alt_text || 'Selected media'}
                          sx={{ width: 60, height: 60, objectFit: 'cover' }}
                        />
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            bgcolor: 'primary.main',
                            borderRadius: '50%',
                            width: 20,
                            height: 20,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Iconify icon="eva:checkmark-fill" width={14} color="white" />
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => {
                            onUpdate(variant.id, 'media_id', null);
                            onUpdate(variant.id, 'selected_media', null);
                          }}
                          sx={{
                            position: 'absolute',
                            top: 2,
                            left: 2,
                            bgcolor: 'rgba(0,0,0,0.6)',
                            color: 'white',
                            width: 20,
                            height: 20,
                            '&:hover': {
                              bgcolor: 'rgba(0,0,0,0.8)',
                            },
                          }}
                        >
                          <Iconify icon="eva:close-fill" width={14} />
                        </IconButton>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Stack>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>

      <MediaPickerDialog
        open={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={handleMediaSelect}
        multiple={false}
        title={t('select_variant_image')}
      />
    </>
  );
}

VariantRow.propTypes = {
  variant: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  expanded: PropTypes.bool.isRequired,
  onToggleExpand: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  images: PropTypes.array,
};

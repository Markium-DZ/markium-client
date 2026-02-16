import PropTypes from 'prop-types';
import { useState, useMemo, useEffect, useCallback } from 'react';

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
import Chip from '@mui/material/Chip';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import { alpha, keyframes } from '@mui/material/styles';

import Tooltip from '@mui/material/Tooltip';

import Iconify from 'src/components/iconify';
import { useTranslate } from 'src/locales';
import Image from 'src/components/image';

// ── Animations ──────────────────────────────────────────────────────────

const checkPop = keyframes`
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
`;

// ── Helpers ─────────────────────────────────────────────────────────────

function generateVariantCombinations(options) {
  if (!options || options.length === 0) return [];

  const validOptions = options.filter((opt) => opt.values && opt.values.length > 0 && opt.name.trim());
  if (validOptions.length === 0) return [];

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

  return combinations.filter((combo) => combo.length > 0);
}

function computeInheritedMedia(combo, options) {
  const inheritedIds = [];
  const inheritedItems = [];
  const seenIds = new Set();

  combo.forEach((c) => {
    const optionDef = options.find((o) => o.name === c.optionName);
    if (!optionDef) return;

    const valueDef = optionDef.values.find((v) => v.value === c.value);
    if (!valueDef?.media_ids?.length) return;

    (valueDef.selected_media || []).forEach((m) => {
      if (!seenIds.has(m.id)) {
        seenIds.add(m.id);
        inheritedIds.push(m.id);
        inheritedItems.push(m);
      }
    });

    // Ensure all media_ids are represented even without selected_media objects
    valueDef.media_ids.forEach((id) => {
      if (!seenIds.has(id)) {
        seenIds.add(id);
        inheritedIds.push(id);
      }
    });
  });

  return { inheritedIds, inheritedItems };
}

// ── Main Component ──────────────────────────────────────────────────────

export default function ProductVariantsManager({ options, variants, onChange, images, productMedia = [] }) {
  const { t } = useTranslate();
  const [expandedVariant, setExpandedVariant] = useState(null);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkDiscount, setBulkDiscount] = useState(false);
  const [bulkValues, setBulkValues] = useState({
    price: '',
    compare_at_price: '',
    quantity: '',
  });

  const possibleVariants = useMemo(() => generateVariantCombinations(options), [options]);

  // Sync variants with possible combinations + compute inherited media
  const syncedVariants = useMemo(() => {
    if (possibleVariants.length === 0) {
      return variants.length > 0
        ? [variants[0]]
        : [
            {
              id: Date.now(),
              price: 0,
              compare_at_price: null,
              quantity: 0,
              option_values: [],
              media_ids: [],
              extra_media_ids: [],
              extra_selected_media: [],
              inherited_media_ids: [],
              inherited_media: [],
              is_default: true,
            },
          ];
    }

    return possibleVariants.map((combo, index) => {
      const optionValues = combo.map((c) => c.value);
      const existingVariant = variants.find(
        (v) => JSON.stringify(v.option_values) === JSON.stringify(optionValues)
      );

      const { inheritedIds, inheritedItems } = computeInheritedMedia(combo, options);
      const extraIds = existingVariant?.extra_media_ids || [];
      const allMediaIds = [...new Set([...inheritedIds, ...extraIds])];

      if (existingVariant) {
        return {
          ...existingVariant,
          media_ids: allMediaIds,
          inherited_media_ids: inheritedIds,
          inherited_media: inheritedItems,
        };
      }

      return {
        id: Date.now() + index,
        price: 0,
        compare_at_price: null,
        quantity: 0,
        option_values: optionValues,
        media_ids: allMediaIds,
        inherited_media_ids: inheritedIds,
        inherited_media: inheritedItems,
        extra_media_ids: [],
        extra_selected_media: [],
        is_default: index === 0,
      };
    });
  }, [possibleVariants, variants, options]);

  useEffect(() => {
    if (JSON.stringify(syncedVariants) !== JSON.stringify(variants)) {
      onChange(syncedVariants);
    }
  }, [syncedVariants, variants, onChange]);

  const handleUpdateVariant = useCallback(
    (variantId, field, value) => {
      const updatedVariants = syncedVariants.map((variant) => {
        if (variant.id === variantId) {
          if (field === 'media_data') return { ...variant, ...value };
          if (field === 'is_default' && value === true) return { ...variant, [field]: value };
          return { ...variant, [field]: value };
        }
        if (field === 'is_default' && value === true) return { ...variant, is_default: false };
        return variant;
      });
      onChange(updatedVariants);
    },
    [syncedVariants, onChange]
  );

  const handleBulkApply = () => {
    onChange(
      syncedVariants.map((variant) => ({
        ...variant,
        ...(bulkValues.price && { price: parseFloat(bulkValues.price) }),
        ...(bulkValues.compare_at_price && {
          compare_at_price: parseFloat(bulkValues.compare_at_price),
        }),
        ...(bulkValues.quantity && { quantity: parseInt(bulkValues.quantity, 10) }),
      }))
    );
    setBulkEditOpen(false);
    setBulkDiscount(false);
    setBulkValues({ price: '', compare_at_price: '', quantity: '' });
  };

  if (possibleVariants.length === 0 && options.length > 0) {
    return (
      <Box
        sx={{
          p: 5,
          textAlign: 'center',
          bgcolor: (theme) => alpha(theme.palette.info.main, 0.04),
          border: (theme) => `2px dashed ${alpha(theme.palette.info.main, 0.24)}`,
          borderRadius: 2,
        }}
      >
        <Iconify icon="carbon:product" width={48} sx={{ color: 'info.main', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {t('add_option_values_first')}
        </Typography>
        <Typography variant="body2" color="text.disabled">
          {t('add_option_values_description')}
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
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
            {possibleVariants.length > 0 ? t('variants_auto_generated') : t('single_variant_product')}
          </Typography>
        </Box>

        {syncedVariants.length > 1 && (
          <Button
            variant="outlined"
            size="small"
            color="secondary"
            startIcon={<Iconify icon="mdi:table-edit" />}
            onClick={() => setBulkEditOpen(!bulkEditOpen)}
          >
            {t('bulk_edit')}
          </Button>
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
          <Typography
            variant="subtitle1"
            gutterBottom
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
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
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
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
              label={t('quantity')}
              type="number"
              value={bulkValues.quantity}
              onChange={(e) => setBulkValues({ ...bulkValues, quantity: e.target.value })}
              InputProps={{
                endAdornment: (
                  <InputAdornment
                    position="end"
                    sx={{ flexDirection: 'column', height: '100%', mr: -0.5 }}
                  >
                    <IconButton
                      size="small"
                      onClick={() =>
                        setBulkValues({
                          ...bulkValues,
                          quantity: String((parseInt(bulkValues.quantity, 10) || 0) + 1),
                        })
                      }
                      sx={{ p: 0, lineHeight: 1 }}
                    >
                      <Iconify icon="eva:arrow-ios-upward-fill" width={16} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() =>
                        setBulkValues({
                          ...bulkValues,
                          quantity: String(Math.max(0, (parseInt(bulkValues.quantity, 10) || 0) - 1)),
                        })
                      }
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
                checked={bulkDiscount}
                onChange={(e) => {
                  setBulkDiscount(e.target.checked);
                  if (!e.target.checked) {
                    setBulkValues({ ...bulkValues, compare_at_price: '' });
                  }
                }}
              />
            }
            label={
              <Typography variant="body2" color="text.secondary">
                {t('add_discount')}
              </Typography>
            }
            sx={{ mb: 1 }}
          />

          <Collapse in={bulkDiscount} unmountOnExit>
            <TextField
              size="small"
              label={t('compare_at_price')}
              type="number"
              value={bulkValues.compare_at_price}
              onChange={(e) => setBulkValues({ ...bulkValues, compare_at_price: e.target.value })}
              InputProps={{
                startAdornment: <InputAdornment position="start">DZD</InputAdornment>,
              }}
              fullWidth
              sx={{ mb: 2 }}
            />
          </Collapse>

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

      {/* Variants Table */}
      <Card sx={{ overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: (theme) => alpha(theme.palette.grey[500], 0.04) }}>
                <TableCell scope="col" padding="checkbox" sx={{ width: 50 }}>
                  <Typography variant="caption" fontWeight={700}>
                    {t('default')}
                  </Typography>
                </TableCell>
                <TableCell scope="col" sx={{ minWidth: 180 }}>
                  <Typography variant="caption" fontWeight={700}>
                    {t('variant')}
                  </Typography>
                </TableCell>
                <TableCell scope="col" sx={{ width: 120 }}>
                  <Typography variant="caption" fontWeight={700}>
                    {t('price')}
                  </Typography>
                </TableCell>
                <TableCell scope="col" sx={{ width: 120 }}>
                  <Typography variant="caption" fontWeight={700}>
                    {t('compare_price')}
                  </Typography>
                </TableCell>
                <TableCell scope="col" sx={{ width: 100 }}>
                  <Typography variant="caption" fontWeight={700}>
                    {t('stock')}
                  </Typography>
                </TableCell>
                <TableCell scope="col" sx={{ width: 80, textAlign: 'center' }}>
                  <Typography variant="caption" fontWeight={700}>
                    {t('image')}
                  </Typography>
                </TableCell>
                <TableCell scope="col" sx={{ width: 60 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {syncedVariants.map((variant, index) => (
                <VariantRow
                  key={variant.id}
                  variant={variant}
                  index={index}
                  expanded={expandedVariant === variant.id}
                  onToggleExpand={() =>
                    setExpandedVariant(expandedVariant === variant.id ? null : variant.id)
                  }
                  onUpdate={handleUpdateVariant}
                  productMedia={productMedia}
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
  productMedia: PropTypes.array,
};

// ── Variant Row ─────────────────────────────────────────────────────────

function VariantRow({ variant, index, expanded, onToggleExpand, onUpdate, productMedia }) {
  const { t } = useTranslate();
  const [extraPickerOpen, setExtraPickerOpen] = useState(false);
  const [showVariantDiscount, setShowVariantDiscount] = useState(variant.compare_at_price > 0);

  useEffect(() => {
    if (variant.compare_at_price > 0) {
      setShowVariantDiscount(true);
    }
  }, [variant.compare_at_price]);

  const variantLabel =
    variant.option_values.length > 0 ? variant.option_values.join(' / ') : t('default_variant');

  // All media for display: inherited + extra
  const inheritedMedia = variant.inherited_media || [];
  const extraMedia = variant.extra_selected_media || [];
  const totalMediaCount = (variant.inherited_media_ids?.length || 0) + (variant.extra_media_ids?.length || 0);

  const handleAddExtraMedia = useCallback(
    (mediaId, mediaItem) => {
      const currentExtraIds = variant.extra_media_ids || [];
      const currentExtraMedia = variant.extra_selected_media || [];

      if (currentExtraIds.includes(mediaId)) {
        // Remove
        onUpdate(variant.id, 'media_data', {
          extra_media_ids: currentExtraIds.filter((id) => id !== mediaId),
          extra_selected_media: currentExtraMedia.filter((m) => m.id !== mediaId),
          media_ids: [...(variant.inherited_media_ids || []), ...currentExtraIds.filter((id) => id !== mediaId)],
        });
      } else {
        // Add
        const newExtraIds = [...currentExtraIds, mediaId];
        onUpdate(variant.id, 'media_data', {
          extra_media_ids: newExtraIds,
          extra_selected_media: [...currentExtraMedia, mediaItem],
          media_ids: [...new Set([...(variant.inherited_media_ids || []), ...newExtraIds])],
        });
      }
    },
    [variant, onUpdate]
  );

  const handleRemoveExtraMedia = useCallback(
    (mediaId) => {
      const newExtraIds = (variant.extra_media_ids || []).filter((id) => id !== mediaId);
      const newExtraMedia = (variant.extra_selected_media || []).filter((m) => m.id !== mediaId);
      onUpdate(variant.id, 'media_data', {
        extra_media_ids: newExtraIds,
        extra_selected_media: newExtraMedia,
        media_ids: [...new Set([...(variant.inherited_media_ids || []), ...newExtraIds])],
      });
    },
    [variant, onUpdate]
  );

  // Filter product media: exclude inherited + already added extra
  const availableForExtra = useMemo(() => {
    const usedIds = new Set([...(variant.inherited_media_ids || []), ...(variant.extra_media_ids || [])]);
    return (productMedia || []).filter((m) => !usedIds.has(m.id));
  }, [productMedia, variant.inherited_media_ids, variant.extra_media_ids]);

  return (
    <>
      <TableRow
        hover
        sx={{
          cursor: 'pointer',
          bgcolor: variant.is_default
            ? (theme) => alpha(theme.palette.primary.main, 0.04)
            : 'transparent',
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
          {variant.compare_at_price > 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
              DZD {variant.compare_at_price}
            </Typography>
          ) : (
            <Typography variant="body2" color="text.disabled">
              —
            </Typography>
          )}
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
          {totalMediaCount > 0 ? (
            <Box sx={{ position: 'relative', display: 'inline-block' }}>
              <Image
                src={
                  (inheritedMedia[0] || extraMedia[0])?.full_url ||
                  (inheritedMedia[0] || extraMedia[0])?.url
                }
                alt={variantLabel}
                sx={{ width: 40, height: 40, borderRadius: 1, objectFit: 'cover' }}
              />
              {totalMediaCount > 1 && (
                <Chip
                  label={`+${totalMediaCount - 1}`}
                  size="small"
                  sx={{
                    position: 'absolute',
                    bottom: -4,
                    right: -4,
                    height: 18,
                    minWidth: 18,
                    fontSize: '0.65rem',
                    bgcolor: 'primary.main',
                    color: 'white',
                    '& .MuiChip-label': { px: 0.5 },
                  }}
                />
              )}
            </Box>
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

        {/* Expand */}
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
            <Box sx={{ p: 3, bgcolor: (theme) => alpha(theme.palette.grey[500], 0.04) }}>
              <Stack spacing={2}>
                {/* Price fields */}
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
                    value={variant.price || ''}
                    onChange={(e) =>
                      onUpdate(
                        variant.id,
                        'price',
                        e.target.value === '' ? 0 : parseFloat(e.target.value)
                      )
                    }
                    InputProps={{
                      startAdornment: <InputAdornment position="start">DZD</InputAdornment>,
                    }}
                  />
                  <TextField
                    size="small"
                    label={t('quantity')}
                    type="number"
                    value={variant.quantity || ''}
                    onChange={(e) =>
                      onUpdate(
                        variant.id,
                        'quantity',
                        e.target.value === '' ? 0 : parseInt(e.target.value, 10)
                      )
                    }
                    InputProps={{
                      endAdornment: (
                        <InputAdornment
                          position="end"
                          sx={{ flexDirection: 'column', height: '100%', mr: -0.5 }}
                        >
                          <IconButton
                            size="small"
                            onClick={() =>
                              onUpdate(variant.id, 'quantity', (variant.quantity || 0) + 1)
                            }
                            sx={{ p: 0, lineHeight: 1 }}
                          >
                            <Iconify icon="eva:arrow-ios-upward-fill" width={16} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() =>
                              onUpdate(
                                variant.id,
                                'quantity',
                                Math.max(0, (variant.quantity || 0) - 1)
                              )
                            }
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
                      checked={showVariantDiscount}
                      onChange={(e) => {
                        setShowVariantDiscount(e.target.checked);
                        if (!e.target.checked) {
                          onUpdate(variant.id, 'compare_at_price', null);
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

                <Collapse in={showVariantDiscount} unmountOnExit>
                  <TextField
                    size="small"
                    label={t('compare_at_price')}
                    type="number"
                    value={variant.compare_at_price || ''}
                    onChange={(e) =>
                      onUpdate(
                        variant.id,
                        'compare_at_price',
                        e.target.value === '' ? 0 : parseFloat(e.target.value)
                      )
                    }
                    error={
                      variant.compare_at_price > 0 && variant.compare_at_price < variant.price
                    }
                    helperText={
                      variant.compare_at_price > 0 && variant.compare_at_price < variant.price
                        ? t('compare_at_price_must_be_greater_than_price')
                        : t('compare_at_price_helper_text')
                    }
                    InputProps={{
                      startAdornment: <InputAdornment position="start">DZD</InputAdornment>,
                    }}
                    fullWidth
                  />
                </Collapse>

                {/* Media Section */}
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    {t('variant_images')} ({totalMediaCount})
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Inherited media (read-only) */}
                    {inheritedMedia.map((media) => (
                      <Box
                        key={`inherited-${media.id}`}
                        sx={{
                          position: 'relative',
                          borderRadius: 1,
                          overflow: 'hidden',
                          border: (theme) => `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                        }}
                      >
                        <Image
                          src={media.full_url || media.url}
                          alt={media.alt_text || ''}
                          sx={{ width: 60, height: 60, objectFit: 'cover' }}
                        />
                        <Chip
                          label={t('auto')}
                          size="small"
                          sx={{
                            position: 'absolute',
                            bottom: 2,
                            left: 2,
                            height: 16,
                            fontSize: '0.55rem',
                            fontWeight: 700,
                            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.85),
                            color: 'white',
                            '& .MuiChip-label': { px: 0.4 },
                          }}
                        />
                      </Box>
                    ))}

                    {/* Extra media (removable) */}
                    {extraMedia.map((media) => (
                      <Box
                        key={`extra-${media.id}`}
                        sx={{
                          position: 'relative',
                          borderRadius: 1,
                          overflow: 'hidden',
                          border: (theme) => `2px solid ${theme.palette.grey[300]}`,
                        }}
                      >
                        <Image
                          src={media.full_url || media.url}
                          alt={media.alt_text || ''}
                          sx={{ width: 60, height: 60, objectFit: 'cover' }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveExtraMedia(media.id)}
                          sx={{
                            position: 'absolute',
                            top: 2,
                            right: 2,
                            bgcolor: 'rgba(0,0,0,0.6)',
                            color: 'white',
                            width: 20,
                            height: 20,
                            '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
                          }}
                        >
                          <Iconify icon="eva:close-fill" width={14} />
                        </IconButton>
                      </Box>
                    ))}

                    {/* Add more button */}
                    <Box
                      role="button"
                      tabIndex={0}
                      onClick={() => setExtraPickerOpen(!extraPickerOpen)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setExtraPickerOpen(!extraPickerOpen);
                        }
                      }}
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
                  </Box>

                  {/* Inline extra media picker */}
                  <Collapse in={extraPickerOpen} unmountOnExit>
                    <Box
                      sx={{
                        mt: 1.5,
                        p: 1.5,
                        borderRadius: 1,
                        border: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
                        bgcolor: (theme) => alpha(theme.palette.grey[500], 0.02),
                      }}
                    >
                      {availableForExtra.length === 0 ? (
                        <Typography
                          variant="caption"
                          color="text.disabled"
                          sx={{ py: 1, textAlign: 'center', display: 'block' }}
                        >
                          {t('no_more_media_available')}
                        </Typography>
                      ) : (
                        <Box sx={{ maxHeight: 160, overflow: 'auto' }}>
                          <Box
                            display="grid"
                            gridTemplateColumns="repeat(auto-fill, minmax(64px, 1fr))"
                            gap={0.75}
                          >
                            {availableForExtra.map((item) => (
                              <Tooltip
                                key={item.id}
                                placement="top"
                                arrow
                                slotProps={{
                                  tooltip: {
                                    sx: {
                                      p: 0.5,
                                      bgcolor: 'background.paper',
                                      border: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.16)}`,
                                      boxShadow: (theme) => theme.shadows[12],
                                      '& .MuiTooltip-arrow': {
                                        color: 'background.paper',
                                        '&::before': {
                                          border: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.16)}`,
                                        },
                                      },
                                    },
                                  },
                                }}
                                title={
                                  <Box
                                    component="img"
                                    src={item.full_url}
                                    alt={item.alt_text || ''}
                                    sx={{
                                      width: 180,
                                      height: 180,
                                      objectFit: 'cover',
                                      borderRadius: 0.75,
                                      display: 'block',
                                    }}
                                  />
                                }
                              >
                                <Box
                                  onClick={() => handleAddExtraMedia(item.id, item)}
                                  sx={{
                                    position: 'relative',
                                    width: '100%',
                                    paddingTop: '100%',
                                    borderRadius: 0.75,
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    opacity: 0.65,
                                    '&:hover': { opacity: 1, transform: 'scale(1.05)' },
                                  }}
                                >
                                  <Box
                                    component="img"
                                    src={item.full_url}
                                    alt={item.alt_text || ''}
                                    loading="lazy"
                                    sx={{
                                      position: 'absolute',
                                      top: 0,
                                      left: 0,
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover',
                                    }}
                                  />
                                </Box>
                              </Tooltip>
                            ))}
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Collapse>
                </Box>
              </Stack>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

VariantRow.propTypes = {
  variant: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  expanded: PropTypes.bool.isRequired,
  onToggleExpand: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  productMedia: PropTypes.array,
};

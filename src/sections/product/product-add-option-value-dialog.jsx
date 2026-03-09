import PropTypes from 'prop-types';
import { useState, useMemo } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Checkbox from '@mui/material/Checkbox';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import Collapse from '@mui/material/Collapse';
import { alpha } from '@mui/material/styles';

import { useTranslate } from 'src/locales';
import { addOptionValue } from 'src/api/product';
import { useSnackbar } from 'src/components/snackbar';
import showError from 'src/utils/show_error';
import Iconify from 'src/components/iconify';

// ── Preset suggestions ──────────────────────────────────────────────
const COLOR_PRESETS = [
  { value: 'color_black', color_hex: '#000000' },
  { value: 'color_white', color_hex: '#FFFFFF' },
  { value: 'color_red', color_hex: '#E53935' },
  { value: 'color_blue', color_hex: '#1E88E5' },
  { value: 'color_green', color_hex: '#43A047' },
  { value: 'color_yellow', color_hex: '#FDD835' },
  { value: 'color_pink', color_hex: '#EC407A' },
  { value: 'color_grey', color_hex: '#757575' },
  { value: 'color_brown', color_hex: '#6D4C41' },
  { value: 'color_navy', color_hex: '#1A237E' },
  { value: 'color_beige', color_hex: '#D7CCC8' },
  { value: 'color_orange', color_hex: '#FB8C00' },
];

const SIZE_PRESETS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'];

const SHOE_SIZE_PRESETS = [
  '29', '30', '31', '32', '33', '34', '35', '36', '37',
  '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48',
];

// Icon map for option types
const OPTION_ICONS = {
  color: 'solar:palette-bold-duotone',
  size: 'solar:ruler-bold-duotone',
  shoe_size: 'mdi:shoe-sneaker',
};

const OPTION_COLORS = {
  color: 'warning',
  size: 'info',
  shoe_size: 'success',
};

function getOptionIcon(def) {
  if (def.style === 'color' || def.type === 'color') return OPTION_ICONS.color;
  const key = def.name?.toLowerCase();
  if (key?.includes('shoe') || key?.includes('pointure') || key?.includes('حذاء')) return OPTION_ICONS.shoe_size;
  if (key?.includes('size') || key?.includes('taille') || key?.includes('مقاس')) return OPTION_ICONS.size;
  return 'mdi:tag-outline';
}

function getOptionColor(def) {
  if (def.style === 'color' || def.type === 'color') return OPTION_COLORS.color;
  const key = def.name?.toLowerCase();
  if (key?.includes('shoe') || key?.includes('pointure') || key?.includes('حذاء')) return OPTION_COLORS.shoe_size;
  if (key?.includes('size') || key?.includes('taille') || key?.includes('مقاس')) return OPTION_COLORS.size;
  return 'primary';
}

// ----------------------------------------------------------------------

export default function AddOptionValueDialog({ open, onClose, product, onRefresh }) {
  const { t } = useTranslate();
  const { enqueueSnackbar } = useSnackbar();

  const [activeStep, setActiveStep] = useState(0);
  const [selectedDefinitionId, setSelectedDefinitionId] = useState('');
  const [newValue, setNewValue] = useState('');
  const [colorHex, setColorHex] = useState('');
  const [variantRows, setVariantRows] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);

  const optionDefinitions = product?.option_definitions || [];
  const defaultVariant = product?.variants?.find((v) => v.is_default) || product?.variants?.[0];

  const selectedDef = useMemo(
    () => optionDefinitions.find((d) => d.id === selectedDefinitionId),
    [optionDefinitions, selectedDefinitionId]
  );

  const crossDimensionCombinations = useMemo(() => {
    if (!selectedDefinitionId) return [];

    const otherDefs = optionDefinitions.filter((d) => d.id !== selectedDefinitionId);

    if (otherDefs.length === 0) {
      return [{ label: newValue || '—', optionValues: {} }];
    }

    const buildCombinations = (defs, index = 0, current = {}) => {
      if (index >= defs.length) {
        const label = Object.entries(current)
          .map(([name, val]) => `${name}: ${val}`)
          .join(' / ');
        return [{ label: `${newValue || '—'} / ${label}`, optionValues: { ...current } }];
      }

      const def = defs[index];
      const results = [];
      (def.values || []).forEach((val) => {
        results.push(
          ...buildCombinations(defs, index + 1, { ...current, [def.name]: val.value })
        );
      });
      return results;
    };

    return buildCombinations(otherDefs);
  }, [selectedDefinitionId, optionDefinitions, newValue]);

  // Get preset suggestions for the selected option, excluding already-used values
  const availablePresets = useMemo(() => {
    if (!selectedDef) return [];
    const existingValues = new Set((selectedDef.values || []).map((v) => v.value.toLowerCase()));
    const isColor = selectedDef.type === 'color' || selectedDef.style === 'color';
    const defName = selectedDef.name?.toLowerCase() || '';
    const isShoeSize = defName.includes('shoe') || defName.includes('pointure') || defName.includes('حذاء');

    if (isColor) {
      return COLOR_PRESETS
        .map((p) => ({ ...p, label: t(p.value) }))
        .filter((p) => !existingValues.has(p.label.toLowerCase()));
    }
    if (isShoeSize) {
      return SHOE_SIZE_PRESETS
        .filter((v) => !existingValues.has(v.toLowerCase()))
        .map((v) => ({ value: v, label: v }));
    }
    // Generic size check
    if (defName.includes('size') || defName.includes('taille') || defName.includes('مقاس')) {
      return SIZE_PRESETS
        .filter((v) => !existingValues.has(v.toLowerCase()))
        .map((v) => ({ value: v, label: v }));
    }
    return [];
  }, [selectedDef, t]);

  const handleSelectDefinition = (defId) => {
    setSelectedDefinitionId(defId);
    setNewValue('');
    setColorHex('');
    setShowCustomInput(false);
  };

  const handleSelectPreset = (preset) => {
    setNewValue(preset.label || preset.value);
    if (preset.color_hex) setColorHex(preset.color_hex);
  };

  const handleNextToVariants = () => {
    if (!selectedDefinitionId || !newValue.trim()) return;

    const existingValues = selectedDef?.values?.map((v) => v.value) || [];
    if (existingValues.includes(newValue.trim())) {
      enqueueSnackbar(t('option_value_already_exists'), { variant: 'error' });
      return;
    }

    const rows = crossDimensionCombinations.map((combo) => ({
      ...combo,
      included: true,
      price: defaultVariant?.price || 0,
      quantity: 0,
      sku: '',
    }));
    setVariantRows(rows);
    setActiveStep(1);
  };

  const handleBack = () => {
    setActiveStep(0);
  };

  const handleRowChange = (index, field, value) => {
    setVariantRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const handleSubmit = async () => {
    const includedRows = variantRows.filter((r) => r.included);
    if (includedRows.length === 0) {
      enqueueSnackbar(t('at_least_one_variant_required'), { variant: 'error' });
      return;
    }

    const invalidPrice = includedRows.find((r) => !r.price || parseFloat(r.price) <= 0);
    if (invalidPrice) {
      enqueueSnackbar(t('all_variants_must_have_price'), { variant: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        option_definition_id: selectedDefinitionId,
        value: newValue.trim(),
        ...(colorHex ? { color_hex: colorHex } : {}),
        variants: includedRows.map((row) => ({
          price: parseFloat(row.price) || 0,
          quantity: parseInt(row.quantity, 10) || 0,
          ...(row.sku ? { sku: row.sku } : {}),
          ...(Object.keys(row.optionValues).length > 0
            ? { option_values: row.optionValues }
            : {}),
        })),
      };

      await addOptionValue(product.id, payload);
      enqueueSnackbar(t('option_value_added_successfully'));
      onRefresh?.();
      handleClose();
    } catch (error) {
      showError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setActiveStep(0);
    setSelectedDefinitionId('');
    setNewValue('');
    setColorHex('');
    setVariantRows([]);
    setShowCustomInput(false);
    onClose();
  };

  const isColorType = selectedDef?.type === 'color' || selectedDef?.style === 'color';
  const canProceed = selectedDefinitionId && newValue.trim();

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '12px',
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Iconify icon="solar:add-circle-bold-duotone" width={24} sx={{ color: 'primary.main' }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ lineHeight: 1.3 }}>
              {t('add_option_value')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {activeStep === 0 ? t('choose_option_value') : t('configure_variants')}
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ pt: '16px !important' }}>
        {/* Step indicator */}
        <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
          {[0, 1].map((step) => (
            <Box
              key={step}
              sx={{
                flex: 1,
                height: 3,
                borderRadius: 1,
                bgcolor: (theme) =>
                  activeStep >= step
                    ? theme.palette.primary.main
                    : alpha(theme.palette.grey[500], 0.16),
                transition: 'background-color 0.3s ease',
              }}
            />
          ))}
        </Stack>

        {activeStep === 0 && (
          <Stack spacing={2.5}>
            {/* Option Definition Cards */}
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: 'block' }}>
                {t('option_definition')}
              </Typography>
              <Box
                display="grid"
                gridTemplateColumns={`repeat(${Math.min(optionDefinitions.length, 3)}, 1fr)`}
                gap={1}
              >
                {optionDefinitions.map((def) => {
                  const isSelected = selectedDefinitionId === def.id;
                  const colorKey = getOptionColor(def);
                  const icon = getOptionIcon(def);
                  return (
                    <Box
                      key={def.id}
                      onClick={() => handleSelectDefinition(def.id)}
                      sx={{
                        p: 1.5,
                        borderRadius: 1.5,
                        cursor: 'pointer',
                        border: (theme) =>
                          `1.5px solid ${
                            isSelected
                              ? theme.palette[colorKey]?.main || theme.palette.primary.main
                              : alpha(theme.palette.grey[500], 0.12)
                          }`,
                        bgcolor: (theme) =>
                          isSelected
                            ? alpha(theme.palette[colorKey]?.main || theme.palette.primary.main, 0.06)
                            : 'background.paper',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          borderColor: (theme) => theme.palette[colorKey]?.main || theme.palette.primary.main,
                          transform: 'translateY(-1px)',
                          boxShadow: (theme) => theme.shadows[2],
                        },
                        '&:active': { transform: 'translateY(0)' },
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.75 }}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '8px',
                            bgcolor: (theme) =>
                              alpha(theme.palette[colorKey]?.main || theme.palette.primary.main, 0.1),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Iconify
                            icon={icon}
                            width={18}
                            sx={{
                              color: (theme) => theme.palette[colorKey]?.main || theme.palette.primary.main,
                            }}
                          />
                        </Box>
                        <Typography variant="subtitle2" fontWeight={700} noWrap>
                          {def.name}
                        </Typography>
                      </Stack>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.4 }}>
                        {(def.values || []).slice(0, 3).map((v) => (
                          <Chip
                            key={v.value}
                            size="small"
                            label={v.value}
                            icon={
                              v.color_hex ? (
                                <Box
                                  sx={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: '50%',
                                    bgcolor: v.color_hex,
                                    border: (theme) =>
                                      `1px solid ${alpha(theme.palette.common.black, v.color_hex === '#FFFFFF' ? 0.15 : 0.04)}`,
                                    ml: '4px !important',
                                  }}
                                />
                              ) : undefined
                            }
                            sx={{
                              height: 20,
                              fontSize: '0.65rem',
                              fontWeight: 500,
                              bgcolor: (theme) => alpha(theme.palette.grey[500], 0.08),
                              color: 'text.secondary',
                              '& .MuiChip-label': { px: 0.5 },
                              '& .MuiChip-icon': { mr: 0 },
                            }}
                          />
                        ))}
                        {(def.values || []).length > 3 && (
                          <Typography
                            variant="caption"
                            color="text.disabled"
                            sx={{ alignSelf: 'center', fontSize: '0.6rem', fontWeight: 600 }}
                          >
                            +{def.values.length - 3}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>

            {/* Value selection — appears after selecting an option */}
            <Collapse in={!!selectedDefinitionId} unmountOnExit>
              <Stack spacing={2}>
                {/* Preset suggestions (not yet used) */}
                {availablePresets.length > 0 && !showCustomInput && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 0.75, display: 'block' }}>
                      {t('select_values')}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {availablePresets.map((preset) => {
                        const isActive = newValue === (preset.label || preset.value);
                        return (
                          <Chip
                            key={preset.value}
                            size="small"
                            label={preset.label || preset.value}
                            onClick={() => handleSelectPreset(preset)}
                            color={isActive ? 'primary' : 'default'}
                            variant={isActive ? 'filled' : 'outlined'}
                            icon={
                              preset.color_hex ? (
                                <Box
                                  sx={{
                                    width: 14,
                                    height: 14,
                                    borderRadius: '50%',
                                    bgcolor: preset.color_hex,
                                    border: (theme) =>
                                      `1.5px solid ${alpha(
                                        theme.palette.common.black,
                                        preset.color_hex === '#FFFFFF' ? 0.2 : 0.06
                                      )}`,
                                    ml: '4px !important',
                                  }}
                                />
                              ) : undefined
                            }
                            sx={{
                              height: 28,
                              fontSize: '0.75rem',
                              fontWeight: isActive ? 600 : 400,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              ...(!isActive && {
                                borderColor: (theme) => alpha(theme.palette.grey[500], 0.24),
                                color: 'text.secondary',
                                '&:hover': {
                                  borderColor: 'primary.main',
                                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
                                },
                              }),
                              '& .MuiChip-label': { px: 0.75 },
                              '& .MuiChip-icon': { mr: 0 },
                            }}
                          />
                        );
                      })}
                      {/* Custom value chip */}
                      <Chip
                        size="small"
                        label={t('custom_option')}
                        onClick={() => { setShowCustomInput(true); setNewValue(''); setColorHex(''); }}
                        variant="outlined"
                        icon={
                          <Iconify icon="solar:pen-new-square-bold-duotone" width={14} sx={{ ml: '4px !important' }} />
                        }
                        sx={{
                          height: 28,
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          borderStyle: 'dashed',
                          borderColor: (theme) => alpha(theme.palette.grey[500], 0.3),
                          color: 'text.secondary',
                          cursor: 'pointer',
                          '&:hover': {
                            borderColor: 'text.secondary',
                            bgcolor: (theme) => alpha(theme.palette.grey[500], 0.04),
                          },
                          '& .MuiChip-label': { px: 0.75 },
                          '& .MuiChip-icon': { mr: 0 },
                        }}
                      />
                    </Box>
                  </Box>
                )}

                {/* Existing values (already used) */}
                {selectedDef?.values?.length > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 0.75, display: 'block' }}>
                      {t('existing_values')}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selectedDef.values.map((v) => (
                        <Chip
                          key={v.value}
                          size="small"
                          label={v.value}
                          variant="outlined"
                          icon={
                            v.color_hex ? (
                              <Box
                                sx={{
                                  width: 12,
                                  height: 12,
                                  borderRadius: '50%',
                                  bgcolor: v.color_hex,
                                  border: (theme) =>
                                    `1.5px solid ${alpha(theme.palette.common.black, v.color_hex === '#FFFFFF' ? 0.2 : 0.06)}`,
                                  ml: '4px !important',
                                }}
                              />
                            ) : undefined
                          }
                          sx={{
                            height: 26,
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            borderColor: (theme) => alpha(theme.palette.grey[500], 0.2),
                            color: 'text.primary',
                            '& .MuiChip-label': { px: 0.75 },
                            '& .MuiChip-icon': { mr: 0 },
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Custom value text input — shown when no presets or user clicks "custom" */}
                {(availablePresets.length === 0 || showCustomInput) && (
                  <Box>
                    {showCustomInput && availablePresets.length > 0 && (
                      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => { setShowCustomInput(false); setNewValue(''); setColorHex(''); }}
                          sx={{ color: 'text.secondary' }}
                        >
                          <Iconify icon="eva:arrow-back-fill" width={16} />
                        </IconButton>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                          {t('custom_option')}
                        </Typography>
                      </Stack>
                    )}
                    <TextField
                      autoFocus
                      fullWidth
                      size="small"
                      label={t('new_value')}
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      placeholder={
                        selectedDef?.name
                          ? `${t('eg')} "${isColorType ? 'Red' : 'XL'}"`
                          : ''
                      }
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && canProceed) {
                          e.preventDefault();
                          handleNextToVariants();
                        }
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Iconify
                              icon="solar:add-circle-bold"
                              width={20}
                              sx={{ color: newValue.trim() ? 'primary.main' : 'text.disabled' }}
                            />
                          </InputAdornment>
                        ),
                      }}
                    />
                    {isColorType && (
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label={t('color_hex')}
                          value={colorHex}
                          onChange={(e) => setColorHex(e.target.value)}
                          placeholder="#FF0000"
                          InputProps={{
                            startAdornment: colorHex ? (
                              <InputAdornment position="start">
                                <Box
                                  sx={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: '50%',
                                    bgcolor: colorHex,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                  }}
                                />
                              </InputAdornment>
                            ) : undefined,
                          }}
                        />
                        <input
                          type="color"
                          value={colorHex || '#000000'}
                          onChange={(e) => setColorHex(e.target.value)}
                          style={{
                            width: 36,
                            height: 36,
                            border: 'none',
                            borderRadius: 8,
                            cursor: 'pointer',
                            flexShrink: 0,
                          }}
                        />
                      </Stack>
                    )}
                  </Box>
                )}
              </Stack>
            </Collapse>
          </Stack>
        )}

        {activeStep === 1 && (
          <Box>
            {/* Summary of what's being added */}
            <Box
              sx={{
                mb: 2,
                p: 1.5,
                borderRadius: 1.5,
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
                border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '8px',
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Iconify icon={getOptionIcon(selectedDef || {})} width={18} sx={{ color: 'primary.main' }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" fontWeight={700}>
                  {selectedDef?.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('new_value')}: <strong>{newValue}</strong>
                  {colorHex && (
                    <Box
                      component="span"
                      sx={{
                        display: 'inline-block',
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        bgcolor: colorHex,
                        ml: 0.5,
                        verticalAlign: 'middle',
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    />
                  )}
                </Typography>
              </Box>
              <IconButton size="small" onClick={handleBack} sx={{ color: 'text.disabled' }}>
                <Iconify icon="solar:pen-bold" width={16} />
              </IconButton>
            </Box>

            <TableContainer sx={{ borderRadius: 1, border: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.12)}` }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: (theme) => alpha(theme.palette.grey[500], 0.04) }}>
                    <TableCell padding="checkbox" />
                    <TableCell>
                      <Typography variant="caption" fontWeight={700}>{t('combination')}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" fontWeight={700}>{t('price')}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" fontWeight={700}>{t('quantity')}</Typography>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {variantRows.map((row, index) => (
                    <TableRow
                      key={index}
                      sx={{
                        opacity: row.included ? 1 : 0.4,
                        transition: 'opacity 0.2s ease',
                      }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          size="small"
                          checked={row.included}
                          onChange={(e) => handleRowChange(index, 'included', e.target.checked)}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>{row.label}</Typography>
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={row.price}
                          onChange={(e) => handleRowChange(index, 'price', e.target.value)}
                          disabled={!row.included}
                          sx={{ width: 100 }}
                          inputProps={{ min: 0, step: 0.01 }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start" sx={{ '& .MuiTypography-root': { fontSize: '0.75rem' } }}>
                                {t('currency_symbol')}
                              </InputAdornment>
                            ),
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={row.quantity}
                          onChange={(e) => handleRowChange(index, 'quantity', e.target.value)}
                          disabled={!row.included}
                          sx={{ width: 80 }}
                          inputProps={{ min: 0 }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={handleClose} color="inherit" sx={{ fontWeight: 600 }}>
          {t('cancel')}
        </Button>

        {activeStep === 0 && (
          <Button
            variant="contained"
            onClick={handleNextToVariants}
            disabled={!canProceed}
            endIcon={<Iconify icon="eva:arrow-forward-fill" width={18} />}
            sx={{ fontWeight: 600 }}
          >
            {t('next')}
          </Button>
        )}

        {activeStep === 1 && (
          <LoadingButton
            variant="contained"
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={!variantRows.some((r) => r.included)}
            startIcon={<Iconify icon="solar:add-circle-bold" width={18} />}
            sx={{ fontWeight: 600 }}
          >
            {t('add_variants')}
          </LoadingButton>
        )}
      </DialogActions>
    </Dialog>
  );
}

AddOptionValueDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  product: PropTypes.object,
  onRefresh: PropTypes.func,
};

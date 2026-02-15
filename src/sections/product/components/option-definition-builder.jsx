import PropTypes from 'prop-types';
import { useState, useMemo, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Autocomplete from '@mui/material/Autocomplete';
import InputAdornment from '@mui/material/InputAdornment';
import Collapse from '@mui/material/Collapse';
import { alpha, keyframes } from '@mui/material/styles';

import Tooltip from '@mui/material/Tooltip';

import Iconify from 'src/components/iconify';
import { useTranslate } from 'src/locales';

// ── Animations ──────────────────────────────────────────────────────────

const checkPop = keyframes`
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
`;

// ── Option Presets ──────────────────────────────────────────────────────

function useOptionPresets() {
  const { t } = useTranslate();

  return useMemo(
    () => [
      {
        key: 'size',
        name: t('option_size'),
        icon: 'solar:ruler-bold-duotone',
        type: 'text',
        style: 'dropdown',
        presetValues: [
          { value: 'XS' },
          { value: 'S' },
          { value: 'M' },
          { value: 'L' },
          { value: 'XL' },
          { value: 'XXL' },
          { value: '3XL' },
          { value: '4XL' },
        ],
      },
      {
        key: 'color',
        name: t('option_color'),
        icon: 'solar:palette-bold-duotone',
        type: 'color',
        style: 'color',
        presetValues: [
          { value: t('color_black'), color_hex: '#000000' },
          { value: t('color_white'), color_hex: '#FFFFFF' },
          { value: t('color_red'), color_hex: '#E53935' },
          { value: t('color_blue'), color_hex: '#1E88E5' },
          { value: t('color_green'), color_hex: '#43A047' },
          { value: t('color_yellow'), color_hex: '#FDD835' },
          { value: t('color_pink'), color_hex: '#EC407A' },
          { value: t('color_grey'), color_hex: '#757575' },
          { value: t('color_brown'), color_hex: '#6D4C41' },
          { value: t('color_navy'), color_hex: '#1A237E' },
          { value: t('color_beige'), color_hex: '#D7CCC8' },
          { value: t('color_orange'), color_hex: '#FB8C00' },
        ],
      },
      {
        key: 'shoe_size',
        name: t('option_shoe_size'),
        icon: 'mdi:shoe-sneaker',
        type: 'text',
        style: 'dropdown',
        presetValues: [
          { value: '29' },
          { value: '30' },
          { value: '31' },
          { value: '32' },
          { value: '33' },
          { value: '34' },
          { value: '35' },
          { value: '36' },
          { value: '37' },
          { value: '38' },
          { value: '39' },
          { value: '40' },
          { value: '41' },
          { value: '42' },
          { value: '43' },
          { value: '44' },
          { value: '45' },
          { value: '46' },
          { value: '47' },
          { value: '48' },
          { value: '49' },
          { value: '50' },
        ],
      },
    ],
    [t]
  );
}

// ── Main Component ──────────────────────────────────────────────────────

export default function OptionDefinitionBuilder({ options, onChange, maxOptions = 3, productMedia = [] }) {
  const { t } = useTranslate();
  const presets = useOptionPresets();

  const usedPresetKeys = useMemo(() => options.map((opt) => opt.presetKey).filter(Boolean), [options]);

  const availablePresets = useMemo(
    () => presets.filter((p) => !usedPresetKeys.includes(p.key)),
    [presets, usedPresetKeys]
  );

  const handleAddOption = useCallback(() => {
    if (options.length >= maxOptions) return;
    onChange([
      ...options,
      {
        id: Date.now(),
        name: '',
        type: 'text',
        style: 'dropdown',
        presetKey: null,
        values: [],
      },
    ]);
  }, [options, onChange, maxOptions]);

  const handleRemoveOption = useCallback(
    (id) => {
      onChange(options.filter((opt) => opt.id !== id));
    },
    [options, onChange]
  );

  const handleUpdateOption = useCallback(
    (id, updates) => {
      onChange(options.map((opt) => (opt.id === id ? { ...opt, ...updates } : opt)));
    },
    [options, onChange]
  );

  return (
    <Stack spacing={2.5}>
      {options.map((option, index) => (
        <OptionCard
          key={option.id}
          option={option}
          index={index}
          presets={presets}
          availablePresets={availablePresets}
          productMedia={productMedia}
          onUpdate={(updates) => handleUpdateOption(option.id, updates)}
          onRemove={() => handleRemoveOption(option.id)}
        />
      ))}

      {options.length < maxOptions && (
        <Button
          variant="outlined"
          color="inherit"
          startIcon={<Iconify icon="eva:plus-fill" />}
          onClick={handleAddOption}
          sx={{
            py: 1.5,
            borderStyle: 'dashed',
            borderColor: (theme) => alpha(theme.palette.grey[500], 0.24),
            color: 'text.secondary',
            '&:hover': {
              borderColor: 'primary.main',
              color: 'primary.main',
            },
          }}
        >
          {t('add_option')}
        </Button>
      )}

      {options.length >= maxOptions && (
        <Typography
          variant="caption"
          color="warning.main"
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
        >
          <Iconify icon="eva:alert-triangle-fill" width={16} />
          {t('max_options_reached', { max: maxOptions })}
        </Typography>
      )}
    </Stack>
  );
}

OptionDefinitionBuilder.propTypes = {
  options: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
  maxOptions: PropTypes.number,
  productMedia: PropTypes.array,
};

// ── Option Card ─────────────────────────────────────────────────────────

function OptionCard({
  option,
  index,
  presets,
  availablePresets,
  productMedia,
  onUpdate,
  onRemove,
}) {
  const { t } = useTranslate();
  const [newValue, setNewValue] = useState('');
  const [newColorHex, setNewColorHex] = useState('#000000');
  const [mediaOpen, setMediaOpen] = useState(false);
  const [activeMediaValue, setActiveMediaValue] = useState(null);

  // Find matched preset
  const matchedPreset = useMemo(() => {
    if (option.presetKey) return presets.find((p) => p.key === option.presetKey) || null;
    return null;
  }, [option.presetKey, presets]);

  // Autocomplete options: current preset + unused presets
  const autocompleteOptions = useMemo(() => {
    const opts = [...availablePresets];
    if (matchedPreset && !opts.find((p) => p.key === matchedPreset.key)) {
      opts.unshift(matchedPreset);
    }
    return opts;
  }, [availablePresets, matchedPreset]);

  const isValueEnabled = useCallback(
    (valueStr) => option.values.some((v) => v.value === valueStr),
    [option.values]
  );

  const getValueMediaCount = useCallback(
    (valueStr) => {
      const val = option.values.find((v) => v.value === valueStr);
      return val?.media_ids?.length || 0;
    },
    [option.values]
  );

  // ── Handlers ──────────────────────────────────────────────────────────

  const handlePresetSelect = useCallback(
    (preset) => {
      onUpdate({
        name: preset.name,
        type: preset.type,
        style: preset.style,
        presetKey: preset.key,
        values: [],
      });
      setMediaOpen(false);
      setActiveMediaValue(null);
    },
    [onUpdate]
  );

  const handleNameChange = useCallback(
    (name) => {
      const updates = { name };
      if (option.presetKey) {
        const currentPreset = presets.find((p) => p.key === option.presetKey);
        if (currentPreset && currentPreset.name !== name) {
          updates.presetKey = null;
          updates.type = 'text';
          updates.style = 'dropdown';
        }
      }
      onUpdate(updates);
    },
    [option.presetKey, presets, onUpdate]
  );

  const handleToggleValue = useCallback(
    (presetValue) => {
      const valueStr = presetValue.value;
      const enabled = isValueEnabled(valueStr);

      if (enabled) {
        onUpdate({
          values: option.values.filter((v) => v.value !== valueStr),
        });
        if (activeMediaValue === valueStr) setActiveMediaValue(null);
      } else {
        onUpdate({
          values: [
            ...option.values,
            {
              value: presetValue.value,
              ...(presetValue.color_hex ? { color_hex: presetValue.color_hex } : {}),
              media_ids: [],
              selected_media: [],
            },
          ],
        });
        setActiveMediaValue(valueStr);
        if (!mediaOpen) setMediaOpen(true);
      }
    },
    [option.values, isValueEnabled, activeMediaValue, mediaOpen, onUpdate]
  );

  const handleAddCustomValue = useCallback(() => {
    if (!newValue.trim()) return;
    const trimmed = newValue.trim();
    if (option.values.some((v) => v.value === trimmed)) return;
    if (matchedPreset?.presetValues.some((pv) => pv.value === trimmed)) return;
    onUpdate({
      values: [
        ...option.values,
        {
          value: trimmed,
          ...(option.type === 'color' ? { color_hex: newColorHex } : {}),
          media_ids: [],
          selected_media: [],
        },
      ],
    });
    setNewValue('');
    setNewColorHex('#000000');
    setActiveMediaValue(trimmed);
    if (!mediaOpen) setMediaOpen(true);
  }, [newValue, newColorHex, option.type, option.values, matchedPreset, mediaOpen, onUpdate]);

  const handleRemoveCustomValue = useCallback(
    (valueIndex) => {
      const removed = option.values[valueIndex];
      if (activeMediaValue === removed?.value) setActiveMediaValue(null);
      onUpdate({ values: option.values.filter((_, idx) => idx !== valueIndex) });
    },
    [option.values, activeMediaValue, onUpdate]
  );

  const handleToggleMediaForValue = useCallback(
    (valueStr, mediaId, mediaItem) => {
      onUpdate({
        values: option.values.map((v) => {
          if (v.value !== valueStr) return v;
          const currentIds = v.media_ids || [];
          const currentMedia = v.selected_media || [];

          if (currentIds.includes(mediaId)) {
            return {
              ...v,
              media_ids: currentIds.filter((id) => id !== mediaId),
              selected_media: currentMedia.filter((m) => m.id !== mediaId),
            };
          }
          return {
            ...v,
            media_ids: [...currentIds, mediaId],
            selected_media: [...currentMedia, mediaItem],
          };
        }),
      });
    },
    [option.values, onUpdate]
  );

  const enabledValues = option.values.filter((v) => v.value);

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <Card
      sx={{
        p: 3,
        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.02),
        border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
        <Chip
          label={`${t('option')} ${index + 1}`}
          size="small"
          color="primary"
          variant="soft"
          sx={{ fontWeight: 700 }}
        />
        <IconButton size="small" color="error" onClick={onRemove}>
          <Iconify icon="eva:trash-2-outline" />
        </IconButton>
      </Box>

      <Stack spacing={2.5}>
        {/* Option Name — Combobox */}
        <Autocomplete
          freeSolo
          value={null}
          inputValue={option.name}
          onInputChange={(_, val, reason) => {
            if (reason === 'input') handleNameChange(val);
            if (reason === 'clear') handleNameChange('');
          }}
          onChange={(_, val) => {
            if (val && typeof val === 'object' && val.key) handlePresetSelect(val);
          }}
          options={autocompleteOptions}
          getOptionLabel={(opt) => (typeof opt === 'string' ? opt : opt.name)}
          filterOptions={(opts, { inputValue }) =>
            opts.filter((opt) => opt.name.toLowerCase().includes(inputValue.toLowerCase()))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label={t('option_name')}
              placeholder={t('type_or_select_option')}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    <InputAdornment position="start">
                      <Iconify
                        icon={matchedPreset?.icon || 'mdi:tag-outline'}
                        width={20}
                        sx={{ color: matchedPreset ? 'primary.main' : 'text.disabled' }}
                      />
                    </InputAdornment>
                    {params.InputProps.startAdornment}
                  </>
                ),
              }}
            />
          )}
          renderOption={(props, opt) => (
            <li {...props} key={opt.key}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 0.5 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1,
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Iconify icon={opt.icon} width={18} sx={{ color: 'primary.main' }} />
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    {opt.name}
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    {opt.presetValues.length} {t('values')}
                  </Typography>
                </Box>
              </Stack>
            </li>
          )}
        />

        {/* ── Preset Values: Toggleable Chips ──────────────────────────── */}
        {matchedPreset && (
          <Box>
            <Typography
              variant="subtitle2"
              sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}
            >
              <Iconify icon="mdi:playlist-check" width={18} />
              {t('select_values')}
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
              {matchedPreset.presetValues.map((pv) => {
                const enabled = isValueEnabled(pv.value);
                const mediaCount = getValueMediaCount(pv.value);
                return (
                  <Chip
                    key={pv.value}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {pv.color_hex && (
                          <Box
                            sx={{
                              width: 14,
                              height: 14,
                              borderRadius: '50%',
                              bgcolor: pv.color_hex,
                              border: (theme) =>
                                `1.5px solid ${alpha(theme.palette.common.black, pv.color_hex === '#FFFFFF' ? 0.2 : 0.05)}`,
                              flexShrink: 0,
                            }}
                          />
                        )}
                        {pv.value}
                        {enabled && mediaCount > 0 && (
                          <Box
                            component="span"
                            sx={{
                              ml: 0.25,
                              px: 0.5,
                              py: 0.1,
                              borderRadius: 0.5,
                              fontSize: '0.6rem',
                              fontWeight: 700,
                              bgcolor: (theme) => alpha(theme.palette.primary.dark, 0.85),
                              color: 'white',
                              lineHeight: 1.4,
                            }}
                          >
                            {mediaCount}
                          </Box>
                        )}
                      </Box>
                    }
                    onClick={() => handleToggleValue(pv)}
                    color={enabled ? 'primary' : 'default'}
                    variant={enabled ? 'filled' : 'outlined'}
                    sx={{
                      fontWeight: enabled ? 600 : 400,
                      transition: 'all 0.15s ease',
                      ...(enabled
                        ? {}
                        : {
                            borderColor: (theme) => alpha(theme.palette.grey[500], 0.24),
                            color: 'text.secondary',
                            '&:hover': {
                              borderColor: 'primary.main',
                              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
                            },
                          }),
                    }}
                  />
                );
              })}

              {/* Custom values added to preset */}
              {option.values
                .filter((v) => !matchedPreset.presetValues.some((pv) => pv.value === v.value))
                .map((val) => (
                  <Chip
                    key={`custom-${val.value}`}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {val.color_hex && (
                          <Box
                            sx={{
                              width: 14,
                              height: 14,
                              borderRadius: '50%',
                              bgcolor: val.color_hex,
                              border: (theme) => `1.5px solid ${theme.palette.divider}`,
                            }}
                          />
                        )}
                        {val.value}
                      </Box>
                    }
                    onDelete={() =>
                      onUpdate({ values: option.values.filter((v) => v.value !== val.value) })
                    }
                    color="primary"
                    variant="soft"
                    sx={{ fontWeight: 600 }}
                  />
                ))}
            </Box>

            {/* Add custom value to preset */}
            <Stack direction="row" spacing={1} alignItems="stretch" sx={{ mt: 1.5 }}>
              <TextField
                fullWidth
                size="small"
                placeholder={
                  option.type === 'color' ? t('color_name_placeholder') : t('value_placeholder')
                }
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomValue();
                  }
                }}
              />
              {option.type === 'color' && (
                <TextField
                  type="color"
                  size="small"
                  value={newColorHex}
                  onChange={(e) => setNewColorHex(e.target.value)}
                  sx={{ width: 60 }}
                />
              )}
              <Button
                variant="contained"
                onClick={handleAddCustomValue}
                disabled={!newValue.trim()}
                sx={{ minWidth: 80 }}
              >
                {t('add')}
              </Button>
            </Stack>
          </Box>
        )}

        {/* ── Custom Values: Text Input + Chips ────────────────────────── */}
        {!matchedPreset && option.name && (
          <Box>
            <Typography
              variant="subtitle2"
              sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}
            >
              <Iconify icon="mdi:playlist-edit" width={18} />
              {t('option_values')}
            </Typography>

            <Stack direction="row" spacing={1} alignItems="stretch" sx={{ mb: 1.5 }}>
              <TextField
                fullWidth
                size="small"
                placeholder={option.type === 'color' ? t('color_name_placeholder') : t('value_placeholder')}
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomValue();
                  }
                }}
              />
              {option.type === 'color' && (
                <TextField
                  type="color"
                  size="small"
                  value={newColorHex}
                  onChange={(e) => setNewColorHex(e.target.value)}
                  sx={{ width: 60 }}
                />
              )}
              <Button
                variant="contained"
                onClick={handleAddCustomValue}
                disabled={!newValue.trim()}
                sx={{ minWidth: 80 }}
              >
                {t('add')}
              </Button>
            </Stack>

            {option.values.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {option.values.map((val, idx) => (
                  <Chip
                    key={idx}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {val.color_hex && (
                          <Box
                            sx={{
                              width: 14,
                              height: 14,
                              borderRadius: '50%',
                              bgcolor: val.color_hex,
                              border: (theme) => `1.5px solid ${theme.palette.divider}`,
                            }}
                          />
                        )}
                        {val.value}
                      </Box>
                    }
                    onDelete={() => handleRemoveCustomValue(idx)}
                    color="primary"
                    variant="soft"
                    sx={{ fontWeight: 500 }}
                  />
                ))}
              </Box>
            )}
          </Box>
        )}

        {/* ── Media Assignment Section ─────────────────────────────────── */}
        {enabledValues.length > 0 && (
          <Box>
            <Button
              size="small"
              color={mediaOpen ? 'primary' : 'inherit'}
              startIcon={<Iconify icon="solar:gallery-bold" width={18} />}
              endIcon={
                <Iconify
                  icon={mediaOpen ? 'eva:arrow-ios-upward-fill' : 'eva:arrow-ios-downward-fill'}
                  width={16}
                />
              }
              onClick={() => {
                setMediaOpen(!mediaOpen);
                if (!mediaOpen && !activeMediaValue && enabledValues.length > 0) {
                  setActiveMediaValue(enabledValues[0].value);
                }
              }}
              sx={{
                fontWeight: 600,
                color: mediaOpen ? 'primary.main' : 'text.secondary',
              }}
            >
              {t('assign_media_to_values')} ({t('optional')})
            </Button>

            <Collapse in={mediaOpen} unmountOnExit>
              <Box
                sx={{
                  mt: 1.5,
                  p: 2,
                  borderRadius: 1.5,
                  border: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
                  bgcolor: (theme) => alpha(theme.palette.grey[500], 0.02),
                }}
              >
                {/* Value tabs */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
                  {enabledValues.map((val) => {
                    const isActive = activeMediaValue === val.value;
                    const count = val.media_ids?.length || 0;
                    return (
                      <Chip
                        key={val.value}
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {val.color_hex && (
                              <Box
                                sx={{
                                  width: 12,
                                  height: 12,
                                  borderRadius: '50%',
                                  bgcolor: val.color_hex,
                                  border: (theme) =>
                                    `1px solid ${alpha(theme.palette.common.black, 0.1)}`,
                                }}
                              />
                            )}
                            {val.value}
                            {count > 0 && (
                              <Typography component="span" variant="caption" sx={{ fontWeight: 700 }}>
                                ({count})
                              </Typography>
                            )}
                          </Box>
                        }
                        onClick={() => setActiveMediaValue(val.value)}
                        color={isActive ? 'primary' : 'default'}
                        variant={isActive ? 'filled' : 'outlined'}
                        size="small"
                        sx={{ fontWeight: isActive ? 700 : 500, transition: 'all 0.15s ease' }}
                      />
                    );
                  })}
                </Box>

                {/* Media grid for active value */}
                {activeMediaValue && (
                  <ValueMediaGrid
                    productMedia={productMedia}
                    assignedIds={
                      option.values.find((v) => v.value === activeMediaValue)?.media_ids || []
                    }
                    onToggle={(mediaId, mediaItem) =>
                      handleToggleMediaForValue(activeMediaValue, mediaId, mediaItem)
                    }
                  />
                )}
              </Box>
            </Collapse>
          </Box>
        )}
      </Stack>
    </Card>
  );
}

OptionCard.propTypes = {
  option: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  presets: PropTypes.array.isRequired,
  availablePresets: PropTypes.array.isRequired,
  productMedia: PropTypes.array.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
};

// ── Product Media Grid ───────────────────────────────────────────────────

function ValueMediaGrid({ productMedia, assignedIds, onToggle }) {
  const { t } = useTranslate();

  if (!productMedia || productMedia.length === 0) {
    return (
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{
          py: 1.5,
          px: 2,
          borderRadius: 1,
          bgcolor: (theme) => alpha(theme.palette.info.main, 0.06),
          border: (theme) => `1px solid ${alpha(theme.palette.info.main, 0.12)}`,
        }}
      >
        <Iconify icon="solar:info-circle-bold" width={18} sx={{ color: 'info.main', flexShrink: 0 }} />
        <Typography variant="caption" sx={{ color: 'info.dark' }}>
          {t('select_product_media_first')}
        </Typography>
      </Stack>
    );
  }

  return (
    <Box sx={{ maxHeight: 220, overflow: 'auto', borderRadius: 1 }}>
      <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(72px, 1fr))" gap={0.75}>
        {productMedia.map((item) => {
          const isAssigned = assignedIds.includes(item.id);
          return (
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
                    width: 200,
                    height: 200,
                    objectFit: 'cover',
                    borderRadius: 0.75,
                    display: 'block',
                  }}
                />
              }
            >
              <Box
                onClick={() => onToggle(item.id, item)}
                sx={{
                  position: 'relative',
                  width: '100%',
                  paddingTop: '100%',
                  borderRadius: 1,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  outline: (theme) =>
                    isAssigned
                      ? `2.5px solid ${theme.palette.primary.main}`
                      : '2.5px solid transparent',
                  outlineOffset: -2.5,
                  opacity: isAssigned ? 1 : 0.65,
                  '&:hover': {
                    opacity: 1,
                    transform: 'scale(1.05)',
                  },
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

                {isAssigned && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 3,
                      right: 3,
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      animation: `${checkPop} 0.25s ease`,
                      boxShadow: (theme) =>
                        `0 1px 4px ${alpha(theme.palette.primary.main, 0.5)}, 0 0 0 1.5px ${alpha(theme.palette.common.white, 0.9)}`,
                    }}
                  >
                    <Iconify icon="eva:checkmark-fill" width={11} sx={{ color: 'white' }} />
                  </Box>
                )}
              </Box>
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
}

ValueMediaGrid.propTypes = {
  productMedia: PropTypes.array.isRequired,
  assignedIds: PropTypes.array.isRequired,
  onToggle: PropTypes.func.isRequired,
};

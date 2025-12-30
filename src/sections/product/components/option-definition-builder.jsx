import PropTypes from 'prop-types';
import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import InputAdornment from '@mui/material/InputAdornment';
import { alpha } from '@mui/material/styles';

import Iconify from 'src/components/iconify';
import { useTranslate } from 'src/locales';

// ----------------------------------------------------------------------

const OPTION_TYPES = [
  { value: 'text', label: 'Text', style: 'dropdown' },
  { value: 'color', label: 'Color', style: 'color' },
];

const STYLE_OPTIONS = {
  text: [
    { value: 'dropdown', label: 'Dropdown', icon: 'eva:arrow-ios-downward-fill' },
    { value: 'text', label: 'Text Input', icon: 'material-symbols:text-fields' },
  ],
  color: [
    { value: 'color', label: 'Color Picker', icon: 'mdi:palette' },
  ],
};

// ----------------------------------------------------------------------

export default function OptionDefinitionBuilder({ options, onChange, maxOptions = 3 }) {
  const { t } = useTranslate();

  const handleAddOption = () => {
    if (options.length >= maxOptions) return;

    const newOption = {
      id: Date.now(),
      name: '',
      type: 'text',
      style: 'dropdown',
      values: [],
    };

    onChange([...options, newOption]);
  };

  const handleRemoveOption = (id) => {
    onChange(options.filter((opt) => opt.id !== id));
  };

  const handleUpdateOption = (id, field, value) => {
    onChange(
      options.map((opt) => {
        if (opt.id === id) {
          const updated = { ...opt, [field]: value };

          // Reset style when type changes
          if (field === 'type') {
            updated.style = STYLE_OPTIONS[value][0].value;
          }

          return updated;
        }
        return opt;
      })
    );
  };

  const handleAddValue = (optionId, value) => {
    onChange(
      options.map((opt) => {
        if (opt.id === optionId) {
          return {
            ...opt,
            values: [...opt.values, value],
          };
        }
        return opt;
      })
    );
  };

  const handleRemoveValue = (optionId, valueIndex) => {
    onChange(
      options.map((opt) => {
        if (opt.id === optionId) {
          return {
            ...opt,
            values: opt.values.filter((_, idx) => idx !== valueIndex),
          };
        }
        return opt;
      })
    );
  };

  return (
    <Stack spacing={3}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box>
          <Typography variant="h6" gutterBottom>
            {t('product_options')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('product_options_description')}
          </Typography>
        </Box>

        {options.length < maxOptions && (
          <Button
            variant="soft"
            color="primary"
            startIcon={<Iconify icon="eva:plus-fill" />}
            onClick={handleAddOption}
            sx={{
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
              '&:hover': {
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.16),
              },
            }}
          >
            {t('add_option')}
          </Button>
        )}
      </Box>

      {/* Options List */}
      {options.length === 0 && (
        <Paper
          sx={{
            p: 5,
            textAlign: 'center',
            bgcolor: (theme) => alpha(theme.palette.grey[500], 0.04),
            border: (theme) => `2px dashed ${alpha(theme.palette.grey[500], 0.24)}`,
          }}
        >
          <Iconify
            icon="carbon:data-view"
            width={48}
            sx={{ color: 'text.disabled', mb: 2 }}
          />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {t('no_options_yet')}
          </Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>
            {t('no_options_description')}
          </Typography>
          <Button
            variant="contained"
            startIcon={<Iconify icon="eva:plus-fill" />}
            onClick={handleAddOption}
          >
            {t('add_first_option')}
          </Button>
        </Paper>
      )}

      {options.map((option, index) => (
        <OptionDefinitionCard
          key={option.id}
          option={option}
          index={index}
          onUpdate={handleUpdateOption}
          onRemove={handleRemoveOption}
          onAddValue={handleAddValue}
          onRemoveValue={handleRemoveValue}
        />
      ))}

      {/* Max Options Warning */}
      {options.length >= maxOptions && (
        <Typography variant="caption" color="warning.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
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
};

// ----------------------------------------------------------------------

function OptionDefinitionCard({ option, index, onUpdate, onRemove, onAddValue, onRemoveValue }) {
  const { t } = useTranslate();
  const [newValue, setNewValue] = useState('');
  const [newColorHex, setNewColorHex] = useState('#000000');

  const handleAddValueSubmit = () => {
    if (!newValue.trim()) return;

    const value = option.type === 'color'
      ? { value: newValue.trim(), color_hex: newColorHex }
      : { value: newValue.trim() };

    onAddValue(option.id, value);
    setNewValue('');
    setNewColorHex('#000000');
  };

  const styleOptions = STYLE_OPTIONS[option.type] || [];

  return (
    <Card
      sx={{
        p: 3,
        position: 'relative',
        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.02),
        border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: (theme) => theme.customShadows.z8,
          borderColor: 'primary.main',
        },
      }}
    >
      {/* Header with Remove Button */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
        <Chip
          label={`${t('option')} ${index + 1}`}
          size="small"
          color="primary"
          variant="soft"
          sx={{ fontWeight: 700 }}
        />
        <IconButton
          size="small"
          color="error"
          onClick={() => onRemove(option.id)}
          sx={{
            '&:hover': {
              bgcolor: (theme) => alpha(theme.palette.error.main, 0.08),
            },
          }}
        >
          <Iconify icon="eva:trash-2-outline" />
        </IconButton>
      </Box>

      {/* Option Configuration */}
      <Stack spacing={2.5}>
        {/* Name and Type Row */}
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          }}
        >
          <TextField
            fullWidth
            label={t('option_name')}
            placeholder={t('option_name_placeholder')}
            value={option.name}
            onChange={(e) => onUpdate(option.id, 'name', e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="mdi:tag-outline" width={20} />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            select
            fullWidth
            label={t('option_type')}
            value={option.type}
            onChange={(e) => onUpdate(option.id, 'type', e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="mdi:format-list-bulleted-type" width={20} />
                </InputAdornment>
              ),
            }}
          >
            {OPTION_TYPES.map((type) => (
              <MenuItem key={type.value} value={type.value}>
                {t(type.label.toLowerCase())}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        {/* Display Style */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Iconify icon="mdi:view-dashboard-outline" width={18} />
            {t('display_style')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            {styleOptions.map((style) => (
              <Button
                key={style.value}
                variant={option.style === style.value ? 'contained' : 'outlined'}
                color={option.style === style.value ? 'primary' : 'inherit'}
                startIcon={<Iconify icon={style.icon} />}
                onClick={() => onUpdate(option.id, 'style', style.value)}
                sx={{
                  flex: { xs: '1 1 100%', sm: '1 1 auto' },
                  minWidth: 140,
                  justifyContent: 'flex-start',
                  transition: 'all 0.2s ease',
                  ...(option.style !== style.value && {
                    bgcolor: (theme) => alpha(theme.palette.grey[500], 0.04),
                    borderColor: (theme) => alpha(theme.palette.grey[500], 0.24),
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
                    },
                  }),
                }}
              >
                {t(style.label.toLowerCase().replace(/\s+/g, '_'))}
              </Button>
            ))}
          </Box>
        </Box>

        {/* Values Section */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Iconify icon="mdi:playlist-edit" width={18} />
            {t('option_values')}
          </Typography>

          {/* Add Value Input */}
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder={option.type === 'color' ? t('color_name_placeholder') : t('value_placeholder')}
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddValueSubmit();
                }
              }}
            />

            {option.type === 'color' && (
              <TextField
                type="color"
                size="small"
                value={newColorHex}
                onChange={(e) => setNewColorHex(e.target.value)}
                sx={{ width: 80 }}
              />
            )}

            <Button
              variant="contained"
              onClick={handleAddValueSubmit}
              disabled={!newValue.trim()}
              sx={{ minWidth: 100, whiteSpace: 'nowrap' }}
            >
              <Iconify icon="eva:plus-fill" sx={{ mr: 0.5 }} />
              {t('add')}
            </Button>
          </Stack>

          {/* Values List */}
          {option.values.length === 0 ? (
            <Paper
              sx={{
                p: 2,
                textAlign: 'center',
                bgcolor: (theme) => alpha(theme.palette.grey[500], 0.04),
                border: (theme) => `1px dashed ${alpha(theme.palette.grey[500], 0.24)}`,
              }}
            >
              <Typography variant="caption" color="text.disabled">
                {t('no_values_yet')}
              </Typography>
            </Paper>
          ) : (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {option.values.map((val, valIndex) => (
                <Chip
                  key={valIndex}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {option.type === 'color' && (
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            bgcolor: val.color_hex,
                            border: (theme) => `2px solid ${theme.palette.divider}`,
                          }}
                        />
                      )}
                      {val.value}
                    </Box>
                  }
                  onDelete={() => onRemoveValue(option.id, valIndex)}
                  color="primary"
                  variant="soft"
                  sx={{
                    fontWeight: 500,
                    '& .MuiChip-deleteIcon': {
                      color: 'error.main',
                      '&:hover': {
                        color: 'error.dark',
                      },
                    },
                  }}
                />
              ))}
            </Box>
          )}
        </Box>
      </Stack>
    </Card>
  );
}

OptionDefinitionCard.propTypes = {
  option: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  onAddValue: PropTypes.func.isRequired,
  onRemoveValue: PropTypes.func.isRequired,
};

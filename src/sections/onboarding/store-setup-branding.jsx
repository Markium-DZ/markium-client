import PropTypes from 'prop-types';
import { useState } from 'react';

import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';

import axios, { endpoints } from 'src/utils/axios';
import { useTranslation } from 'react-i18next';
import generatePalette from 'src/utils/generate-palette';

// ----------------------------------------------------------------------

const PRESET_COLORS = [
  '#E91E63', '#9C27B0', '#3F51B5', '#00BCD4',
  '#4CAF50', '#FF9800', '#F44336', '#607D8B',
];

// ----------------------------------------------------------------------

export default function StoreSetupBranding({ onNext }) {
  const { t } = useTranslation();

  const [selectedColor, setSelectedColor] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleColorChange = (color) => {
    setSelectedColor(color);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      const body = selectedColor
        ? { colorPalette: generatePalette(selectedColor) }
        : {};

      await axios.patch(endpoints.storeSetup.branding, body);
      onNext();
    } catch (error) {
      console.error(error);
      const message = error.error?.message || error.message || t('operation_failed');
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      await axios.patch(endpoints.storeSetup.branding, {});
      onNext();
    } catch (error) {
      console.error(error);
      const message = error.error?.message || error.message || t('operation_failed');
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack spacing={3}>
      {!!errorMsg && (
        <Alert severity="error">{errorMsg}</Alert>
      )}

      <Stack spacing={1} sx={{ textAlign: 'center' }}>
        <Typography variant="h6">
          {t('choose_primary_color')}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('primary_color_description')}
        </Typography>
      </Stack>

      {/* Preset color swatches */}
      <Stack direction="row" flexWrap="wrap" justifyContent="center" gap={1.5}>
        {PRESET_COLORS.map((color) => (
          <Box
            key={color}
            onClick={() => handleColorChange(color)}
            sx={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              bgcolor: color,
              cursor: 'pointer',
              border: (theme) =>
                selectedColor === color
                  ? `3px solid ${theme.palette.text.primary}`
                  : '3px solid transparent',
              boxShadow: selectedColor === color ? 3 : 0,
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'scale(1.1)',
              },
            }}
          />
        ))}
      </Stack>

      {/* Custom color picker */}
      <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('pick_color')}:
        </Typography>
        <input
          type="color"
          value={selectedColor || '#3F51B5'}
          onChange={(e) => handleColorChange(e.target.value)}
          style={{
            width: 40,
            height: 40,
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            padding: 0,
          }}
        />
        <TextField
          size="small"
          value={selectedColor}
          onChange={(e) => {
            const val = e.target.value;
            if (/^#[0-9A-Fa-f]{0,6}$/.test(val) || val === '') {
              handleColorChange(val);
            }
          }}
          placeholder="#000000"
          sx={{ width: 120 }}
          inputProps={{ dir: 'ltr' }}
        />
      </Stack>

      {/* Color preview */}
      {selectedColor && (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Box
            sx={{
              width: 200,
              height: 48,
              borderRadius: 1.5,
              bgcolor: selectedColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="caption" sx={{ color: 'common.white', fontWeight: 600 }}>
              {selectedColor}
            </Typography>
          </Box>
        </Box>
      )}

      <Stack direction="row" spacing={2}>
        <Button
          fullWidth
          size="large"
          variant="outlined"
          onClick={handleSkip}
          disabled={loading}
        >
          {t('skip')}
        </Button>

        <LoadingButton
          fullWidth
          size="large"
          variant="contained"
          onClick={handleSubmit}
          loading={loading}
          disabled={!selectedColor}
        >
          {t('next')}
        </LoadingButton>
      </Stack>
    </Stack>
  );
}

StoreSetupBranding.propTypes = {
  onNext: PropTypes.func.isRequired,
};

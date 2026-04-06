import { useState, useContext, useRef, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import Grid from '@mui/material/Grid';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Radio from '@mui/material/Radio';
import Tooltip from '@mui/material/Tooltip';
import { alpha, useTheme } from '@mui/material/styles';

import { useTranslate } from 'src/locales';
import { useSnackbar } from 'src/components/snackbar';
import showError from 'src/utils/show_error';
import { AuthContext } from 'src/auth/context/jwt';
import Iconify from 'src/components/iconify';
import { updateTheme } from 'src/api/theme';
import { updateStoreConfig, useGetMyStore } from 'src/api/store';
import generatePalette from 'src/utils/generate-palette';

// ----------------------------------------------------------------------

const TEMPLATES = [
  { id: 'clothing', image: '/assets/templates/clothing.webp' },
  { id: 'shoes', image: '/assets/templates/shoes.webp' },
  { id: 'furniture', image: '/assets/templates/furniture.webp' },
  { id: 'kitchen', image: '/assets/templates/kitchen.webp' },
  { id: 'jewellery', image: '/assets/templates/jewellery.webp' },
  { id: 'autoparts', image: '/assets/templates/autoparts.webp' },
  { id: 'islamic-lib', image: '/assets/templates/islamic-lib.webp' },
  { id: 'islamic-lib2', image: '/assets/templates/islamic-lib2.webp' },
  { id: 'spices', image: '/assets/templates/spices.webp' },
  { id: 'bags', image: '/assets/templates/bags.webp' },
  { id: 'hardware-store', image: '/assets/templates/hardware-store.webp' },
  { id: 'electronics', image: '/assets/templates/electronics.webp' },
  { id: 'health-cosmetics', image: '/assets/templates/health.webp' },
  { id: 'women-fashion', image: '/assets/templates/women-fashion.webp' },
  { id: 'default', image: '/assets/templates/default.webp' },
];

const PRESET_COLORS = [
  { hex: '#E91E63', name: 'pink' },
  { hex: '#9C27B0', name: 'purple' },
  { hex: '#2196F3', name: 'blue' },
  { hex: '#00BCD4', name: 'cyan' },
  { hex: '#4CAF50', name: 'green' },
  { hex: '#FF9800', name: 'orange' },
  { hex: '#F44336', name: 'red' },
  { hex: '#607D8B', name: 'slate' },
  { hex: '#212121', name: 'black' },
  { hex: '#009688', name: 'teal' },
];

// ----------------------------------------------------------------------

export default function AppearanceForm() {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslate();
  const { user } = useContext(AuthContext);
  const { store, mutate } = useGetMyStore(user?.store?.slug);

  const colorInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(user?.store?.theme_name);

  const storedPrimaryColor = store?.config?.colorPalette?.primary?.main || null;
  const [selectedColor, setSelectedColor] = useState(storedPrimaryColor);
  const [customColor, setCustomColor] = useState(
    storedPrimaryColor && !PRESET_COLORS.some((p) => p.hex === storedPrimaryColor)
      ? storedPrimaryColor
      : null
  );

  // Sync state when store data loads or updates (after save + mutate)
  useEffect(() => {
    if (storedPrimaryColor) {
      setSelectedColor(storedPrimaryColor);
      if (!PRESET_COLORS.some((p) => p.hex === storedPrimaryColor)) {
        setCustomColor(storedPrimaryColor);
      } else {
        setCustomColor(null);
      }
    }
  }, [storedPrimaryColor]);

  const isDirty =
    selectedTemplate !== user?.store?.theme_name || selectedColor !== storedPrimaryColor;

  const handleSubmit = async () => {
    try {
      setLoading(true);

      await updateTheme({ theme_name: selectedTemplate });

      const config = { theme_name: selectedTemplate };

      if (selectedColor) {
        config.colorPalette = generatePalette(selectedColor);
      } else {
        config.colorPalette = '';
      }

      await updateStoreConfig({ config });

      await mutate();
      enqueueSnackbar(t('appearance_saved'), { variant: 'success' });
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetColor = () => {
    setSelectedColor(null);
    setCustomColor(null);
  };

  const handlePresetClick = (hex) => {
    setSelectedColor(hex);
    setCustomColor(null);
  };

  const handleCustomColorChange = (e) => {
    const hex = e.target.value;
    setCustomColor(hex);
    setSelectedColor(hex);
  };

  const isPresetSelected = (hex) => selectedColor === hex && !customColor;
  const isCustomSelected = customColor && selectedColor === customColor;

  return (
    <Stack spacing={3}>
      {/* Sticky save button */}
      <Stack
        direction="row"
        justifyContent="flex-end"
        sx={{
          position: 'sticky',
          top: 0,
          py: 2,
          bgcolor: 'background.default',
          zIndex: 1,
        }}
      >
        <LoadingButton
          size="large"
          variant="contained"
          loading={loading}
          onClick={handleSubmit}
          disabled={!isDirty}
          startIcon={<Iconify icon="solar:check-circle-bold" />}
        >
          {t('save_changes')}
        </LoadingButton>
      </Stack>

      {/* Section 1: Primary Color */}
      <Card sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: alpha(theme.palette.warning.main, 0.1),
                }}
              >
                <Iconify
                  icon="solar:pallete-2-bold-duotone"
                  width={22}
                  sx={{ color: 'warning.dark' }}
                />
              </Box>
              <Box>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Typography variant="h6">{t('primary_color')}</Typography>
                  {storedPrimaryColor && (
                    <Stack direction="row" alignItems="center" spacing={0.75} sx={{
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1,
                      bgcolor: alpha(storedPrimaryColor, 0.08),
                      border: `1px solid ${alpha(storedPrimaryColor, 0.2)}`,
                    }}>
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          bgcolor: storedPrimaryColor,
                          border: `1px solid ${alpha(theme.palette.grey[500], 0.24)}`,
                        }}
                      />
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600, color: 'text.secondary' }}>
                        {storedPrimaryColor.toUpperCase()}
                      </Typography>
                    </Stack>
                  )}
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {t('primary_color_description')}
                </Typography>
              </Box>
            </Stack>

            {selectedColor && (
              <Button
                size="small"
                color="inherit"
                startIcon={<Iconify icon="solar:restart-bold" width={18} />}
                onClick={handleResetColor}
              >
                {t('reset_to_default')}
              </Button>
            )}
          </Stack>

          {/* Preset swatches */}
          <Stack direction="row" flexWrap="wrap" gap={1.5}>
            {PRESET_COLORS.map((preset) => (
              <Tooltip key={preset.hex} title={preset.name} arrow>
                <Box
                  onClick={() => handlePresetClick(preset.hex)}
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    bgcolor: preset.hex,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    outline: isPresetSelected(preset.hex)
                      ? `3px solid ${preset.hex}`
                      : '3px solid transparent',
                    outlineOffset: 2,
                    '&:hover': {
                      transform: 'scale(1.15)',
                    },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isPresetSelected(preset.hex) && (
                    <Iconify icon="eva:checkmark-fill" width={18} sx={{ color: '#fff' }} />
                  )}
                </Box>
              </Tooltip>
            ))}

            {/* Custom color swatch */}
            <Tooltip title={t('custom_color')} arrow>
              <Box
                onClick={() => colorInputRef.current?.click()}
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  border: isCustomSelected ? 'none' : `2px dashed ${theme.palette.grey[400]}`,
                  bgcolor: isCustomSelected ? customColor : 'transparent',
                  outline: isCustomSelected
                    ? `3px solid ${customColor}`
                    : '3px solid transparent',
                  outlineOffset: 2,
                  '&:hover': {
                    transform: 'scale(1.15)',
                    borderColor: theme.palette.grey[600],
                  },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {isCustomSelected ? (
                  <Iconify icon="solar:pen-bold" width={16} sx={{ color: '#fff' }} />
                ) : (
                  <Iconify icon="eva:plus-fill" width={18} sx={{ color: 'text.secondary' }} />
                )}
                <input
                  ref={colorInputRef}
                  type="color"
                  value={customColor || '#E91E63'}
                  onChange={handleCustomColorChange}
                  style={{
                    position: 'absolute',
                    width: 0,
                    height: 0,
                    opacity: 0,
                    pointerEvents: 'none',
                  }}
                />
              </Box>
            </Tooltip>
          </Stack>

          {/* Color preview */}
          {selectedColor && (
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: 0.75,
                  bgcolor: selectedColor,
                  border: `1px solid ${alpha(theme.palette.grey[500], 0.24)}`,
                }}
              />
              <Typography variant="body2" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>
                {selectedColor.toUpperCase()}
              </Typography>
            </Stack>
          )}
        </Stack>
      </Card>

      {/* Section 2: Store Template */}
      <Card sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(theme.palette.primary.main, 0.1),
              }}
            >
              <Iconify
                icon="solar:palette-round-bold-duotone"
                width={22}
                sx={{ color: 'primary.dark' }}
              />
            </Box>
            <Box>
              <Typography variant="h6">{t('choose_your_store_template')}</Typography>
              <Typography variant="body2" color="text.secondary">
                {t('select_template_description')}
              </Typography>
            </Box>
          </Stack>

          <Grid container spacing={2}>
            {TEMPLATES.map((tpl) => (
              <Grid item xs={6} sm={4} key={tpl.id}>
                <Card
                  sx={{
                    position: 'relative',
                    border:
                      selectedTemplate === tpl.id
                        ? `2px solid ${theme.palette.primary.main}`
                        : `1px solid ${theme.palette.divider}`,
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: theme.customShadows?.z12 || theme.shadows[6],
                    },
                  }}
                >
                  <CardActionArea onClick={() => setSelectedTemplate(tpl.id)}>
                    <Box
                      component="img"
                      src={tpl.image}
                      alt={tpl.id}
                      sx={{
                        width: '100%',
                        height: 200,
                        objectFit: 'contain',
                        bgcolor: 'grey.100',
                        p: 1,
                      }}
                    />
                    <CardContent sx={{ py: 1.5, px: 2 }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography variant="subtitle2" noWrap>
                          {t(`template_${tpl.id}`)}
                        </Typography>
                        <Radio checked={selectedTemplate === tpl.id} value={tpl.id} sx={{ p: 0 }} />
                      </Stack>
                    </CardContent>
                  </CardActionArea>

                  {selectedTemplate === tpl.id && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: 'primary.main',
                        color: 'white',
                        borderRadius: '50%',
                        width: 28,
                        height: 28,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Iconify icon="eva:checkmark-fill" width={18} />
                    </Box>
                  )}
                </Card>
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Card>
    </Stack>
  );
}

import { useState, useEffect, useContext } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import { alpha, useTheme } from '@mui/material/styles';
import CardActionArea from '@mui/material/CardActionArea';

import showError from 'src/utils/show_error';

import { useTranslate } from 'src/locales';
import { AuthContext } from 'src/auth/context/jwt';
import { useGetMyStore, updateStoreConfig } from 'src/api/store';

import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';

// ----------------------------------------------------------------------

// Curated brand palettes — swatch colors mirror the storefront's
// src/theme/palettes.ts primary (keep IDs in sync). Merchants pick one; the
// whole storefront re-colors coherently. No free-form hex (always legible).
const BRAND_PALETTES = [
  { id: 'terracotta', hex: '#DB7150' },
  { id: 'emerald', hex: '#24A578' },
  { id: 'teal', hex: '#229FA7' },
  { id: 'ocean', hex: '#3E8FDE' },
  { id: 'indigo', hex: '#6969CF' },
  { id: 'violet', hex: '#9A69CF' },
  { id: 'rose', hex: '#DB5B8B' },
  { id: 'crimson', hex: '#DE4A40' },
  { id: 'amber', hex: '#F0A020' },
  { id: 'gold', hex: '#CDA31F' },
  { id: 'forest', hex: '#2F8052' },
  { id: 'graphite', hex: '#454A53' },
];

const DEFAULT_PALETTE_ID = 'terracotta';

// ----------------------------------------------------------------------

export default function AppearanceForm() {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslate();
  const { user } = useContext(AuthContext);
  const { store, mutate } = useGetMyStore(user?.store?.slug);

  const [loading, setLoading] = useState(false);

  const storedPalette = store?.config?.appearance?.palette || DEFAULT_PALETTE_ID;
  const [selectedPalette, setSelectedPalette] = useState(storedPalette);

  // Sync state when store data loads or updates (after save + mutate)
  useEffect(() => {
    setSelectedPalette(storedPalette);
  }, [storedPalette]);

  const isDirty = selectedPalette !== storedPalette;

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Single request: merges appearance.palette into the store config. (Was
      // two sequential POST /store calls, each re-uploading data.json to S3 —
      // slow for a one-field change.)
      await updateStoreConfig({ config: { appearance: { palette: selectedPalette } } });

      await mutate();
      enqueueSnackbar(t('appearance_saved'), { variant: 'success' });
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  };

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

      {/* Section 1: Brand palette (curated) */}
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
                bgcolor: alpha(theme.palette.warning.main, 0.1),
              }}
            >
              <Iconify icon="solar:pallete-2-bold-duotone" width={22} sx={{ color: 'warning.dark' }} />
            </Box>
            <Box>
              <Typography variant="h6">{t('brand_palette')}</Typography>
              <Typography variant="body2" color="text.secondary">
                {t('brand_palette_description')}
              </Typography>
            </Box>
          </Stack>

          <Grid container spacing={1.5}>
            {BRAND_PALETTES.map((palette) => {
              const isSelected = selectedPalette === palette.id;
              return (
                <Grid item xs={4} sm={3} md={2} key={palette.id}>
                  <Tooltip title={t(`palette_${palette.id}`)} arrow>
                    <CardActionArea
                      onClick={() => setSelectedPalette(palette.id)}
                      sx={{
                        borderRadius: 1.5,
                        p: 1,
                        border: isSelected
                          ? `2px solid ${palette.hex}`
                          : `1px solid ${theme.palette.divider}`,
                        transition: 'all 0.15s',
                      }}
                    >
                      <Stack spacing={0.75} alignItems="center">
                        <Box
                          sx={{
                            width: '100%',
                            height: 44,
                            borderRadius: 1,
                            bgcolor: palette.hex,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {isSelected && (
                            <Iconify icon="eva:checkmark-fill" width={20} sx={{ color: '#fff' }} />
                          )}
                        </Box>
                        <Typography
                          variant="caption"
                          noWrap
                          sx={{ fontWeight: isSelected ? 700 : 500, color: isSelected ? 'text.primary' : 'text.secondary' }}
                        >
                          {t(`palette_${palette.id}`)}
                        </Typography>
                      </Stack>
                    </CardActionArea>
                  </Tooltip>
                </Grid>
              );
            })}
          </Grid>
        </Stack>
      </Card>
    </Stack>
  );
}

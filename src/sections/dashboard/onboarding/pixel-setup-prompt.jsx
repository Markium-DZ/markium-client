import PropTypes from 'prop-types';
import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useTranslation } from 'react-i18next';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import { alpha, useTheme } from '@mui/material/styles';

import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';
import FormProvider, { RHFTextField } from 'src/components/hook-form';
import showError from 'src/utils/show_error';
import { updateStoreConfig } from 'src/api/store';

// ----------------------------------------------------------------------

const PIXELS = [
  {
    key: 'facebook_pixel',
    id: 'facebook',
    icon: 'eva:facebook-fill',
    color: '#1877F2',
    label: 'Facebook Pixel',
    enabledKey: 'facebook_pixel_enabled',
    instructionKey: 'facebook_pixel_instructions',
    fields: [
      { name: 'facebook_pixel_id', labelKey: 'facebook_pixel_id', placeholder: '1234567890123456', required: true },
      { name: 'facebook_access_token', labelKey: 'facebook_access_token', required: false, advanced: true },
    ],
  },
  {
    key: 'tiktok_pixel',
    id: 'tiktok',
    icon: 'ic:baseline-tiktok',
    color: '#010101',
    label: 'TikTok Pixel',
    enabledKey: 'tiktok_pixel_enabled',
    instructionKey: 'tiktok_pixel_instructions',
    fields: [
      { name: 'tiktok_pixel_id', labelKey: 'tiktok_pixel_id', placeholder: 'ABCDEFGHIJ1234567890', required: true },
      { name: 'tiktok_access_token', labelKey: 'tiktok_access_token', required: false, advanced: true },
    ],
  },
  {
    key: 'google_analytics',
    id: 'google_analytics',
    icon: 'mdi:google-analytics',
    color: '#E37400',
    label: 'Google Analytics',
    enabledKey: 'google_analytics_enabled',
    instructionKey: 'google_analytics_instructions',
    fields: [
      { name: 'google_analytics_id', labelKey: 'google_analytics_id', placeholder: 'G-XXXXXXXXXX', required: true },
      { name: 'google_analytics_measurement_id', labelKey: 'google_analytics_measurement_id', placeholder: 'G-XXXXXXXXXX', required: false },
    ],
  },
];

export default function PixelSetupPrompt({ store, onStoreRefresh, sx, ...other }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();

  const pixels = store?.config?.pixels;
  const isDark = theme.palette.mode === 'dark';

  const [configDialog, setConfigDialog] = useState(null);
  const [loading, setLoading] = useState(false);
  const [localConfigured, setLocalConfigured] = useState([]);

  const pixelStatuses = PIXELS.map((p) => {
    const cfg = pixels?.[p.key];
    const configured = localConfigured.includes(p.key) || (cfg?.enabled && (cfg?.pixel_id || cfg?.tracking_id));
    return { ...p, configured: !!configured };
  });

  const anyConfigured = pixelStatuses.some((p) => p.configured);
  if (anyConfigured) return null;

  const activePixel = PIXELS.find((p) => p.id === configDialog);

  return (
    <Card
      sx={{
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        ...sx,
      }}
      {...other}
    >
      {/* Title row */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
        <Iconify icon="solar:target-bold" width={18} sx={{ color: 'warning.main' }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
          {t('pixel_setup_title')}
        </Typography>
      </Stack>

      {/* Pixel quick-action buttons — vertical */}
      <Stack spacing={1}>
        {pixelStatuses.map((pixel) => (
          <ButtonBase
            key={pixel.key}
            onClick={() => setConfigDialog(pixel.id)}
            sx={{
              py: 1.25,
              px: 1.5,
              borderRadius: 1.5,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: 1.5,
              position: 'relative',
              bgcolor: alpha(pixel.color, isDark ? 0.1 : 0.04),
              border: `1px solid ${alpha(pixel.color, isDark ? 0.2 : 0.12)}`,
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: alpha(pixel.color, isDark ? 0.18 : 0.1),
                transform: 'translateY(-1px)',
                boxShadow: `0 2px 8px ${alpha(pixel.color, 0.15)}`,
              },
            }}
          >
            <Iconify
              icon={pixel.icon}
              width={20}
              sx={{ color: pixel.color, flexShrink: 0 }}
            />
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                fontSize: '0.7rem',
                color: 'text.secondary',
              }}
            >
              {pixel.label}
            </Typography>
            <Iconify
              icon="eva:arrow-ios-forward-fill"
              width={16}
              sx={{ color: 'text.disabled', ml: 'auto' }}
            />
          </ButtonBase>
        ))}
      </Stack>

      {/* Inline config dialog */}
      {activePixel && (
        <PixelConfigDialog
          pixel={activePixel}
          store={store}
          open={!!configDialog}
          onClose={() => setConfigDialog(null)}
          loading={loading}
          setLoading={setLoading}
          onConfigured={(key) => {
            setLocalConfigured((prev) => [...prev, key]);
            onStoreRefresh?.();
          }}
          enqueueSnackbar={enqueueSnackbar}
          t={t}
        />
      )}
    </Card>
  );
}

// ----------------------------------------------------------------------

function PixelConfigDialog({ pixel, store, open, onClose, loading, setLoading, onConfigured, enqueueSnackbar, t }) {
  const schema = useMemo(() => {
    const shape = {};
    pixel.fields.forEach((f) => {
      shape[f.name] = f.required ? Yup.string().required(t(`${f.name}_required`)) : Yup.string();
    });
    return Yup.object().shape(shape);
  }, [pixel, t]);

  const pixels = store?.config?.pixels;

  const defaultValues = useMemo(() => {
    const vals = {};
    const cfg = pixels?.[pixel.key] || {};
    pixel.fields.forEach((f) => {
      // Map field names to config keys
      if (f.name.includes('pixel_id')) vals[f.name] = cfg.pixel_id || '';
      else if (f.name.includes('access_token')) vals[f.name] = cfg.access_token || '';
      else if (f.name === 'google_analytics_id') vals[f.name] = cfg.tracking_id || '';
      else if (f.name === 'google_analytics_measurement_id') vals[f.name] = cfg.measurement_id || '';
      else vals[f.name] = '';
    });
    return vals;
  }, [pixel, pixels]);

  const methods = useForm({
    resolver: yupResolver(schema),
    defaultValues,
  });

  const { reset, handleSubmit, formState: { isSubmitting } } = methods;

  const [showAdvanced, setShowAdvanced] = useState(false);

  const mainFields = pixel.fields.filter((f) => !f.advanced);
  const advancedFields = pixel.fields.filter((f) => f.advanced);

  useEffect(() => {
    if (store) reset(defaultValues);
  }, [store, reset, defaultValues]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      setLoading(true);

      // Build the full pixels config, preserving other pixels
      const currentPixels = pixels || {};
      const updatedPixels = { ...currentPixels };

      if (pixel.key === 'facebook_pixel') {
        updatedPixels.facebook_pixel = {
          enabled: true,
          pixel_id: data.facebook_pixel_id,
          access_token: data.facebook_access_token || '',
        };
      } else if (pixel.key === 'tiktok_pixel') {
        updatedPixels.tiktok_pixel = {
          enabled: true,
          pixel_id: data.tiktok_pixel_id,
          access_token: data.tiktok_access_token || '',
        };
      } else if (pixel.key === 'google_analytics') {
        updatedPixels.google_analytics = {
          enabled: true,
          tracking_id: data.google_analytics_id,
          measurement_id: data.google_analytics_measurement_id || '',
        };
      }

      await updateStoreConfig({ config: { pixels: updatedPixels } });

      enqueueSnackbar(t('marketing_pixels_saved_successfully'), { variant: 'success' });
      setLoading(false);
      onConfigured(pixel.key);
      onClose();
    } catch (error) {
      setLoading(false);
      showError(error);
    }
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Iconify icon={pixel.icon} width={28} sx={{ color: pixel.color }} />
              <Typography variant="h6">{pixel.label}</Typography>
            </Stack>
            <IconButton size="small" onClick={onClose}>
              <Iconify icon="mingcute:close-line" width={20} />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ pb: 0.5 }}>
              {t(pixel.instructionKey)}
            </Typography>
            {mainFields.map((field) => (
              <RHFTextField
                key={field.name}
                name={field.name}
                label={t(field.labelKey)}
                placeholder={field.placeholder || ''}
                size="small"
              />
            ))}
            {advancedFields.length > 0 && (
              <>
                <ButtonBase
                  onClick={() => setShowAdvanced((prev) => !prev)}
                  sx={{
                    alignSelf: 'flex-start',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    color: 'text.secondary',
                    typography: 'caption',
                    fontWeight: 600,
                    '&:hover': { color: 'text.primary' },
                  }}
                >
                  {t('advanced_settings')}
                  <Iconify
                    icon={showAdvanced ? 'eva:chevron-up-fill' : 'eva:chevron-down-fill'}
                    width={16}
                  />
                </ButtonBase>
                <Collapse in={showAdvanced}>
                  <Stack spacing={2}>
                    {advancedFields.map((field) => (
                      <RHFTextField
                        key={field.name}
                        name={field.name}
                        label={t(field.labelKey)}
                        placeholder={field.placeholder || t('optional')}
                        size="small"
                      />
                    ))}
                  </Stack>
                </Collapse>
              </>
            )}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" color="inherit" onClick={onClose}>
            {t('cancel')}
          </Button>
          <LoadingButton
            variant="contained"
            loading={isSubmitting || loading}
            onClick={onSubmit}
          >
            {t('save_changes')}
          </LoadingButton>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
}

PixelConfigDialog.propTypes = {
  pixel: PropTypes.object.isRequired,
  store: PropTypes.object,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  setLoading: PropTypes.func.isRequired,
  onConfigured: PropTypes.func.isRequired,
  enqueueSnackbar: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
};

PixelSetupPrompt.propTypes = {
  store: PropTypes.object,
  onStoreRefresh: PropTypes.func,
  sx: PropTypes.object,
};

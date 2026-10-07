import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useContext, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Collapse from '@mui/material/Collapse';
import ButtonBase from '@mui/material/ButtonBase';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import IconButton from '@mui/material/IconButton';
import Grid from '@mui/material/Unstable_Grid2';
import { alpha } from '@mui/material/styles';

import { useTranslate } from 'src/locales';
import Iconify from 'src/components/iconify';

import { useSnackbar } from 'src/components/snackbar';
import FormProvider, {
  RHFTextField,
} from 'src/components/hook-form';
import showError from 'src/utils/show_error';
import { updateStoreConfig, useGetMyStore } from 'src/api/store';
import { AuthContext } from 'src/auth/context/jwt';

// ----------------------------------------------------------------------

export default function MarketingPixelsForm() {
  const { user } = useContext(AuthContext)
  const { store } = useGetMyStore(user?.store?.slug);
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslate();

  const [loading, setLoading] = useState(false);
  const [configDialog, setConfigDialog] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const MarketingPixelsSchema = Yup.object().shape({
    facebook_pixel_enabled: Yup.boolean(),
    facebook_pixel_id: Yup.string().when('facebook_pixel_enabled', {
      is: true,
      then: (schema) => schema.required(t('facebook_pixel_id_required')),
      otherwise: (schema) => schema,
    }),
    facebook_access_token: Yup.string(),

    tiktok_pixel_enabled: Yup.boolean(),
    tiktok_pixel_id: Yup.string().when('tiktok_pixel_enabled', {
      is: true,
      then: (schema) => schema.required(t('tiktok_pixel_id_required')),
      otherwise: (schema) => schema,
    }),
    tiktok_access_token: Yup.string(),

    google_analytics_enabled: Yup.boolean(),
    google_analytics_id: Yup.string().when('google_analytics_enabled', {
      is: true,
      then: (schema) => schema.required(t('google_analytics_id_required')),
      otherwise: (schema) => schema,
    }),
    google_analytics_measurement_id: Yup.string(),
  });

  const defaultValues = useMemo(
    () => ({
      facebook_pixel_enabled: store?.config?.pixels?.facebook_pixel?.enabled || false,
      facebook_pixel_id: store?.config?.pixels?.facebook_pixel?.pixel_id || '',
      facebook_access_token: store?.config?.pixels?.facebook_pixel?.access_token || '',

      tiktok_pixel_enabled: store?.config?.pixels?.tiktok_pixel?.enabled || false,
      tiktok_pixel_id: store?.config?.pixels?.tiktok_pixel?.pixel_id || '',
      tiktok_access_token: store?.config?.pixels?.tiktok_pixel?.access_token || '',

      google_analytics_enabled: store?.config?.pixels?.google_analytics?.enabled || false,
      google_analytics_id: store?.config?.pixels?.google_analytics?.tracking_id || '',
      google_analytics_measurement_id: store?.config?.pixels?.google_analytics?.measurement_id || '',
    }),
    [store]
  );

  const methods = useForm({
    resolver: yupResolver(MarketingPixelsSchema),
    defaultValues,
  });

  const {
    reset,
    watch,
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const values = watch();

  useEffect(() => {
    if (store) {
      reset(defaultValues);
    }
  }, [store, reset, defaultValues]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      setLoading(true);

      // Enable the pixel being configured via dialog
      if (configDialog) {
        const enabledKeyMap = {
          facebook: 'facebook_pixel_enabled',
          tiktok: 'tiktok_pixel_enabled',
          google_analytics: 'google_analytics_enabled',
        };
        const key = enabledKeyMap[configDialog];
        if (key) {
          data[key] = true;
          setValue(key, true);
        }
      }

      const structuredData = {
        facebook_pixel: {
          enabled: data.facebook_pixel_enabled,
          pixel_id: data.facebook_pixel_id,
          access_token: data.facebook_access_token,
        },
        tiktok_pixel: {
          enabled: data.tiktok_pixel_enabled,
          pixel_id: data.tiktok_pixel_id,
          access_token: data.tiktok_access_token,
        },
        google_analytics: {
          enabled: data.google_analytics_enabled,
          tracking_id: data.google_analytics_id,
          measurement_id: data.google_analytics_measurement_id,
        },
      };

      await updateStoreConfig({ config: { pixels: structuredData } });

      enqueueSnackbar(t('marketing_pixels_saved_successfully'), { variant: 'success' });
      setLoading(false);
      setConfigDialog(null);
    } catch (error) {
      setLoading(false);
      showError(error);
    }
  });

  const pixelSections = [
    {
      id: 'facebook',
      title: 'Facebook Pixel',
      description: t('facebook_pixel_description'),
      icon: 'eva:facebook-fill',
      color: '#1877F2',
      enabledKey: 'facebook_pixel_enabled',
      enabled: values.facebook_pixel_enabled,
      hasId: !!values.facebook_pixel_id,
      instructions: t('facebook_pixel_instructions'),
      fields: [
        { name: 'facebook_pixel_id', label: t('facebook_pixel_id'), placeholder: '1234567890123456', required: true },
        { name: 'facebook_access_token', label: t('facebook_access_token'), placeholder: t('optional'), required: false, advanced: true },
      ],
    },
    {
      id: 'tiktok',
      title: 'TikTok Pixel',
      description: t('tiktok_pixel_description'),
      icon: 'ic:baseline-tiktok',
      color: '#000000',
      enabledKey: 'tiktok_pixel_enabled',
      enabled: values.tiktok_pixel_enabled,
      hasId: !!values.tiktok_pixel_id,
      instructions: t('tiktok_pixel_instructions'),
      fields: [
        { name: 'tiktok_pixel_id', label: t('tiktok_pixel_id'), placeholder: 'ABCDEFGHIJ1234567890', required: true },
        { name: 'tiktok_access_token', label: t('tiktok_access_token'), placeholder: t('optional'), required: false, advanced: true },
      ],
    },
    {
      id: 'google_analytics',
      title: 'Google Analytics',
      description: t('google_analytics_description'),
      icon: 'logos:google-analytics',
      color: '#E37400',
      enabledKey: 'google_analytics_enabled',
      enabled: values.google_analytics_enabled,
      hasId: !!values.google_analytics_id,
      instructions: t('google_analytics_instructions'),
      fields: [
        { name: 'google_analytics_id', label: t('google_analytics_id'), placeholder: 'UA-XXXXXXXXX-X or G-XXXXXXXXXX', required: true },
        { name: 'google_analytics_measurement_id', label: t('google_analytics_measurement_id'), placeholder: 'G-XXXXXXXXXX', required: false },
      ],
    },
  ];

  const activeSection = pixelSections.find((s) => s.id === configDialog);

  const handleSwitchToggle = useCallback(
    (section) => (e) => {
      e.stopPropagation();
      if (e.target.checked) {
        // Trying to enable → open dialog so user enters credentials first
        setConfigDialog(section.id);
      } else {
        // Disabling → turn off and save immediately
        setValue(section.enabledKey, false);
        // Auto-save the disabled state
        const currentValues = methods.getValues();
        const updatedValues = { ...currentValues, [section.enabledKey]: false };
        const structuredData = {
          facebook_pixel: {
            enabled: updatedValues.facebook_pixel_enabled,
            pixel_id: updatedValues.facebook_pixel_id,
            access_token: updatedValues.facebook_access_token,
          },
          tiktok_pixel: {
            enabled: updatedValues.tiktok_pixel_enabled,
            pixel_id: updatedValues.tiktok_pixel_id,
            access_token: updatedValues.tiktok_access_token,
          },
          google_analytics: {
            enabled: updatedValues.google_analytics_enabled,
            tracking_id: updatedValues.google_analytics_id,
            measurement_id: updatedValues.google_analytics_measurement_id,
          },
        };
        updateStoreConfig({ config: { pixels: structuredData } })
          .then(() => enqueueSnackbar(t('marketing_pixels_saved_successfully'), { variant: 'success' }))
          .catch((err) => showError(err));
      }
    },
    [setValue, methods, enqueueSnackbar, t]
  );

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      {/* Provider Grid */}
      <Grid container spacing={2.5}>
        {pixelSections.map((section) => (
          <Grid xs={12} sm={6} md={4} key={section.id}>
            <Card
              variant="outlined"
              sx={{
                height: '100%',
                border: (theme) => `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: 'text.disabled',
                  boxShadow: (theme) => theme.customShadows?.z4 || '0 4px 16px 0 rgba(0,0,0,0.06)',
                },
                ...(section.enabled && section.hasId && {
                  borderColor: (theme) => alpha(theme.palette.success.main, 0.5),
                }),
              }}
              onClick={() => setConfigDialog(section.id)}
            >
              <Stack sx={{ height: '100%', p: 2.5 }} spacing={2}>
                {/* Top: Icon + Switch */}
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Iconify icon={section.icon} width={32} sx={{ color: section.color, flexShrink: 0 }} />
                  <Box onClick={(e) => e.stopPropagation()}>
                    <Switch
                      size="small"
                      checked={!!section.enabled}
                      onChange={handleSwitchToggle(section)}
                    />
                  </Box>
                </Stack>

                {/* Name + Description */}
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {section.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: 'block' }}>
                    {section.description}
                  </Typography>
                </Box>

                {/* Status Footer */}
                <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" gap={0.5}>
                  {section.enabled && section.hasId ? (
                    <Chip
                      icon={<Iconify icon="eva:checkmark-circle-2-fill" width={14} />}
                      label={t('configured')}
                      size="small"
                      color="success"
                      variant="soft"
                      sx={{ height: 24, fontSize: '0.7rem' }}
                    />
                  ) : section.enabled ? (
                    <Chip
                      icon={<Iconify icon="eva:alert-circle-fill" width={14} />}
                      label={t('missing_id')}
                      size="small"
                      color="warning"
                      variant="soft"
                      sx={{ height: 24, fontSize: '0.7rem' }}
                    />
                  ) : (
                    <Chip
                      label={t('disabled')}
                      size="small"
                      variant="soft"
                      sx={{ height: 24, fontSize: '0.7rem' }}
                    />
                  )}
                </Stack>
              </Stack>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Configuration Dialog */}
      <Dialog
        open={!!configDialog}
        onClose={() => setConfigDialog(null)}
        maxWidth="sm"
        fullWidth
      >
        {activeSection && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Iconify icon={activeSection.icon} width={28} sx={{ color: activeSection.color }} />
                  <Typography variant="h6">{activeSection.title}</Typography>
                </Stack>
                <IconButton size="small" onClick={() => setConfigDialog(null)}>
                  <Iconify icon="mingcute:close-line" width={20} />
                </IconButton>
              </Stack>
            </DialogTitle>

            <DialogContent>
              <Stack spacing={2} sx={{ pt: 1 }}>
                {activeSection.instructions && (
                  <Typography variant="body2" color="text.secondary" sx={{ pb: 0.5 }}>
                    {activeSection.instructions}
                  </Typography>
                )}
                {activeSection.fields.filter((f) => !f.advanced).map((field) => (
                  <RHFTextField
                    key={field.name}
                    name={field.name}
                    label={field.label}
                    placeholder={field.placeholder}
                    size="small"
                  />
                ))}
                {activeSection.fields.some((f) => f.advanced) && (
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
                        {activeSection.fields.filter((f) => f.advanced).map((field) => (
                          <RHFTextField
                            key={field.name}
                            name={field.name}
                            label={field.label}
                            placeholder={field.placeholder}
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
              <Button variant="outlined" color="inherit" onClick={() => setConfigDialog(null)}>
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
          </>
        )}
      </Dialog>
    </FormProvider>
  );
}

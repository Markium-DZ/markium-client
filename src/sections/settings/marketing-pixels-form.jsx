import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useContext, useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import Switch from '@mui/material/Switch';
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
    } catch (error) {
      setLoading(false);
      showError(error);
    }
  });

  const pixelSections = [
    {
      id: 'facebook',
      title: 'Facebook Pixel',
      icon: 'eva:facebook-fill',
      color: '#1877F2',
      enabled: values.facebook_pixel_enabled,
      fields: [
        { name: 'facebook_pixel_id', label: t('facebook_pixel_id'), placeholder: '1234567890123456', required: true },
        { name: 'facebook_access_token', label: t('facebook_access_token'), placeholder: t('optional'), required: false },
      ],
      description: t('facebook_pixel_description'),
    },
    {
      id: 'tiktok',
      title: 'TikTok Pixel',
      icon: 'ic:baseline-tiktok',
      color: '#000000',
      enabled: values.tiktok_pixel_enabled,
      fields: [
        { name: 'tiktok_pixel_id', label: t('tiktok_pixel_id'), placeholder: 'ABCDEFGHIJ1234567890', required: true },
        { name: 'tiktok_access_token', label: t('tiktok_access_token'), placeholder: t('optional'), required: false },
      ],
      description: t('tiktok_pixel_description'),
    },
    {
      id: 'google_analytics',
      title: 'Google Analytics',
      icon: 'logos:google-analytics',
      color: '#E37400',
      enabled: values.google_analytics_enabled,
      fields: [
        { name: 'google_analytics_id', label: t('google_analytics_id'), placeholder: 'UA-XXXXXXXXX-X or G-XXXXXXXXXX', required: true },
        { name: 'google_analytics_measurement_id', label: t('google_analytics_measurement_id'), placeholder: 'G-XXXXXXXXXX', required: false },
      ],
      description: t('google_analytics_description'),
    },
  ];

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Stack spacing={2.5}>
        {pixelSections.map((section) => (
          <Card
            key={section.id}
            variant="outlined"
            sx={{
              border: (theme) => `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              overflow: 'hidden',
              transition: 'border-color 0.2s',
              ...(section.enabled && {
                borderColor: (theme) => alpha(section.color, 0.4),
              }),
            }}
          >
            {/* Provider Header */}
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ px: 2.5, py: 2 }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                <Iconify icon={section.icon} width={28} sx={{ color: section.color, flexShrink: 0 }} />
                <Box sx={{ minWidth: 0 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="subtitle2" fontWeight={600} noWrap>
                      {section.title}
                    </Typography>
                    {section.enabled && (
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          bgcolor: 'success.main',
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </Stack>
                  <Typography variant="caption" color="text.disabled" noWrap>
                    {section.description}
                  </Typography>
                </Box>
              </Stack>

              <Switch
                size="small"
                checked={!!section.enabled}
                onChange={(e) => setValue(`${section.id}_pixel_enabled`, e.target.checked)}
                sx={{ flexShrink: 0 }}
              />
            </Stack>

            {/* Credential Fields */}
            <Collapse in={!!section.enabled}>
              <Divider />
              <Stack spacing={2} sx={{ px: 2.5, py: 2.5 }}>
                {section.fields.map((field) => (
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
          </Card>
        ))}

        {/* Save */}
        <Stack direction="row" justifyContent="flex-end" sx={{ pt: 1 }}>
          <LoadingButton
            type="submit"
            variant="contained"
            loading={isSubmitting || loading}
          >
            {t('save_changes')}
          </LoadingButton>
        </Stack>
      </Stack>
    </FormProvider>
  );
}

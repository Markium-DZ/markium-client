import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useContext, useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';

import { useTranslate } from 'src/locales';
import Iconify from 'src/components/iconify';

import { useSnackbar } from 'src/components/snackbar';
import FormProvider, {
  RHFTextField,
  RHFSwitch,
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
    // Facebook Pixel
    facebook_pixel_enabled: Yup.boolean(),
    facebook_pixel_id: Yup.string().when('facebook_pixel_enabled', {
      is: true,
      then: (schema) => schema.required(t('facebook_pixel_id_required')),
      otherwise: (schema) => schema,
    }),
    facebook_access_token: Yup.string(),

    // TikTok Pixel
    tiktok_pixel_enabled: Yup.boolean(),
    tiktok_pixel_id: Yup.string().when('tiktok_pixel_enabled', {
      is: true,
      then: (schema) => schema.required(t('tiktok_pixel_id_required')),
      otherwise: (schema) => schema,
    }),
    tiktok_access_token: Yup.string(),

    // Google Analytics
    google_analytics_enabled: Yup.boolean(),
    google_analytics_id: Yup.string().when('google_analytics_enabled', {
      is: true,
      then: (schema) => schema.required(t('google_analytics_id_required')),
      otherwise: (schema) => schema,
    }),
    google_analytics_measurement_id: Yup.string(),

    // Google Tag Manager
    // google_tag_manager_enabled: Yup.boolean(),
    // google_tag_manager_id: Yup.string().when('google_tag_manager_enabled', {
    //   is: true,
    //   then: (schema) => schema.required(t('google_tag_manager_id_required')),
    //   otherwise: (schema) => schema,
    // }),

    // // Snapchat Pixel
    // snapchat_pixel_enabled: Yup.boolean(),
    // snapchat_pixel_id: Yup.string().when('snapchat_pixel_enabled', {
    //   is: true,
    //   then: (schema) => schema.required(t('snapchat_pixel_id_required')),
    //   otherwise: (schema) => schema,
    // }),

    // // Pinterest Tag
    // pinterest_tag_enabled: Yup.boolean(),
    // pinterest_tag_id: Yup.string().when('pinterest_tag_enabled', {
    //   is: true,
    //   then: (schema) => schema.required(t('pinterest_tag_id_required')),
    //   otherwise: (schema) => schema,
    // }),

    // // Twitter Pixel
    // twitter_pixel_enabled: Yup.boolean(),
    // twitter_pixel_id: Yup.string().when('twitter_pixel_enabled', {
    //   is: true,
    //   then: (schema) => schema.required(t('twitter_pixel_id_required')),
    //   otherwise: (schema) => schema,
    // }),
  });

  const defaultValues = useMemo(
    () => ({
      // Facebook
      facebook_pixel_enabled: store?.config?.pixels?.facebook_pixel?.enabled || false,
      facebook_pixel_id: store?.config?.pixels?.facebook_pixel?.pixel_id || '',
      facebook_access_token: store?.config?.pixels?.facebook_pixel?.access_token || '',

      // TikTok
      tiktok_pixel_enabled: store?.config?.pixels?.tiktok_pixel?.enabled || false,
      tiktok_pixel_id: store?.config?.pixels?.tiktok_pixel?.pixel_id || '',
      tiktok_access_token: store?.config?.pixels?.tiktok_pixel?.access_token || '',

      // Google Analytics
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
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const values = watch();

  // Reset form when store data is loaded
  useEffect(() => {
    if (store) {
      reset(defaultValues);
    }
  }, [store, reset, defaultValues]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      setLoading(true);

      // Transform flat form data into structured pixel objects
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

      await updateStoreConfig({ config: { pixels: structuredData } })


      // Console log the structured data
      // console.log('Marketing pixels structuredData :', structuredData);

      // TODO: Implement API call to save marketing pixels
      // await updateMarketingPixels(structuredData);

      // Simulated API call
      // await new Promise((resolve) => setTimeout(resolve, 1000));

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
    // {
    //   id: 'google_tag_manager',
    //   title: 'Google Tag Manager',
    //   icon: 'logos:google-tag-manager',
    //   color: '#4285F4',
    //   enabled: values.google_tag_manager_enabled,
    //   fields: [
    //     { name: 'google_tag_manager_id', label: t('google_tag_manager_id'), placeholder: 'GTM-XXXXXXX', required: true },
    //   ],
    //   description: t('google_tag_manager_description'),
    // },
    // {
    //   id: 'snapchat',
    //   title: 'Snapchat Pixel',
    //   icon: 'fa6-brands:snapchat',
    //   color: '#FFFC00',
    //   enabled: values.snapchat_pixel_enabled,
    //   fields: [
    //     { name: 'snapchat_pixel_id', label: t('snapchat_pixel_id'), placeholder: '12345678-1234-1234-1234-123456789012', required: true },
    //   ],
    //   description: t('snapchat_pixel_description'),
    // },
    // {
    //   id: 'pinterest',
    //   title: 'Pinterest Tag',
    //   icon: 'fa6-brands:pinterest',
    //   color: '#E60023',
    //   enabled: values.pinterest_tag_enabled,
    //   fields: [
    //     { name: 'pinterest_tag_id', label: t('pinterest_tag_id'), placeholder: '1234567890123', required: true },
    //   ],
    //   description: t('pinterest_tag_description'),
    // },
    // {
    //   id: 'twitter',
    //   title: 'Twitter Pixel',
    //   icon: 'fa6-brands:x-twitter',
    //   color: '#000000',
    //   enabled: values.twitter_pixel_enabled,
    //   fields: [
    //     { name: 'twitter_pixel_id', label: t('twitter_pixel_id'), placeholder: 'o1234', required: true },
    //   ],
    //   description: t('twitter_pixel_description'),
    // },
  ];

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        {/* Information Alert */}
         <Grid xs={12}>
          <Stack direction="row" justifyContent="flex-end" spacing={2}>
            <LoadingButton
              type="submit"
              variant="contained"
              size="large"
              loading={isSubmitting || loading}
            >
              {t('save_changes')}
            </LoadingButton>
          </Stack>
        </Grid>
        <Grid xs={12}>
          <Alert severity="info">
            <Typography variant="body2">
              {t('marketing_pixels_info_message')}
            </Typography>
          </Alert>
        </Grid>

        {/* Pixel Sections */}
        <Grid xs={12} display={"flex"} flexDirection={"column"} gap={4} >
          {pixelSections.map((section) => (
            <Card xs={12} key={section.id} width={"100%"}   >
              <Accordion>
                <AccordionSummary
                  expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}
                  sx={{
                    backgroundColor: 'background.neutral',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  <Stack direction={"row"} spacing={2} alignItems="center" sx={{ width: '100%' }}>
                    <Iconify icon={section.icon} width={32} sx={{ color: section.color }} />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6">{section.title}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {section.description}
                      </Typography>
                    </Box>
                  </Stack>
                  <RHFSwitch name={`${section.id}_pixel_enabled`} label={t('enabled')} sx={{ mr: 2 }} />
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={3}>
                    {section.fields.map((field) => (
                      <RHFTextField
                        key={field.name}
                        name={field.name}
                        label={field.label}
                        placeholder={field.placeholder}
                        disabled={!section.enabled}
                        helperText={!section.enabled ? t('enable_to_configure') : ''}
                      />
                    ))}
                  </Stack>
                </AccordionDetails>
              </Accordion>
            </Card>
          ))}
        </Grid>

        {/* Instructions Card */}

        <Grid xs={12}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {t('integration_instructions')}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Stack spacing={2}>
              <Typography variant="body2">
                <strong>1. {t('facebook_pixel')}:</strong> {t('facebook_pixel_instructions')}
              </Typography>
              <Typography variant="body2">
                <strong>2. {t('tiktok_pixel')}:</strong> {t('tiktok_pixel_instructions')}
              </Typography>
              <Typography variant="body2">
                <strong>3. {t('google_analytics')}:</strong> {t('google_analytics_instructions')}
              </Typography>
            </Stack>
          </Card>
        </Grid>

        {/* Actions */}
       
      </Grid>
    </FormProvider>
  );
}

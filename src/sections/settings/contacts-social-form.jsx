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

export default function ContactsSocialForm() {
  const { user } = useContext(AuthContext)
  const { store } = useGetMyStore(user?.store?.slug);
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslate();

  const [loading, setLoading] = useState(false);

  const ContactsSocialSchema = Yup.object().shape({
    // Contact Information
    phone: Yup.string(),
    whatsapp: Yup.string(),
    telegram: Yup.string(),
    email: Yup.string().email(t('email_must_be_valid')),

    // Social Media Links
    facebook: Yup.string().url(t('must_be_valid_url')),
    instagram: Yup.string().url(t('must_be_valid_url')),
    tiktok: Yup.string().url(t('must_be_valid_url')),
    youtube: Yup.string().url(t('must_be_valid_url')),
  });

  const defaultValues = useMemo(
    () => ({
      // Contact
      phone: store?.config?.contacts_social?.contacts?.phone || '',
      whatsapp: store?.config?.contacts_social?.contacts?.whatsapp || '',
      telegram: store?.config?.contacts_social?.contacts?.telegram || '',
      email: store?.config?.contacts_social?.contacts?.email || '',

      // Social Media
      facebook: store?.config?.contacts_social?.social_media?.facebook || '',
      instagram: store?.config?.contacts_social?.social_media?.instagram || '',
      tiktok: store?.config?.contacts_social?.social_media?.tiktok || '',
      youtube: store?.config?.contacts_social?.social_media?.youtube || '',
    }),
    [store]
  );

  const methods = useForm({
    resolver: yupResolver(ContactsSocialSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  // Reset form when store data is loaded
  useEffect(() => {
    if (store) {
      reset(defaultValues);
    }
  }, [store, reset, defaultValues]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      setLoading(true);

      // Transform flat form data into structured objects
      const structuredData = {
        contacts: {
          phone: data.phone,
          whatsapp: data.whatsapp,
          telegram: data.telegram,
          email: data.email,
        },
        social_media: {
          facebook: data.facebook,
          instagram: data.instagram,
          tiktok: data.tiktok,
          youtube: data.youtube,
        },
      };

      await updateStoreConfig({ config: { contacts_social: structuredData } });

      enqueueSnackbar(t('contacts_social_saved_successfully'), { variant: 'success' });
      setLoading(false);
    } catch (error) {
      setLoading(false);
      showError(error);
    }
  });

  const contactFields = [
    { name: 'phone', label: t('phone_number'), icon: 'solar:phone-bold', placeholder: '+213 555 123 456' },
    { name: 'whatsapp', label: t('whatsapp'), icon: 'ic:baseline-whatsapp', placeholder: '+213 555 123 456' },
    { name: 'telegram', label: t('telegram'), icon: 'ic:baseline-telegram', placeholder: '@yourusername' },
    { name: 'email', label: t('email'), icon: 'solar:letter-bold', placeholder: 'contact@example.com' },
  ];

  const socialFields = [
    { name: 'facebook', label: 'Facebook', icon: 'eva:facebook-fill', color: '#1877F2', placeholder: 'https://facebook.com/yourpage' },
    { name: 'instagram', label: 'Instagram', icon: 'ant-design:instagram-filled', color: '#E4405F', placeholder: 'https://instagram.com/youraccount' },
    { name: 'tiktok', label: 'TikTok', icon: 'ic:baseline-tiktok', color: '#000000', placeholder: 'https://tiktok.com/@youraccount' },
    { name: 'youtube', label: 'YouTube', icon: 'ant-design:youtube-filled', color: '#FF0000', placeholder: 'https://youtube.com/c/yourchannel' },
  ];

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        {/* Save Button */}
        <Grid xs={12}>
          <Stack
            direction="row"
            justifyContent="flex-end"
            spacing={2}
            sx={{
              position: 'sticky',
              top: 0,
              py: 1,
              bgcolor: 'background.default',
              zIndex: 1,
            }}
          >
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
          <Alert severity="info" icon={<Iconify icon="solar:info-circle-bold" width={24} />}>
            <Typography variant="body2">
              {t('contacts_social_info_message')}
            </Typography>
          </Alert>
        </Grid>

        {/* Contact Information Section */}
        <Grid xs={12}>
          <Card sx={{ p: 3 }}>
            <Stack spacing={3}>
              <Box>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <Iconify icon="solar:phone-calling-bold-duotone" width={28} sx={{ color: 'primary.main' }} />
                  <Typography variant="h6">{t('contact_information')}</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {t('contact_information_description')}
                </Typography>
              </Box>

              <Divider />

              <Grid container spacing={3}>
                {contactFields.map((field) => (
                  <Grid xs={12} md={6} key={field.name}>
                    <RHFTextField
                      name={field.name}
                      label={field.label}
                      placeholder={field.placeholder}
                      InputProps={{
                        startAdornment: (
                          <Iconify
                            icon={field.icon}
                            width={20}
                            sx={{ mr: 1, color: 'text.disabled' }}
                          />
                        ),
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
            </Stack>
          </Card>
        </Grid>

        {/* Social Media Links Section */}
        <Grid xs={12}>
          <Card sx={{ p: 3 }}>
            <Stack spacing={3}>
              <Box>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <Iconify icon="solar:share-bold-duotone" width={28} sx={{ color: 'primary.main' }} />
                  <Typography variant="h6">{t('social_media_links')}</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {t('social_media_links_description')}
                </Typography>
              </Box>

              <Divider />

              <Grid container spacing={3}>
                {socialFields.map((field) => (
                  <Grid xs={12} md={6} key={field.name}>
                    <RHFTextField
                      name={field.name}
                      label={field.label}
                      placeholder={field.placeholder}
                      InputProps={{
                        startAdornment: (
                          <Iconify
                            icon={field.icon}
                            width={20}
                            sx={{ mr: 1, color: field.color }}
                          />
                        ),
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
            </Stack>
          </Card>
        </Grid>

        {/* Actions */}

      </Grid>
    </FormProvider>
  );
}

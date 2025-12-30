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
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import Avatar from '@mui/material/Avatar';
import { alpha } from '@mui/material/styles';

import { useTranslate } from 'src/locales';
import Iconify from 'src/components/iconify';

import { useSnackbar } from 'src/components/snackbar';
import FormProvider, {
  RHFTextField,
  RHFUploadAvatar,
} from 'src/components/hook-form';
import showError from 'src/utils/show_error';
import { updateStoreConfig, updateStoreLogo, useGetMyStore } from 'src/api/store';
import { AuthContext } from 'src/auth/context/jwt';

// ----------------------------------------------------------------------

export default function GeneralSettingsForm() {
  const { user, updateUser } = useContext(AuthContext);
  const { store } = useGetMyStore(user?.store?.slug);
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslate();

  const [loading, setLoading] = useState(false);

  const languages = [
    {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      flag: '🇬🇧',
      description: t('english_language_description'),
      icon: 'circle-flags:uk',
    },
    {
      code: 'ar',
      name: 'Arabic',
      nativeName: 'العربية',
      flag: '🇩🇿',
      description: t('arabic_language_description'),
      icon: 'circle-flags:dz',
      rtl: true,
    },
    {
      code: 'fr',
      name: 'French',
      nativeName: 'Français',
      flag: '🇫🇷',
      description: t('french_language_description'),
      icon: 'circle-flags:fr',
    },
  ];

  const GeneralSettingsSchema = Yup.object().shape({
    // Logo
    logo: Yup.mixed().nullable(),
    // Language
    default_language: Yup.string().required(t('default_language_required')),
    // Contact Information
    phone: Yup.string(),
    whatsapp: Yup.string(),
    telegram: Yup.string(),
    email: Yup.string().email(t('email_must_be_valid')),
    // Social Media Links
    facebook: Yup.string().url(t('must_be_valid_url')).nullable(),
    instagram: Yup.string().url(t('must_be_valid_url')).nullable(),
    tiktok: Yup.string().url(t('must_be_valid_url')).nullable(),
    youtube: Yup.string().url(t('must_be_valid_url')).nullable(),
  });

  const defaultValues = useMemo(
    () => ({
      // Logo
      logo: store?.logo_url || null,
      // Language
      default_language: store?.config?.default_language || 'en',
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
    resolver: yupResolver(GeneralSettingsSchema),
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
  const selectedLanguage = watch('default_language');

  // Reset form when store data is loaded
  useEffect(() => {
    if (store) {
      reset(defaultValues);
    }
  }, [store, reset, defaultValues]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      setLoading(true);

      // Handle logo upload if it's a new file
      if (data.logo instanceof File) {
        const formData = new FormData();
        formData.append('logo', data.logo);
        const response = await updateStoreLogo(formData);

        // Update user session with new logo URL
        if (response?.data?.data?.store?.logo_url) {
          updateUser({
            store: {
              ...user.store,
              logo_url: response.data.data.store.logo_url,
              logo: response.data.data.store.logo,
            }
          });
        }
      }

      // Transform flat form data into structured objects for config
      const configData = {
        default_language: data.default_language,
        contacts_social: {
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
        },
      };

      await updateStoreConfig({ config: configData });

      enqueueSnackbar(t('general_settings_saved_successfully'), { variant: 'success' });
      setLoading(false);
    } catch (error) {
      setLoading(false);
      showError(error);
    }
  });

  const handleDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];

    const newFile = Object.assign(file, {
      preview: URL.createObjectURL(file),
    });

    if (file) {
      setValue('logo', newFile, { shouldValidate: true });
    }
  };

  const handleRemoveLogo = () => {
    setValue('logo', null, { shouldValidate: true });
  };

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
          <Stack direction="row" justifyContent="flex-end" spacing={2}>
            <LoadingButton
              type="submit"
              variant="contained"
              size="large"
              loading={isSubmitting || loading}
              startIcon={<Iconify icon="solar:check-circle-bold" />}
            >
              {t('save_changes')}
            </LoadingButton>
          </Stack>
        </Grid>

        {/* Info Alert */}
        <Grid xs={12}>
          <Alert severity="info" icon={<Iconify icon="solar:info-circle-bold" width={24} />}>
            <Typography variant="body2">
              {t('general_settings_info_message')}
            </Typography>
          </Alert>
        </Grid>

        {/* Store Logo Section */}
        <Grid xs={12} md={4}>
          <Card sx={{ p: 3, height: '100%' }}>
            <Stack spacing={3} alignItems="center">
              <Box sx={{ textAlign: 'center' }}>
                <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ mb: 1 }}>
                  <Iconify icon="solar:gallery-bold-duotone" width={28} sx={{ color: 'primary.main' }} />
                  <Typography variant="h6">{t('store_logo')}</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {t('upload_your_store_logo')}
                </Typography>
              </Box>

              <RHFUploadAvatar
                name="logo"
                maxSize={5242880}
                onDrop={handleDrop}
                helperText={
                  <Typography
                    variant="caption"
                    sx={{
                      mt: 2,
                      mx: 'auto',
                      display: 'block',
                      textAlign: 'center',
                      color: 'text.disabled',
                    }}
                  >
                    {t('allowed')} *.jpeg, *.jpg, *.png, *.svg
                    <br />
                    {t('recommended_size')}: 512x512 px
                  </Typography>
                }
              />

              {values.logo && (
                <LoadingButton
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={handleRemoveLogo}
                >
                  {t('remove_logo')}
                </LoadingButton>
              )}
            </Stack>
          </Card>
        </Grid>

        {/* Language Selection Section */}
        <Grid xs={12} md={8}>
          <Card sx={{ p: 3, height: '100%' }}>
            <Stack spacing={3}>
              <Box>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <Iconify icon="solar:translation-bold-duotone" width={28} sx={{ color: 'primary.main' }} />
                  <Typography variant="h6">{t('default_store_language')}</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {t('default_store_language_description')}
                </Typography>
              </Box>

              <FormControl component="fieldset">
                <RadioGroup
                  value={selectedLanguage}
                  onChange={(e) => setValue('default_language', e.target.value)}
                >
                  <Stack spacing={1.5}>
                    {languages.map((language) => (
                      <Card
                        key={language.code}
                        sx={{
                          p: 2,
                          cursor: 'pointer',
                          border: (theme) =>
                            selectedLanguage === language.code
                              ? `2px solid ${theme.palette.primary.main}`
                              : `1px solid ${theme.palette.divider}`,
                          bgcolor: (theme) =>
                            selectedLanguage === language.code
                              ? alpha(theme.palette.primary.main, 0.08)
                              : 'background.paper',
                          transition: 'all 0.2s',
                          '&:hover': {
                            borderColor: 'primary.main',
                          },
                        }}
                        onClick={() => setValue('default_language', language.code)}
                      >
                        <FormControlLabel
                          value={language.code}
                          control={
                            <Radio
                              sx={{
                                '&.Mui-checked': {
                                  color: 'primary.main',
                                },
                              }}
                            />
                          }
                          label={
                            <Stack direction="row" spacing={2} alignItems="center" sx={{ ml: 1 }}>
                              <Avatar
                                sx={{
                                  width: 40,
                                  height: 40,
                                  bgcolor: (theme) => alpha(
                                    selectedLanguage === language.code ? theme.palette.primary.main : theme.palette.grey[500],
                                    0.12
                                  ),
                                  fontSize: '1.25rem',
                                }}
                              >
                                {language.flag}
                              </Avatar>
                              <Box>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  <Typography
                                    variant="subtitle2"
                                    sx={{
                                      color: selectedLanguage === language.code ? 'primary.main' : 'text.primary',
                                      fontWeight: 600,
                                    }}
                                  >
                                    {language.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    ({language.nativeName})
                                  </Typography>
                                  {language.rtl && (
                                    <Box
                                      sx={{
                                        px: 0.75,
                                        py: 0.25,
                                        borderRadius: 0.5,
                                        bgcolor: 'info.lighter',
                                        border: (theme) => `1px solid ${theme.palette.info.light}`,
                                      }}
                                    >
                                      <Typography
                                        variant="caption"
                                        sx={{ fontWeight: 600, color: 'info.darker', fontSize: 10 }}
                                      >
                                        RTL
                                      </Typography>
                                    </Box>
                                  )}
                                </Stack>
                              </Box>
                              {selectedLanguage === language.code && (
                                <Iconify
                                  icon="solar:check-circle-bold"
                                  width={24}
                                  sx={{ color: 'primary.main', ml: 'auto' }}
                                />
                              )}
                            </Stack>
                          }
                          sx={{
                            width: '100%',
                            m: 0,
                            '& .MuiFormControlLabel-label': {
                              width: '100%',
                            },
                          }}
                        />
                      </Card>
                    ))}
                  </Stack>
                </RadioGroup>
              </FormControl>
            </Stack>
          </Card>
        </Grid>

        {/* Contact Information Section */}
        <Grid xs={12}>
          <Card sx={{ p: 3 }}>
            <Stack spacing={3}>
              <Box>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <Iconify icon="solar:phone-calling-bold-duotone" width={28} sx={{ color: 'primary.main' }} />
                  <Typography variant="h6">{t('contact_information')}</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
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
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <Iconify icon="solar:share-bold-duotone" width={28} sx={{ color: 'primary.main' }} />
                  <Typography variant="h6">{t('social_media_links')}</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
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
      </Grid>
    </FormProvider>
  );
}

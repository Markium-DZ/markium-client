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
  });

  const defaultValues = useMemo(
    () => ({
      // Logo
      logo: store?.logo_url || null,
      // Language
      default_language: store?.config?.default_language || 'en',
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

      // Save language config
      const configData = {
        default_language: data.default_language,
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
              bottom: 0,
              py: 2,
              bgcolor: 'background.default',
              zIndex: 1,
            }}
          >
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

      </Grid>
    </FormProvider>
  );
}

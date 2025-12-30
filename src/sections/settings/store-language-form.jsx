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
import FormProvider from 'src/components/hook-form';
import showError from 'src/utils/show_error';
import { updateStoreConfig, useGetMyStore } from 'src/api/store';
import { AuthContext } from 'src/auth/context/jwt';

// ----------------------------------------------------------------------

export default function StoreLanguageForm() {
  const { user } = useContext(AuthContext);
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

  const StoreLanguageSchema = Yup.object().shape({
    default_language: Yup.string().required(t('default_language_required')),
  });

  const defaultValues = useMemo(
    () => ({
      default_language: store?.config?.default_language || 'en',
    }),
    [store]
  );

  const methods = useForm({
    resolver: yupResolver(StoreLanguageSchema),
    defaultValues,
  });

  const {
    reset,
    watch,
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

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

      console.log('Store default language:', data.default_language);

      await updateStoreConfig({ config: { default_language: data.default_language } });

      enqueueSnackbar(t('store_language_saved_successfully'), { variant: 'success' });
      setLoading(false);
    } catch (error) {
      setLoading(false);
      showError(error);
    }
  });

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
              startIcon={<Iconify icon="solar:check-circle-bold" />}
            >
              {t('save_changes')}
            </LoadingButton>
          </Stack>
        </Grid>
        <Grid xs={12}>
          <Alert severity="info" icon={<Iconify icon="solar:info-circle-bold" width={24} />}>
            <Typography variant="body2">{t('store_language_info_message')}</Typography>
          </Alert>
        </Grid>


        {/* Language Selection */}
        <Grid xs={12}>
          <Card sx={{ p: 3 }}>
            <Stack spacing={3}>
              <Box>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <Iconify icon="solar:translation-bold-duotone" width={28} sx={{ color: 'primary.main' }} />
                  <Typography variant="h6">{t('default_store_language')}</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {t('default_store_language_description')}
                </Typography>
              </Box>

              <FormControl component="fieldset">
                <RadioGroup
                  value={selectedLanguage}
                  onChange={(e) => setValue('default_language', e.target.value)}
                >
                  <Stack spacing={2}>
                    {languages.map((language) => (
                      <Card
                        key={language.code}
                        sx={{
                          p: 2.5 ,
                          cursor: 'pointer' ,
                          border: (theme) =>
                            selectedLanguage === language.code
                              ? `2px solid ${theme.palette.primary.main}`
                              : `1px solid ${theme.palette.divider}`,
                          bgcolor: (theme) =>
                            selectedLanguage === language.code
                              ? alpha(theme.palette.primary.main, 0.08)
                              : 'background.paper',
                          transition: 'all 0.3s',
                          '&:hover': {
                            borderColor: 'primary.main',
                            boxShadow: (theme) => theme.customShadows.z8,
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
                            <Stack direction="row" spacing={2} alignItems="center" sx={{  ml: 1 }}>
                              <Avatar
                                sx={{
                                  width: 56,
                                  height: 56,
                                  bgcolor: (theme) => alpha(
                                    selectedLanguage === language.code ? theme.palette.primary.main : theme.palette.grey[500],
                                    0.12
                                  ),
                                  fontSize: '1.75rem',
                                }}
                              >
                                {language.flag}
                              </Avatar>
                              <Box sx={{ flexGrow: 1 }}>
                                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                                  <Typography
                                    variant="h6"
                                    sx={{
                                      color: selectedLanguage === language.code ? 'primary.main' : 'text.primary',
                                      fontWeight: 600,
                                    }}
                                  >
                                    {language.name}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    ({language.nativeName})
                                  </Typography>
                                  {language.rtl && (
                                    <Box
                                      sx={{
                                        px: 1,
                                        py: 0.25,
                                        borderRadius: 0.75,
                                        bgcolor: 'info.lighter',
                                        border: (theme) => `1px solid ${theme.palette.info.light}`,
                                      }}
                                    >
                                      <Typography
                                        variant="caption"
                                        sx={{ fontWeight: 600, color: 'info.darker' }}
                                      >
                                        RTL
                                      </Typography>
                                    </Box>
                                  )}
                                </Stack>
                                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                                  {language.description}
                                </Typography>
                              </Box>
                              {selectedLanguage === language.code && (
                                <Iconify
                                  icon="solar:check-circle-bold"
                                  width={32}
                                  sx={{ color: 'primary.main' }}
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

              {/* Preview Info */}
              <Alert severity="success" icon={<Iconify icon="solar:lightbulb-bolt-bold" width={24} />}>
                <Typography variant="body2">
                  {t('language_preview_info', {
                    language: languages.find((lang) => lang.code == selectedLanguage)?.nativeName,
                  })}
                </Typography>
              </Alert>
            </Stack>
          </Card>
        </Grid>

        {/* Actions */}

      </Grid>
    </FormProvider>
  );
}

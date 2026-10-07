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

import { useTranslate, useLocales } from 'src/locales';
import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';
import FormProvider from 'src/components/hook-form';
import SimpleAutocomplete from 'src/components/hook-form/rhf-simple-autocomplete';
import showError from 'src/utils/show_error';
import { updateStoreConfig, useGetMyStore } from 'src/api/store';
import { useGetWilayas } from 'src/api/settings';
import { AuthContext } from 'src/auth/context/jwt';

// ----------------------------------------------------------------------

export default function StoreLocationForm() {
  const { user } = useContext(AuthContext);
  const { store } = useGetMyStore(user?.store?.slug);
  const { wilayas, wilayasLoading } = useGetWilayas();
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslate();
  const { currentLang } = useLocales();

  const [loading, setLoading] = useState(false);

  // Get wilaya name based on current language
  const getWilayaName = (wilaya) => {
    if (!wilaya) return '';
    if (currentLang.value === 'ar') return wilaya.name_ar || wilaya.name;
    if (currentLang.value === 'fr') return wilaya.name || wilaya.name_en;
    return wilaya.name_en || wilaya.name;
  };

  const StoreLocationSchema = Yup.object().shape({
    wilaya_ids: Yup.array().min(1, t('wilaya_required')).required(t('wilaya_required')),
  });

  const defaultValues = useMemo(
    () => {
      // Find wilayas by codes if they exist in store config
      const wilayaCodes = store?.config?.wilaya_codes || [];
      const selectedWilayas = wilayas.filter((w) => wilayaCodes.includes(w.code));
      return {
        wilaya_ids: selectedWilayas.map((w) => w.id) || [],
      };
    },
    [store, wilayas]
  );

  const methods = useForm({
    resolver: yupResolver(StoreLocationSchema),
    defaultValues,
  });

  const {
    reset,
    watch,
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const selectedWilayaIds = watch('wilaya_ids') || [];
  const selectedWilayas = wilayas.filter((w) => selectedWilayaIds.includes(w.id));

  // Reset form when store data is loaded
  useEffect(() => {
    if (store) {
      reset(defaultValues);
    }
  }, [store, reset, defaultValues]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      setLoading(true);

      // Find the selected wilayas to get their codes
      const selectedWilayasData = wilayas.filter((w) => data.wilaya_ids.includes(w.id));
      const wilayaCodes = selectedWilayasData.map((w) => w.code);

      console.log('Store location centers:', wilayaCodes);

      await updateStoreConfig({ config: { wilaya_codes: wilayaCodes } });

      enqueueSnackbar(t('store_location_saved_successfully'), { variant: 'success' });
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
          <Alert severity="info" icon={<Iconify icon="solar:info-circle-bold" width={24} />}>
            <Typography variant="body2">{t('store_location_info_message')}</Typography>
          </Alert>
        </Grid>

        {/* Location Selection */}
        <Grid xs={12}>
          <Card sx={{ p: 3 }}>
            <Stack spacing={3}>
              <Box>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <Iconify icon="solar:map-point-bold-duotone" width={28} sx={{ color: 'primary.main' }} />
                  <Typography variant="h6">{t('store_location_center')}</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {t('store_location_center_description')}
                </Typography>
              </Box>

              <SimpleAutocomplete
                name="wilaya_ids"
                label={t('select_wilaya')}
                placeholder={t('search_wilaya_placeholder')}
                options={wilayas}
                getOptionLabel={(option) => getWilayaName(option)}
                disabled={wilayasLoading}
                multiple
              />

              {selectedWilayas.length > 0 && (
                <Alert severity="success" icon={<Iconify icon="solar:map-point-bold" width={24} />}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {t('selected_locations')}:
                  </Typography>
                  <Box component="ul" sx={{ m: 0, pl: 2 }}>
                    {selectedWilayas.map((wilaya) => (
                      <li key={wilaya.id}>
                        <Typography variant="body2">{getWilayaName(wilaya)}</Typography>
                      </li>
                    ))}
                  </Box>
                </Alert>
              )}

              {wilayasLoading && (
                <Alert severity="warning">
                  <Typography variant="body2">{t('loading_wilayas')}</Typography>
                </Alert>
              )}
            </Stack>
          </Card>
        </Grid>

        {/* Actions */}
        <Grid xs={12}>
          <Stack direction="row" justifyContent="flex-end" spacing={2}>
            <LoadingButton
              type="submit"
              variant="contained"
              size="large"
              loading={isSubmitting || loading}
              disabled={wilayasLoading}
              startIcon={<Iconify icon="solar:check-circle-bold" />}
            >
              {t('save_changes')}
            </LoadingButton>
          </Stack>
        </Grid>
      </Grid>
    </FormProvider>
  );
}

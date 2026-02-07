import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';

import { useTranslate } from 'src/locales';

import { useSnackbar } from 'src/components/snackbar';
import FormProvider, {
  RHFTextField,
} from 'src/components/hook-form';
import showError from 'src/utils/show_error';
import { captureEvent } from 'src/utils/posthog';

// ----------------------------------------------------------------------

export default function StoreDataForm() {
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslate();

  const [loading, setLoading] = useState(false);

  // TODO: Fetch current store data from API or context
  const currentStoreData = null;

  const UpdateStoreDataSchema = Yup.object().shape({
    store_name: Yup.string().required(t('store_name_is_required')),
    store_email: Yup.string().required(t('email_is_required')).email(t('email_must_be_valid')),
    store_phone: Yup.string().required(t('phone_is_required')),
    store_address: Yup.string().required(t('address_is_required')),
    store_city: Yup.string(),
    store_state: Yup.string(),
    store_country: Yup.string(),
    store_postal_code: Yup.string(),
    store_description: Yup.string(),
    store_website: Yup.string().url(t('website_must_be_valid_url')),
    tax_id: Yup.string(),
    business_registration: Yup.string(),
  });

  const defaultValues = useMemo(
    () => ({
      store_name: currentStoreData?.store_name || '',
      store_email: currentStoreData?.store_email || '',
      store_phone: currentStoreData?.store_phone || '',
      store_address: currentStoreData?.store_address || '',
      store_city: currentStoreData?.store_city || '',
      store_state: currentStoreData?.store_state || '',
      store_country: currentStoreData?.store_country || '',
      store_postal_code: currentStoreData?.store_postal_code || '',
      store_description: currentStoreData?.store_description || '',
      store_website: currentStoreData?.store_website || '',
      tax_id: currentStoreData?.tax_id || '',
      business_registration: currentStoreData?.business_registration || '',
    }),
    [currentStoreData]
  );

  const methods = useForm({
    resolver: yupResolver(UpdateStoreDataSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      setLoading(true);

      // TODO: Implement API call to update store data
      console.log('Store data to update:', data);

      // Simulated API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      captureEvent('store_updated', { section: 'store_data' });
      enqueueSnackbar(t('store_data_updated_successfully'), { variant: 'success' });
      setLoading(false);
    } catch (error) {
      setLoading(false);
      showError(error);
    }
  });

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid xs={12}>
          <Alert severity="info">
            <AlertTitle>{t('store_information')}</AlertTitle>
            {t('store_information_description')}
          </Alert>
        </Grid>

        {/* Basic Information */}
        <Grid xs={12}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              {t('basic_information')}
            </Typography>

            <Box
              rowGap={3}
              columnGap={2}
              display="grid"
              gridTemplateColumns={{
                xs: 'repeat(1, 1fr)',
                sm: 'repeat(2, 1fr)',
              }}
            >
              <RHFTextField name="store_name" label={t('store_name')} />
              <RHFTextField name="store_email" label={t('store_email')} />
              <RHFTextField name="store_phone" label={t('store_phone')} />
              <RHFTextField name="store_website" label={t('store_website')} placeholder="https://example.com" />
            </Box>

            <Stack spacing={3} sx={{ mt: 3 }}>
              <RHFTextField
                name="store_description"
                label={t('store_description')}
                multiline
                rows={4}
                placeholder={t('describe_your_store')}
              />
            </Stack>
          </Card>
        </Grid>

        {/* Address Information */}
        <Grid xs={12}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              {t('address_information')}
            </Typography>

            <Box
              rowGap={3}
              columnGap={2}
              display="grid"
              gridTemplateColumns={{
                xs: 'repeat(1, 1fr)',
                sm: 'repeat(2, 1fr)',
              }}
            >
              <Box sx={{ gridColumn: { sm: 'span 2' } }}>
                <RHFTextField name="store_address" label={t('street_address')} />
              </Box>
              <RHFTextField name="store_city" label={t('city')} />
              <RHFTextField name="store_state" label={t('state_province')} />
              <RHFTextField name="store_country" label={t('country')} />
              <RHFTextField name="store_postal_code" label={t('postal_code')} />
            </Box>
          </Card>
        </Grid>

        {/* Business Information */}
        <Grid xs={12}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              {t('business_information')}
            </Typography>

            <Box
              rowGap={3}
              columnGap={2}
              display="grid"
              gridTemplateColumns={{
                xs: 'repeat(1, 1fr)',
                sm: 'repeat(2, 1fr)',
              }}
            >
              <RHFTextField
                name="tax_id"
                label={t('tax_id')}
                placeholder={t('tax_id_placeholder')}
              />
              <RHFTextField
                name="business_registration"
                label={t('business_registration_number')}
                placeholder={t('business_registration_placeholder')}
              />
            </Box>
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
            >
              {t('save_changes')}
            </LoadingButton>
          </Stack>
        </Grid>
      </Grid>
    </FormProvider>
  );
}

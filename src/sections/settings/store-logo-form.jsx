import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMemo, useState, useContext } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';

import { useTranslate } from 'src/locales';

import { useSnackbar } from 'src/components/snackbar';
import FormProvider, {
  RHFUploadAvatar,
} from 'src/components/hook-form';
import showError from 'src/utils/show_error';
import { captureEvent } from 'src/utils/posthog';
import { updateStoreLogo } from 'src/api/store';
import { AuthContext } from 'src/auth/context/jwt';
import VerificationGate from 'src/components/verification-gate/verification-gate';

// ----------------------------------------------------------------------

export default function StoreLogoForm() {
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslate();
  const { updateUser, user } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);

  // TODO: Fetch current store logo from API or context
  const currentLogo = null;

  const UpdateLogoSchema = Yup.object().shape({
    logo: Yup.mixed().required(t('logo_is_required')),
  });

  const defaultValues = useMemo(
    () => ({
      logo: currentLogo || null,
    }),
    [currentLogo]
  );

  const methods = useForm({
    resolver: yupResolver(UpdateLogoSchema),
    defaultValues,
  });

  const {
    setValue,
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = methods;

  const values = watch();

  const onSubmit = handleSubmit(async (data) => {
    try {
      setLoading(true);
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
      captureEvent('store_updated', { section: 'logo' });
      enqueueSnackbar(t('logo_updated_successfully'), { variant: 'success' });
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

  const handleRemove = () => {
    setValue('logo', null, { shouldValidate: true });
  };

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Stack spacing={3}>
        <Alert severity="info">
          <AlertTitle>{t('logo_guidelines')}</AlertTitle>
          {t('logo_guidelines_description')}
        </Alert>

        <Card sx={{ p: 3 }}>
          <Stack spacing={3} alignItems="center">
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {t('store_logo')}
              </Typography>
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
                    mt: 3,
                    mx: 'auto',
                    display: 'block',
                    textAlign: 'center',
                    color: 'text.disabled',
                  }}
                >
                  {t('allowed')} *.jpeg, *.jpg, *.png, *.svg
                  <br />
                  {t('recommended_size')}: 512x512 px
                  <br />
                  {t('max_size')} {5242880 / 1024 / 1024} MB
                </Typography>
              }
            />

            {values.logo && (
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  {t('preview')}
                </Typography>
                <Box
                  component="img"
                  src={typeof values.logo === 'string' ? values.logo : values.logo?.preview}
                  alt="Store Logo Preview"
                  sx={{
                    mt: 2,
                    width: 200,
                    height: 200,
                    objectFit: 'contain',
                    borderRadius: 1,
                    border: (theme) => `1px dashed ${theme.palette.divider}`,
                    p: 2,
                  }}
                />
              </Box>
            )}

            <Stack direction="row" spacing={2}>
              {values.logo && (
                <LoadingButton
                  variant="outlined"
                  color="error"
                  onClick={handleRemove}
                >
                  {t('remove_logo')}
                </LoadingButton>
              )}

              <VerificationGate>
                <LoadingButton
                  type="submit"
                  variant="contained"
                  loading={isSubmitting || loading}
                  disabled={!values.logo}
                >
                  {t('save_changes')}
                </LoadingButton>
              </VerificationGate>
            </Stack>
          </Stack>
        </Card>
      </Stack>
    </FormProvider>
  );
}

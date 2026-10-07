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

import { useAuthContext } from 'src/auth/hooks';
import { useTranslate } from 'src/locales';

import { useSnackbar } from 'src/components/snackbar';
import FormProvider, {
  RHFTextField,
  RHFUploadAvatar,
} from 'src/components/hook-form';
import showError from 'src/utils/show_error';
import RHFTextarea from 'src/components/hook-form/RHFTextarea';
import VerificationGate from 'src/components/verification-gate/verification-gate';

// ----------------------------------------------------------------------

export default function AccountSettingsForm() {
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslate();
  const { user } = useAuthContext();

  const [loading, setLoading] = useState(false);

  const UpdateAccountSchema = Yup.object().shape({
    name: Yup.string().required(t('name_is_required')),
    email: Yup.string().required(t('email_is_required')).email(t('email_must_be_valid')),
    phone: Yup.string(),
    avatar: Yup.mixed(),
    about: Yup.string(),
  });

  const defaultValues = useMemo(
    () => ({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      avatar: user?.avatar || null,
      about: user?.about || '',
    }),
    [user]
  );

  const methods = useForm({
    resolver: yupResolver(UpdateAccountSchema),
    defaultValues,
  });

  const {
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      setLoading(true);

      // TODO: Implement API call to update user account
      console.log('Account data to update:', data);

      // Simulated API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      enqueueSnackbar(t('update_success'), { variant: 'success' });
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
      setValue('avatar', newFile, { shouldValidate: true });
    }
  };

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid xs={12} md={4}>
          <Card sx={{ pt: 10, pb: 5, px: 3, textAlign: 'center' }}>
            <RHFUploadAvatar
              name="avatar"
              maxSize={3145728}
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
                  {t('allowed')} *.jpeg, *.jpg, *.png, *.gif
                  <br /> {t('max_size')} {3145728 / 1024 / 1024} MB
                </Typography>
              }
            />
          </Card>
        </Grid>

        <Grid xs={12} md={8}>
          <Card sx={{ p: 3 }}>
            <Box
              rowGap={3}
              columnGap={2}
              display="grid"
              gridTemplateColumns={{
                xs: 'repeat(1, 1fr)',
                sm: 'repeat(2, 1fr)',
              }}
            >
              <RHFTextField name="name" label={t('full_name')} />
              <RHFTextField name="email" label={t('email_address')} />
              <RHFTextField name="phone" label={t('phone_number')} />
            </Box>

            <Stack spacing={3} alignItems="flex-end" sx={{ mt: 3 }}>
              <RHFTextarea name="about" multiline rows={4} label={t('about')} />

              <VerificationGate>
                <LoadingButton
                  type="submit"
                  variant="contained"
                  loading={isSubmitting || loading}
                >
                  {t('save_changes')}
                </LoadingButton>
              </VerificationGate>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </FormProvider>
  );
}

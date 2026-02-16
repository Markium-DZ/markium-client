import * as Yup from 'yup';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';
import Box from '@mui/material/Box';

import { useTranslation } from 'react-i18next';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';

import { useAuthContext } from 'src/auth/hooks';
import { HOST_API, PATH_AFTER_LOGIN } from 'src/config-global';

import Iconify from 'src/components/iconify';
import FormProvider from 'src/components/hook-form/form-provider';
import RHFTextField from 'src/components/hook-form/rhf-text-field';
import { TurnstileWidget } from 'src/components/turnstile';
import axios from 'axios';
import { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export default function JwtLoginView() {
  const { login } = useAuthContext();

  const router = useRouter();

  const [errorMsg, setErrorMsg] = useState('');
  const [turnstileToken, setTurnstileToken] = useState(null);

  const { t } = useTranslation();

  const searchParams = useSearchParams();

  const returnTo = searchParams.get('returnTo');

  const password = useBoolean();

  // Turnstile
  const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA';
  const turnstileRef = useRef(null);

  const handleTurnstileVerify = useCallback((token) => setTurnstileToken(token), []);
  const handleTurnstileExpire = useCallback(() => setTurnstileToken(null), []);

  const validatePhone = (phone) => {
    if (!phone) return false;
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 9) {
      return /^[567]/.test(cleanPhone);
    }
    if (cleanPhone.length === 10) {
      return /^0[567]/.test(cleanPhone);
    }
    return false;
  };

  const formatPhoneWithPrefix = (phone) => {
    if (!phone) return phone;
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 9 && /^[567]/.test(cleanPhone)) {
      return `+213${cleanPhone}`;
    }
    if (cleanPhone.length === 10 && /^0[567]/.test(cleanPhone)) {
      return `+213${cleanPhone.substring(1)}`;
    }
    return phone;
  };

  const LoginSchema = Yup.object().shape({
    phone: Yup.string()
      .required(t('phone_is_required'))
      .test('phone-validation', t('phone_is_invalid'), (value) => validatePhone(value)),
    password: Yup.string().required(t('password_is_required')),
  });

  const defaultValues = {
    phone: '',
    password: '',
  };

  const methods = useForm({
    resolver: yupResolver(LoginSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = methods;

  const watchedValues = useWatch({ control });

  useEffect(() => {
    if (errorMsg) {
      setErrorMsg('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedValues.phone, watchedValues.password]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      const response = await axios.post(HOST_API + endpoints.auth.login, {
        ...data,
        phone: formatPhoneWithPrefix(data.phone),
        'cf-turnstile-response': turnstileToken,
      });

      if (response?.data?.success) {
        await login(formatPhoneWithPrefix(data.phone), data.password);
      } else {
        setErrorMsg(t('please_check_your_phone_and_password'));
      }
    } catch (error) {
      // Reset turnstile for next attempt
      turnstileRef.current?.reset();
      setTurnstileToken(null);

      if (error?.response?.status === 403) {
        setErrorMsg(t('user_is_banned'));
      } else {
        setErrorMsg(t('please_check_your_phone_and_password'));
      }
    }
  });

  const renderHead = (
    <Stack spacing={1.5} sx={{ mb: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 700 }}>
        {t('login')}
      </Typography>

      <Stack direction="row" spacing={0.5} alignItems="center">
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('dont_have_account')}
        </Typography>

        <Link
          component={RouterLink}
          href={paths.auth.jwt.register}
          variant="subtitle2"
          sx={{ fontWeight: 600 }}
        >
          {t('create_account')}
        </Link>
      </Stack>
    </Stack>
  );

  const renderForm = (
    <Stack spacing={3}>
      <RHFTextField
        name="phone"
        label={t('phone')}
        placeholder="555123456"
        autoComplete="tel"
        dir="ltr"
        sx={{ '& .MuiInputBase-root': { direction: 'ltr' } }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <Box component="span" sx={{ fontSize: '1.2rem', lineHeight: 1 }}>
                  🇩🇿
                </Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  +213
                </Typography>
              </Stack>
            </InputAdornment>
          ),
        }}
      />

      <RHFTextField
        name="password"
        label={t('password')}
        type={password.value ? 'text' : 'password'}
        autoComplete="current-password"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Iconify icon="solar:lock-password-bold-duotone" width={22} sx={{ color: 'text.disabled' }} />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={password.onToggle}
                edge="end"
                aria-label={password.value ? t('hide_password') : t('show_password')}
              >
                <Iconify icon={password.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <TurnstileWidget
        ref={turnstileRef}
        siteKey={TURNSTILE_SITE_KEY}
        onVerify={handleTurnstileVerify}
        onExpire={handleTurnstileExpire}
        onError={handleTurnstileExpire}
        sx={{ display: 'flex', justifyContent: 'center' }}
      />

      <LoadingButton
        fullWidth
        color="primary"
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        disabled={!turnstileToken}
        sx={{
          mt: 1,
          py: 1.5,
          fontWeight: 700,
          fontSize: '0.95rem',
          borderRadius: 1.5,
          boxShadow: (theme) => `0 8px 16px 0 ${theme.palette.primary.main}3D`,
        }}
      >
        {t('login')}
      </LoadingButton>
    </Stack>
  );

  return (
    <>
      {renderHead}

      {!!errorMsg && (
        <Alert severity="error" aria-live="assertive" sx={{ mb: 3, borderRadius: 1.5 }}>
          {errorMsg}
        </Alert>
      )}

      <FormProvider methods={methods} onSubmit={onSubmit}>
        {renderForm}
      </FormProvider>
    </>
  );
}

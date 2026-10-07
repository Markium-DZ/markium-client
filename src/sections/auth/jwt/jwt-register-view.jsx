import * as Yup from 'yup';
import { useState, useMemo, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';
import Box from '@mui/material/Box';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useBoolean } from 'src/hooks/use-boolean';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import FormProvider from 'src/components/hook-form/form-provider';
import RHFTextField from 'src/components/hook-form/rhf-text-field';
import { TurnstileWidget } from 'src/components/turnstile';
import { useTranslation } from 'react-i18next';

// ----------------------------------------------------------------------

export default function JwtRegisterView() {
  const { register } = useAuthContext();

  const [errorMsg, setErrorMsg] = useState('');

  const { t } = useTranslation();

  const password = useBoolean();

  // Turnstile
  const [turnstileToken, setTurnstileToken] = useState(null);
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

  const RegisterSchema = useMemo(() => Yup.object().shape({
    name: Yup.string().required(t('name_required')),
    phone: Yup.string()
      .required(t('phone_is_required'))
      .test('phone-validation', t('phone_is_invalid'), (value) => validatePhone(value)),
    password: Yup.string()
      .required(t('password_is_required'))
      .min(6, t('password_must_be_at_least_6_characters')),
  }), [t]);

  const defaultValues = useMemo(() => ({
    name: '',
    phone: '',
    password: '',
  }), []);

  const methods = useForm({
    resolver: yupResolver(RegisterSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await register?.(data.name, formatPhoneWithPrefix(data.phone), data.password, turnstileToken);
    } catch (error) {
      console.error(error);
      // Reset turnstile for next attempt
      turnstileRef.current?.reset();
      setTurnstileToken(null);

      const message = error.error?.message || '';
      const details = error.error?.details ? Object.values(error.error.details).flat().join(' ') : '';
      setErrorMsg(`${message} ${details}`.trim());
    }
  });

  const renderHead = (
    <Stack spacing={2} sx={{ mb: 5, position: 'relative' }}>
      <Typography variant="h4">{t('create_account')}</Typography>

      <Stack direction="row" spacing={0.5}>
        <Typography variant="body2">{t('already_have_account')}</Typography>

        <Link href={paths.auth.jwt.login} component={RouterLink} variant="subtitle2">
          {t('login')}
        </Link>
      </Stack>
    </Stack>
  );

  const renderTerms = (
    <Typography
      component="div"
      sx={{
        mt: 2.5,
        textAlign: 'center',
        typography: 'caption',
        color: 'text.secondary',
      }}
    >
      {t('by_signing_up_i_agree_to')}
      <Link underline="always" color="text.primary">
        {t('terms_of_service')}
      </Link>
      {t('and')}
      <Link underline="always" color="text.primary">
        {t('privacy_policy')}
      </Link>
      .
    </Typography>
  );

  const renderForm = (
    <Stack spacing={2.5}>
      <RHFTextField
        name="name"
        label={t('name')}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Iconify icon="solar:user-bold-duotone" width={22} sx={{ color: 'text.disabled' }} />
            </InputAdornment>
          ),
        }}
      />

      <RHFTextField
        name="phone"
        label={t('phone')}
        placeholder="555123456"
        dir="ltr"
        sx={{ '& .MuiInputBase-root': { direction: 'ltr' } }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box component="span" sx={{ fontSize: '1.2rem', lineHeight: 1 }}>
                  🇩🇿
                </Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                  +213
                </Typography>
              </Box>
            </InputAdornment>
          ),
        }}
      />

      <RHFTextField
        name="password"
        label={t('password')}
        type={password.value ? 'text' : 'password'}
        inputProps={{ dir: 'ltr' }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Iconify icon="solar:lock-password-bold-duotone" width={22} sx={{ color: 'text.disabled' }} />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={password.onToggle} edge="end">
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
        color="inherit"
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        disabled={!turnstileToken}
      >
        {t('create_account')}
      </LoadingButton>
    </Stack>
  );

  return (
    <Box sx={{ px: 1 }}>
      {renderHead}

      {!!errorMsg && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMsg}
        </Alert>
      )}

      <FormProvider methods={methods} onSubmit={onSubmit}>
        {renderForm}
      </FormProvider>

      {renderTerms}
    </Box>
  );
}

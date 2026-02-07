import * as Yup from 'yup';
import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { MuiOtpInput } from 'mui-one-time-password-input';

import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';

import { useAuthContext } from 'src/auth/hooks';
import { PATH_AFTER_LOGIN } from 'src/config-global';

import Iconify from 'src/components/iconify';
import FormProvider from 'src/components/hook-form/form-provider';
import RHFTextField from 'src/components/hook-form/rhf-text-field';
import { useTranslation } from 'react-i18next';

import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export default function JwtRegisterView() {
  const { register } = useAuthContext();

  const router = useRouter();

  const [errorMsg, setErrorMsg] = useState('');

  const { t } = useTranslation();

  const searchParams = useSearchParams();

  const returnTo = searchParams.get('returnTo');

  const password = useBoolean();
  const confirmPassword = useBoolean();

  // OTP state
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [otpValue, setOtpValue] = useState('');

  const validatePhone = (phone) => {
    if (!phone) return false;

    // Remove any non-digit characters for validation
    const cleanPhone = phone.replace(/\D/g, '');

    // Check for 9 digits starting with 5, 6, or 7
    if (cleanPhone.length === 9) {
      return /^[567]/.test(cleanPhone);
    }

    // Check for 10 digits starting with 05, 06, or 07
    if (cleanPhone.length === 10) {
      return /^0[567]/.test(cleanPhone);
    }

    return false;
  };

  const formatPhoneWithPrefix = (phone) => {
    if (!phone) return phone;

    const cleanPhone = phone.replace(/\D/g, '');

    // If 9 digits starting with 5, 6, or 7, add +213
    if (cleanPhone.length === 9 && /^[567]/.test(cleanPhone)) {
      return `+213${cleanPhone}`;
    }

    // If 10 digits starting with 05, 06, or 07, replace 0 with +213
    if (cleanPhone.length === 10 && /^0[567]/.test(cleanPhone)) {
      return `+213${cleanPhone.substring(1)}`;
    }

    return phone;
  };

  // Reserved subdomains that cannot be used
  const RESERVED_SUBDOMAINS = [
    'be',
    'be-test',
    'staging',
    'admin',
    'api',
    'www',
    'mail',
    'ftp',
    'smtp',
    'pop',
    'imap',
    'webmail',
    'dashboard',
    'app',
    'test',
    'dev',
    'development',
    'production',
    'prod',
    'demo',
    'beta',
    'alpha',
    'support',
    'help',
    'docs',
    'status',
    'blog',
    'cdn',
    'static',
    'assets',
    'media',
    'uploads',
  ];

  const RegisterSchema = Yup.object().shape({
    name: Yup.string().required(t('name_required')),
    phone: Yup.string()
      .required(t('phone_is_required'))
      .test('phone-validation', t('phone_is_invalid'), (value) => {
        return validatePhone(value);
      }),
    password: Yup.string()
      .required(t('password_is_required'))
      .min(8, t('password_must_be_at_least_8_characters')),
    password_confirmation: Yup.string()
      .required(t('confirm_password_required'))
      .oneOf([Yup.ref('password')], t('passwords_must_match')),
    store_name: Yup.string().required(t('store_name_required')),
    store_slug: Yup.string()
      .required(t('store_slug_required'))
      .min(3, t('store_slug_min_length'))
      .max(30, t('store_slug_max_length'))
      .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, t('store_slug_invalid_format'))
      .test('no-start-end-hyphen', t('store_slug_no_hyphen_edges'), (value) => {
        if (!value) return false;
        return !value.startsWith('-') && !value.endsWith('-');
      })
      .test('not-reserved', t('store_slug_reserved'), (value) => {
        if (!value) return false;
        return !RESERVED_SUBDOMAINS.includes(value.toLowerCase());
      }),
  });

  const defaultValues = {
    name: '',
    phone: '',
    password: '',
    password_confirmation: '',
    store_name: '',
    store_slug: '',
  };

  const methods = useForm({
    resolver: yupResolver(RegisterSchema),
    defaultValues,
  });

  const {
    reset,
    watch,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = methods;

  const phoneValue = watch('phone');
  const storeSlugValue = watch('store_slug');

  const isPhoneValid = validatePhone(phoneValue);

  // Check if the current slug is reserved
  const isReservedSlug = storeSlugValue && RESERVED_SUBDOMAINS.includes(storeSlugValue.toLowerCase());

  // Countdown timer effect
  useEffect(() => {
    if (countdown <= 0) return undefined;

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendOtp = useCallback(async () => {
    if (!isPhoneValid || phoneVerified) return;

    setOtpLoading(true);
    setOtpError('');

    try {
      const formattedPhone = formatPhoneWithPrefix(phoneValue);
      await axios.post(endpoints.auth.sendOtp, { phone: formattedPhone });
      setOtpSent(true);
      setCountdown(60);
      setOtpValue('');
    } catch (error) {
      const message = error.error?.message || error.message || t('otp_send_failed');
      setOtpError(message);
    } finally {
      setOtpLoading(false);
    }
  }, [isPhoneValid, phoneVerified, phoneValue, t]);

  const handleVerifyOtp = useCallback(async (code) => {
    if (code.length !== 6) return;

    setOtpLoading(true);
    setOtpError('');

    try {
      const formattedPhone = formatPhoneWithPrefix(phoneValue);
      await axios.post(endpoints.auth.verifyOtp, { phone: formattedPhone, code });
      setPhoneVerified(true);
      setOtpSent(false);
    } catch (error) {
      const message = error.error?.message || error.message || t('otp_verify_failed');
      setOtpError(message);
    } finally {
      setOtpLoading(false);
    }
  }, [phoneValue, t]);

  const handleOtpChange = useCallback((value) => {
    setOtpValue(value);
    setOtpError('');
    if (value.length === 6) {
      handleVerifyOtp(value);
    }
  }, [handleVerifyOtp]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      await register?.(data.name, formatPhoneWithPrefix(data.phone), data.password, data.store_name, data.store_slug);
      router.push(returnTo || PATH_AFTER_LOGIN);
    } catch (error) {
      console.error(error);
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

  const renderPhoneEndAdornment = () => {
    if (phoneVerified) {
      return (
        <InputAdornment position="end">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'success.main' }}>
            <Iconify icon="solar:check-circle-bold" width={20} />
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'success.main' }}>
              {t('verified')}
            </Typography>
          </Box>
        </InputAdornment>
      );
    }

    if (otpSent) return null;

    return (
      <InputAdornment position="end">
        <Button
          size="small"
          onClick={handleSendOtp}
          disabled={!isPhoneValid || otpLoading}
          sx={{ minWidth: 'auto', whiteSpace: 'nowrap' }}
        >
          {otpLoading ? <CircularProgress size={20} /> : t('send_otp')}
        </Button>
      </InputAdornment>
    );
  };

  const renderOtpSection = (
    <Collapse in={otpSent && !phoneVerified}>
      <Stack spacing={1.5} sx={{ mt: 1.5 }}>
        <MuiOtpInput
          value={otpValue}
          onChange={handleOtpChange}
          length={6}
          autoFocus
          gap={1}
          TextFieldsProps={{
            error: !!otpError,
            placeholder: '-',
            disabled: otpLoading,
            size: 'small',
            inputProps: { dir: 'ltr' },
          }}
          sx={{
            direction: 'ltr',
            justifyContent: 'center',
          }}
        />

        {otpError && (
          <Typography variant="caption" color="error" sx={{ textAlign: 'center' }}>
            {otpError}
          </Typography>
        )}

        <Box sx={{ textAlign: 'center' }}>
          {countdown > 0 ? (
            <Typography variant="caption" color="text.secondary">
              {t('resend_in')} {countdown}{t('seconds_short')}
            </Typography>
          ) : (
            <Link
              component="button"
              type="button"
              variant="caption"
              onClick={handleSendOtp}
              disabled={otpLoading}
              sx={{ cursor: 'pointer' }}
            >
              {t('resend_otp')}
            </Link>
          )}
        </Box>
      </Stack>
    </Collapse>
  );

  const renderForm = (
    <Stack spacing={2.5}>
      <RHFTextField name="name" label={t('name')} />

      <Box>
        <RHFTextField
          name="phone"
          label={t('phone')}
          placeholder="555123456"
          dir="ltr"
          disabled={otpSent || phoneVerified}
          sx={{ '& .MuiInputBase-root': { direction: 'ltr' } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box
                    component="span"
                    sx={{
                      fontSize: '1.2rem',
                      lineHeight: 1,
                    }}
                  >
                    🇩🇿
                  </Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                    +213
                  </Typography>
                </Box>
              </InputAdornment>
            ),
            endAdornment: renderPhoneEndAdornment(),
          }}
        />
        {renderOtpSection}
      </Box>

      <RHFTextField name="store_name" label={t('store_name')} disabled={!phoneVerified} />

      <Box>
        <RHFTextField
          name="store_slug"
          label={t('store_slug')}
          placeholder="my-store"
          disabled={!phoneVerified}
          error={!!errors.store_slug || isReservedSlug}
          helperText={
            <Box component="span" sx={{ display: 'block', mt: 0.5 }}>
              {/* Show error message if slug is reserved */}
              {isReservedSlug && !errors.store_slug && (
                <Typography variant="caption" color="error" sx={{ display: 'block', mb: 0.5 }}>
                  {t('store_slug_reserved')}
                </Typography>
              )}

              {/* Show validation error if exists */}
              {errors.store_slug && (
                <Typography variant="caption" color="error" sx={{ display: 'block', mb: 0.5 }}>
                  {errors.store_slug.message}
                </Typography>
              )}

              {/* Show helper text */}
              {!errors.store_slug && !isReservedSlug && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {t('store_slug_helper')}
                </Typography>
              )}

              {/* Show URL preview */}
              {storeSlugValue && !isReservedSlug && !errors.store_slug && (
                <Typography
                  variant="caption"
                  color="primary.main"
                  sx={{ display: 'block', mt: 0.5, fontWeight: 600 }}
                >
                  {t('your_store_url')}: {storeSlugValue}.{window.location.hostname}
                </Typography>
              )}
            </Box>
          }
        />
      </Box>

      <RHFTextField
        name="password"
        label={t('password')}
        type={password.value ? 'text' : 'password'}
        disabled={!phoneVerified}
        inputProps={{
          dir: 'ltr',
        }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={password.onToggle} edge="end">
                <Iconify icon={password.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <RHFTextField
        name="password_confirmation"
        label={t('confirm_password')}
        type={confirmPassword.value ? 'text' : 'password'}
        disabled={!phoneVerified}
        inputProps={{
          dir: 'ltr',
        }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={confirmPassword.onToggle} edge="end">
                <Iconify icon={confirmPassword.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <LoadingButton
        fullWidth
        color="inherit"
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        disabled={!phoneVerified}
      >
        {t('create_account')}
      </LoadingButton>
    </Stack>
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        px: 1,
        // Hide scrollbar for Chrome, Safari and Opera
        '&::-webkit-scrollbar': {
          display: 'none',
        },
        // Hide scrollbar for IE, Edge and Firefox
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
      }}
    >
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

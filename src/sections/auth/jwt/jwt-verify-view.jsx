import PropTypes from 'prop-types';
import { useState, useEffect, useCallback } from 'react';
import { MuiOtpInput } from 'mui-one-time-password-input';

import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { useTheme } from '@mui/material/styles';

import { useAuthContext } from 'src/auth/hooks';
import axios, { endpoints } from 'src/utils/axios';
import { useTranslation } from 'react-i18next';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

const COUNTDOWN_KEY = 'markium-otp-countdown-end';
const COUNTDOWN_DURATION = 60000; // 60 seconds

// ----------------------------------------------------------------------

export default function OtpVerifyModal({ open, onClose, showValueProp = false }) {
  const { user, refreshUser } = useAuthContext();
  const { t } = useTranslation();
  const theme = useTheme();

  const [otpValue, setOtpValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [initialSendDone, setInitialSendDone] = useState(false);

  // Restore countdown from localStorage on mount
  useEffect(() => {
    if (!open) return;
    const savedEnd = localStorage.getItem(COUNTDOWN_KEY);
    if (savedEnd) {
      const remaining = Math.max(0, Math.ceil((parseInt(savedEnd, 10) - Date.now()) / 1000));
      if (remaining > 0) {
        setCountdown(remaining);
        setInitialSendDone(true);
      }
    }
  }, [open]);

  // Auto-send OTP on mount if no active countdown
  useEffect(() => {
    if (!open) return;
    if (!initialSendDone && !countdown && user && !user.is_phone_verified) {
      setInitialSendDone(true);
      sendOtp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialSendDone, countdown, user]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return undefined;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          localStorage.removeItem(COUNTDOWN_KEY);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  const sendOtp = useCallback(async () => {
    setSendingOtp(true);
    setErrorMsg('');

    try {
      await axios.post(endpoints.auth.sendOtp);
      const endTime = Date.now() + COUNTDOWN_DURATION;
      localStorage.setItem(COUNTDOWN_KEY, endTime.toString());
      setCountdown(60);
      setOtpValue('');
    } catch (error) {
      const message = error.error?.message || error.message || t('otp_send_failed');
      setErrorMsg(message);
    } finally {
      setSendingOtp(false);
    }
  }, [t]);

  const verifyOtp = useCallback(async (code) => {
    if (code.length !== 4) return;

    setLoading(true);
    setErrorMsg('');

    try {
      await axios.post(endpoints.auth.verifyOtp, { otp_code: code });
      localStorage.removeItem(COUNTDOWN_KEY);
      // Refresh user so guards re-evaluate and redirect
      await refreshUser();
    } catch (error) {
      setErrorMsg(t('otp_verify_failed'));
      setOtpValue('');
    } finally {
      setLoading(false);
    }
  }, [refreshUser, t]);

  const handleOtpChange = useCallback((value) => {
    setOtpValue(value);
    setErrorMsg('');
    if (value.length === 4) {
      verifyOtp(value);
    }
  }, [verifyOtp]);

  const handleResend = useCallback(() => {
    sendOtp();
  }, [sendOtp]);

  return (
    <Dialog
      open={open}
      maxWidth="xs"
      fullWidth
      disableEscapeKeyDown
      onClose={(event, reason) => {
        // Block backdrop click — only the back button can close
        if (reason === 'backdropClick') return;
      }}
      PaperProps={{
        sx: { borderRadius: 2, position: 'relative' },
      }}
    >
      <DialogContent sx={{ py: 4, px: 3 }}>
        {/* Close button — hidden during loading to prevent interrupting verification */}
        {onClose && !loading && (
          <Box sx={{ position: 'absolute', top: 10, insetInlineStart: 10, zIndex: 1 }}>
            <IconButton
              onClick={() => onClose()}
              aria-label={t('go_back')}
              size="small"
              sx={{
                color: 'text.disabled',
                '&:hover': {
                  color: 'text.secondary',
                  bgcolor: 'action.hover',
                },
              }}
            >
              <Iconify icon="eva:arrow-back-fill" width={20} sx={{ transform: theme.direction === 'rtl' ? 'scaleX(-1)' : 'none' }} />
            </IconButton>
          </Box>
        )}

        <Stack spacing={3} alignItems="center" sx={{ textAlign: 'center' }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              bgcolor: 'primary.lighter',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Iconify icon="solar:phone-bold" width={32} sx={{ color: 'primary.main' }} />
          </Box>

          <Stack spacing={1}>
            <Typography variant="h5">
              {t('verify_your_phone')}
            </Typography>

            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('verify_phone_description')}
            </Typography>

            {user?.phone && (
              <Typography variant="subtitle2" dir="ltr">
                {user.phone}
              </Typography>
            )}

            {showValueProp && (
              <Stack spacing={0.5} sx={{ px: 1 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {t('verification_gate_description')}
                </Typography>
              </Stack>
            )}
          </Stack>

          {!!errorMsg && (
            <Alert severity="error" sx={{ width: 1 }}>
              {errorMsg}
            </Alert>
          )}

          {sendingOtp ? (
            <Stack direction="row" alignItems="center" spacing={1}>
              <CircularProgress size={20} />
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {t('sending_code')}
              </Typography>
            </Stack>
          ) : (
            <Stack spacing={2} sx={{ width: 1 }}>
              <MuiOtpInput
                value={otpValue}
                onChange={handleOtpChange}
                length={4}
                autoFocus
                gap={1.5}
                TextFieldsProps={{
                  error: !!errorMsg,
                  placeholder: '-',
                  disabled: loading,
                  size: 'medium',
                  inputProps: { dir: 'ltr' },
                }}
                sx={{
                  direction: 'ltr',
                  justifyContent: 'center',
                }}
              />

              {loading && (
                <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                  <CircularProgress size={16} />
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('verifying')}
                  </Typography>
                </Stack>
              )}
            </Stack>
          )}

          <Box>
            {countdown > 0 ? (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {t('resend_in')} {countdown}{t('seconds_short')}
              </Typography>
            ) : (
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={handleResend}
                disabled={sendingOtp}
                sx={{ cursor: 'pointer' }}
              >
                {t('resend_otp')}
              </Link>
            )}
          </Box>

          {onClose && (
            <Link
              component="button"
              type="button"
              variant="body2"
              onClick={() => onClose()}
              sx={{ color: 'text.secondary', cursor: 'pointer' }}
            >
              {t('verify_later')}
            </Link>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

OtpVerifyModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func,
  showValueProp: PropTypes.bool,
};

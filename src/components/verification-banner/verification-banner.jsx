import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';

import { useAuthContext } from 'src/auth/hooks';
import { OtpVerifyModal } from 'src/sections/auth/jwt';
import { useTranslation } from 'react-i18next';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

const DISMISSED_KEY = 'markium-verification-banner-dismissed';

// ----------------------------------------------------------------------

export default function VerificationBanner() {
  const { user } = useAuthContext();
  const { t } = useTranslation();

  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem(DISMISSED_KEY) === 'true'
  );
  const [otpOpen, setOtpOpen] = useState(false);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    sessionStorage.setItem(DISMISSED_KEY, 'true');
  }, []);

  const handleVerifyClick = useCallback(() => {
    setOtpOpen(true);
  }, []);

  const handleOtpClose = useCallback(() => {
    setOtpOpen(false);
  }, []);

  // Don't render if user is verified or banner was dismissed this session
  if (user?.is_phone_verified || dismissed) {
    return null;
  }

  const isFirstSession = !localStorage.getItem('markium-has-visited-dashboard');

  // Mark that user has visited dashboard (for progressive messaging)
  if (!localStorage.getItem('markium-has-visited-dashboard')) {
    localStorage.setItem('markium-has-visited-dashboard', 'true');
  }

  const message = isFirstSession
    ? t('verification_banner_full')
    : t('verification_banner_short');

  return (
    <>
      <Box sx={{ px: { xs: 2, lg: 0 }, pt: { xs: 1, lg: 0 }, pb: 1 }}>
        <Alert
          severity="info"
          action={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                color="info"
                size="small"
                variant="contained"
                onClick={handleVerifyClick}
              >
                {t('verify_now')}
              </Button>
              <IconButton
                size="small"
                color="inherit"
                onClick={handleDismiss}
              >
                <Iconify icon="mingcute:close-line" width={18} />
              </IconButton>
            </Box>
          }
          sx={{ alignItems: 'center' }}
        >
          {message}
        </Alert>
      </Box>

      <OtpVerifyModal open={otpOpen} onClose={handleOtpClose} />
    </>
  );
}

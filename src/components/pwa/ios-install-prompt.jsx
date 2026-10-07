import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import Iconify from 'src/components/iconify';

const DISMISSED_KEY = 'ios-install-dismissed';

function isIosSafari() {
  const ua = window.navigator.userAgent.toLowerCase();
  const isIos = /iphone|ipad|ipod/.test(ua);
  const isSafari = /safari/.test(ua) && !/crios|fxios|edgios/.test(ua);
  return isIos && isSafari;
}

function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

export default function IosInstallPrompt() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(true);

  const shouldShow = useMemo(
    () => isIosSafari() && !isStandalone() && !localStorage.getItem(DISMISSED_KEY),
    []
  );

  if (!shouldShow || !visible) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, Date.now().toString());
    setVisible(false);
  };

  return (
    <Card
      sx={{
        position: 'fixed',
        bottom: { xs: 72, lg: 24 },
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1300,
        p: 2,
        mx: 2,
        maxWidth: 400,
        width: 'calc(100% - 32px)',
        boxShadow: (theme) => theme.customShadows?.z16 || theme.shadows[16],
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
        <Iconify icon="solar:smartphone-bold-duotone" width={32} sx={{ color: 'primary.main', mt: 0.5 }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2">{t('pwa.ios_install_title', 'Install Markium for notifications')}</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            {t('pwa.ios_install_body', 'To get order alerts on iPhone, add Markium to your Home Screen.')}
          </Typography>
          <Box component="ol" sx={{ pl: 2, m: 0, mt: 1, color: 'text.secondary' }}>
            <li>
              <Typography variant="caption">{t('pwa.ios_install_step_share', 'Tap the Share button in Safari')}</Typography>
            </li>
            <li>
              <Typography variant="caption">{t('pwa.ios_install_step_add', 'Choose "Add to Home Screen"')}</Typography>
            </li>
          </Box>
          <Button variant="contained" size="small" onClick={handleDismiss} sx={{ mt: 1.5 }}>
            {t('pwa.ios_install_dismiss', 'Got it')}
          </Button>
        </Box>
        <IconButton size="small" onClick={handleDismiss} sx={{ mt: -0.5, mr: -0.5 }}>
          <Iconify icon="mingcute:close-line" width={18} />
        </IconButton>
      </Box>
    </Card>
  );
}

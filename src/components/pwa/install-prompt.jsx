import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Iconify from 'src/components/iconify';
import { useResponsive } from 'src/hooks/use-responsive';

const INSTALL_DISMISSED_KEY = 'pwa-install-dismissed';
const VISIT_COUNT_KEY = 'pwa-visit-count';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation();
  const lgUp = useResponsive('up', 'lg');

  useEffect(() => {
    // Track visits — show prompt after 2nd visit
    const visits = parseInt(localStorage.getItem(VISIT_COUNT_KEY) || '0', 10) + 1;
    localStorage.setItem(VISIT_COUNT_KEY, visits.toString());

    if (visits < 2 || localStorage.getItem(INSTALL_DISMISSED_KEY)) return;

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Don't show on desktop or if already installed
  if (lgUp || !visible || !deferredPrompt) return null;

  const handleInstall = async () => {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem(INSTALL_DISMISSED_KEY, 'true');
    setVisible(false);
  };

  return (
    <Card
      sx={{
        position: 'fixed',
        bottom: 72,
        left: 16,
        right: 16,
        zIndex: 1300,
        p: 2,
        boxShadow: (theme) => theme.customShadows?.z16 || theme.shadows[16],
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
        <Iconify icon="solar:download-minimalistic-bold-duotone" width={32} sx={{ color: 'primary.main', mt: 0.5 }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2">
            {t('pwa.install_title', 'Install Markium')}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            {t('pwa.install_body', 'Add to your home screen for a faster experience.')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
            <Button variant="contained" size="small" onClick={handleInstall}>
              {t('pwa.install_button', 'Install')}
            </Button>
            <Button variant="text" size="small" onClick={handleDismiss} sx={{ color: 'text.secondary' }}>
              {t('pwa.install_dismiss', 'Not now')}
            </Button>
          </Box>
        </Box>
        <IconButton size="small" onClick={handleDismiss} sx={{ mt: -0.5, mr: -0.5 }}>
          <Iconify icon="mingcute:close-line" width={18} />
        </IconButton>
      </Box>
    </Card>
  );
}

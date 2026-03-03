import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Iconify from 'src/components/iconify';
import { usePushNotifications } from 'src/hooks/use-push-notifications';

export default function PushPermissionPrompt() {
  const { shouldShowPrompt, subscribe, dismiss, loading } = usePushNotifications();
  const { t } = useTranslation();
  const [visible, setVisible] = useState(true);

  if (!shouldShowPrompt || !visible) return null;

  const handleDismiss = () => {
    dismiss();
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
        <Iconify icon="solar:bell-bing-bold-duotone" width={32} sx={{ color: 'primary.main', mt: 0.5 }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2">
            {t('pwa.push_prompt_title', 'Stay updated')}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            {t('pwa.push_prompt_body', 'Get notified about new orders, inventory alerts, and more.')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
            <Button variant="contained" size="small" onClick={subscribe} disabled={loading}>
              {t('pwa.push_enable', 'Enable')}
            </Button>
            <Button variant="text" size="small" onClick={handleDismiss} sx={{ color: 'text.secondary' }}>
              {t('pwa.push_later', 'Not now')}
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

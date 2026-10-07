import { useEffect } from 'react';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { useNetworkStatus } from 'src/hooks/use-network-status';

export default function OfflineIndicator() {
  const isOnline = useNetworkStatus();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const { t } = useTranslation();

  useEffect(() => {
    if (!isOnline) {
      enqueueSnackbar(
        t('pwa.offline', 'You are offline. Some features may be limited.'),
        {
          variant: 'warning',
          persist: true,
          key: 'offline-indicator',
          preventDuplicate: true,
        }
      );
    } else {
      closeSnackbar('offline-indicator');
    }
  }, [isOnline, enqueueSnackbar, closeSnackbar, t]);

  return null;
}

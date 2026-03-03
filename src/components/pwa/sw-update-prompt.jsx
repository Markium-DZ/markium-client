import { useRegisterSW } from 'virtual:pwa-register/react';
import { useSnackbar } from 'notistack';
import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '@mui/material/Button';

export default function SwUpdatePrompt() {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const { t } = useTranslation();

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      // Check for updates every 60 minutes
      if (registration) {
        setInterval(() => registration.update(), 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.error('SW registration error:', error);
    },
  });

  const handleUpdate = useCallback(() => {
    updateServiceWorker(true);
  }, [updateServiceWorker]);

  useEffect(() => {
    if (needRefresh) {
      enqueueSnackbar(t('pwa.update_available', 'A new version is available'), {
        variant: 'info',
        persist: true,
        action: (snackbarId) => (
          <>
            <Button color="inherit" size="small" onClick={handleUpdate}>
              {t('pwa.refresh', 'Refresh')}
            </Button>
            <Button color="inherit" size="small" onClick={() => closeSnackbar(snackbarId)}>
              {t('pwa.dismiss', 'Later')}
            </Button>
          </>
        ),
      });
    }
  }, [needRefresh, enqueueSnackbar, closeSnackbar, handleUpdate, t]);

  return null;
}

import { useState, useEffect, useCallback } from 'react';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { subscribeToPush, getSubscriptionStatus } from 'src/services/push-notifications';

const PROMPT_DISMISSED_KEY = 'push-prompt-dismissed';

export function usePushNotifications() {
  const [status, setStatus] = useState({ supported: false, subscribed: false, permission: 'default' });
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation();

  useEffect(() => {
    getSubscriptionStatus().then(setStatus);
  }, []);

  const subscribe = useCallback(async () => {
    setLoading(true);
    try {
      await subscribeToPush();
      const newStatus = await getSubscriptionStatus();
      setStatus(newStatus);
      enqueueSnackbar(t('pwa.push_enabled', 'Notifications enabled!'), { variant: 'success' });
    } catch (err) {
      console.error('Push subscription failed:', err);
      enqueueSnackbar(t('pwa.push_error', 'Could not enable notifications'), { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar, t]);

  const dismiss = useCallback(() => {
    localStorage.setItem(PROMPT_DISMISSED_KEY, Date.now().toString());
  }, []);

  const shouldShowPrompt =
    status.supported &&
    !status.subscribed &&
    status.permission === 'default' &&
    !localStorage.getItem(PROMPT_DISMISSED_KEY);

  return { status, loading, subscribe, dismiss, shouldShowPrompt };
}

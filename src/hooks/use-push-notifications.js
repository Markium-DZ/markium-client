import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback } from 'react';

import {
  subscribeToPush,
  ensureSubscribed,
  getSubscriptionStatus,
} from 'src/services/push-notifications';

// Re-ask instead of hiding forever: dismissing snoozes the prompt, and it
// reappears after a cooldown so an accidental "Not now" isn't permanent.
const PROMPT_SNOOZE_UNTIL_KEY = 'push-prompt-snooze-until';
const PROMPT_DISMISS_COUNT_KEY = 'push-prompt-dismiss-count';
const REASK_AFTER_MS = 2 * 24 * 60 * 60 * 1000; // re-ask 2 days after a dismissal
const MAX_DISMISSALS = 4; // ...then stop asking (respect a repeated "no")

export function usePushNotifications() {
  const [status, setStatus] = useState({ supported: false, subscribed: false, permission: 'default' });
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation();

  useEffect(() => {
    getSubscriptionStatus().then(setStatus);
    // Re-register silently if permission was already granted (key rotation / new device).
    ensureSubscribed();
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
    const count = Number(localStorage.getItem(PROMPT_DISMISS_COUNT_KEY) || 0) + 1;
    localStorage.setItem(PROMPT_DISMISS_COUNT_KEY, String(count));
    const snoozeUntil =
      count >= MAX_DISMISSALS ? Number.MAX_SAFE_INTEGER : Date.now() + REASK_AFTER_MS;
    localStorage.setItem(PROMPT_SNOOZE_UNTIL_KEY, String(snoozeUntil));
  }, []);

  const snoozedUntil = Number(localStorage.getItem(PROMPT_SNOOZE_UNTIL_KEY)) || 0;
  const shouldShowPrompt =
    status.supported &&
    !status.subscribed &&
    status.permission === 'default' &&
    Date.now() >= snoozedUntil;

  return { status, loading, subscribe, dismiss, shouldShowPrompt };
}

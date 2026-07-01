import PropTypes from 'prop-types';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';
import {
  subscribeToPush,
  unsubscribeFromPush,
  getSubscriptionStatus,
} from 'src/services/push-notifications';

import Iconify from 'src/components/iconify';

export default function NotificationDevicePanel({ anyEnabled }) {
  const { t } = useTranslate();
  const [status, setStatus] = useState({ supported: false, subscribed: false, permission: 'default' });
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(() => {
    getSubscriptionStatus().then(setStatus);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleEnable = async () => {
    setLoading(true);
    try {
      await subscribeToPush();
    } catch (err) {
      console.error('enable push failed', err);
    } finally {
      refresh();
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    setLoading(true);
    try {
      await unsubscribeFromPush();
    } catch (err) {
      console.error('disable push failed', err);
    } finally {
      refresh();
      setLoading(false);
    }
  };

  const blocked = status.permission === 'denied';
  const showWarning = anyEnabled && status.supported && !status.subscribed && !blocked;

  const getStatusMessage = () => {
    if (!status.supported) return t('notif_device_unsupported');
    if (blocked) return t('notif_device_blocked');
    if (status.subscribed) return t('notif_device_on');
    return t('notif_device_off');
  };

  return (
    <Card variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Iconify icon="solar:bell-bing-bold-duotone" width={28} sx={{ color: 'primary.main' }} />
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="subtitle2">{t('notif_device_title')}</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {getStatusMessage()}
          </Typography>
        </Box>
        {status.supported && !blocked && (
          <Button
            variant={status.subscribed ? 'outlined' : 'contained'}
            color={status.subscribed ? 'inherit' : 'primary'}
            size="small"
            disabled={loading}
            onClick={status.subscribed ? handleDisable : handleEnable}
          >
            {status.subscribed ? t('notif_device_disable') : t('notif_device_enable')}
          </Button>
        )}
      </Stack>

      {showWarning && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          {t('notif_device_warning')}
        </Alert>
      )}
    </Card>
  );
}

NotificationDevicePanel.propTypes = {
  anyEnabled: PropTypes.bool,
};

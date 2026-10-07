import { useContext, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Switch from '@mui/material/Switch';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';

import { useTranslate } from 'src/locales';
import Iconify from 'src/components/iconify';

import { useSnackbar } from 'src/components/snackbar';
import showError from 'src/utils/show_error';
import { updateStoreConfig, useGetMyStore } from 'src/api/store';
import { useGetCurrentSubscription } from 'src/api/subscriptions';
import { AuthContext } from 'src/auth/context/jwt';

// ----------------------------------------------------------------------

export default function SessionReplayForm() {
  const { user } = useContext(AuthContext);
  const { store } = useGetMyStore(user?.store?.slug);
  const { subscription } = useGetCurrentSubscription();
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslate();

  const [sessionReplayEnabled, setSessionReplayEnabled] = useState(false);
  const [sessionReplayLoading, setSessionReplayLoading] = useState(false);

  const hasAdvancedAnalytics = subscription?.features?.some(
    (f) => f.name === 'advanced_analytics' && f.enabled
  ) ?? false;

  useEffect(() => {
    if (store) {
      setSessionReplayEnabled(store?.config?.session_replay ?? false);
    }
  }, [store]);

  const handleSessionReplayToggle = async (event) => {
    const newValue = event.target.checked;
    setSessionReplayLoading(true);
    try {
      await updateStoreConfig({ config: { session_replay: newValue } });
      setSessionReplayEnabled(newValue);
      enqueueSnackbar(t('operation_success'), { variant: 'success' });
    } catch (error) {
      showError(error);
    } finally {
      setSessionReplayLoading(false);
    }
  };

  return (
    <Stack spacing={2.5}>
      <Card
        variant="outlined"
        sx={{
          border: (theme) => `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 2.5, py: 2 }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
            <Iconify icon="solar:videocamera-record-bold" width={28} sx={{ color: 'warning.main', flexShrink: 0 }} />
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="subtitle2" fontWeight={600} noWrap>
                  {t('settings_session_replay')}
                </Typography>
                {sessionReplayEnabled && (
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      bgcolor: 'success.main',
                      flexShrink: 0,
                    }}
                  />
                )}
              </Stack>
              <Typography variant="caption" color="text.disabled" noWrap>
                {t('settings_session_replay_description')}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1} sx={{ flexShrink: 0 }}>
            {!hasAdvancedAnalytics && (
              <Chip
                label={t('settings_session_replay_business_only')}
                size="small"
                color="warning"
                variant="outlined"
                sx={{ height: 24, fontSize: '0.7rem' }}
              />
            )}
            {sessionReplayLoading ? (
              <CircularProgress size={20} />
            ) : (
              <Switch
                size="small"
                checked={sessionReplayEnabled}
                onChange={handleSessionReplayToggle}
                disabled={!hasAdvancedAnalytics}
              />
            )}
          </Stack>
        </Stack>
      </Card>
    </Stack>
  );
}

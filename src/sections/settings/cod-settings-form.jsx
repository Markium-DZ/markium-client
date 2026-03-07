import { useContext, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Switch from '@mui/material/Switch';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';
import Iconify from 'src/components/iconify';

import { useSnackbar } from 'src/components/snackbar';
import showError from 'src/utils/show_error';
import { updateStoreConfig, useGetMyStore } from 'src/api/store';
import { AuthContext } from 'src/auth/context/jwt';

// ----------------------------------------------------------------------

export default function CodSettingsForm() {
  const { user } = useContext(AuthContext);
  const { store } = useGetMyStore(user?.store?.slug);
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslate();

  const [smsEnabled, setSmsEnabled] = useState(false);
  const [smsLoading, setSmsLoading] = useState(false);

  useEffect(() => {
    if (store) {
      setSmsEnabled(store?.config?.sms_confirmation_enabled ?? false);
    }
  }, [store]);

  const handleToggle = async (event) => {
    const newValue = event.target.checked;
    setSmsLoading(true);
    try {
      await updateStoreConfig({ config: { sms_confirmation_enabled: newValue } });
      setSmsEnabled(newValue);
      enqueueSnackbar(t('operation_success'), { variant: 'success' });
    } catch (error) {
      showError(error);
    } finally {
      setSmsLoading(false);
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
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 2.5, py: 2 }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
            <Iconify icon="solar:phone-calling-bold" width={28} sx={{ color: 'info.main', flexShrink: 0 }} />
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="subtitle2" fontWeight={600} noWrap>
                  {t('settings_sms_confirmation')}
                </Typography>
                {smsEnabled && (
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
                {t('settings_sms_confirmation_description')}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1} sx={{ flexShrink: 0 }}>
            {smsLoading ? (
              <CircularProgress size={20} />
            ) : (
              <Switch
                size="small"
                checked={smsEnabled}
                onChange={handleToggle}
              />
            )}
          </Stack>
        </Stack>
      </Card>
    </Stack>
  );
}

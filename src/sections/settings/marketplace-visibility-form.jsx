import { useContext, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';
import Iconify from 'src/components/iconify';

import { useSnackbar } from 'src/components/snackbar';
import showError from 'src/utils/show_error';
import { updateStoreConfig, useGetMyStore } from 'src/api/store';
import { AuthContext } from 'src/auth/context/jwt';

// ----------------------------------------------------------------------

const MARKETPLACE_URL = import.meta.env.VITE_MARKETPLACE_URL || 'https://markium.online';

export default function MarketplaceVisibilityForm() {
  const { user } = useContext(AuthContext);
  const { store, mutate } = useGetMyStore(user?.store?.slug);
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslate();

  const [visible, setVisible] = useState(true);

  // Hidden by a Markium admin: overrides the merchant's switch until an admin lifts it
  const hiddenByAdmin = !!store?.marketplace_hidden_by_admin;
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (store && store.marketplace_visible !== undefined) {
      setVisible(!!store.marketplace_visible);
    }
  }, [store]);

  const handleToggle = async (event) => {
    const newValue = event.target.checked;
    setLoading(true);
    try {
      // Multipart request: send 1/0, Laravel's boolean rule rejects the string "false"
      await updateStoreConfig({ marketplace_visible: newValue ? 1 : 0 });
      setVisible(newValue);
      mutate();
      enqueueSnackbar(t('operation_success'), { variant: 'success' });
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      variant="outlined"
      sx={{ mt: 3, border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 2 }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} sx={{ px: 2.5, py: 2 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
          <Iconify icon="solar:shop-2-bold" width={28} sx={{ color: 'primary.main', flexShrink: 0 }} />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight={600}>
              {t('settings_marketplace_visible')}
            </Typography>
            <Typography variant="caption" color="text.disabled" component="p">
              {t('settings_marketplace_visible_description')}{' '}
              <Link href={MARKETPLACE_URL} target="_blank" rel="noopener">
                markium.online
              </Link>
            </Typography>
          </Box>
        </Stack>

        {loading ? (
          <CircularProgress size={20} />
        ) : (
          <Switch
            checked={visible && !hiddenByAdmin}
            onChange={handleToggle}
            disabled={hiddenByAdmin}
            inputProps={{ 'aria-label': t('settings_marketplace_visible') }}
          />
        )}
      </Stack>

      {hiddenByAdmin && (
        <Alert severity="warning" sx={{ mx: 2.5, mb: 2 }}>
          {t('settings_marketplace_hidden_by_admin')}
        </Alert>
      )}
    </Card>
  );
}

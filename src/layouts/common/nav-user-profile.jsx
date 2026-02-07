import { useContext } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { useRouter } from 'src/routes/hooks';

import { useAuthContext } from 'src/auth/hooks';
import { AuthContext } from 'src/auth/context/jwt';

import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';
import CustomPopover, { usePopover } from 'src/components/custom-popover';
import { useTranslate } from 'src/locales';

// ----------------------------------------------------------------------

export default function NavUserProfile() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const { logout } = useAuthContext();
  const { t } = useTranslate();
  const { enqueueSnackbar } = useSnackbar();
  const popover = usePopover();

  const handleLogout = async () => {
    try {
      await logout();
      popover.onClose();
      router.replace('/auth/jwt/login');
    } catch (error) {
      console.error(error);
      enqueueSnackbar('Unable to logout!', { variant: 'error' });
    }
  };

  const handleHome = () => {
    popover.onClose();
    router.push('/dashboard');
  };

  const handleCopyStoreUrl = () => {
    const storeUrl = `https://${user?.store?.slug}.markium.online`;
    navigator.clipboard
      .writeText(storeUrl)
      .then(() => {
        enqueueSnackbar(t('store_url_copied'), { variant: 'success' });
        popover.onClose();
      })
      .catch((err) => {
        console.error('Failed to copy:', err);
        enqueueSnackbar(t('failed_to_copy'), { variant: 'error' });
      });
  };

  return (
    <>
      <Box
        sx={{
          px: 2.5,
          py: 2,
          borderTop: (theme) => `dashed 1px ${theme.palette.divider}`,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Avatar
            src={user?.photoURL}
            alt={user?.name}
            sx={{ width: 36, height: 36 }}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </Avatar>

          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" noWrap>
              {user?.name}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled' }} noWrap>
              {user?.phone}
            </Typography>
          </Box>

          <IconButton onClick={popover.onOpen} size="small">
            <Iconify icon="eva:more-horizontal-fill" width={20} />
          </IconButton>
        </Stack>
      </Box>

      <CustomPopover open={popover.open} onClose={popover.onClose} sx={{ width: 200, p: 0 }}>
        <Stack sx={{ p: 1 }}>
          <MenuItem onClick={handleHome}>{t('home')}</MenuItem>
          <MenuItem onClick={handleCopyStoreUrl}>{t('copy_store_url')}</MenuItem>
        </Stack>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <MenuItem
          onClick={handleLogout}
          sx={{ m: 1, fontWeight: 'fontWeightBold', color: 'error.main' }}
        >
          {t('logout')}
        </MenuItem>
      </CustomPopover>
    </>
  );
}

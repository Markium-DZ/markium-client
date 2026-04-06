import { useContext } from 'react';
import { m } from 'framer-motion';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Switch from '@mui/material/Switch';
import { alpha } from '@mui/material/styles';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { useRouter } from 'src/routes/hooks';

import { useAuthContext } from 'src/auth/hooks';
import { AuthContext } from 'src/auth/context/jwt';

import { varHover } from 'src/components/animate';
import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';
import CustomPopover, { usePopover } from 'src/components/custom-popover';
import { useSettingsContext } from 'src/components/settings';
import { useTranslate } from 'src/locales';
import { getStorefrontUrl } from 'src/config-global';

// ----------------------------------------------------------------------

export default function AccountPopover() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const { logout } = useAuthContext();
  const { t } = useTranslate();
  const { enqueueSnackbar } = useSnackbar();
  const popover = usePopover();
  const settings = useSettingsContext();

  const isDarkMode = settings.themeMode === 'dark';

  const handleToggleDarkMode = () => {
    settings.onUpdate('themeMode', isDarkMode ? 'light' : 'dark');
  };

  const handleLogout = async () => {
    try {
      await logout();
      popover.onClose();
      router.replace('/auth/jwt/login');
    } catch (error) {
      console.error(error);
      enqueueSnackbar(t('logout_failed'), { variant: 'error' });
    }
  };

  const handleHome = () => {
    popover.onClose();
    router.push('/dashboard');
  };

  const handleCopyStoreUrl = () => {
    const storeUrl = getStorefrontUrl(user?.store?.slug);
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

  const storeUrl = user?.store?.slug ? getStorefrontUrl(user.store.slug) : '';

  return (
    <>
      <IconButton
        component={m.button}
        whileTap="tap"
        whileHover="hover"
        variants={varHover(1.05)}
        onClick={popover.onOpen}
        aria-label={t('account')}
        sx={{
          width: 40,
          height: 40,
          background: (theme) => alpha(theme.palette.grey[500], 0.08),
          ...(popover.open && {
            background: (theme) =>
              `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
          }),
        }}
      >
        <Avatar
          src={user?.photoURL}
          alt={user?.name}
          sx={{
            width: 36,
            height: 36,
            border: (theme) => `solid 2px ${theme.palette.background.default}`,
          }}
        >
          {user?.name?.charAt(0).toUpperCase()}
        </Avatar>
      </IconButton>

      <CustomPopover open={popover.open} onClose={popover.onClose} sx={{ width: 220, p: 0 }}>
        {/* Identity block */}
        <Box sx={{ p: 2, pb: 1.5 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar
              src={user?.photoURL}
              alt={user?.name}
              sx={{ width: 40, height: 40 }}
            >
              {user?.name?.charAt(0).toUpperCase()}
            </Avatar>

            <Box sx={{ minWidth: 0, flexGrow: 1 }}>
              <Typography variant="subtitle2" noWrap>
                {user?.name}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled' }} noWrap>
                {user?.phone}
              </Typography>
            </Box>
          </Stack>

          {storeUrl && (
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', mt: 1, display: 'block', direction: 'ltr', textAlign: 'end' }}
              noWrap
            >
              {storeUrl}
            </Typography>
          )}
        </Box>

        <Divider sx={{ borderStyle: 'dashed' }} />

        {/* Dark mode toggle */}
        <MenuItem
          onClick={handleToggleDarkMode}
          sx={{ px: 2, py: 1 }}
        >
          <Iconify
            icon={isDarkMode ? 'duo-icons:moon-stars' : 'duo-icons:sun'}
            width={20}
            sx={{ mr: 1.5 }}
          />
          <Typography variant="body2" sx={{ flexGrow: 1 }}>
            {t('dark_mode')}
          </Typography>
          <Switch
            size="small"
            checked={isDarkMode}
            onChange={handleToggleDarkMode}
            onClick={(e) => e.stopPropagation()}
          />
        </MenuItem>

        <Divider sx={{ borderStyle: 'dashed' }} />

        {/* Actions */}
        <Stack sx={{ p: 1 }}>
          <MenuItem onClick={handleHome}>
            <Iconify icon="solar:home-2-bold-duotone" width={20} sx={{ mr: 1.5 }} />
            {t('home')}
          </MenuItem>

          <MenuItem onClick={handleCopyStoreUrl}>
            <Iconify icon="solar:copy-bold-duotone" width={20} sx={{ mr: 1.5 }} />
            {t('copy_store_url')}
          </MenuItem>
        </Stack>

        <Divider sx={{ borderStyle: 'dashed' }} />

        {/* Logout */}
        <MenuItem
          onClick={handleLogout}
          sx={{ m: 1, fontWeight: 'fontWeightBold', color: 'error.main' }}
        >
          <Iconify icon="solar:logout-2-bold-duotone" width={20} sx={{ mr: 1.5 }} />
          {t('logout')}
        </MenuItem>
      </CustomPopover>
    </>
  );
}

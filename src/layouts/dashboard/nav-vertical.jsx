import { useEffect } from 'react';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';

import { usePathname } from 'src/routes/hooks';

import { useResponsive } from 'src/hooks/use-responsive';

import Scrollbar from 'src/components/scrollbar';
import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import { NavSectionVertical } from 'src/components/nav-section';

import { useAuthContext } from 'src/auth/hooks';
import { useGetCurrentSubscription } from 'src/api/subscriptions';
import { useTranslate } from 'src/locales';

import { NAV } from '../config-layout';
import NavUserProfile from '../common/nav-user-profile';
import { useNavData } from './config-navigation';
import NavToggleButton from '../common/nav-toggle-button';

// ----------------------------------------------------------------------

export default function NavVertical({ openNav, onCloseNav }) {
  const { user } = useAuthContext();
  const { t } = useTranslate();
  const { subscription } = useGetCurrentSubscription();

  const pathname = usePathname();

  const lgUp = useResponsive('up', 'lg');

  const navData = useNavData();

  useEffect(() => {
    if (openNav) {
      onCloseNav();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const storeName = user?.store?.name || t('markium');
  const storeLogo = user?.store?.logo_url;
  const storeInitials = storeName?.substring(0, 2).toUpperCase();

  const packageName = subscription?.package?.name;
  const packageSlug = subscription?.package?.slug;
  const packageTranslationKey = packageSlug ? `package_${packageSlug}` : '';
  const translatedPackageName = packageTranslationKey ? t(packageTranslationKey) : '';
  const displayPackageName =
    translatedPackageName && translatedPackageName !== packageTranslationKey
      ? translatedPackageName
      : packageName;

  const renderContent = (
    <Scrollbar
      sx={{
        height: 1,
        '& .simplebar-content': {
          height: 1,
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <Box sx={{ px: 2.5, pt: 3, pb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Avatar
            src={storeLogo}
            alt={storeName}
            sx={{
              width: 40,
              height: 40,
              bgcolor: 'grey.800',
              color: 'common.white',
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            {storeInitials}
          </Avatar>

          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Typography variant="subtitle2" noWrap>
              {storeName}
            </Typography>

            {displayPackageName && (
              <Label
                color="success"
                variant="soft"
                startIcon={<Iconify icon="solar:cart-3-bold" width={14} />}
                sx={{ mt: 0.5 }}
              >
                {displayPackageName}
              </Label>
            )}
          </Box>
        </Stack>
      </Box>

      <Box sx={{ px: 2.5, pt: 2, pb: 3 }}>
        <Typography variant="h5" sx={{ whiteSpace: 'pre-line' }}>
          {`${t('welcome_back')}\n${user?.name} 👋`}
        </Typography>
      </Box>

      <Divider sx={{ borderStyle: 'dashed', mx: 2.5, mb: 2 }} />

      <NavSectionVertical
        data={navData}
        slotProps={{
          currentRole: user?.role,
        }}
        aria-label={t('main_navigation')}
      />

      <Box sx={{ flexGrow: 1 }} />

      <NavUserProfile />
    </Scrollbar>
  );

  return (
    <Box
      sx={{
        flexShrink: { lg: 0 },
        width: { lg: NAV.W_VERTICAL },
      }}
    >
      <NavToggleButton />

      {lgUp ? (
        <Stack
          sx={{
            height: 1,
            position: 'fixed',
            width: NAV.W_VERTICAL,
            borderRight: (theme) => `dashed 1px ${theme.palette.divider}`,
          }}
        >
          {renderContent}
        </Stack>
      ) : (
        <Drawer
          open={openNav}
          onClose={onCloseNav}
          PaperProps={{
            sx: {
              width: NAV.W_VERTICAL,
            },
          }}
        >
          {renderContent}
        </Drawer>
      )}
    </Box>
  );
}

NavVertical.propTypes = {
  openNav: PropTypes.bool,
  onCloseNav: PropTypes.func,
};

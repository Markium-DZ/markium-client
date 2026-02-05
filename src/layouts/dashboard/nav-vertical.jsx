import { useContext, useEffect } from 'react';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Drawer from '@mui/material/Drawer';

import { usePathname } from 'src/routes/hooks';

import { useResponsive } from 'src/hooks/use-responsive';
import { useMockedUser } from 'src/hooks/use-mocked-user';

import Logo from 'src/components/logo';
import Scrollbar from 'src/components/scrollbar';
import { NavSectionVertical } from 'src/components/nav-section';

import { NAV } from '../config-layout';
// import NavUpgrade from '../common/nav-upgrade';
import { useNavData } from './config-navigation';
import NavToggleButton from '../common/nav-toggle-button';
import { IconButton, Tooltip, Typography } from '@mui/material';
import { t } from 'i18next';
import { AuthContext } from 'src/auth/context/jwt';
import { useAuthContext } from 'src/auth/hooks';
import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function NavVertical({ openNav, onCloseNav }) {
  // const { user } = useMockedUser();
  // const { user } = useContext(AuthContext);
  const { user } = useAuthContext();

  const publicProductUrl = user?.store?.slug
    ? `https://${user.store.slug}.markium.online/?store=${user?.store?.slug}`
    : '';

  const pathname = usePathname();

  const lgUp = useResponsive('up', 'lg');

  const navData = useNavData();

  useEffect(() => {
    if (openNav) {
      onCloseNav();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

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
      <Box display="flex" alignItems="center" sx={{ mt: 3, ml: 4, mb: 1 }}>
        <Logo user={user} />
        <Typography color="primary" mx={1} fontWeight="500" >
          {user?.store?.name || t("markium")}
        </Typography>
        <Tooltip title={t('open_in_new_tab')}>
          <IconButton
            component="a"
            href={publicProductUrl}
            target="_blank"
            rel="noopener noreferrer"
            size="small"
            color="primary"
            sx={{ p: 0.5 }}
          >
            <Iconify icon="eva:external-link-fill" width={16} />
          </IconButton>
        </Tooltip>
      </Box>

      <NavSectionVertical
        data={navData}
        slotProps={{
          currentRole: user?.role,
        }}
        aria-label={t('main_navigation')}
      />

      <Box sx={{ flexGrow: 1 }} />

      {/* <NavUpgrade /> */}
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

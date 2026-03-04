import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

import Stack from '@mui/material/Stack';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import { alpha, useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

import { useOffSetTop } from 'src/hooks/use-off-set-top';
import { useResponsive } from 'src/hooks/use-responsive';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { bgBlur } from 'src/theme/css';

import Logo from 'src/components/logo';
import Iconify from 'src/components/iconify';
import SvgColor from 'src/components/svg-color';
import { useSettingsContext } from 'src/components/settings';

import Searchbar from '../common/searchbar';
import { NAV, HEADER } from '../config-layout';
import LanguagePopover from '../common/language-popover';
import SettingsLink from '../common/settings-link';
import AccountPopover from '../common/account-popover';
import SubscriptionWalletWidget from 'src/sections/subscription/subscription-wallet-widget';

const DRAWER_HINT_KEY = 'markium_drawer_hint_shown';

// ----------------------------------------------------------------------

// Root paths covered by bottom nav — no back button needed
const ROOT_PATHS = ['/dashboard', '/dashboard/order', '/dashboard/product', '/dashboard/analytics', '/dashboard/inventory', '/dashboard/settings'];

function isRootPage(pathname) {
  return ROOT_PATHS.some((p) => pathname === p || pathname === `${p}/`);
}

export default function Header({ onOpenNav }) {
  const theme = useTheme();

  const settings = useSettingsContext();

  const isNavHorizontal = settings.themeLayout === 'horizontal';

  const isNavMini = settings.themeLayout === 'mini';

  const lgUp = useResponsive('up', 'lg');

  const { pathname } = useLocation();
  const navigate = useNavigate();

  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';

  const showBackButton = !lgUp && !isRootPage(pathname);

  const offset = useOffSetTop(HEADER.H_DESKTOP);

  const offsetTop = offset && !isNavHorizontal;

  // First-visit tooltip for drawer discoverability
  const [showDrawerHint, setShowDrawerHint] = useState(false);

  useEffect(() => {
    if (lgUp) return;
    const alreadyShown = localStorage.getItem(DRAWER_HINT_KEY);
    if (!alreadyShown) {
      setShowDrawerHint(true);
      localStorage.setItem(DRAWER_HINT_KEY, '1');
      const timer = setTimeout(() => setShowDrawerHint(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [lgUp]);

  const handleOpenNav = useCallback(() => {
    setShowDrawerHint(false);
    onOpenNav();
  }, [onOpenNav]);

  const renderContent = (
    <>
      {lgUp && isNavHorizontal && <Logo sx={{ mr: 2.5 }} />}

      {!lgUp && showBackButton && (
        <IconButton onClick={() => navigate(-1)} aria-label="Go back">
          <Iconify icon={isRtl ? 'eva:arrow-ios-forward-fill' : 'eva:arrow-ios-back-fill'} />
        </IconButton>
      )}

      {!lgUp && !showBackButton && (
        <Tooltip
          title={t('nav.all_sections_here')}
          open={showDrawerHint}
          arrow
          placement="bottom-start"
          slotProps={{
            tooltip: {
              sx: {
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                fontSize: '0.8rem',
                fontWeight: 600,
                px: 1.5,
                py: 0.75,
                '& .MuiTooltip-arrow': { color: 'primary.main' },
              },
            },
          }}
        >
          <IconButton
            onClick={handleOpenNav}
            aria-label="Open navigation"
            sx={{
              bgcolor: (th) => alpha(th.palette.primary.main, 0.08),
              '&:hover': {
                bgcolor: (th) => alpha(th.palette.primary.main, 0.16),
              },
            }}
          >
            <SvgColor src="/assets/icons/navbar/ic_menu_item.svg" />
          </IconButton>
        </Tooltip>
      )}

      {lgUp && <Searchbar />}

      <Stack
        flexGrow={1}
        direction="row"
        alignItems="center"
        justifyContent="flex-end"
        spacing={{ xs: 0.5, sm: 1 }}
      >
        <SubscriptionWalletWidget />

        <LanguagePopover />

        <SettingsLink />

        <AccountPopover />
      </Stack>
    </>
  );

  return (
    <AppBar
      sx={{
        height: HEADER.H_MOBILE,
        zIndex: theme.zIndex.appBar + 1,
        ...bgBlur({
          color: theme.palette.background.default,
        }),
        transition: theme.transitions.create(['height'], {
          duration: theme.transitions.duration.shorter,
        }),
        // Safe area: pad top for notch/status bar on mobile
        ...(!lgUp && {
          pt: 'env(safe-area-inset-top)',
          height: `calc(${HEADER.H_MOBILE}px + env(safe-area-inset-top))`,
        }),
        ...(lgUp && {
          width: `calc(100% - ${NAV.W_VERTICAL + 1}px)`,
          height: HEADER.H_DESKTOP,
          ...(offsetTop && {
            height: HEADER.H_DESKTOP_OFFSET,
          }),
          ...(isNavHorizontal && {
            width: 1,
            bgcolor: 'background.default',
            height: HEADER.H_DESKTOP_OFFSET,
            borderBottom: `dashed 1px ${theme.palette.divider}`,
          }),
          ...(isNavMini && {
            width: `calc(100% - ${NAV.W_MINI + 1}px)`,
          }),
        }),
      }}
    >
      <Toolbar
        sx={{
          height: 1,
          px: { lg: 5 },
        }}
      >
        {renderContent}
      </Toolbar>
    </AppBar>
  );
}

Header.propTypes = {
  onOpenNav: PropTypes.func,
};

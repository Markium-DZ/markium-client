import PropTypes from 'prop-types';

import Box from '@mui/material/Box';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';

import { useSettingsContext } from 'src/components/settings';
import { useTranslate } from 'src/locales';

import SkipToContent from 'src/components/skip-to-content';
import PushPermissionPrompt from 'src/components/pwa/push-permission-prompt';
import InstallPrompt from 'src/components/pwa/install-prompt';
import Main from './main';
import Header from './header';
import NavMini from './nav-mini';
import NavVertical from './nav-vertical';
import NavHorizontal from './nav-horizontal';
import BottomNav from './bottom-nav';

// ----------------------------------------------------------------------

export default function DashboardLayout({ children }) {
  const settings = useSettingsContext();

  const lgUp = useResponsive('up', 'lg');

  const nav = useBoolean();

  const isHorizontal = settings.themeLayout === 'horizontal';

  const isMini = settings.themeLayout === 'mini';

  const renderNavMini = <NavMini />;

  const renderHorizontal = <NavHorizontal />;

  const renderNavVertical = <NavVertical openNav={nav.value} onCloseNav={nav.onFalse} />;

  if (isHorizontal) {
    return (
      <>
        <SkipToContent />
        <Header onOpenNav={nav.onTrue} />

        {lgUp ? renderHorizontal : renderNavVertical}

        <Main>{children}</Main>
        <PushPermissionPrompt />
        <InstallPrompt />
        {!lgUp && <BottomNav />}
      </>
    );
  }

  if (isMini) {
    return (
      <>
        <SkipToContent />
        <Header onOpenNav={nav.onTrue} />

        <Box
          sx={{
            minHeight: 1,
            display: 'flex',
            flexDirection: { xs: 'column', lg: 'row' },
          }}
        >
          {lgUp ? renderNavMini : renderNavVertical}

          <Main>{children}</Main>
        </Box>
        <PushPermissionPrompt />
        <InstallPrompt />
        {!lgUp && <BottomNav />}
      </>
    );
  }

  return (
    <>
      <SkipToContent />
      <Header onOpenNav={nav.onTrue} />

      <Box
        sx={{
          minHeight: 1,
          display: 'flex',
          flexDirection: { xs: 'column', lg: 'row' },
        }}
      >
        {renderNavVertical}

        <Main>{children}</Main>
      </Box>
      <PushPermissionPrompt />
      <InstallPrompt />
      {!lgUp && <BottomNav />}
    </>
  );
}

DashboardLayout.propTypes = {
  children: PropTypes.node,
};

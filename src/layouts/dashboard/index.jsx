import PropTypes from 'prop-types';

import Box from '@mui/material/Box';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';

import SkipToContent from 'src/components/skip-to-content';
import { useSettingsContext } from 'src/components/settings';
import InstallPrompt from 'src/components/pwa/install-prompt';
import IosInstallPrompt from 'src/components/pwa/ios-install-prompt';
import PushPermissionPrompt from 'src/components/pwa/push-permission-prompt';
import VerificationBanner from 'src/components/verification-banner/verification-banner';
import ImpersonationBanner from 'src/components/impersonation-banner/impersonation-banner';

import Main from './main';
import Header from './header';
import NavMini from './nav-mini';
import BottomNav from './bottom-nav';
import NavVertical from './nav-vertical';
import NavHorizontal from './nav-horizontal';

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
        <ImpersonationBanner />
        <Header onOpenNav={nav.onTrue} />

        {lgUp ? renderHorizontal : renderNavVertical}

        <VerificationBanner />
        <Main>{children}</Main>
        <PushPermissionPrompt />
        <IosInstallPrompt />
        <InstallPrompt />
        {!lgUp && <BottomNav />}
      </>
    );
  }

  if (isMini) {
    return (
      <>
        <SkipToContent />
        <ImpersonationBanner />
        <Header onOpenNav={nav.onTrue} />

        <Box
          sx={{
            minHeight: 1,
            display: 'flex',
            flexDirection: { xs: 'column', lg: 'row' },
          }}
        >
          {lgUp ? renderNavMini : renderNavVertical}

          <Main>
            <VerificationBanner />
            {children}
          </Main>
        </Box>
        <PushPermissionPrompt />
        <IosInstallPrompt />
        <InstallPrompt />
        {!lgUp && <BottomNav />}
      </>
    );
  }

  return (
    <>
      <SkipToContent />
      <ImpersonationBanner />
      <Header onOpenNav={nav.onTrue} />

      <Box
        sx={{
          minHeight: 1,
          display: 'flex',
          flexDirection: { xs: 'column', lg: 'row' },
        }}
      >
        {renderNavVertical}

        <Main>
          <VerificationBanner />
          {children}
        </Main>
      </Box>
      <PushPermissionPrompt />
      <IosInstallPrompt />
      <InstallPrompt />
      {!lgUp && <BottomNav />}
    </>
  );
}

DashboardLayout.propTypes = {
  children: PropTypes.node,
};

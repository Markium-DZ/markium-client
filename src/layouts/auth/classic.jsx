import PropTypes from 'prop-types';
import { useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { useRouter } from 'src/routes/hooks';

import { useResponsive } from 'src/hooks/use-responsive';

import { bgGradient } from 'src/theme/css';
import { useAuthContext } from 'src/auth/hooks';

import Logo from 'src/components/logo';
import SkipToContent from 'src/components/skip-to-content';
import { useTranslate } from 'src/locales';

// ----------------------------------------------------------------------

export default function AuthClassicLayout({ children, image, title }) {
  const { authenticated } = useAuthContext();

  const theme = useTheme();
  const router = useRouter();
  const mdUp = useResponsive('up', 'md');
  const { t } = useTranslate();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (authenticated) {
      router.push('/dashboard');
    }
  }, [authenticated, router]);

  const renderLogo = (
    <Logo
      sx={{
        zIndex: 9,
        position: 'absolute',
        m: { xs: 2, md: 5 },
      }}
    />
  );

  const renderContent = (
    <Stack
      sx={{
        width: 1,
        mx: 'auto',
        maxWidth: 480,
        px: { xs: 2, md: 8 },
        pt: { xs: 15, md: 20 },
        pb: { xs: 15, md: 0 },
      }}
    >
      {children}
    </Stack>
  );

  const renderSection = (
    <Stack
      flexGrow={1}
      spacing={10}
      alignItems="center"
      justifyContent="center"
      sx={{
        ...bgGradient({
          color: alpha(
            theme.palette.background.default,
            theme.palette.mode === 'light' ? 0.88 : 0.94
          ),
          imgUrl: '/assets/background/overlay_2.jpg',
        }),
      }}
    >
      
      <Typography variant="h3" sx={{ maxWidth: 480, textAlign: 'center' }}>
        {title || t('hi_welcome_back')}
        {/* Hi, Welcome back */}
      </Typography>

      <Box
        component="img"
        alt={t('auth_illustration_alt')}
        src={image || '/assets/illustrations/illustration_dashboard.webp'}
        width={720}
        height={720}
        sx={{
          maxWidth: {
            xs: 480,
            lg: 560,
            xl: 720,
          },
          height: 'auto',
        }}
      />

    </Stack>
  );

  return (
    <Stack
      component="main"
      id="main-content"
      tabIndex={-1}
      direction="row"
      position={"relative"}
      sx={{
        minHeight: '100vh',
        outline: 'none',
      }}
    >
      <SkipToContent />

      {renderLogo}

      {mdUp && renderSection}

      {renderContent}
    </Stack>
  );
}

AuthClassicLayout.propTypes = {
  children: PropTypes.node,
  image: PropTypes.string,
  title: PropTypes.string,
};

import PropTypes from 'prop-types';
import { useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { useRouter } from 'src/routes/hooks';

import { useResponsive } from 'src/hooks/use-responsive';

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

  const renderContent = (
    <Stack
      sx={{
        width: 1,
        maxWidth: 480,
        flexShrink: 0,
        height: 1,
        overflow: 'hidden',
        px: { xs: 3, md: 6 },
        py: { xs: 5, md: 8 },
        justifyContent: 'center',
      }}
    >
      <Logo
        sx={{
          mb: 5,
          width: 48,
          height: 48,
          flexShrink: 0,
        }}
      />

      {children}
    </Stack>
  );

  const renderSection = (
    <Stack
      flexGrow={1}
      alignItems="center"
      justifyContent="center"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '24px',
        m: 2,
        background: `linear-gradient(135deg, ${theme.palette.primary.darker} 0%, ${theme.palette.primary.dark} 50%, ${theme.palette.primary.main} 100%)`,
      }}
    >
      {/* Decorative circles */}
      <Box
        sx={{
          position: 'absolute',
          width: 400,
          height: 400,
          borderRadius: '50%',
          border: `1px solid ${alpha(theme.palette.common.white, 0.08)}`,
          top: -100,
          right: -100,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: 300,
          height: 300,
          borderRadius: '50%',
          border: `1px solid ${alpha(theme.palette.common.white, 0.06)}`,
          bottom: -80,
          left: -80,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: 200,
          height: 200,
          borderRadius: '50%',
          bgcolor: alpha(theme.palette.common.white, 0.04),
          top: '50%',
          right: '10%',
        }}
      />

      {/* Content */}
      <Stack
        spacing={4}
        alignItems="center"
        justifyContent="center"
        sx={{
          position: 'relative',
          zIndex: 1,
          px: 6,
          textAlign: 'center',
        }}
      >
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: '20px',
            bgcolor: alpha(theme.palette.common.white, 0.12),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Box
            component="img"
            src="/assets/icons/navbar/ic_ecommerce.svg"
            sx={{
              width: 40,
              height: 40,
              filter: 'brightness(0) invert(1)',
            }}
          />
        </Box>

        <Stack spacing={2}>
          <Typography
            variant="h3"
            sx={{
              color: 'common.white',
              fontWeight: 800,
              maxWidth: 400,
            }}
          >
            {title || t('hi_welcome_back')}
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: alpha(theme.palette.common.white, 0.64),
              maxWidth: 360,
            }}
          >
            {t('manage_work_effectively')}
          </Typography>
        </Stack>

        <Box
          component="img"
          alt={t('auth_illustration_alt')}
          src={image || '/assets/illustrations/illustration_dashboard.webp'}
          sx={{
            maxWidth: { md: 320, lg: 400 },
            width: '100%',
            height: 'auto',
            filter: `drop-shadow(0 40px 80px ${alpha('#000', 0.4)})`,
          }}
        />
      </Stack>
    </Stack>
  );

  return (
    <Stack
      component="main"
      id="main-content"
      tabIndex={-1}
      direction="row"
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        outline: 'none',
        bgcolor: 'background.default',
      }}
    >
      <SkipToContent />

      {renderContent}

      {mdUp && renderSection}
    </Stack>
  );
}

AuthClassicLayout.propTypes = {
  children: PropTypes.node,
  image: PropTypes.string,
  title: PropTypes.string,
};

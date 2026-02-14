import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { useAuthContext } from 'src/auth/hooks';

import Logo from 'src/components/logo';
import Iconify from 'src/components/iconify';
import { useTranslation } from 'react-i18next';

// ----------------------------------------------------------------------

export default function AuthMinimalLayout({ children, maxWidth = 480 }) {
  const { user, logout } = useAuthContext();
  const { t } = useTranslation();

  return (
    <Stack
      component="main"
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      {/* Header */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          px: { xs: 2, md: 4 },
          py: 2,
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Logo sx={{ width: 40, height: 40 }} />

        <Stack direction="row" alignItems="center" spacing={2}>
          {user?.name && (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {user.name}
            </Typography>
          )}
          <Button
            size="small"
            color="inherit"
            onClick={logout}
            startIcon={<Iconify icon="solar:logout-2-outline" />}
          >
            {t('logout')}
          </Button>
        </Stack>
      </Stack>

      {/* Content */}
      <Stack
        sx={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          px: 2,
          py: 5,
        }}
      >
        <Box sx={{ width: 1, maxWidth }}>
          {children}
        </Box>
      </Stack>
    </Stack>
  );
}

AuthMinimalLayout.propTypes = {
  children: PropTypes.node,
  maxWidth: PropTypes.number,
};

import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';

import { bgGradient } from 'src/theme/css';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function WelcomeNewUser({ userName, productsCount = 0, ordersCount = 0, isNewUser = true, showSetupHint = false, img, ...other }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();

  const isReturning = !isNewUser;

  return (
    <Stack
      flexDirection={{ xs: 'column', md: 'row' }}
      sx={{
        ...bgGradient({
          direction: '135deg',
          startColor: alpha(theme.palette.primary.light, 0.2),
          endColor: alpha(theme.palette.primary.main, 0.2),
        }),
        height: { md: 1 },
        borderRadius: 2,
        position: 'relative',
        color: 'primary.darker',
        backgroundColor: 'common.white',
      }}
      {...other}
    >
      <Stack
        flexGrow={1}
        justifyContent="center"
        alignItems={{ xs: 'center', md: 'flex-start' }}
        sx={{
          p: {
            xs: theme.spacing(5, 3, 0, 3),
            md: theme.spacing(5),
          },
          textAlign: { xs: 'center', md: 'start' },
        }}
      >
        <Typography variant="h4" sx={{ mb: isReturning ? 1 : 2, whiteSpace: 'pre-line' }}>
          {t('welcome_back')} {userName}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            opacity: 0.8,
            maxWidth: 360,
            mb: { xs: 2, xl: 3 },
          }}
        >
          {t('manage_store_description')}
        </Typography>

        {/* Metric chips for returning users */}
        {isReturning && (
          <Stack
            direction="row"
            spacing={1}
            sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}
          >
            <Chip
              icon={<Iconify icon="solar:box-bold" width={16} />}
              label={t('welcome_products_count', { count: productsCount })}
              size="small"
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                color: 'primary.darker',
                fontWeight: 600,
              }}
            />
            <Chip
              icon={<Iconify icon="solar:bag-check-bold" width={16} />}
              label={t('welcome_orders_count', { count: ordersCount })}
              size="small"
              sx={{
                bgcolor: alpha(theme.palette.success.main, 0.12),
                color: 'success.darker',
                fontWeight: 600,
              }}
            />
          </Stack>
        )}

        <Button
          variant="contained"
          color="primary"
          onClick={() => router.push(paths.dashboard.order.root)}
        >
          {t('view_orders')}
        </Button>

        {/* M2: Setup hint for new users */}
        {showSetupHint && (
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{
              mt: 2,
              p: 1,
              borderRadius: 1,
              bgcolor: alpha(theme.palette.info.main, 0.08),
              display: { xs: 'none', md: 'flex' },
            }}
          >
            <Iconify icon="solar:arrow-down-bold" sx={{ color: 'info.main', fontSize: 16 }} />
            <Typography variant="caption" sx={{ color: 'info.dark' }}>
              {t('welcome_continue_setup')}
            </Typography>
          </Stack>
        )}
      </Stack>

      {img && (
        <Stack
          component="span"
          justifyContent="center"
          sx={{
            p: { xs: 5, md: 3 },
            maxWidth: isReturning ? 200 : 360,
            mx: 'auto',
          }}
        >
          {img}
        </Stack>
      )}
    </Stack>
  );
}

WelcomeNewUser.propTypes = {
  userName: PropTypes.string,
  productsCount: PropTypes.number,
  ordersCount: PropTypes.number,
  isNewUser: PropTypes.bool,
  showSetupHint: PropTypes.bool,
  img: PropTypes.node,
};

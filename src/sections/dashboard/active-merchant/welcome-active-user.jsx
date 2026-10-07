import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { fNumber, fCurrency } from 'src/utils/format-number';

import { bgGradient } from 'src/theme/css';

import Iconify from 'src/components/iconify';

// Height token — shared with ActionsRequired via CSS, not props
const ROW_MIN_HEIGHT = 88;

// ----------------------------------------------------------------------

export default function WelcomeActiveUser({ userName, ordersToday = 0, weeklyRevenue = 0 }) {
  const { t } = useTranslation();
  const theme = useTheme();

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      alignItems={{ xs: 'flex-start', sm: 'center' }}
      justifyContent="space-between"
      sx={{
        ...bgGradient({
          direction: '135deg',
          startColor: alpha(theme.palette.primary.light, 0.2),
          endColor: alpha(theme.palette.primary.main, 0.2),
        }),
        px: 3,
        py: 2.5,
        borderRadius: 2,
        minHeight: ROW_MIN_HEIGHT,
        height: '100%',
        color: 'primary.darker',
        backgroundColor: 'common.white',
      }}
    >
      <Stack spacing={0.25}>
        <Typography variant="h5" component="h1" sx={{ lineHeight: 1.3 }}>
          {t('welcome_back')} {userName}
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.72 }}>
          {today}
        </Typography>
      </Stack>

      <Stack direction="row" spacing={3} sx={{ mt: { xs: 1.5, sm: 0 } }}>
        <MiniStat
          icon="solar:cart-large-minimalistic-bold-duotone"
          value={fNumber(ordersToday)}
          label={t('new_orders_today')}
          color={theme.palette.primary.main}
        />
        <MiniStat
          icon="solar:dollar-minimalistic-bold-duotone"
          value={fCurrency(weeklyRevenue)}
          label={t('revenue_this_week')}
          color={theme.palette.info.main}
        />
      </Stack>
    </Stack>
  );
}

WelcomeActiveUser.propTypes = {
  userName: PropTypes.string,
  ordersToday: PropTypes.number,
  weeklyRevenue: PropTypes.number,
};

// ----------------------------------------------------------------------

function MiniStat({ icon, value, label, color }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <Box
        sx={{
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 1,
          bgcolor: alpha(color, 0.16),
          flexShrink: 0,
        }}
      >
        <Iconify icon={icon} width={18} sx={{ color }} />
      </Box>
      <Stack spacing={0}>
        <Typography variant="subtitle2" sx={{ lineHeight: 1.3 }}>
          {value || '0'}
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.72, whiteSpace: 'nowrap', lineHeight: 1.3 }}>
          {label}
        </Typography>
      </Stack>
    </Stack>
  );
}

MiniStat.propTypes = {
  icon: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  label: PropTypes.string,
  color: PropTypes.string,
};

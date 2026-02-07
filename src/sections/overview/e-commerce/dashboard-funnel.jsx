import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';
import { alpha, useTheme } from '@mui/material/styles';

import { fNumber, fPercent } from 'src/utils/format-number';

// ----------------------------------------------------------------------

const FUNNEL_KEYS = {
  $pageview: 'page_views',
  product_viewed: 'product_viewed',
  add_to_cart: 'add_to_cart',
  checkout_started: 'checkout_started',
  order_completed: 'order_completed',
};

const COLOR_KEYS = ['primary', 'info', 'warning', 'error', 'success'];

// ----------------------------------------------------------------------

export default function DashboardFunnel({ funnel, loading }) {
  const { t } = useTranslation();
  const theme = useTheme();

  if (loading) {
    return (
      <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={32} />
      </Card>
    );
  }

  if (!funnel || funnel.length === 0) {
    return (
      <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          {t('no_funnel_data')}
        </Typography>
      </Card>
    );
  }

  const maxCount = funnel[0]?.count || 1;

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title={t('analytics_conversion_funnel')}
        titleTypographyProps={{ variant: 'subtitle1' }}
        sx={{ pb: 1 }}
      />

      <Stack spacing={2} sx={{ px: 3, pb: 3, flexGrow: 1 }}>
        {funnel.map((step, index) => {
          const prevCount = index > 0 ? funnel[index - 1].count : step.count;
          const conversionRate = prevCount > 0 ? (step.count / prevCount) * 100 : 0;
          const totalRate = (step.count / maxCount) * 100;
          const color = theme.palette[COLOR_KEYS[index % COLOR_KEYS.length]].main;

          return (
            <Box key={step.name}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                <Typography variant="caption" fontWeight={600} noWrap>
                  {t(FUNNEL_KEYS[step.name] || step.name)}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Typography variant="caption" fontWeight={700}>
                    {fNumber(step.count)}
                  </Typography>
                  {index > 0 && (
                    <Typography
                      variant="caption"
                      sx={{
                        px: 0.5,
                        borderRadius: 0.5,
                        fontSize: '0.6rem',
                        bgcolor: alpha(color, 0.12),
                        color,
                      }}
                    >
                      {fPercent(conversionRate)}
                    </Typography>
                  )}
                </Stack>
              </Stack>

              <LinearProgress
                variant="determinate"
                value={totalRate}
                sx={{
                  height: 6,
                  borderRadius: 1,
                  bgcolor: alpha(color, 0.12),
                  '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 1 },
                }}
              />
            </Box>
          );
        })}
      </Stack>
    </Card>
  );
}

DashboardFunnel.propTypes = {
  funnel: PropTypes.array,
  loading: PropTypes.bool,
};

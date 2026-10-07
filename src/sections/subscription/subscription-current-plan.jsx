import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { useTranslate } from 'src/locales';
import { fDate } from 'src/utils/format-time';
import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import { bgGradient } from 'src/theme/css';

import { useGetCurrentSubscription } from 'src/api/subscriptions';

// ----------------------------------------------------------------------

const STATUS_COLORS = {
  active: 'success',
  grace: 'warning',
  frozen: 'error',
  expired: 'error',
  trial: 'info',
};

// ----------------------------------------------------------------------

export default function SubscriptionCurrentPlan() {
  const { t } = useTranslate();
  const router = useRouter();
  const theme = useTheme();
  const { subscription, subscriptionLoading } = useGetCurrentSubscription();

  if (subscriptionLoading) {
    return null;
  }

  const packageName = subscription?.package?.name || t('subscription_status_payg');
  const status = subscription?.status || 'payg';
  const endsAt = subscription?.ends_at;
  const daysLeft = subscription?.days_until_expiry;
  const hasDaysLeft = typeof daysLeft === 'number' && daysLeft >= 0;
  const statusColor = STATUS_COLORS[status] || 'primary';
  const isFreePlan = ['payg', 'free-trial'].includes(subscription?.package?.slug);

  return (
    <Box
      sx={{
        ...bgGradient({
          direction: '135deg',
          startColor: alpha(theme.palette.primary.light, 0.2),
          endColor: alpha(theme.palette.primary.main, 0.2),
        }),
        backgroundColor: 'common.white',
        borderRadius: 2,
        p: { xs: 3, md: 5 },
        position: 'relative',
        overflow: 'hidden',
        color: 'primary.darker',
      }}
    >
      {/* Decorative circles */}
      <Box
        sx={{
          position: 'absolute',
          top: -40,
          right: theme.direction === 'rtl' ? 'auto' : -20,
          left: theme.direction === 'rtl' ? -20 : 'auto',
          width: 200,
          height: 200,
          borderRadius: '50%',
          bgcolor: alpha(theme.palette.primary.main, 0.08),
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -60,
          right: theme.direction === 'rtl' ? 'auto' : 120,
          left: theme.direction === 'rtl' ? 120 : 'auto',
          width: 140,
          height: 140,
          borderRadius: '50%',
          bgcolor: alpha(theme.palette.primary.main, 0.06),
        }}
      />

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        alignItems={{ md: 'center' }}
        justifyContent="space-between"
        spacing={3}
        sx={{ position: 'relative', zIndex: 1 }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              flexShrink: 0,
            }}
          >
            <Iconify icon="solar:crown-bold" width={32} sx={{ color: 'primary.dark' }} />
          </Box>

          <Stack spacing={0.5}>
            <Typography variant="overline" sx={{ opacity: 0.72, letterSpacing: 1.2 }}>
              {t('subscription_current_plan')}
            </Typography>

            <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
              <Typography variant="h3" sx={{ lineHeight: 1.2 }}>
                {packageName}
              </Typography>
              <Label color={statusColor}>{t(`subscription_status_${status}`)}</Label>
            </Stack>

            {subscription?.package?.billing_cycle && (
              <Typography variant="body2" sx={{ opacity: 0.72 }}>
                / {t(`billing_cycle_${subscription.package.billing_cycle}`)}
              </Typography>
            )}

            {endsAt && (
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 1, flexWrap: 'wrap', gap: 1 }}>
                {hasDaysLeft && (
                  <Label
                    color={daysLeft <= 3 ? 'error' : daysLeft <= 7 ? 'warning' : 'info'}
                    startIcon={<Iconify icon="solar:clock-circle-bold" width={14} />}
                  >
                    {daysLeft === 0
                      ? t('subscription_expires_today')
                      : t('subscription_days_remaining', { count: daysLeft })}
                  </Label>
                )}
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Iconify icon="solar:calendar-linear" width={16} sx={{ opacity: 0.64 }} />
                  <Typography variant="caption" sx={{ opacity: 0.72 }}>
                    {status === 'active' && !isFreePlan
                      ? t('subscription_renews_on')
                      : t('subscription_expires_on')}
                    :{' '}
                    <Box component="strong" sx={{ fontWeight: 700 }}>
                      {fDate(endsAt)}
                    </Box>
                  </Typography>
                </Stack>
              </Stack>
            )}
          </Stack>
        </Stack>

        <Button
          variant="contained"
          size="large"
          startIcon={<Iconify icon="solar:arrow-up-bold" />}
          onClick={() => router.push(paths.dashboard.subscription.checkout)}
          sx={{
            px: 3,
            flexShrink: 0,
            boxShadow: theme.customShadows?.primary,
          }}
        >
          {t('subscription_upgrade')}
        </Button>
      </Stack>
    </Box>
  );
}

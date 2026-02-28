import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { useTranslate } from 'src/locales';
import { fDate } from 'src/utils/format-time';
import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';

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
  const { subscription, subscriptionLoading } = useGetCurrentSubscription();

  if (subscriptionLoading) {
    return null;
  }

  const packageName = subscription?.package?.name || t('subscription_status_payg');
  const status = subscription?.status || 'payg';
  const endsAt = subscription?.ends_at;
  const startsAt = subscription?.starts_at;

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">{t('subscription_current_plan')}</Typography>
            <Label color={STATUS_COLORS[status] || 'default'}>
              {t(`subscription_status_${status}`)}
            </Label>
          </Stack>

          <Stack direction="row" alignItems="baseline" spacing={1}>
            <Typography variant="h4">{packageName}</Typography>
            {subscription?.package?.billing_cycle && (
              <Typography variant="body2" color="text.secondary">
                / {t(`billing_cycle_${subscription.package.billing_cycle}`)}
              </Typography>
            )}
          </Stack>

          {endsAt && (
            <Stack direction="row" spacing={0.5}>
              <Typography variant="body2" color="text.secondary">
                {status === 'active' ? t('subscription_renews_on') : t('subscription_expires_on')}:
              </Typography>
              <Typography variant="body2">{fDate(endsAt)}</Typography>
            </Stack>
          )}

          <Box>
            <Button
              variant="contained"
              size="small"
              startIcon={<Iconify icon="solar:arrow-up-bold" />}
              onClick={() => router.push(paths.dashboard.subscription.checkout)}
            >
              {t('subscription_upgrade')}
            </Button>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

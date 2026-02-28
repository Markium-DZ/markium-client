import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import LinearProgress from '@mui/material/LinearProgress';

import { useTranslate } from 'src/locales';

import { useGetCurrentSubscription } from 'src/api/subscriptions';

// ----------------------------------------------------------------------

export default function SubscriptionUsage() {
  const { t } = useTranslate();
  const { subscription, subscriptionLoading } = useGetCurrentSubscription();

  if (subscriptionLoading || !subscription) {
    return null;
  }

  const features = subscription?.package?.features || [];
  const limitedFeatures = features.filter(
    (f) => f.enabled && f.limit && f.limit.count > 0
  );

  if (limitedFeatures.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 3 }}>
          {t('usage_of')}
        </Typography>

        <Stack spacing={3}>
          {limitedFeatures.map((feature) => {
            const used = feature.usage ?? 0;
            const limit = feature.limit.count;
            const isUnlimited = limit === -1;
            const progress = isUnlimited ? 0 : Math.min((used / limit) * 100, 100);

            return (
              <Stack key={feature.name} spacing={1}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2">
                    {t(`feature_${feature.name}`) || feature.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {isUnlimited
                      ? t('usage_unlimited')
                      : `${used} ${t('usage_of')} ${limit}`}
                  </Typography>
                </Stack>
                {!isUnlimited && (
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    color={progress > 90 ? 'error' : progress > 70 ? 'warning' : 'primary'}
                    sx={{ height: 8, borderRadius: 1 }}
                  />
                )}
              </Stack>
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );
}

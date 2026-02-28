import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';
import { useTranslate } from 'src/locales';
import { useGetSubscriptionPackages, useGetCurrentSubscription } from 'src/api/subscriptions';
import Iconify from 'src/components/iconify';

// Map tier names to package slug prefixes for highlighting
const TIER_PACKAGE_PREFIX = {
  medium: 'pro',
  advanced: 'business',
};

// ----------------------------------------------------------------------

export default function AnalyticsUpgradeModal({ open, onClose, requiredTier }) {
  const { t } = useTranslate();
  const router = useRouter();
  const { packages } = useGetSubscriptionPackages();
  const { subscription } = useGetCurrentSubscription();

  const currentPackageSlug = subscription?.package?.slug || null;
  const suggestedPrefix = TIER_PACKAGE_PREFIX[requiredTier] || 'pro';

  // Find the cheapest matching package (monthly)
  const suggestedPackage = packages.find(
    (pkg) => pkg.slug.startsWith(suggestedPrefix) && pkg.billing_cycle === 'monthly'
  );

  const handleSubscribe = (packageSlug) => {
    onClose();
    router.push(`${paths.dashboard.subscription.checkout}?package=${packageSlug}`);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('analytics_upgrade_to_unlock')}</DialogTitle>

      <DialogContent>
        <Stack spacing={3}>
          {/* Current plan */}
          {currentPackageSlug && (
            <Stack>
              <Typography variant="overline" color="text.secondary">
                {t('subscription_current_plan')}
              </Typography>
              <Typography variant="subtitle1">
                {subscription?.package?.name || t('analytics_tier_basic')}
              </Typography>
            </Stack>
          )}

          {/* Suggested plan */}
          {suggestedPackage && (
            <Stack>
              <Typography variant="overline" color="text.secondary">
                {t('subscription_recommended')}
              </Typography>
              <Typography variant="h5">
                {suggestedPackage.name}
                <Chip
                  label={`${suggestedPackage.price} ${suggestedPackage.currency}/${t(`billing_cycle_${suggestedPackage.billing_cycle}`)}`}
                  size="small"
                  color="primary"
                  sx={{ ml: 1 }}
                />
              </Typography>

              {/* Feature list from package data */}
              <List dense>
                {suggestedPackage.features
                  ?.filter((f) => f.enabled)
                  .slice(0, 8)
                  .map((feature) => (
                    <ListItem key={feature.name} disableGutters>
                      <ListItemIcon sx={{ minWidth: 28 }}>
                        <Iconify icon="solar:check-circle-bold" width={18} color="success.main" />
                      </ListItemIcon>
                      <ListItemText primary={t(`feature_${feature.name}`) || feature.name} />
                    </ListItem>
                  ))}
              </List>
            </Stack>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit">
          {t('cancel')}
        </Button>
        {suggestedPackage && (
          <Button variant="contained" onClick={() => handleSubscribe(suggestedPackage.slug)}>
            {t('subscribe')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

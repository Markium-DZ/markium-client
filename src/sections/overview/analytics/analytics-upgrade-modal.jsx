import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Stack,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';
import { useTranslate } from 'src/locales';
import { useGetSubscriptionPackages, useGetCurrentSubscription } from 'src/api/subscriptions';
import Iconify from 'src/components/iconify';
import { bgGradient } from 'src/theme/css';

// Map tier names to package slug prefixes for highlighting
const TIER_PACKAGE_PREFIX = {
  medium: 'pro',
  advanced: 'business',
};

// ----------------------------------------------------------------------

export default function AnalyticsUpgradeModal({ open, onClose, requiredTier }) {
  const { t } = useTranslate();
  const router = useRouter();
  const theme = useTheme();
  const { packages } = useGetSubscriptionPackages();
  const { subscription } = useGetCurrentSubscription();

  const currentPackageSlug = subscription?.package?.slug || null;
  const suggestedPrefix = TIER_PACKAGE_PREFIX[requiredTier] || 'pro';

  // Find the cheapest matching package (monthly)
  const suggestedPackage = packages.find(
    (pkg) => pkg.slug.startsWith(suggestedPrefix) && pkg.billing_cycle === 'monthly'
  );

  const features = suggestedPackage?.features?.filter((f) => f.enabled).slice(0, 8) || [];

  const handleSubscribe = (packageSlug) => {
    onClose();
    router.push(`${paths.dashboard.subscription.checkout}?package=${packageSlug}`);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, overflow: 'hidden' },
      }}
    >
      {/* Header with gradient */}
      <Box
        sx={{
          ...bgGradient({
            direction: '135deg',
            startColor: alpha(theme.palette.primary.light, 0.2),
            endColor: alpha(theme.palette.primary.main, 0.2),
          }),
          backgroundColor: 'common.white',
          position: 'relative',
          overflow: 'hidden',
          px: 3,
          pt: 4,
          pb: 3,
        }}
      >
        {/* Decorative circle */}
        <Box
          sx={{
            position: 'absolute',
            top: -30,
            right: theme.direction === 'rtl' ? 'auto' : -30,
            left: theme.direction === 'rtl' ? -30 : 'auto',
            width: 120,
            height: 120,
            borderRadius: '50%',
            bgcolor: alpha(theme.palette.primary.main, 0.08),
          }}
        />

        {/* Close button */}
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 8,
            right: theme.direction === 'rtl' ? 'auto' : 8,
            left: theme.direction === 'rtl' ? 8 : 'auto',
            zIndex: 1,
          }}
        >
          <Iconify icon="mingcute:close-line" width={20} />
        </IconButton>

        <Stack direction="row" alignItems="center" spacing={2} sx={{ position: 'relative', zIndex: 1 }}>
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              flexShrink: 0,
            }}
          >
            <Iconify icon="solar:lock-keyhole-unlock-bold" width={28} sx={{ color: 'primary.dark' }} />
          </Box>
          <Stack>
            <Typography variant="h5" color="primary.darker">
              {t('analytics_upgrade_to_unlock')}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.72, color: 'primary.darker' }}>
              {t('analytics_unlock_description') || ''}
            </Typography>
          </Stack>
        </Stack>
      </Box>

      <DialogContent sx={{ px: 3, pt: 3, pb: 1 }}>
        <Stack spacing={3}>
          {/* Plan comparison */}
          <Stack spacing={2}>
            {/* Current plan */}
            {currentPackageSlug && (
              <Box
                sx={{
                  p: 2,
                  borderRadius: 1.5,
                  bgcolor: 'background.neutral',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>
                      {t('subscription_current_plan')}
                    </Typography>
                    <Typography variant="subtitle1">
                      {subscription?.package?.name || t('analytics_tier_basic')}
                    </Typography>
                  </Stack>
                  <Iconify icon="solar:shield-check-bold" width={24} sx={{ color: 'text.disabled' }} />
                </Stack>
              </Box>
            )}

            {/* Arrow between plans */}
            {currentPackageSlug && suggestedPackage && (
              <Stack alignItems="center">
                <Iconify
                  icon="solar:arrow-down-bold"
                  width={20}
                  sx={{ color: 'primary.main', opacity: 0.6 }}
                />
              </Stack>
            )}

            {/* Suggested plan */}
            {suggestedPackage && (
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.primary.main, 0.04),
                  border: '2px solid',
                  borderColor: 'primary.main',
                  position: 'relative',
                }}
              >
                <Stack spacing={1.5}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                    <Stack>
                      <Typography variant="caption" color="primary.main" sx={{ textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 700 }}>
                        {t('subscription_recommended')}
                      </Typography>
                      <Typography variant="h5">
                        {suggestedPackage.name}
                      </Typography>
                    </Stack>
                    <Chip
                      label={`${suggestedPackage.price} ${suggestedPackage.currency}/${t(`billing_cycle_${suggestedPackage.billing_cycle}`)}`}
                      color="primary"
                      sx={{ fontWeight: 600 }}
                    />
                  </Stack>

                  {/* Feature list */}
                  {features.length > 0 && (
                    <List dense disablePadding>
                      {features.map((feature) => (
                        <ListItem key={feature.name} disableGutters sx={{ py: 0.25 }}>
                          <ListItemIcon sx={{ minWidth: 28 }}>
                            <Iconify icon="solar:check-circle-bold" width={18} color="success.main" />
                          </ListItemIcon>
                          <ListItemText
                            primary={t(`feature_${feature.name}`) || feature.name}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Stack>
              </Box>
            )}
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
        <Button onClick={onClose} color="inherit" sx={{ mr: 1 }}>
          {t('cancel')}
        </Button>
        {suggestedPackage && (
          <Button
            variant="contained"
            size="large"
            onClick={() => handleSubscribe(suggestedPackage.slug)}
            startIcon={<Iconify icon="solar:arrow-up-bold" />}
            sx={{
              px: 4,
              boxShadow: theme.customShadows?.primary,
            }}
          >
            {t('subscribe')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

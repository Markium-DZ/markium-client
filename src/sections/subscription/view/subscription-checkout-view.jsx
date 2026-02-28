import { useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { alpha, useTheme } from '@mui/material/styles';

import { useTranslate } from 'src/locales';
import { fCurrency } from 'src/utils/format-number';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';
import { useSettingsContext } from 'src/components/settings';

import {
  checkoutSubscription,
  useGetSubscriptionPackages,
  useGetCurrentSubscription,
} from 'src/api/subscriptions';

// Curated features for pricing display (marketing-optimized, not exhaustive)
const PRO_FEATURES = [
  'unlimited_products_orders',
  'shipping_integrations',
  'shipping_tracking',
  'store_customization',
  'analytics',
  'fake_order_protection',
];

// Business-only extras (shown under "Everything in Pro, plus:")
const BUSINESS_EXTRAS = [
  'advanced_analytics',
  'priority_support',
];

// Group packages by tier name (e.g., "pro" or "business")
function groupByTier(packages) {
  const tiers = {};

  packages.forEach((pkg) => {
    // Extract tier name: "pro-monthly" -> "pro", "business-yearly" -> "business"
    const tierName = pkg.slug.replace(/-(monthly|yearly)$/, '');

    if (!tiers[tierName]) {
      tiers[tierName] = { name: tierName, monthly: null, yearly: null };
    }

    if (pkg.billing_cycle === 'monthly') {
      tiers[tierName].monthly = pkg;
    } else if (pkg.billing_cycle === 'yearly') {
      tiers[tierName].yearly = pkg;
    }
  });

  return Object.values(tiers);
}

// ----------------------------------------------------------------------

export default function SubscriptionCheckoutView() {
  const { t } = useTranslate();
  const theme = useTheme();
  const settings = useSettingsContext();
  const { enqueueSnackbar } = useSnackbar();

  const [searchParams] = useSearchParams();
  const preselectedPackage = searchParams.get('package');

  const { packages, packagesLoading, packagesEmpty } = useGetSubscriptionPackages();
  const { subscription, subscriptionLoading } = useGetCurrentSubscription();

  const paidPackages = packages.filter((pkg) => pkg.price > 0);
  const tiers = useMemo(() => groupByTier(paidPackages), [paidPackages]);

  const [billingCycle, setBillingCycle] = useState('monthly');
  const [loadingPackage, setLoadingPackage] = useState(null);

  const handleCycleChange = useCallback((_, newCycle) => {
    if (newCycle !== null) {
      setBillingCycle(newCycle);
    }
  }, []);

  const handleCheckout = useCallback(async (pkg) => {
    setLoadingPackage(pkg.slug);
    try {
      const response = await checkoutSubscription({ package_slug: pkg.slug });
      if (response?.data?.checkout_url) {
        window.location.href = response.data.checkout_url;
      }
    } catch (error) {
      const message = error?.error?.message || error?.message || t('operation_failed');
      enqueueSnackbar(message, { variant: 'error' });
      setLoadingPackage(null);
    }
  }, [enqueueSnackbar, t]);

  const getPackageName = (pkg) => {
    if (!pkg) return '';
    const translationKey = `package_${pkg.slug}`;
    const translated = t(translationKey);
    return translated !== translationKey ? translated : pkg.name;
  };

  const getTierLabel = (tierName) => {
    const key = `tier_${tierName}`;
    const translated = t(key);
    return translated !== key ? translated : tierName.charAt(0).toUpperCase() + tierName.slice(1);
  };

  const getFeatureLabel = (featureName) => {
    const key = `feature_${featureName}`;
    const translated = t(key);
    return translated !== key ? translated : featureName.replace(/_/g, ' ');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'expired': return 'error';
      case 'canceled': return 'default';
      case 'trial': return 'info';
      default: return 'warning';
    }
  };

  // Calculate yearly savings
  const getYearlySavings = (tier) => {
    if (!tier.monthly || !tier.yearly) return null;
    const monthlyAnnualized = tier.monthly.price * 12;
    const yearlyPrice = tier.yearly.price;
    const savings = monthlyAnnualized - yearlyPrice;
    if (savings <= 0) return null;
    const percent = Math.round((savings / monthlyAnnualized) * 100);
    return { amount: savings, percent };
  };

  // Check if any tier has yearly savings
  const hasAnySavings = useMemo(
    () => tiers.some((tier) => getYearlySavings(tier) !== null),
    [tiers]
  );

  // Determine the most feature-rich tier for "recommended" badge
  const recommendedTierIndex = useMemo(() => {
    if (tiers.length <= 1) return 0;
    let maxFeatures = 0;
    let maxIndex = 0;
    tiers.forEach((tier, index) => {
      const pkg = tier.monthly || tier.yearly;
      const count = pkg?.features?.length || 0;
      if (count > maxFeatures) {
        maxFeatures = count;
        maxIndex = index;
      }
    });
    return maxIndex;
  }, [tiers]);

  // Render loading
  if (packagesLoading) {
    return (
      <Container maxWidth={settings.themeStretch ? false : 'lg'}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Render empty
  if (!packagesLoading && (packagesEmpty || paidPackages.length === 0)) {
    return (
      <Container maxWidth={settings.themeStretch ? false : 'lg'}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            {t('no_packages_available')}
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      {/* Header */}
      <Stack alignItems="center" sx={{ mb: 5 }}>
        <Typography variant="h4" sx={{ mb: 1 }}>
          {t('pricing_choose_plan')}
        </Typography>

        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3, textAlign: 'center' }}>
          {t('pricing_subtitle')}
        </Typography>

        {/* Current subscription badge */}
        {!subscriptionLoading && subscription && (
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('current_subscription')}:
            </Typography>
            <Typography variant="subtitle2">
              {subscription.package ? getPackageName(subscription.package) : t('subscription_status_payg')}
            </Typography>
            <Label color={getStatusColor(subscription.status)}>{t(subscription.status)}</Label>
          </Stack>
        )}

        {/* Billing cycle toggle */}
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <ToggleButtonGroup
            exclusive
            value={billingCycle}
            onChange={handleCycleChange}
            sx={{
              bgcolor: alpha(theme.palette.grey[500], 0.08),
              borderRadius: 2,
              p: 0.5,
              '& .MuiToggleButton-root': {
                border: 'none',
                borderRadius: '12px !important',
                px: 3.5,
                py: 1.2,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: 15,
                color: 'text.disabled',
                '&.Mui-selected': {
                  bgcolor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                  boxShadow: theme.customShadows?.z8 || theme.shadows[3],
                  '&:hover': {
                    bgcolor: theme.palette.primary.dark,
                  },
                },
              },
            }}
          >
            <ToggleButton value="monthly">{t('monthly')}</ToggleButton>
            <ToggleButton value="yearly">
              <Stack direction="row" alignItems="center" spacing={1}>
                <span>{t('yearly')}</span>
                {hasAnySavings && (
                  <Chip
                    label={`-20%`}
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: 11,
                      fontWeight: 700,
                      bgcolor: billingCycle === 'yearly'
                        ? theme.palette.common.white
                        : theme.palette.success.main,
                      color: billingCycle === 'yearly'
                        ? theme.palette.primary.main
                        : theme.palette.success.contrastText,
                    }}
                  />
                )}
              </Stack>
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Stack>

      {/* Plan Cards Grid */}
      <Box
        gap={3}
        display="grid"
        gridTemplateColumns={{
          xs: 'repeat(1, 1fr)',
          md: `repeat(${Math.min(tiers.length, 3)}, 1fr)`,
        }}
        sx={{ maxWidth: tiers.length <= 2 ? 800 : '100%', mx: 'auto' }}
      >
        {tiers.map((tier, index) => {
          const pkg = billingCycle === 'monthly' ? tier.monthly : tier.yearly;
          if (!pkg) return null;

          const isRecommended = index === recommendedTierIndex;
          const isPreselected = preselectedPackage && pkg.slug === preselectedPackage;
          const savings = getYearlySavings(tier);
          const isBusiness = tier.name === 'business';
          const monthlyEquivalent = billingCycle === 'yearly' && tier.monthly
            ? Math.round(pkg.price / 12)
            : null;
          const isCurrentPlan = subscription?.package?.slug === pkg.slug;

          return (
            <Card
              key={tier.name}
              sx={{
                p: 0,
                overflow: 'visible',
                position: 'relative',
                border: `1px solid ${alpha(theme.palette.grey[500], 0.16)}`,
                ...(isRecommended && {
                  border: `2px solid ${theme.palette.primary.main}`,
                  boxShadow: `0 0 0 1px ${alpha(theme.palette.primary.main, 0.16)}`,
                }),
                ...(isPreselected && {
                  border: `2px solid ${theme.palette.primary.main}`,
                  boxShadow: `0 0 0 1px ${alpha(theme.palette.primary.main, 0.16)}`,
                }),
              }}
            >
              {/* Recommended badge */}
              {isRecommended && (
                <Chip
                  icon={<Iconify icon="solar:star-bold" width={16} />}
                  label={t('subscription_recommended')}
                  color="primary"
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: -14,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    height: 28,
                    px: 1,
                    fontSize: 13,
                    fontWeight: 700,
                    zIndex: 1,
                    '& .MuiChip-icon': {
                      fontSize: 16,
                      color: 'inherit',
                    },
                  }}
                />
              )}

              <Stack sx={{ p: 4 }}>
                {/* Tier name */}
                <Typography variant="h5" sx={{ mb: 0.5 }}>
                  {getTierLabel(tier.name)}
                </Typography>

                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                  {t(`tier_${tier.name}_description`)}
                </Typography>

                {/* Price */}
                <Stack direction="row" alignItems="baseline" sx={{ mb: 1 }}>
                  <Typography variant="h2" component="span">
                    {fCurrency(billingCycle === 'yearly' && monthlyEquivalent ? monthlyEquivalent : pkg.price)}
                  </Typography>
                  <Typography
                    variant="body2"
                    component="span"
                    sx={{ color: 'text.secondary', ml: 0.5 }}
                  >
                    / {billingCycle === 'yearly' && monthlyEquivalent ? t('mo') : (billingCycle === 'monthly' ? t('mo') : t('yr'))}
                  </Typography>
                </Stack>

                {/* Yearly total + savings */}
                {billingCycle === 'yearly' && (
                  <Stack spacing={0.5} sx={{ mb: 2 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {t('pricing_billed_yearly', { amount: fCurrency(pkg.price) })}
                    </Typography>
                    {savings && (
                      <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>
                        {t('pricing_you_save', { amount: fCurrency(savings.amount), percent: savings.percent })}
                      </Typography>
                    )}
                  </Stack>
                )}

                {billingCycle === 'monthly' && <Box sx={{ mb: 2 }} />}

                {/* CTA button */}
                <Button
                  fullWidth
                  size="large"
                  variant={isRecommended ? 'contained' : 'outlined'}
                  onClick={() => handleCheckout(pkg)}
                  disabled={loadingPackage === pkg.slug || isCurrentPlan}
                  sx={{ mb: 3 }}
                >
                  {loadingPackage === pkg.slug ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : isCurrentPlan ? (
                    t('pricing_current_plan')
                  ) : (
                    t('subscribe_now')
                  )}
                </Button>

                <Divider sx={{ mb: 3 }} />

                {/* Features list */}
                <Typography variant="overline" sx={{ color: 'text.secondary', mb: 2 }}>
                  {isBusiness ? t('pricing_everything_in_pro') : t('pricing_whats_included')}
                </Typography>

                <Stack spacing={1.5}>
                  {(isBusiness ? BUSINESS_EXTRAS : PRO_FEATURES).map((featureName) => (
                    <Stack key={featureName} direction="row" alignItems="center" spacing={1.5}>
                      <Iconify
                        icon="solar:check-circle-bold"
                        width={20}
                        sx={{ color: isBusiness ? 'success.main' : 'primary.main', flexShrink: 0 }}
                      />
                      <Typography variant="body2" sx={{ ...(isBusiness && { fontWeight: 600 }) }}>
                        {getFeatureLabel(featureName)}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Stack>

              {/* Secure payment footer */}
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="center"
                spacing={0.5}
                sx={{
                  py: 2,
                  borderTop: `1px dashed ${alpha(theme.palette.grey[500], 0.24)}`,
                }}
              >
                <Iconify icon="solar:shield-check-bold" width={16} sx={{ color: 'success.main' }} />
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {t('secure_payment')}
                </Typography>
              </Stack>
            </Card>
          );
        })}
      </Box>

      {/* Bottom note */}
      <Typography
        variant="caption"
        sx={{ display: 'block', textAlign: 'center', color: 'text.disabled', mt: 3 }}
      >
        * {t('plus_applicable_taxes')}
      </Typography>
    </Container>
  );
}

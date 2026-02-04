import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';
import { fDate } from 'src/utils/format-time';
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

// ----------------------------------------------------------------------

export default function SubscriptionCheckoutView() {
  const { t } = useTranslate();
  const settings = useSettingsContext();
  const { enqueueSnackbar } = useSnackbar();

  const { packages, packagesLoading, packagesEmpty } = useGetSubscriptionPackages();
  const { subscription, subscriptionLoading } = useGetCurrentSubscription();

  // Filter out free packages
  const paidPackages = packages.filter((pkg) => pkg.price > 0);

  const [loadingPackage, setLoadingPackage] = useState(null);

  const handleCheckout = useCallback(async (pkg) => {
    setLoadingPackage(pkg.slug);

    try {
      const response = await checkoutSubscription({
        package_slug: pkg.slug,
      });

      // Redirect to the checkout URL from the payment gateway
      if (response?.data?.checkout_url) {
        window.location.href = response.data.checkout_url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      const message = error?.error?.message || error?.message || t('operation_failed');
      enqueueSnackbar(message, { variant: 'error' });
      setLoadingPackage(null);
    }
  }, [enqueueSnackbar, t]);

  const renderLoading = (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
      <CircularProgress />
    </Box>
  );

  const renderEmpty = (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
      <Typography variant="body1" sx={{ color: 'text.secondary' }}>
        {t('no_packages_available')}
      </Typography>
    </Box>
  );

  const getBillingCycleLabel = (cycle) => {
    if (cycle === 'monthly') return t('monthly');
    if (cycle === 'yearly') return t('yearly');
    return cycle;
  };

  const getPackageName = (pkg) => {
    if (!pkg) return '';
    // Check if there's a translation key for the package name
    const translationKey = `package_${pkg.slug}`;
    const translated = t(translationKey);
    // If translation exists (not equal to the key), use it; otherwise use original name
    return translated !== translationKey ? translated : pkg.name;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'expired':
        return 'error';
      case 'canceled':
        return 'default';
      case 'trial':
        return 'info';
      default:
        return 'warning';
    }
  };

  const renderCurrentSubscription = () => {
    if (subscriptionLoading || !subscription) {
      return null;
    }

    return (
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('current_subscription')}:
        </Typography>
        <Typography variant="subtitle2">
          {subscription.package ? getPackageName(subscription.package) : '-'}
        </Typography>
        <Label color={getStatusColor(subscription.status)}>{t(subscription.status)}</Label>
        {subscription.ends_at && (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            ({t('ends')}: {fDate(subscription.ends_at)})
          </Typography>
        )}
      </Stack>
    );
  };

  const renderPackageCard = (pkg) => (
    <Box
      key={pkg.id || pkg.slug}
      sx={{
        p: 4,
        borderRadius: 2,
        bgcolor: 'background.neutral',
      }}
    >
      <Typography variant="h6" sx={{ mb: 4 }}>
        {getPackageName(pkg)}
      </Typography>

      <Stack spacing={2.5}>
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('subscription')}
          </Typography>
          <Label color="primary">{getPackageName(pkg)}</Label>
        </Stack>

        <Stack direction="row" justifyContent="space-between">
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('billing_cycle')}
          </Typography>
          <Typography variant="body2">{getBillingCycleLabel(pkg.billing_cycle)}</Typography>
        </Stack>

        {/* Price Display */}
        <Stack direction="row" justifyContent="flex-end" alignItems="baseline">
          <Typography variant="h2">{fCurrency(pkg.price)}</Typography>
          <Typography
            component="span"
            sx={{
              alignSelf: 'center',
              color: 'text.disabled',
              ml: 1,
              typography: 'body2',
            }}
          >
            / {pkg.billing_cycle === 'monthly' ? t('mo') : t('yr')}
          </Typography>
        </Stack>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="subtitle1">{t('total_billed')}</Typography>
          <Typography variant="subtitle1">{fCurrency(pkg.price)} DZD</Typography>
        </Stack>

        <Divider sx={{ borderStyle: 'dashed' }} />
      </Stack>

      <Typography component="div" variant="caption" sx={{ color: 'text.secondary', mt: 1 }}>
        * {t('plus_applicable_taxes')}
      </Typography>

      <Button
        fullWidth
        size="large"
        variant="contained"
        sx={{ mt: 4, mb: 3 }}
        onClick={() => handleCheckout(pkg)}
        disabled={loadingPackage === pkg.slug}
      >
        {loadingPackage === pkg.slug ? (
          <CircularProgress size={24} color="inherit" />
        ) : (
          t('subscribe_now')
        )}
      </Button>

      <Stack alignItems="center" spacing={1}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Iconify icon="solar:shield-check-bold" sx={{ color: 'success.main' }} />
          <Typography variant="subtitle2">{t('secure_payment')}</Typography>
        </Stack>

        <Typography variant="caption" sx={{ color: 'text.disabled', textAlign: 'center' }}>
          {t('secure_payment_description')}
        </Typography>
      </Stack>
    </Box>
  );

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <Typography variant="h4" sx={{ mb: 5 }}>
        {t('subscription_checkout')}
      </Typography>

      {renderCurrentSubscription()}

      {packagesLoading && renderLoading}

      {!packagesLoading && (packagesEmpty || paidPackages.length === 0) && renderEmpty}

      {!packagesLoading && paidPackages.length > 0 && (
        <Box
          gap={3}
          display="grid"
          gridTemplateColumns={{
            xs: 'repeat(1, 1fr)',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
          }}
        >
          {paidPackages.map((pkg) => renderPackageCard(pkg))}
        </Box>
      )}
    </Container>
  );
}

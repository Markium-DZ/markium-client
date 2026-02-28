import Grid from '@mui/material/Unstable_Grid2';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';
import { useSettingsContext } from 'src/components/settings';

import SubscriptionCurrentPlan from '../subscription-current-plan';
import SubscriptionUsage from '../subscription-usage';
import SubscriptionWallet from '../subscription-wallet';
import SubscriptionAddons from '../subscription-addons';

// ----------------------------------------------------------------------

export default function SubscriptionBillingView() {
  const { t } = useTranslate();
  const settings = useSettingsContext();

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <Typography variant="h4" sx={{ mb: { xs: 3, md: 5 } }}>
        {t('subscription_current_plan')}
      </Typography>

      <Grid container spacing={3}>
        {/* Current Plan */}
        <Grid xs={12} md={8}>
          <SubscriptionCurrentPlan />
        </Grid>

        {/* Usage */}
        <Grid xs={12} md={4}>
          <SubscriptionUsage />
        </Grid>

        {/* Wallet */}
        <Grid xs={12} md={6}>
          <SubscriptionWallet />
        </Grid>

        {/* Add-ons */}
        <Grid xs={12} md={6}>
          <SubscriptionAddons />
        </Grid>
      </Grid>
    </Container>
  );
}

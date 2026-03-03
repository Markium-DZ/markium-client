import PropTypes from 'prop-types';

import Grid from '@mui/material/Unstable_Grid2';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';

import { useTranslate } from 'src/locales';
import { fNumber } from 'src/utils/format-number';
import Iconify from 'src/components/iconify';
import {
  useGetAnalyticsTopProducts,
  useGetAnalyticsConversion,
  useGetAnalyticsAov,
  useGetAnalyticsFunnel,
  useGetAnalyticsCartAbandonment,
} from 'src/api/analytics';

import AnalyticsGate from '../analytics-gate';
import AnalyticsWidgetSummary from '../analytics-widget-summary';
import AnalyticsWebsiteVisits from '../analytics-website-visits';
import AnalyticsConversionRates from '../analytics-conversion-rates';
import AnalyticsCurrentVisits from '../analytics-current-visits';

// ----------------------------------------------------------------------

export default function AnalyticsTabProducts({ dateFrom, sections }) {
  const { t } = useTranslate();

  const { topProducts } = useGetAnalyticsTopProducts(
    sections?.top_products?.accessible ? dateFrom : null
  );
  const { uniqueVisitors, uniqueBuyers } = useGetAnalyticsConversion(
    sections?.conversion?.accessible ? dateFrom : null
  );
  const { aov } = useGetAnalyticsAov(
    sections?.aov?.accessible ? dateFrom : null
  );
  const { pageviews, productViewed, addToCart, checkoutStarted, orderCompleted } = useGetAnalyticsFunnel(
    sections?.funnel?.accessible ? dateFrom : null
  );
  const { cartAbandonment } = useGetAnalyticsCartAbandonment(
    sections?.cart_abandonment?.accessible ? dateFrom : null
  );

  const conversionRate =
    uniqueVisitors > 0 ? ((uniqueBuyers / uniqueVisitors) * 100).toFixed(1) : 0;

  return (
    <Grid container spacing={3}>
      {/* ── Row 1: KPI metrics ── */}
      <Grid xs={6} md={3}>
        <AnalyticsWidgetSummary
          title={t('analytics_aov')}
          description={t('analytics_aov_desc')}
          total={aov?.average_order_value || 0}
          formatter={(v) => `${fNumber(v)} DA`}
          color="primary"
          icon={<Iconify icon="solar:tag-price-bold-duotone" width={48} />}
          sectionKey="aov"
        />
      </Grid>

      <Grid xs={6} md={3}>
        <AnalyticsWidgetSummary
          title={t('analytics_conversion')}
          description={t('analytics_conversion_desc')}
          total={Number(conversionRate)}
          formatter={(v) => `${v}%`}
          color="info"
          icon={<Iconify icon="solar:chart-bold-duotone" width={48} />}
          sectionKey="conversion"
        />
      </Grid>

      <Grid xs={6} md={3}>
        <AnalyticsWidgetSummary
          title={t('analytics_add_to_cart')}
          description={t('analytics_add_to_cart_desc')}
          total={addToCart || 0}
          color="warning"
          icon={<Iconify icon="solar:cart-plus-bold-duotone" width={48} />}
          sectionKey="funnel"
        />
      </Grid>

      <Grid xs={6} md={3}>
        <AnalyticsWidgetSummary
          title={t('analytics_total_orders')}
          description={t('analytics_completed_orders_desc')}
          total={orderCompleted || 0}
          color="error"
          icon={<Iconify icon="solar:bag-check-bold-duotone" width={48} />}
          sectionKey="funnel"
        />
      </Grid>

      {/* ── Row 2: Top products + Conversion pie ── */}
      <Grid xs={12} md={6}>
        <Card sx={{ height: 1, display: 'flex', flexDirection: 'column' }} aria-label={t('analytics_top_products_desc')}>
          <CardHeader title={t('analytics_top_products')} subheader={t('analytics_top_products_desc')} />
          <AnalyticsGate sectionKey="top_products">
            <AnalyticsConversionRates
              chart={{
                series: (topProducts || []).slice(0, 10).map((p) => ({
                  label: p.name || p.product_name || '',
                  value: p.views || p.count || 0,
                })),
              }}
            />
          </AnalyticsGate>
        </Card>
      </Grid>

      <Grid xs={12} md={6}>
        <Card sx={{ height: 1, display: 'flex', flexDirection: 'column' }} aria-label={t('analytics_conversion_desc')}>
          <CardHeader title={t('analytics_conversion')} subheader={t('analytics_conversion_desc')} />
          <AnalyticsGate sectionKey="conversion">
            <AnalyticsCurrentVisits
              chart={{
                series: [
                  { label: t('analytics_unique_visitors'), value: uniqueVisitors },
                  { label: t('analytics_unique_buyers'), value: uniqueBuyers },
                ],
              }}
            />
          </AnalyticsGate>
        </Card>
      </Grid>

      {/* ── Row 3: Conversion funnel ── */}
      <Grid xs={12}>
        <Card aria-label={t('analytics_funnel_desc')}>
          <CardHeader title={t('analytics_funnel')} subheader={t('analytics_funnel_desc')} />
          <AnalyticsGate sectionKey="funnel">
            <AnalyticsConversionRates
              chart={{
                series: [
                  { label: t('analytics_unique_visitors'), value: pageviews },
                  { label: t('analytics_product_views'), value: productViewed },
                  { label: t('analytics_checkout_started'), value: checkoutStarted },
                  { label: t('analytics_total_orders'), value: orderCompleted },
                ],
              }}
            />
          </AnalyticsGate>
        </Card>
      </Grid>

      {/* ── Row 4: Cart abandonment trend ── */}
      <Grid xs={12}>
        <Card aria-label={t('analytics_cart_abandonment_desc')}>
          <CardHeader title={t('analytics_cart_abandonment')} subheader={t('analytics_cart_abandonment_desc')} />
          <AnalyticsGate sectionKey="cart_abandonment">
            <AnalyticsWebsiteVisits
              chart={{
                labels: cartAbandonment?.[0]?.labels || [],
                series: [
                  {
                    name: t('analytics_add_to_cart'),
                    type: 'area',
                    fill: 'gradient',
                    data: cartAbandonment?.[0]?.data || [],
                  },
                  {
                    name: t('analytics_total_orders'),
                    type: 'line',
                    fill: 'solid',
                    data: cartAbandonment?.[2]?.data || [],
                  },
                ],
              }}
            />
          </AnalyticsGate>
        </Card>
      </Grid>
    </Grid>
  );
}

AnalyticsTabProducts.propTypes = {
  dateFrom: PropTypes.string,
  sections: PropTypes.object,
};

import PropTypes from 'prop-types';

import Grid from '@mui/material/Unstable_Grid2';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';

import { useTranslate } from 'src/locales';
import { useGetAnalyticsOverview } from 'src/api/analytics';

import AnalyticsGate from '../analytics-gate';
import AnalyticsWidgetSummary from '../analytics-widget-summary';
import AnalyticsWebsiteVisits from '../analytics-website-visits';

// ----------------------------------------------------------------------

export default function AnalyticsTabOverview({ dateFrom }) {
  const { t } = useTranslate();

  const {
    totalOrders,
    totalOrdersData,
    totalOrdersLabels,
    totalRevenue,
    totalRevenueData,
    totalRevenueLabels,
    totalVisitors,
    totalVisitorsData,
    totalVisitorsLabels,
    totalProductViews,
    totalProductViewsData,
    totalProductViewsLabels,
  } = useGetAnalyticsOverview(dateFrom);

  return (
    <Grid container spacing={3}>
      {/* ── Row 1: KPI cards ── */}
      <Grid xs={6} md={3}>
        <AnalyticsWidgetSummary
          title={t('analytics_total_orders')}
          description={t('analytics_total_orders_desc')}
          total={totalOrders}
          icon={<img alt="icon" src="/assets/icons/glass/ic_glass_bag.webp" />}
          sectionKey="overview"
        />
      </Grid>

      <Grid xs={6} md={3}>
        <AnalyticsWidgetSummary
          title={t('analytics_revenue')}
          description={t('analytics_revenue_desc')}
          total={totalRevenue}
          color="info"
          icon={<img alt="icon" src="/assets/icons/glass/ic_glass_buy.webp" />}
          sectionKey="overview"
        />
      </Grid>

      <Grid xs={6} md={3}>
        <AnalyticsWidgetSummary
          title={t('analytics_unique_visitors')}
          description={t('analytics_unique_visitors_desc')}
          total={totalVisitors}
          color="warning"
          icon={<img alt="icon" src="/assets/icons/glass/ic_glass_users.webp" />}
          sectionKey="overview"
        />
      </Grid>

      <Grid xs={6} md={3}>
        <AnalyticsWidgetSummary
          title={t('analytics_product_views')}
          description={t('analytics_product_views_desc')}
          total={totalProductViews}
          color="error"
          icon={<img alt="icon" src="/assets/icons/glass/ic_glass_message.webp" />}
          sectionKey="overview"
        />
      </Grid>

      {/* ── Row 2: Orders + Revenue trends ── */}
      <Grid xs={12} md={6}>
        <Card sx={{ height: 1, display: 'flex', flexDirection: 'column' }}>
          <CardHeader title={t('analytics_total_orders')} subheader={t('analytics_orders_trend_desc')} />
          <AnalyticsGate sectionKey="overview">
            <AnalyticsWebsiteVisits
              chart={{
                labels: totalOrdersLabels,
                series: [
                  {
                    name: t('analytics_total_orders'),
                    type: 'area',
                    fill: 'gradient',
                    data: totalOrdersData,
                  },
                ],
              }}
            />
          </AnalyticsGate>
        </Card>
      </Grid>

      <Grid xs={12} md={6}>
        <Card sx={{ height: 1, display: 'flex', flexDirection: 'column' }}>
          <CardHeader title={t('analytics_revenue')} subheader={t('analytics_revenue_trend_desc')} />
          <AnalyticsGate sectionKey="overview">
            <AnalyticsWebsiteVisits
              chart={{
                labels: totalRevenueLabels,
                series: [
                  {
                    name: t('analytics_revenue'),
                    type: 'area',
                    fill: 'gradient',
                    data: totalRevenueData,
                  },
                ],
              }}
            />
          </AnalyticsGate>
        </Card>
      </Grid>

      {/* ── Row 3: Visitors + Product Views trends ── */}
      <Grid xs={12} md={6}>
        <Card sx={{ height: 1, display: 'flex', flexDirection: 'column' }}>
          <CardHeader title={t('analytics_unique_visitors')} subheader={t('analytics_visitors_trend_desc')} />
          <AnalyticsGate sectionKey="overview">
            <AnalyticsWebsiteVisits
              chart={{
                labels: totalVisitorsLabels,
                series: [
                  {
                    name: t('analytics_unique_visitors'),
                    type: 'area',
                    fill: 'gradient',
                    data: totalVisitorsData,
                  },
                ],
              }}
            />
          </AnalyticsGate>
        </Card>
      </Grid>

      <Grid xs={12} md={6}>
        <Card sx={{ height: 1, display: 'flex', flexDirection: 'column' }}>
          <CardHeader title={t('analytics_product_views')} subheader={t('analytics_views_trend_desc')} />
          <AnalyticsGate sectionKey="overview">
            <AnalyticsWebsiteVisits
              chart={{
                labels: totalProductViewsLabels,
                series: [
                  {
                    name: t('analytics_product_views'),
                    type: 'area',
                    fill: 'gradient',
                    data: totalProductViewsData,
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

AnalyticsTabOverview.propTypes = {
  dateFrom: PropTypes.string,
};

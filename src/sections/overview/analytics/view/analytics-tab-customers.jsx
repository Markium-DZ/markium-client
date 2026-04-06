import PropTypes from 'prop-types';

import Grid from '@mui/material/Unstable_Grid2';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';

import { useTranslate } from 'src/locales';
import Iconify from 'src/components/iconify';
import {
  useGetAnalyticsCustomerInsights,
  useGetAnalyticsRevenueBreakdown,
} from 'src/api/analytics';

import AnalyticsGate from '../analytics-gate';
import AnalyticsWidgetSummary from '../analytics-widget-summary';
import AnalyticsWebsiteVisits from '../analytics-website-visits';
import AnalyticsCurrentVisits from '../analytics-current-visits';

// ----------------------------------------------------------------------

export default function AnalyticsTabCustomers({ dateFrom, sections }) {
  const { t } = useTranslate();

  const { customerInsights, customerInsightsLoading } = useGetAnalyticsCustomerInsights(
    sections?.customer_insights?.accessible ? dateFrom : null
  );
  const { dailyTrend } = useGetAnalyticsRevenueBreakdown(
    sections?.revenue_breakdown?.accessible ? dateFrom : null
  );

  return (
    <Grid container spacing={3}>
      {/* ── Row 1: KPI metrics (aligned to start) ── */}
      <Grid xs={12} container spacing={3}>
        <Grid xs={6} md={3}>
          <AnalyticsWidgetSummary
            title={t('analytics_total_buyers')}
            description={t('analytics_total_buyers_desc')}
            total={customerInsights?.total_buyers ?? 0}
            color="primary"
            icon={<Iconify icon="solar:user-check-bold-duotone" width={48} />}
            sectionKey="customer_insights"
          />
        </Grid>

        <Grid xs={6} md={3}>
          <AnalyticsWidgetSummary
            title={t('analytics_repeat_buyers')}
            description={t('analytics_repeat_buyers_desc')}
            total={customerInsights?.repeat_buyers ?? 0}
            color="info"
            icon={<Iconify icon="solar:user-heart-bold-duotone" width={48} />}
            sectionKey="customer_insights"
          />
        </Grid>
      </Grid>

      {/* ── Row 2: Customer insights pie + Revenue trend ── */}
      <Grid xs={12} md={6}>
        <Card sx={{ height: 1, display: 'flex', flexDirection: 'column' }} aria-label={t('analytics_customer_insights_desc')}>
          <CardHeader title={t('analytics_customer_insights')} subheader={t('analytics_customer_insights_desc')} />
          <AnalyticsGate sectionKey="customer_insights">
            <AnalyticsCurrentVisits
              loading={customerInsightsLoading}
              chart={{
                series: [
                  {
                    label: t('analytics_total_buyers'),
                    value: customerInsights?.total_buyers ?? 0,
                  },
                  {
                    label: t('analytics_repeat_buyers'),
                    value: customerInsights?.repeat_buyers ?? 0,
                  },
                ],
              }}
            />
          </AnalyticsGate>
        </Card>
      </Grid>

      <Grid xs={12} md={6}>
        <Card sx={{ height: 1, display: 'flex', flexDirection: 'column' }} aria-label={t('analytics_revenue_breakdown_desc')}>
          <CardHeader title={t('analytics_revenue_breakdown')} subheader={t('analytics_revenue_breakdown_desc')} />
          <AnalyticsGate sectionKey="revenue_breakdown">
            <AnalyticsWebsiteVisits
              chart={{
                labels: (dailyTrend || []).map((d) => d.date || d.label || ''),
                series: [
                  {
                    name: t('analytics_revenue'),
                    type: 'area',
                    fill: 'gradient',
                    data: (dailyTrend || []).map((d) => d.revenue || d.value || 0),
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

AnalyticsTabCustomers.propTypes = {
  dateFrom: PropTypes.string,
  sections: PropTypes.object,
};

import PropTypes from 'prop-types';

import Grid from '@mui/material/Unstable_Grid2';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';

import { useTranslate } from 'src/locales';
import {
  useGetAnalyticsOrdersGeography,
  useGetAnalyticsDeliveryPerformance,
} from 'src/api/analytics';

import AnalyticsGate from '../analytics-gate';
import AnalyticsConversionRates from '../analytics-conversion-rates';
import AnalyticsTableCard from '../analytics-table-card';

// ----------------------------------------------------------------------

export default function AnalyticsTabOrders({ dateFrom, sections }) {
  const { t } = useTranslate();

  const { ordersGeography } = useGetAnalyticsOrdersGeography(
    sections?.orders_geography?.accessible ? dateFrom : null
  );
  const { deliveryPerformance } = useGetAnalyticsDeliveryPerformance(
    sections?.delivery_performance?.accessible ? dateFrom : null
  );

  return (
    <Grid container spacing={3}>
      {/* ── Row 1: Geography + Delivery performance ── */}
      <Grid xs={12} md={6}>
        <Card sx={{ height: 1, display: 'flex', flexDirection: 'column' }} aria-label={t('analytics_orders_geography_desc')}>
          <CardHeader title={t('analytics_orders_geography')} subheader={t('analytics_orders_geography_desc')} />
          <AnalyticsGate sectionKey="orders_geography">
            <AnalyticsConversionRates
              chart={{
                series: (ordersGeography || []).slice(0, 10).map((g) => ({
                  label: g.wilaya_name || g.name || '',
                  value: g.order_count || g.count || 0,
                })),
              }}
            />
          </AnalyticsGate>
        </Card>
      </Grid>

      <Grid xs={12} md={6}>
        <Card sx={{ height: 1, display: 'flex', flexDirection: 'column' }} aria-label={t('analytics_delivery_performance_desc')}>
          <CardHeader title={t('analytics_delivery_performance')} subheader={t('analytics_delivery_performance_desc')} />
          <AnalyticsGate sectionKey="delivery_performance">
            <AnalyticsTableCard
              columns={[
                { key: 'wilaya', label: t('analytics_orders_geography') },
                {
                  key: 'delivery_rate',
                  label: t('analytics_delivery_rate'),
                  align: 'right',
                  format: (v) => `${v}%`,
                },
                {
                  key: 'return_rate',
                  label: t('analytics_return_rate'),
                  align: 'right',
                  format: (v) => `${v}%`,
                },
              ]}
              rows={(deliveryPerformance || []).map((dp) => ({
                wilaya: dp.wilaya_name || dp.name || '',
                delivery_rate: dp.delivery_rate || 0,
                return_rate: dp.return_rate || 0,
              }))}
            />
          </AnalyticsGate>
        </Card>
      </Grid>
    </Grid>
  );
}

AnalyticsTabOrders.propTypes = {
  dateFrom: PropTypes.string,
  sections: PropTypes.object,
};

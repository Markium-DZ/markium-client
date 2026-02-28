import PropTypes from 'prop-types';

import Grid from '@mui/material/Unstable_Grid2';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';

import { useTranslate } from 'src/locales';
import { fNumber } from 'src/utils/format-number';
import Iconify from 'src/components/iconify';
import {
  useGetAnalyticsTraffic,
  useGetAnalyticsTrafficSources,
  useGetAnalyticsDeviceBreakdown,
  useGetAnalyticsVisitorTypes,
  useGetAnalyticsBounceRate,
  useGetAnalyticsSessionDuration,
  useGetAnalyticsLandingPages,
} from 'src/api/analytics';

import AnalyticsGate from '../analytics-gate';
import AnalyticsWidgetSummary from '../analytics-widget-summary';
import AnalyticsWebsiteVisits from '../analytics-website-visits';
import AnalyticsConversionRates from '../analytics-conversion-rates';
import AnalyticsCurrentVisits from '../analytics-current-visits';
import AnalyticsTableCard from '../analytics-table-card';

// ----------------------------------------------------------------------

export default function AnalyticsTabTraffic({ dateFrom, sections }) {
  const { t } = useTranslate();

  const { visitors, productViews } = useGetAnalyticsTraffic(
    sections?.traffic?.accessible ? dateFrom : null
  );
  const { trafficSources } = useGetAnalyticsTrafficSources(
    sections?.traffic_sources?.accessible ? dateFrom : null
  );
  const { deviceBreakdown } = useGetAnalyticsDeviceBreakdown(
    sections?.device_breakdown?.accessible ? dateFrom : null
  );
  const { visitorTypes } = useGetAnalyticsVisitorTypes(
    sections?.visitor_types?.accessible ? dateFrom : null
  );
  const { bounceRate } = useGetAnalyticsBounceRate(
    sections?.bounce_rate?.accessible ? dateFrom : null
  );
  const { sessionDuration } = useGetAnalyticsSessionDuration(
    sections?.session_duration?.accessible ? dateFrom : null
  );
  const { landingPages } = useGetAnalyticsLandingPages(
    sections?.landing_pages?.accessible ? dateFrom : null
  );

  return (
    <Grid container spacing={3}>
      {/* ── Row 1: KPI metrics ── */}
      <Grid xs={6} md={3}>
        <AnalyticsWidgetSummary
          title={t('analytics_bounce_rate')}
          total={bounceRate?.bounce_rate || 0}
          formatter={(v) => `${v}%`}
          caption={`${bounceRate?.bounced_visitors || 0} / ${bounceRate?.total_visitors || 0}`}
          color="error"
          icon={<Iconify icon="solar:arrow-left-down-bold-duotone" width={48} />}
          sectionKey="bounce_rate"
        />
      </Grid>

      <Grid xs={6} md={3}>
        <AnalyticsWidgetSummary
          title={t('analytics_session_duration')}
          total={sessionDuration?.avg_duration_seconds || 0}
          formatter={(v) => `${Math.round(v)}s`}
          caption={t('avg_session_duration')}
          color="warning"
          icon={<Iconify icon="solar:clock-circle-bold-duotone" width={48} />}
          sectionKey="session_duration"
        />
      </Grid>

      <Grid xs={6} md={3}>
        <AnalyticsWidgetSummary
          title={t('new_visitors')}
          total={visitorTypes?.new_visitors || 0}
          caption={t('new_visitors_desc')}
          color="info"
          icon={<Iconify icon="solar:user-plus-bold-duotone" width={48} />}
          sectionKey="visitor_types"
        />
      </Grid>

      <Grid xs={6} md={3}>
        <AnalyticsWidgetSummary
          title={t('returning_visitors')}
          total={visitorTypes?.returning_visitors || 0}
          caption={t('returning_visitors_desc')}
          color="primary"
          icon={<Iconify icon="solar:users-group-rounded-bold-duotone" width={48} />}
          sectionKey="visitor_types"
        />
      </Grid>

      {/* ── Row 2: Traffic trend ── */}
      <Grid xs={12}>
        <Card aria-label={t('analytics_traffic_desc')}>
          <CardHeader title={t('analytics_traffic')} subheader={t('analytics_traffic_desc')} />
          <AnalyticsGate sectionKey="traffic">
            <AnalyticsWebsiteVisits
              chart={{
                labels: visitors?.labels || [],
                series: [
                  {
                    name: t('analytics_unique_visitors'),
                    type: 'area',
                    fill: 'gradient',
                    data: visitors?.data || [],
                  },
                  {
                    name: t('analytics_units_sold'),
                    type: 'line',
                    fill: 'solid',
                    data: productViews?.data || [],
                  },
                ],
              }}
            />
          </AnalyticsGate>
        </Card>
      </Grid>

      {/* ── Row 3: Breakdowns ── */}
      <Grid xs={12} md={6}>
        <Card sx={{ height: 1, display: 'flex', flexDirection: 'column' }} aria-label={t('analytics_device_breakdown_desc')}>
          <CardHeader title={t('analytics_device_breakdown')} subheader={t('analytics_device_breakdown_desc')} />
          <AnalyticsGate sectionKey="device_breakdown">
            <AnalyticsCurrentVisits
              chart={{
                series: (deviceBreakdown || []).map((d) => ({
                  label: d.breakdown_value || 'Unknown',
                  value: d.count || 0,
                })),
              }}
            />
          </AnalyticsGate>
        </Card>
      </Grid>

      <Grid xs={12} md={6}>
        <Card sx={{ height: 1, display: 'flex', flexDirection: 'column' }} aria-label={t('analytics_visitor_types_desc')}>
          <CardHeader title={t('analytics_visitor_types')} subheader={t('analytics_visitor_types_desc')} />
          <AnalyticsGate sectionKey="visitor_types">
            <AnalyticsCurrentVisits
              chart={{
                series: [
                  { label: t('new_visitors'), value: visitorTypes?.new_visitors || 0 },
                  { label: t('returning_visitors'), value: visitorTypes?.returning_visitors || 0 },
                ],
              }}
            />
          </AnalyticsGate>
        </Card>
      </Grid>

      {/* ── Row 4: Sources ── */}
      <Grid xs={12} md={6}>
        <Card sx={{ height: 1, display: 'flex', flexDirection: 'column' }} aria-label={t('analytics_traffic_sources_desc')}>
          <CardHeader title={t('analytics_traffic_sources')} subheader={t('analytics_traffic_sources_desc')} />
          <AnalyticsGate sectionKey="traffic_sources">
            <AnalyticsConversionRates
              chart={{
                series: (trafficSources || []).slice(0, 10).map((s) => ({
                  label: s.referring_domain || s.source || s.name || 'Direct',
                  value: s.count || s.visits || 0,
                })),
              }}
            />
          </AnalyticsGate>
        </Card>
      </Grid>

      <Grid xs={12} md={6}>
        <Card sx={{ height: 1, display: 'flex', flexDirection: 'column' }} aria-label={t('analytics_landing_pages_desc')}>
          <CardHeader title={t('analytics_landing_pages')} subheader={t('analytics_landing_pages_desc')} />
          <AnalyticsGate sectionKey="landing_pages">
            <AnalyticsTableCard
              columns={[
                { key: 'page', label: t('landing_page') },
                { key: 'entries', label: t('entries'), align: 'right', format: fNumber },
              ]}
              rows={(landingPages || []).map((lp) => ({
                page: lp.page || lp.path || '',
                entries: lp.entries || lp.count || 0,
              }))}
            />
          </AnalyticsGate>
        </Card>
      </Grid>
    </Grid>
  );
}

AnalyticsTabTraffic.propTypes = {
  dateFrom: PropTypes.string,
  sections: PropTypes.object,
};

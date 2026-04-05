import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { LineChart } from '@mui/x-charts/LineChart';
import { alpha, useTheme } from '@mui/material/styles';

import Iconify from 'src/components/iconify';
import { useTranslate } from 'src/locales';
import ChartLoadingPlaceholder from 'src/components/chart/chart-loading-placeholder';

// ----------------------------------------------------------------------

const DEFAULT_COLORS = [
  '#2065D1', '#22C55E', '#FFAB00', '#FF5630', '#00B8D9',
];

// Parse API date labels like "20-Feb-2026" or "1-Mar-2026 14:00" into a Date object
function parseLabel(label) {
  if (!label || typeof label !== 'string') return null;
  // Try "1-Mar-2026 14:00" (hourly) or "1-Mar-2026" (daily)
  const match = label.match(/^(\d{1,2})-(\w+)-(\d{4})(?:\s+(\d{2}):(\d{2}))?$/);
  if (match) {
    const timeStr = match[4] ? ` ${match[4]}:${match[5]}` : '';
    const d = new Date(`${match[2]} ${match[1]}, ${match[3]}${timeStr}`);
    if (!Number.isNaN(d.getTime())) return d;
  }
  const fallback = new Date(label);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

// Detect if labels contain hourly data (have time component like "14:00")
function isHourlyData(labels) {
  if (!labels || labels.length < 2) return false;
  return labels.some((l) => typeof l === 'string' && /\d{2}:\d{2}/.test(l));
}

export default function AnalyticsWebsiteVisits({ title, subheader, chart, loading, ...other }) {
  const theme = useTheme();
  const { t, i18n } = useTranslate();
  const lang = i18n.language || 'ar';
  const isRtl = lang === 'ar';

  const { labels, colors, series } = chart;

  const xAxisData = (labels || []).map((l, i) => i);
  const xAxisLabels = labels || [];

  // Format x-axis labels — use time for hourly data, date for daily
  const hourly = isHourlyData(labels);
  const dateFmt = new Intl.DateTimeFormat(lang, hourly
    ? { hour: '2-digit', minute: '2-digit', hour12: false }
    : { month: 'short', day: 'numeric' });
  const formatXLabel = (v) => {
    const raw = xAxisLabels[v];
    if (!raw) return '';
    const d = parseLabel(raw);
    return d ? dateFmt.format(d) : String(raw);
  };

  // Format y-axis as clean localized integers
  const numFmt = new Intl.NumberFormat(lang, { maximumFractionDigits: 0 });
  const formatYLabel = (v) => numFmt.format(Math.round(v));

  const muiSeries = (series || []).map((s, idx) => ({
    label: s.name || `Series ${idx + 1}`,
    data: s.data || [],
    area: s.type === 'area' || s.fill === 'gradient',
    showMark: false,
    color: colors?.[idx] || DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
  }));

  const showLegend = muiSeries.length > 1;

  const isEmpty = !labels || labels.length === 0;

  const chartContent = loading ? (
    <ChartLoadingPlaceholder variant="line" height={364} />
  ) : isEmpty ? (
    <Stack alignItems="center" justifyContent="center" spacing={1} sx={{ height: 364 }}>
      <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: alpha(theme.palette.grey[500], 0.08) }}>
        <Iconify icon="solar:chart-bold-duotone" width={28} sx={{ color: 'text.disabled' }} />
      </Box>
      <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>{t('no_data')}</Typography>
      <Typography variant="caption" sx={{ color: 'text.disabled', maxWidth: 200, textAlign: 'center' }}>
        {t('analytics_no_data_hint')}
      </Typography>
    </Stack>
  ) : (
    <Box sx={{ p: 3, pb: 1 }}>
      {showLegend && (
        <Stack direction="row" spacing={3} justifyContent="center" sx={{ mb: 1 }}>
          {muiSeries.map((s, idx) => (
            <Stack key={idx} direction="row" alignItems="center" spacing={1}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: 0.5,
                  flexShrink: 0,
                  bgcolor: s.color || colors?.[idx] || DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
                }}
              />
              <Typography variant="body2" color="text.secondary">
                {s.label}
              </Typography>
            </Stack>
          ))}
        </Stack>
      )}

      <LineChart
        height={364}
        series={muiSeries}
        xAxis={[
          {
            data: xAxisData,
            scaleType: 'point',
            valueFormatter: formatXLabel,
            tickLabelStyle: { fontSize: 11 },
          },
        ]}
        yAxis={[
          {
            valueFormatter: formatYLabel,
            min: 0,
            tickLabelStyle: { fontSize: 11 },
          },
        ]}
        margin={isRtl ? { left: 20, right: 60, top: 10, bottom: 30 } : { left: 60, right: 20, top: 10, bottom: 30 }}
        sx={{
          '& .MuiLineElement-root': { strokeWidth: 2 },
          '& .MuiAreaElement-root': { fillOpacity: 0.15 },
        }}
        slotProps={{ legend: { hidden: true } }}
      />
    </Box>
  );

  if (!title) return chartContent;

  return (
    <Card {...other}>
      <CardHeader title={title} subheader={subheader} />
      {chartContent}
    </Card>
  );
}

AnalyticsWebsiteVisits.propTypes = {
  chart: PropTypes.object,
  loading: PropTypes.bool,
  subheader: PropTypes.string,
  title: PropTypes.string,
};

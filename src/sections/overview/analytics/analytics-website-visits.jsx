import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { LineChart } from '@mui/x-charts/LineChart';

import { useTranslate } from 'src/locales';

// ----------------------------------------------------------------------

const DEFAULT_COLORS = [
  '#2065D1', '#22C55E', '#FFAB00', '#FF5630', '#00B8D9',
];

// Parse API date labels like "Feb-2026-20" into a Date object
function parseLabel(label) {
  if (!label) return null;
  const parts = label.split('-');
  if (parts.length === 3) {
    const d = new Date(`${parts[0]} ${parts[2]}, ${parts[1]}`);
    if (!Number.isNaN(d.getTime())) return d;
  }
  const fallback = new Date(label);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

export default function AnalyticsWebsiteVisits({ title, subheader, chart, ...other }) {
  const { i18n } = useTranslate();
  const lang = i18n.language || 'ar';
  const isRtl = lang === 'ar';

  const { labels, colors, series } = chart;

  const xAxisData = (labels || []).map((l, i) => i);
  const xAxisLabels = labels || [];

  // Format x-axis labels as localized dates
  const dateFmt = new Intl.DateTimeFormat(lang, { month: 'short', day: 'numeric' });
  const formatXLabel = (v) => {
    const raw = xAxisLabels[v];
    if (!raw) return '';
    const d = parseLabel(raw);
    return d ? dateFmt.format(d) : raw;
  };

  // Format y-axis as clean localized integers
  const numFmt = new Intl.NumberFormat(lang, { maximumFractionDigits: 0 });
  const formatYLabel = (v) => numFmt.format(Math.round(v));

  const muiSeries = (series || []).map((s, idx) => {
    const item = {
      label: s.name || `Series ${idx + 1}`,
      data: s.data || [],
      area: s.type === 'area' || s.fill === 'gradient',
      showMark: false,
    };
    if (colors?.[idx]) item.color = colors[idx];
    return item;
  });

  const showLegend = muiSeries.length > 1;

  const isEmpty = !labels || labels.length === 0;

  const chartContent = isEmpty ? (
    <Box sx={{ height: 364, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Typography variant="body2" color="text.secondary">No data</Typography>
    </Box>
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
  subheader: PropTypes.string,
  title: PropTypes.string,
};

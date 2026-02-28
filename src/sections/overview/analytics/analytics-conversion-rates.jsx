import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import { BarChart } from '@mui/x-charts/BarChart';

import { useTranslate } from 'src/locales';

// ----------------------------------------------------------------------

export default function AnalyticsConversionRates({ title, subheader, chart, ...other }) {
  const { i18n } = useTranslate();
  const lang = i18n.language || 'ar';
  const isRtl = lang === 'ar';

  const { colors, series } = chart;

  const categories = (series || []).map((i) => i.label || '');
  const values = (series || []).map((i) => i.value || 0);

  const isEmpty = !series || series.length === 0;

  // Format x-axis (value axis) as clean localized integers
  const numFmt = new Intl.NumberFormat(lang, { maximumFractionDigits: 0 });
  const formatValue = (v) => numFmt.format(Math.round(v));

  const chartContent = isEmpty ? (
    <Box sx={{ height: 364, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Typography variant="body2" color="text.secondary">No data</Typography>
    </Box>
  ) : (
    <Box sx={{ mx: 3, mb: 1 }}>
      <BarChart
        height={364}
        layout="horizontal"
        series={[{ data: values, ...(colors?.[0] ? { color: colors[0] } : {}) }]}
        yAxis={[
          {
            data: categories,
            scaleType: 'band',
            tickLabelStyle: { fontSize: 11 },
          },
        ]}
        xAxis={[
          {
            valueFormatter: formatValue,
            min: 0,
            tickLabelStyle: { fontSize: 11 },
          },
        ]}
        slotProps={{ legend: { hidden: true } }}
        margin={isRtl ? { left: 60, right: 120, top: 10, bottom: 30 } : { left: 120, right: 20, top: 10, bottom: 30 }}
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

AnalyticsConversionRates.propTypes = {
  chart: PropTypes.object,
  subheader: PropTypes.string,
  title: PropTypes.string,
};

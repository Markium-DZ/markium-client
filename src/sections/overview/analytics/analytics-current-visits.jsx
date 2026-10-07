import PropTypes from 'prop-types';

import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { PieChart } from '@mui/x-charts/PieChart';
import { useTheme, alpha } from '@mui/material/styles';

import Iconify from 'src/components/iconify';
import { useTranslate } from 'src/locales';
import ChartLoadingPlaceholder from 'src/components/chart/chart-loading-placeholder';

// ----------------------------------------------------------------------

const DEFAULT_COLORS = [
  '#2065D1', '#22C55E', '#FFAB00', '#FF5630',
  '#00B8D9', '#8E33FF', '#FF6C40', '#36B37E',
];

export default function AnalyticsCurrentVisits({ title, subheader, chart, loading, ...other }) {
  const theme = useTheme();
  const { t } = useTranslate();
  const { colors, series } = chart;

  const palette = colors || [
    theme.palette.primary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main,
    ...DEFAULT_COLORS,
  ];

  const pieData = (series || []).map((item, index) => ({
    id: index,
    value: item.value || 0,
    label: String(item.label || ''),
    color: palette[index % palette.length],
  }));

  const isEmpty = !series || series.length === 0 || pieData.every((d) => d.value === 0);

  const chartContent = loading ? (
    <ChartLoadingPlaceholder variant="pie" height={280} />
  ) : isEmpty ? (
    <Stack alignItems="center" justifyContent="center" spacing={1} sx={{ height: 280 }}>
      <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: alpha(theme.palette.grey[500], 0.08) }}>
        <Iconify icon="solar:chart-2-bold-duotone" width={28} sx={{ color: 'text.disabled' }} />
      </Box>
      <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>{t('no_data')}</Typography>
      <Typography variant="caption" sx={{ color: 'text.disabled', maxWidth: 200, textAlign: 'center' }}>
        {t('analytics_no_data_hint')}
      </Typography>
    </Stack>
  ) : (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <PieChart
          height={280}
          width={400}
          series={[
            {
              data: pieData,
              innerRadius: 0,
              paddingAngle: 1,
              cornerRadius: 3,
            },
          ]}
          slotProps={{ legend: { hidden: true } }}
        />
      </Box>

      <Stack direction="row" spacing={3} justifyContent="center" flexWrap="wrap" sx={{ mt: 2 }}>
        {pieData.map((item, idx) => (
          <Stack key={idx} direction="row" alignItems="center" spacing={1}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                flexShrink: 0,
                bgcolor: item.color,
              }}
            />
            <Typography variant="body2" color="text.secondary">
              {item.label}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );

  if (!title) return chartContent;

  return (
    <Card {...other}>
      <CardHeader title={title} subheader={subheader} sx={{ mb: 2 }} />
      {chartContent}
    </Card>
  );
}

AnalyticsCurrentVisits.propTypes = {
  chart: PropTypes.object,
  loading: PropTypes.bool,
  subheader: PropTypes.string,
  title: PropTypes.string,
};

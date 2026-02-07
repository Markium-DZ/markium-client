import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import CircularProgress from '@mui/material/CircularProgress';
import { alpha, useTheme } from '@mui/material/styles';
import { LineChart } from '@mui/x-charts/LineChart';

import { fNumber } from 'src/utils/format-number';

// ----------------------------------------------------------------------

export default function DashboardChart({ visitorsData, visitorsLabels, ordersData, ordersLabels, loading }) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const currentLang = i18n.language;

  const hasVisitors = visitorsData?.length > 0;
  const hasOrders = ordersData?.length > 0;
  const hasData = hasVisitors || hasOrders;

  const rawLabels = hasVisitors ? visitorsLabels : hasOrders ? ordersLabels : [];
  const len = rawLabels?.length || 0;

  // Format dates using app language
  const xLabels = (rawLabels || []).map((raw) => {
    const d = new Date(raw);
    return Number.isNaN(d.getTime())
      ? raw
      : d.toLocaleDateString(currentLang, { month: 'short', day: 'numeric' });
  });

  const labelStep = len > 10 ? Math.ceil(len / 8) : 1;

  const pad = (arr) => {
    if (!arr || arr.length === 0) return Array(len).fill(0);
    if (arr.length >= len) return arr.slice(0, len);
    return [...arr, ...Array(len - arr.length).fill(0)];
  };

  const visitorsColor = theme.palette.warning.main;
  const ordersColor = theme.palette.primary.main;

  const series = [];
  const yAxis = [];
  const hasBoth = hasVisitors && hasOrders;

  if (hasBoth) {
    yAxis.push({ id: 'leftAxisId', width: 44 });
    yAxis.push({ id: 'rightAxisId', position: 'right', width: 44 });
    series.push({
      data: pad(visitorsData),
      label: t('total_visitors'),
      yAxisId: 'leftAxisId',
      color: visitorsColor,
      area: true,
      curve: 'monotoneX',
      showMark: false,
      valueFormatter: (v) => fNumber(v) || '0',
    });
    series.push({
      data: pad(ordersData),
      label: t('total_orders'),
      yAxisId: 'rightAxisId',
      color: ordersColor,
      area: true,
      curve: 'monotoneX',
      showMark: false,
      valueFormatter: (v) => fNumber(v) || '0',
    });
  } else if (hasVisitors) {
    series.push({
      data: pad(visitorsData),
      label: t('total_visitors'),
      color: visitorsColor,
      area: true,
      curve: 'monotoneX',
      showMark: false,
      valueFormatter: (v) => fNumber(v) || '0',
    });
  } else if (hasOrders) {
    series.push({
      data: pad(ordersData),
      label: t('total_orders'),
      color: ordersColor,
      area: true,
      curve: 'monotoneX',
      showMark: false,
      valueFormatter: (v) => fNumber(v) || '0',
    });
  }

  if (loading) {
    return (
      <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={32} />
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title={t('visitors_and_orders')}
        titleTypographyProps={{ variant: 'subtitle1' }}
        sx={{ pb: 0 }}
      />

      {hasData ? (
        <Box dir="ltr" sx={{ flexGrow: 1, width: '100%', position: 'relative', minHeight: 260 }}>
          <svg width={0} height={0} style={{ position: 'absolute' }}>
            <defs>
              <linearGradient id="chart-grad-visitors" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={visitorsColor} stopOpacity={0.28} />
                <stop offset="100%" stopColor={visitorsColor} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="chart-grad-orders" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={ordersColor} stopOpacity={0.24} />
                <stop offset="100%" stopColor={ordersColor} stopOpacity={0.02} />
              </linearGradient>
            </defs>
          </svg>

          <LineChart
            series={series}
            xAxis={[{
              scaleType: 'point',
              data: xLabels,
              tickLabelInterval: (_value, index) => index % labelStep === 0,
            }]}
            {...(yAxis.length > 0 ? { yAxis } : {})}
            grid={{ horizontal: true }}
            slotProps={{
              legend: {
                direction: 'row',
                position: { vertical: 'top', horizontal: 'right' },
                itemMarkWidth: 10,
                itemMarkHeight: 10,
                labelStyle: { fontSize: 12, fill: theme.palette.text.secondary },
                padding: { top: 0 },
              },
            }}
            margin={{
              top: 36,
              right: hasBoth ? 52 : 20,
              bottom: 28,
              left: hasBoth ? 52 : 48,
            }}
            sx={{
              '& .MuiLineElement-root': {
                strokeWidth: 2,
              },
              '& .MuiAreaElement-series-auto-generated-id-0': {
                fill: 'url(#chart-grad-visitors)',
              },
              '& .MuiAreaElement-series-auto-generated-id-1': {
                fill: 'url(#chart-grad-orders)',
              },
              '& .MuiChartsAxis-tickLabel': {
                fontSize: '0.65rem !important',
                fill: `${theme.palette.text.disabled} !important`,
              },
              '& .MuiChartsAxis-line': {
                stroke: theme.palette.divider,
              },
              '& .MuiChartsAxis-tick': {
                stroke: 'transparent',
              },
              '& .MuiChartsGrid-line': {
                stroke: theme.palette.divider,
                strokeDasharray: '3 3',
                strokeWidth: 0.8,
              },
            }}
          />
        </Box>
      ) : (
        <Stack alignItems="center" justifyContent="center" sx={{ flexGrow: 1, py: 6 }}>
          <Typography variant="body2" color="text.disabled">
            {t('no_data_available')}
          </Typography>
        </Stack>
      )}
    </Card>
  );
}

DashboardChart.propTypes = {
  visitorsData: PropTypes.array,
  visitorsLabels: PropTypes.array,
  ordersData: PropTypes.array,
  ordersLabels: PropTypes.array,
  loading: PropTypes.bool,
};

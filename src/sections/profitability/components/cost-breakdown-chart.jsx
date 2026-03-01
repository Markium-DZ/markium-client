import PropTypes from 'prop-types';
import { Card, CardHeader, Box, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Chart from 'react-apexcharts';
import { useTranslate } from 'src/locales';
import { COST_TYPE_LABELS, COST_TYPE_COLORS } from '../constants';

// ----------------------------------------------------------------------

export default function CostBreakdownChart({ costsBreakdown, title }) {
  const { t } = useTranslate();
  const theme = useTheme();

  const entries = Object.entries(costsBreakdown || {}).filter(([, val]) => val > 0);
  const labels = entries.map(([key]) => t(COST_TYPE_LABELS[key] || key));
  const series = entries.map(([, val]) => val);
  const colors = entries.map(([key]) => COST_TYPE_COLORS[key] || '#919EAB');
  const total = series.reduce((a, b) => a + b, 0);

  const chartOptions = {
    chart: {
      type: 'donut',
      fontFamily: theme.typography.fontFamily,
    },
    labels,
    colors,
    legend: { show: false },
    stroke: { show: false },
    dataLabels: {
      enabled: true,
      formatter: (val) => `${val.toFixed(0)}%`,
      dropShadow: { enabled: false },
      style: {
        fontSize: '12px',
        fontWeight: 600,
        fontFamily: theme.typography.fontFamily,
      },
    },
    tooltip: {
      y: {
        formatter: (val) => `${val.toLocaleString('fr-DZ')} DA`,
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '13px',
              fontFamily: theme.typography.fontFamily,
              color: theme.palette.text.secondary,
              offsetY: -8,
            },
            value: {
              show: true,
              fontSize: '20px',
              fontWeight: 700,
              fontFamily: theme.typography.fontFamily,
              color: theme.palette.text.primary,
              offsetY: 4,
              formatter: (val) => `${Number(val).toLocaleString('fr-DZ')} DA`,
            },
            total: {
              show: true,
              label: t('total_costs'),
              fontSize: '13px',
              fontFamily: theme.typography.fontFamily,
              color: theme.palette.text.secondary,
              formatter: () => `${total.toLocaleString('fr-DZ')} DA`,
            },
          },
        },
      },
    },
  };

  if (series.length === 0) return null;

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader title={title || t('cost_breakdown')} />

      <Box sx={{ px: 2, pb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" spacing={2}>
          <Box sx={{ flex: 1, minHeight: 280 }}>
            <Chart type="donut" series={series} options={chartOptions} height={280} />
          </Box>

          {/* Custom legend */}
          <Stack spacing={1.5} sx={{ minWidth: 180 }}>
            {entries.map(([key, val], idx) => {
              const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
              return (
                <Stack key={key} direction="row" alignItems="center" spacing={1.5}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: 0.5,
                      bgcolor: colors[idx],
                      flexShrink: 0,
                    }}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {labels[idx]}
                    </Typography>
                    <Stack direction="row" alignItems="baseline" spacing={0.5}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {val.toLocaleString('fr-DZ')} DA
                      </Typography>
                      <Typography variant="caption" color="text.disabled">
                        ({pct}%)
                      </Typography>
                    </Stack>
                  </Box>
                </Stack>
              );
            })}
          </Stack>
        </Stack>
      </Box>
    </Card>
  );
}

CostBreakdownChart.propTypes = {
  costsBreakdown: PropTypes.object,
  title: PropTypes.string,
};

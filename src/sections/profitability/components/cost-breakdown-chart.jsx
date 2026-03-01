import PropTypes from 'prop-types';
import { Card, CardHeader } from '@mui/material';
import Chart from 'react-apexcharts';
import { useTranslate } from 'src/locales';
import { useTheme } from '@mui/material/styles';
import { COST_TYPE_LABELS, COST_TYPE_COLORS } from '../constants';

// ----------------------------------------------------------------------

export default function CostBreakdownChart({ costsBreakdown, title }) {
  const { t } = useTranslate();
  const theme = useTheme();

  const entries = Object.entries(costsBreakdown || {}).filter(([, val]) => val > 0);
  const labels = entries.map(([key]) => t(COST_TYPE_LABELS[key] || key));
  const series = entries.map(([, val]) => val);
  const colors = entries.map(([key]) => COST_TYPE_COLORS[key] || '#919EAB');

  const chartOptions = {
    chart: {
      type: 'donut',
      fontFamily: theme.typography.fontFamily,
    },
    labels,
    colors,
    legend: {
      position: 'right',
      fontSize: '13px',
      fontFamily: theme.typography.fontFamily,
      labels: { colors: theme.palette.text.secondary },
      formatter: (label, opts) => {
        const val = opts.w.globals.series[opts.seriesIndex];
        return `${label}: ${val.toLocaleString('fr-DZ')} DA`;
      },
    },
    stroke: { show: false },
    dataLabels: {
      enabled: true,
      formatter: (val) => `${val.toFixed(1)}%`,
      dropShadow: { enabled: false },
    },
    tooltip: {
      y: {
        formatter: (val) => `${val.toLocaleString('fr-DZ')} DA`,
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: '60%',
          labels: {
            show: true,
            total: {
              show: true,
              label: t('total_costs'),
              fontFamily: theme.typography.fontFamily,
              formatter: (w) => {
                const total = w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                return `${total.toLocaleString('fr-DZ')} DA`;
              },
            },
          },
        },
      },
    },
  };

  if (series.length === 0) return null;

  return (
    <Card>
      <CardHeader title={title || t('cost_breakdown')} />
      <Chart type="donut" series={series} options={chartOptions} height={320} />
    </Card>
  );
}

CostBreakdownChart.propTypes = {
  costsBreakdown: PropTypes.object,
  title: PropTypes.string,
};

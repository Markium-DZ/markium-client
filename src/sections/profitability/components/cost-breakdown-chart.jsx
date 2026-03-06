import PropTypes from 'prop-types';
import { Card, CardHeader, Box, Stack, Typography } from '@mui/material';
import { PieChart } from '@mui/x-charts/PieChart';
import { alpha } from '@mui/material/styles';
import { useTranslate } from 'src/locales';
import { fNumber } from 'src/utils/format-number';
import Iconify from 'src/components/iconify';
import { COST_TYPE_LABELS, COST_TYPE_COLORS } from '../constants';

// ----------------------------------------------------------------------

export default function CostBreakdownChart({ costsBreakdown, title }) {
  const { t } = useTranslate();

  const entries = Object.entries(costsBreakdown || {}).filter(([, val]) => val > 0);
  const labels = entries.map(([key]) => t(COST_TYPE_LABELS[key] || key));
  const series = entries.map(([, val]) => val);
  const colors = entries.map(([key]) => COST_TYPE_COLORS[key] || '#919EAB');
  const total = series.reduce((a, b) => a + b, 0);

  const pieData = entries.map(([key, val], index) => ({
    id: index,
    value: val,
    label: labels[index],
    color: colors[index],
  }));

  const isEmpty = series.length === 0;

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader title={title || t('cost_breakdown')} />

      <Box sx={{ px: 2, pb: 3 }}>
        {isEmpty ? (
          <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 280, py: 4 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                bgcolor: (theme) => alpha(theme.palette.grey[500], 0.08),
                mb: 2,
              }}
            >
              <Iconify icon="solar:pie-chart-2-bold-duotone" width={32} sx={{ color: 'text.disabled' }} />
            </Box>
            <Typography variant="subtitle2" color="text.secondary">
              {t('no_cost_data')}
            </Typography>
          </Stack>
        ) : (
          <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" spacing={2}>
            <Box sx={{ flex: 1, minHeight: 280, position: 'relative' }}>
              <PieChart
                height={280}
                series={[
                  {
                    data: pieData,
                    innerRadius: 60,
                    outerRadius: 110,
                    paddingAngle: 1,
                    cornerRadius: 3,
                    arcLabel: (item) => {
                      const pct = total > 0 ? ((item.value / total) * 100).toFixed(0) : 0;
                      return `${pct}%`;
                    },
                    arcLabelMinAngle: 20,
                  },
                ]}
                slotProps={{ legend: { hidden: true } }}
              />

              {/* Center label showing total */}
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  pointerEvents: 'none',
                }}
              >
                <Typography variant="caption" color="text.secondary" display="block">
                  {t('total_costs')}
                </Typography>
                <Typography variant="subtitle1" fontWeight={700}>
                  {fNumber(total)} {t('currency_da')}
                </Typography>
              </Box>
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
                          {fNumber(val)} {t('currency_da')}
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
        )}
      </Box>
    </Card>
  );
}

CostBreakdownChart.propTypes = {
  costsBreakdown: PropTypes.object,
  title: PropTypes.string,
};

import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { alpha, useTheme } from '@mui/material/styles';
import { SparkLineChart } from '@mui/x-charts/SparkLineChart';
import { LineChart } from '@mui/x-charts/LineChart';

import { fNumber } from 'src/utils/format-number';
import Iconify from 'src/components/iconify';

import { DATE_RANGE_OPTIONS } from 'src/api/analytics';

// ----------------------------------------------------------------------

const FLAT_LINE = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

// ----------------------------------------------------------------------

export default function GradeBMetrics({
  totalVisitors,
  totalVisitorsData,
  productsCount,
  trafficData,
  trafficLabels,
  trafficLoading,
  dateRange,
  onDateRangeChange,
  sx,
}) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const currentLang = i18n.language;

  const hasVisitorsData = totalVisitorsData?.length > 0;
  const visitorsSparklineData = hasVisitorsData ? totalVisitorsData.slice(-10) : FLAT_LINE;
  const visitorsSparklineColor = hasVisitorsData ? theme.palette.primary.main : theme.palette.grey[300];

  const hasTrafficData = trafficData?.length > 0;
  const rawLabels = trafficLabels || [];
  const len = rawLabels?.length || 0;

  // Parse ISO date strings into Date objects for time-based x-axis
  const xDates = (rawLabels || []).map((raw) => {
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? new Date() : d;
  });

  const xValueFormatter = (date) => {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString(currentLang, { month: 'short', day: 'numeric' });
  };

  const pad = (arr) => {
    if (!arr || arr.length === 0) return Array(len).fill(0);
    if (arr.length >= len) return arr.slice(0, len);
    return [...arr, ...Array(len - arr.length).fill(0)];
  };

  const visitorsColor = theme.palette.primary.main;

  const series = hasTrafficData
    ? [
        {
          data: pad(trafficData),
          label: t('visitors'),
          color: visitorsColor,
          area: true,
          curve: 'monotoneX',
          showMark: false,
          valueFormatter: (v) => fNumber(v) || '0',
        },
      ]
    : [];

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', ...sx }}>
      {/* Main content area */}
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'row',
          overflow: 'hidden',
        }}
      >
        {/* Left column - Metrics */}
        <Box
          sx={{
            width: 180,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            borderRight: (thm) => `1px dashed ${thm.palette.divider}`,
          }}
        >
          {/* Total Visits Metric */}
          <Box
            sx={{
              flex: 1,
              p: 2,
              borderBottom: (thm) => `1px dashed ${thm.palette.divider}`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <Box sx={{ alignSelf: 'flex-start' }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                  mb: 0.5,
                }}
              >
                {totalVisitors ? fNumber(totalVisitors) : '0'}
              </Typography>

              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  fontWeight: 500,
                }}
              >
                {t('total_visits')}
              </Typography>
            </Box>

            {/* Sparkline */}
            <Box sx={{ height: 36, mt: 1.5 }} dir="ltr">
              <SparkLineChart
                data={visitorsSparklineData}
                height={36}
                curve="natural"
                showHighlight
                showTooltip
                colors={[visitorsSparklineColor]}
                valueFormatter={(v) => `${t('total_visits')}: ${fNumber(v) || '0'}`}
                sx={{
                  '& .MuiLineElement-root': {
                    strokeWidth: 1.5,
                  },
                }}
              />
            </Box>
          </Box>

          {/* Products Count Metric */}
          <Box
            sx={{
              flex: 1,
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            {/* Icon badge */}
            <Box
              sx={{
                position: 'absolute',
                top: 12,
                right: 12,
                width: 36,
                height: 36,
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(theme.palette.info.main, 0.1),
              }}
            >
              <Iconify icon="solar:box-bold-duotone" width={20} sx={{ color: theme.palette.info.main }} />
            </Box>

            <Box sx={{ alignSelf: 'flex-start' }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                  mb: 0.5,
                }}
              >
                {productsCount ? fNumber(productsCount) : '0'}
              </Typography>

              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  fontWeight: 500,
                }}
              >
                {t('total_products')}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Right area - Chart */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
            {t('store_visits')}
          </Typography>

          {trafficLoading ? (
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress size={32} />
            </Box>
          ) : hasTrafficData ? (
            <Box dir="ltr" sx={{ flexGrow: 1, width: '100%', position: 'relative', minHeight: 0 }}>
              <svg width={0} height={0} style={{ position: 'absolute' }}>
                <defs>
                  <linearGradient id="grade-b-chart-grad-visitors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={visitorsColor} stopOpacity={0.24} />
                    <stop offset="100%" stopColor={visitorsColor} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
              </svg>

              <LineChart
                series={series}
                xAxis={[
                  {
                    scaleType: 'time',
                    data: xDates,
                    valueFormatter: xValueFormatter,
                    tickMinStep: 3600 * 1000 * 24,
                  },
                ]}
                yAxis={[{ tickMinStep: 1 }]}
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
                  right: 20,
                  bottom: 28,
                  left: 48,
                }}
                sx={{
                  '& .MuiLineElement-root': {
                    strokeWidth: 2,
                  },
                  '& .MuiAreaElement-series-auto-generated-id-0': {
                    fill: 'url(#grade-b-chart-grad-visitors)',
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
            <Stack alignItems="center" justifyContent="center" sx={{ flexGrow: 1 }}>
              <Typography variant="body2" color="text.disabled">
                {t('no_data_available')}
              </Typography>
            </Stack>
          )}
        </Box>
      </Box>

      {/* Footer */}
      <Stack
        direction="row"
        justifyContent="center"
        alignItems="center"
        spacing={3}
        sx={{ py: 1.25, borderTop: (thm) => `1px dashed ${thm.palette.divider}` }}
      >
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Iconify icon="solar:calendar-linear" width={15} sx={{ color: 'text.disabled' }} />
          <Select
            value={dateRange}
            onChange={(e) => onDateRangeChange(e.target.value)}
            variant="standard"
            disableUnderline
            sx={{
              color: 'text.disabled',
              '& .MuiSelect-select': { py: 0, pr: '18px !important', pl: 0, fontSize: '0.75rem', lineHeight: 1.5 },
              '& .MuiSvgIcon-root': { color: 'text.disabled', fontSize: 14, right: 0, top: 'calc(50% - 7px)' },
            }}
          >
            {DATE_RANGE_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: '0.75rem' }}>
                {t(opt.label)}
              </MenuItem>
            ))}
          </Select>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={0.75}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: 'success.main',
              animation: 'pulse-live 2s ease-in-out infinite',
              '@keyframes pulse-live': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.4 },
              },
            }}
          />
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            {t('live_updates')}
          </Typography>
        </Stack>
      </Stack>
    </Card>
  );
}

GradeBMetrics.propTypes = {
  totalVisitors: PropTypes.number,
  totalVisitorsData: PropTypes.array,
  productsCount: PropTypes.number,
  trafficData: PropTypes.array,
  trafficLabels: PropTypes.array,
  trafficLoading: PropTypes.bool,
  dateRange: PropTypes.string.isRequired,
  onDateRangeChange: PropTypes.func.isRequired,
  sx: PropTypes.object,
};

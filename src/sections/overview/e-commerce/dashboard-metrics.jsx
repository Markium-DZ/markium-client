import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import { SparkLineChart } from '@mui/x-charts/SparkLineChart';

import { fNumber } from 'src/utils/format-number';
import Iconify from 'src/components/iconify';

import { DATE_RANGE_OPTIONS } from 'src/api/analytics';

// ----------------------------------------------------------------------

const FLAT_LINE = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

// ----------------------------------------------------------------------

export default function DashboardMetrics({ metrics, dateRange, onDateRangeChange }) {
  const { t } = useTranslation();

  return (
    <Stack spacing={2} sx={{ height: '100%' }}>
      <Box
        display="grid"
        gridTemplateColumns="repeat(2, 1fr)"
        gap={2}
        sx={{ flexGrow: 1 }}
      >
        {metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} sx={metric.span === 2 ? { gridColumn: '1 / -1' } : undefined} />
        ))}
      </Box>

      {/* Footer */}
      <Stack
        direction="row"
        justifyContent="center"
        alignItems="center"
        spacing={3}
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
    </Stack>
  );
}

DashboardMetrics.propTypes = {
  metrics: PropTypes.array.isRequired,
  dateRange: PropTypes.string.isRequired,
  onDateRangeChange: PropTypes.func.isRequired,
};

// ----------------------------------------------------------------------

function MetricCard({ metric, sx: sxProp }) {
  const theme = useTheme();
  const mainColor = metric.color || theme.palette.primary.main;
  const hasData = metric.data?.length > 0;
  const data = hasData ? metric.data.slice(-10) : FLAT_LINE;
  const chartColor = hasData ? mainColor : theme.palette.grey[300];

  return (
    <Card
      sx={{
        p: 2.5,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 12px 24px -4px ${alpha(mainColor, 0.16)}`,
        },
        ...sxProp,
      }}
    >
      {/* Decorative background circles */}
      <Box
        sx={{
          position: 'absolute',
          top: -24,
          right: -24,
          width: 96,
          height: 96,
          borderRadius: '50%',
          bgcolor: alpha(mainColor, 0.06),
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: -8,
          right: -8,
          width: 56,
          height: 56,
          borderRadius: '50%',
          bgcolor: alpha(mainColor, 0.1),
        }}
      />

      <Stack spacing={1.5} sx={{ position: 'relative', zIndex: 1, flexGrow: 1 }}>
        {/* Icon badge */}
        <Tooltip title={metric.tooltip || ''} placement="top" arrow>
          <Box
            sx={{
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 1.5,
              background: `linear-gradient(135deg, ${alpha(mainColor, 0.16)} 0%, ${alpha(mainColor, 0.04)} 100%)`,
              border: `1px solid ${alpha(mainColor, 0.12)}`,
            }}
          >
            <Iconify icon={metric.icon || 'solar:chart-bold-duotone'} width={22} sx={{ color: mainColor }} />
          </Box>
        </Tooltip>

        {/* Value + Label */}
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              mb: 0.5,
            }}
          >
            {metric.value ? fNumber(metric.value) : '0'}
            {metric.suffix && (
              <Typography
                component="span"
                variant="subtitle2"
                sx={{ ml: 0.5, fontWeight: 500, color: 'text.secondary' }}
              >
                {metric.suffix}
              </Typography>
            )}
          </Typography>

          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            {metric.label}
          </Typography>
        </Box>

        {/* Sparkline */}
        <Box sx={{ height: 32, mt: 'auto' }} dir="ltr">
          <SparkLineChart
            data={data}
            height={32}
            curve="natural"
            showHighlight
            showTooltip
            colors={[chartColor]}
            valueFormatter={(v) => `${metric.label}: ${fNumber(v) || '0'}`}
            sx={{
              '& .MuiLineElement-root': {
                strokeWidth: 1.5,
              },
            }}
          />
        </Box>
      </Stack>
    </Card>
  );
}

MetricCard.propTypes = {
  metric: PropTypes.object.isRequired,
  sx: PropTypes.object,
};

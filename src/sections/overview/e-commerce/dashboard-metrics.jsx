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
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Metrics grid: 2 top cells + 1 spanning bottom */}
      <Box
        sx={{
          flexGrow: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gridTemplateRows: 'repeat(2, 1fr)',
          '& > *:first-of-type': {
            borderRight: (thm) => `1px dashed ${thm.palette.divider}`,
            borderBottom: (thm) => `1px dashed ${thm.palette.divider}`,
          },
          '& > *:nth-of-type(2)': {
            borderBottom: (thm) => `1px dashed ${thm.palette.divider}`,
          },
        }}
      >
        {metrics.map((metric) => (
          <MetricCell key={metric.label} metric={metric} />
        ))}
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

DashboardMetrics.propTypes = {
  metrics: PropTypes.array.isRequired,
  dateRange: PropTypes.string.isRequired,
  onDateRangeChange: PropTypes.func.isRequired,
};

// ----------------------------------------------------------------------

function MetricCell({ metric }) {
  const theme = useTheme();
  const hasData = metric.data?.length > 0;
  const data = hasData ? metric.data.slice(-10) : FLAT_LINE;
  const color = hasData ? metric.color : theme.palette.grey[300];
  const isWide = metric.span === 2;

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        p: 2,
        overflow: 'hidden',
        ...(isWide && { gridColumn: '1 / -1' }),
      }}
    >
      {/* Colored icon badge — top-end corner */}
      <Tooltip title={metric.tooltip || ''} placement="top" arrow>
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
            bgcolor: alpha(metric.color, 0.1),
          }}
        >
          <Iconify icon={metric.icon || 'solar:chart-bold-duotone'} width={20} sx={{ color: metric.color }} />
        </Box>
      </Tooltip>

      {/* Value + Label */}
      <Tooltip title={metric.tooltip || ''} placement="top" arrow>
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
            {metric.value ? fNumber(metric.value) : '0'}
            {metric.suffix && (
              <Typography component="span" variant="body2" sx={{ fontWeight: 600, ml: 0.5 }}>
                {metric.suffix}
              </Typography>
            )}
          </Typography>

          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontWeight: 500,
            }}
          >
            {metric.label}
          </Typography>
        </Box>
      </Tooltip>

      {/* Sparkline */}
      <Box sx={{ height: 36, mt: 1.5 }} dir="ltr">
        <SparkLineChart
          data={data}
          height={36}
          curve="natural"
          showHighlight
          showTooltip
          colors={[color]}
          valueFormatter={(v) => `${metric.label}: ${fNumber(v) || '0'}`}
          sx={{
            '& .MuiLineElement-root': {
              strokeWidth: 1.5,
            },
          }}
        />
      </Box>
    </Box>
  );
}

MetricCell.propTypes = {
  metric: PropTypes.object.isRequired,
};

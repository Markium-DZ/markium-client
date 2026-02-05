import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import FormControl from '@mui/material/FormControl';
import LinearProgress from '@mui/material/LinearProgress';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';
import { alpha, useTheme } from '@mui/material/styles';

import { fNumber, fPercent } from 'src/utils/format-number';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import Chart, { useChart } from 'src/components/chart';

import { DATE_RANGE_OPTIONS } from 'src/api/analytics';

// ----------------------------------------------------------------------

const TABS = [
  { value: 'overview', label: 'overview', icon: 'solar:chart-square-bold-duotone' },
  { value: 'traffic', label: 'traffic', icon: 'solar:users-group-rounded-bold-duotone' },
  { value: 'funnel', label: 'funnel', icon: 'solar:filter-bold-duotone' },
  { value: 'top_products', label: 'top_products', icon: 'solar:star-bold-duotone' },
];

// ----------------------------------------------------------------------

export default function EcommerceAnalyticsTabs({
  // Overview data
  totalOrders,
  totalOrdersData,
  totalRevenue,
  totalRevenueData,
  totalVisitors,
  totalVisitorsData,
  totalProductViews,
  totalProductViewsData,
  overviewLoading,
  // Traffic data
  visitors,
  productViews,
  trafficLoading,
  // Funnel data
  funnel,
  funnelLoading,
  // Top products data
  topProducts,
  topProductsLoading,
  // Date range
  dateRange,
  onDateRangeChange,
  // Tab state
  currentTab,
  onTabChange,
  ...other
}) {
  const { t } = useTranslation();

  const handleChangeTab = (event, newValue) => {
    onTabChange?.(newValue);
  };

  const handleDateRangeChange = (event) => {
    onDateRangeChange?.(event.target.value);
  };

  return (
    <Card {...other}>
      <CardHeader
        title={t('analytics')}
        action={
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select
              value={dateRange}
              onChange={handleDateRangeChange}
              sx={{ fontSize: 14 }}
            >
              {DATE_RANGE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {t(option.label)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        }
        sx={{ pb: 0 }}
      />

      <Tabs
        value={currentTab}
        onChange={handleChangeTab}
        sx={{
          px: 3,
          pt: 2,
          '& .MuiTab-root': {
            minHeight: 48,
          },
        }}
      >
        {TABS.map((tab) => (
          <Tab
            key={tab.value}
            value={tab.value}
            label={t(tab.label)}
            icon={<Iconify icon={tab.icon} width={24} />}
            iconPosition="start"
          />
        ))}
      </Tabs>

      <Box sx={{ p: 3 }}>
        {currentTab === 'overview' && (
          <OverviewTab
            totalOrders={totalOrders}
            totalOrdersData={totalOrdersData}
            totalRevenue={totalRevenue}
            totalRevenueData={totalRevenueData}
            totalVisitors={totalVisitors}
            totalVisitorsData={totalVisitorsData}
            totalProductViews={totalProductViews}
            totalProductViewsData={totalProductViewsData}
            loading={overviewLoading}
          />
        )}

        {currentTab === 'traffic' && (
          <TrafficTab
            visitors={visitors}
            productViews={productViews}
            loading={trafficLoading}
          />
        )}

        {currentTab === 'funnel' && (
          <FunnelTab funnel={funnel} loading={funnelLoading} />
        )}

        {currentTab === 'top_products' && (
          <TopProductsTab topProducts={topProducts} loading={topProductsLoading} />
        )}
      </Box>
    </Card>
  );
}

EcommerceAnalyticsTabs.propTypes = {
  totalOrders: PropTypes.number,
  totalOrdersData: PropTypes.array,
  totalRevenue: PropTypes.number,
  totalRevenueData: PropTypes.array,
  totalVisitors: PropTypes.number,
  totalVisitorsData: PropTypes.array,
  totalProductViews: PropTypes.number,
  totalProductViewsData: PropTypes.array,
  overviewLoading: PropTypes.bool,
  visitors: PropTypes.object,
  productViews: PropTypes.object,
  trafficLoading: PropTypes.bool,
  funnel: PropTypes.array,
  funnelLoading: PropTypes.bool,
  topProducts: PropTypes.array,
  topProductsLoading: PropTypes.bool,
  dateRange: PropTypes.string,
  onDateRangeChange: PropTypes.func,
  currentTab: PropTypes.string,
  onTabChange: PropTypes.func,
};

// ----------------------------------------------------------------------
// OVERVIEW TAB
// ----------------------------------------------------------------------

function OverviewTab({
  totalOrders,
  totalOrdersData,
  totalRevenue,
  totalRevenueData,
  totalVisitors,
  totalVisitorsData,
  totalProductViews,
  totalProductViewsData,
  loading,
}) {
  const { t } = useTranslation();
  const theme = useTheme();

  if (loading) {
    return <LoadingState />;
  }

  const metrics = [
    {
      label: t('total_orders'),
      tooltip: t('tooltip_total_orders'),
      value: totalOrders,
      data: totalOrdersData,
      color: theme.palette.primary.main,
      icon: 'solar:cart-large-minimalistic-bold-duotone',
    },
    {
      label: t('total_revenue'),
      tooltip: t('tooltip_total_revenue'),
      value: totalRevenue,
      data: totalRevenueData,
      color: theme.palette.info.main,
      icon: 'solar:dollar-minimalistic-bold-duotone',
    },
    {
      label: t('total_visitors'),
      tooltip: t('tooltip_total_visitors'),
      value: totalVisitors,
      data: totalVisitorsData,
      color: theme.palette.warning.main,
      icon: 'solar:users-group-rounded-bold-duotone',
    },
    {
      label: t('total_product_views'),
      tooltip: t('tooltip_total_product_views'),
      value: totalProductViews,
      data: totalProductViewsData,
      color: theme.palette.success.main,
      icon: 'solar:eye-bold-duotone',
    },
  ];

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 3,
        gridTemplateColumns: {
          xs: 'repeat(1, 1fr)',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(4, 1fr)',
        },
      }}
    >
      {metrics.map((metric) => (
        <MetricCard key={metric.label} metric={metric} />
      ))}
    </Box>
  );
}

function MetricCard({ metric }) {
  const { t } = useTranslation();
  const theme = useTheme();

  // Check if data has any non-zero values OR if the total value is non-zero
  const hasChartData = metric.data && metric.data.length > 0;
  const hasNonZeroData = hasChartData && metric.data.some((val) => val > 0);
  // Show chart if there's non-zero data, hide only when both value and data are zero
  const showChart = hasNonZeroData || (hasChartData && metric.value > 0);

  const chartOptions = useChart({
    colors: [metric.color],
    chart: {
      sparkline: { enabled: true },
    },
    xaxis: { categories: [] },
    stroke: { width: 2 },
    tooltip: {
      y: { formatter: (value) => fNumber(value), title: { formatter: () => '' } },
    },
  });

  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: 2,
        bgcolor: alpha(metric.color, 0.08),
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
        <Box
          sx={{
            p: 1,
            borderRadius: 1,
            bgcolor: alpha(metric.color, 0.16),
            color: metric.color,
          }}
        >
          <Iconify icon={metric.icon} width={24} />
        </Box>
        <Tooltip title={metric.tooltip} arrow placement="top">
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', cursor: 'help' }}>
            {metric.label}
          </Typography>
        </Tooltip>
      </Stack>

      <Typography variant="h4" sx={{ mb: 1 }}>
        {fNumber(metric.value)}
      </Typography>

      {hasNonZeroData ? (
        <Chart
          type="line"
          series={[{ data: metric.data.slice(-10) }]}
          options={chartOptions}
          height={60}
        />
      ) : (
        <Box
          sx={{
            height: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            {t('no_chart_data')}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

MetricCard.propTypes = {
  metric: PropTypes.object,
};

// ----------------------------------------------------------------------
// TRAFFIC TAB
// ----------------------------------------------------------------------

function TrafficTab({ visitors, productViews, loading }) {
  const { t } = useTranslation();
  const theme = useTheme();

  if (loading) {
    return <LoadingState />;
  }

  const hasData = visitors?.data?.length > 0 || productViews?.data?.length > 0;

  if (!hasData) {
    return <EmptyState message={t('no_traffic_data')} />;
  }

  const chartOptions = useChart({
    colors: [theme.palette.primary.main, theme.palette.warning.main],
    xaxis: {
      categories: visitors?.labels?.slice(-14) || [],
    },
    tooltip: {
      y: { formatter: (value) => fNumber(value) },
    },
  });

  const series = [
    {
      name: t('total_visitors'),
      data: visitors?.data?.slice(-14) || [],
    },
    {
      name: t('product_views'),
      data: productViews?.data?.slice(-14) || [],
    },
  ];

  return (
    <Box>
      <Stack direction="row" spacing={3} sx={{ mb: 3 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h4">{fNumber(visitors?.count || 0)}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('total_visitors')}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h4">{fNumber(productViews?.count || 0)}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('product_views')}
          </Typography>
        </Box>
      </Stack>

      <Chart type="area" series={series} options={chartOptions} height={320} />
    </Box>
  );
}

TrafficTab.propTypes = {
  visitors: PropTypes.object,
  productViews: PropTypes.object,
  loading: PropTypes.bool,
};

// ----------------------------------------------------------------------
// FUNNEL TAB
// ----------------------------------------------------------------------

function FunnelTab({ funnel, loading }) {
  const { t } = useTranslation();
  const theme = useTheme();

  if (loading) {
    return <LoadingState />;
  }

  if (!funnel || funnel.length === 0) {
    return <EmptyState message={t('no_funnel_data')} />;
  }

  const funnelLabels = {
    $pageview: t('page_views'),
    product_viewed: t('product_viewed'),
    add_to_cart: t('add_to_cart'),
    checkout_started: t('checkout_started'),
    order_completed: t('order_completed'),
  };

  const colors = [
    theme.palette.primary.main,
    theme.palette.info.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.success.main,
  ];

  const maxCount = funnel[0]?.count || 1;

  return (
    <Stack spacing={2.5}>
      {funnel.map((step, index) => {
        const prevCount = index > 0 ? funnel[index - 1].count : step.count;
        const conversionRate = prevCount > 0 ? (step.count / prevCount) * 100 : 0;
        const totalRate = (step.count / maxCount) * 100;

        return (
          <Box key={step.name}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: colors[index % colors.length],
                  }}
                />
                <Typography variant="subtitle2">
                  {funnelLabels[step.name] || step.name}
                </Typography>
              </Stack>

              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="subtitle2">{fNumber(step.count)}</Typography>
                {index > 0 && (
                  <Typography
                    variant="caption"
                    sx={{
                      px: 0.75,
                      py: 0.25,
                      borderRadius: 0.5,
                      bgcolor: alpha(colors[index % colors.length], 0.16),
                      color: colors[index % colors.length],
                    }}
                  >
                    {fPercent(conversionRate)}
                  </Typography>
                )}
              </Stack>
            </Stack>

            <LinearProgress
              variant="determinate"
              value={totalRate}
              sx={{
                height: 10,
                borderRadius: 1,
                bgcolor: alpha(colors[index % colors.length], 0.16),
                '& .MuiLinearProgress-bar': {
                  bgcolor: colors[index % colors.length],
                  borderRadius: 1,
                },
              }}
            />
          </Box>
        );
      })}
    </Stack>
  );
}

FunnelTab.propTypes = {
  funnel: PropTypes.array,
  loading: PropTypes.bool,
};

// ----------------------------------------------------------------------
// TOP PRODUCTS TAB
// ----------------------------------------------------------------------

function TopProductsTab({ topProducts, loading }) {
  const { t } = useTranslation();
  const theme = useTheme();

  if (loading) {
    return <LoadingState />;
  }

  if (!topProducts || topProducts.length === 0) {
    return <EmptyState message={t('no_top_products_data')} />;
  }

  const maxCount = topProducts[0]?.count || 1;

  return (
    <TableContainer>
      <Scrollbar>
        <Table sx={{ minWidth: 400 }}>
          <TableBody>
            {topProducts.map((product, index) => (
              <TableRow key={product.breakdown_value}>
                <TableCell sx={{ width: 40 }}>
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor:
                        index === 0
                          ? theme.palette.primary.main
                          : index === 1
                            ? theme.palette.info.main
                            : index === 2
                              ? theme.palette.warning.main
                              : alpha(theme.palette.grey[500], 0.16),
                      color: index < 3 ? 'white' : 'text.secondary',
                      fontWeight: 'bold',
                      fontSize: 12,
                    }}
                  >
                    {index + 1}
                  </Box>
                </TableCell>

                <TableCell>
                  <Typography variant="subtitle2" noWrap>
                    {product.breakdown_value}
                  </Typography>
                </TableCell>

                <TableCell sx={{ width: 200 }}>
                  <Stack spacing={0.5}>
                    <LinearProgress
                      variant="determinate"
                      value={(product.count / maxCount) * 100}
                      sx={{
                        height: 6,
                        borderRadius: 1,
                        bgcolor: alpha(theme.palette.primary.main, 0.16),
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 1,
                        },
                      }}
                    />
                  </Stack>
                </TableCell>

                <TableCell align="right">
                  <Typography variant="subtitle2">{fNumber(product.count)}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('views')}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Scrollbar>
    </TableContainer>
  );
}

TopProductsTab.propTypes = {
  topProducts: PropTypes.array,
  loading: PropTypes.bool,
};

// ----------------------------------------------------------------------
// SHARED COMPONENTS
// ----------------------------------------------------------------------

function LoadingState() {
  return (
    <Box sx={{ py: 5, textAlign: 'center' }}>
      <CircularProgress size={40} />
    </Box>
  );
}

function EmptyState({ message }) {
  const { t } = useTranslation();

  return (
    <Box sx={{ py: 5, textAlign: 'center' }}>
      <Iconify
        icon="solar:chart-square-bold-duotone"
        width={48}
        sx={{ color: 'text.disabled', mb: 2 }}
      />
      <Typography variant="body2" color="text.secondary">
        {message || t('no_data_available')}
      </Typography>
    </Box>
  );
}

EmptyState.propTypes = {
  message: PropTypes.string,
};

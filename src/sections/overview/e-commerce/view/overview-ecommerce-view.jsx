import { useState, useContext, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import Container from '@mui/material/Container';
import Grid from '@mui/material/Unstable_Grid2';
import { useTheme } from '@mui/material/styles';

import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';

import { useGetProducts } from 'src/api/product';
import { useGetOrders } from 'src/api/orders';
import { useGetMedia } from 'src/api/media';
import { useGetLowStockInventory } from 'src/api/inventory';
import {
  useGetAnalyticsOverview,
  useGetAnalyticsTraffic,
  useGetAnalyticsTopProducts,
  useGetAnalyticsFunnel,
} from 'src/api/analytics';

import { AuthContext } from 'src/auth/context/jwt';

import { useSettingsContext } from 'src/components/settings';
import { MotivationIllustration } from 'src/assets/illustrations';
import { Walktour, useWalktour } from 'src/components/walktour';

import EcommerceEventsCalendar from '../ecommerce-events-calendar';
import DashboardMetrics from '../dashboard-metrics';
import DashboardChart from '../dashboard-chart';
import DashboardFunnel from '../dashboard-funnel';
import DashboardSkeleton from './dashboard-skeleton';

import {
  SetupChecklist,
  WelcomeNewUser,
  EmptyStateOrders,
} from 'src/sections/dashboard/onboarding';

import {
  ActionCenter,
  DashboardDataTable,
} from 'src/sections/dashboard/active-merchant';

// ----------------------------------------------------------------------

export default function OverviewEcommerceView() {
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();
  const theme = useTheme();
  const { products, productsLoading, productsMutate } = useGetProducts();
  const { orders, ordersLoading } = useGetOrders();
  const { media, total: mediaTotal, mutate: mediaMutate } = useGetMedia(1, 1);

  const router = useRouter();
  const settings = useSettingsContext();

  const { run: tourRun, handleCallback: tourCallback } = useWalktour();

  const tourSteps = useMemo(() => [
    {
      target: '[data-tour="welcome-banner"]',
      title: t('tour_welcome_title'),
      content: t('tour_welcome_content'),
      disableBeacon: true,
    },
    {
      target: '[data-tour="setup-checklist"]',
      title: t('tour_setup_title'),
      content: t('tour_setup_content'),
    },
  ], [t]);

  // Refresh data when tasks are completed in SetupChecklist
  const handleRefreshData = useCallback(() => {
    productsMutate?.();
    mediaMutate?.();
  }, [productsMutate, mediaMutate]);

  // Show skeleton while core data is loading to prevent grade flicker
  const gradeLoading = productsLoading || ordersLoading;

  const productsCount = products?.length || 0;
  const ordersCount = orders?.length || 0;
  const hasMedia = mediaTotal > 0 || (media && media.length > 0);

  // Determine if user is new (no products)
  const isNewUser = !gradeLoading && productsCount === 0;
  // B grade merchant: has products but no orders yet
  const isBGradeMerchant = !gradeLoading && productsCount > 0 && ordersCount === 0;
  // Third grade user: has products and orders (established merchant)
  const isThirdGradeUser = !gradeLoading && !isNewUser && !isBGradeMerchant;

  // Analytics state
  const [dateRange, setDateRange] = useState('-30d');

  // Fetch analytics data only for third grade users
  const {
    totalOrders: analyticsOrders,
    totalOrdersData,
    totalOrdersLabels,
    totalRevenue,
    totalRevenueData,
    totalRevenueLabels,
    totalVisitors,
    totalVisitorsData,
    totalVisitorsLabels,
    totalProductViews,
    totalProductViewsData,
    overviewLoading,
  } = useGetAnalyticsOverview(isThirdGradeUser ? dateRange : null);

  // Fetch traffic time-series (visitors + product views per day)
  const {
    visitors: trafficVisitors,
    trafficLoading,
  } = useGetAnalyticsTraffic(isThirdGradeUser ? dateRange : null);

  const { topProducts, topProductsLoading } = useGetAnalyticsTopProducts(isThirdGradeUser ? dateRange : null);

  const {
    funnel: funnelData,
    funnelLoading,
  } = useGetAnalyticsFunnel(isThirdGradeUser ? dateRange : null);

  // Low stock data (fetches 10 items for dashboard table + total count)
  const {
    inventory: lowStockItems,
    inventoryLoading: lowStockLoading,
    total: lowStockTotal,
  } = useGetLowStockInventory(1, 10);

  // Derived data for Grade C widgets
  const pendingOrders = useMemo(
    () => (orders || []).filter((o) => o.status === 'pending').length,
    [orders]
  );

  const ordersToShip = useMemo(
    () => (orders || []).filter((o) => o.status === 'confirmed').length,
    [orders]
  );

  const draftProducts = useMemo(
    () => (products || []).filter((p) => p.status === 'draft').length,
    [products]
  );

  // Build orders-per-day time-series from raw orders, aligned to traffic labels
  const ordersTimeSeries = useMemo(() => {
    const labels = trafficVisitors?.labels;
    if (!labels?.length || !orders?.length) return { data: [], labels: [] };

    // Normalize date to YYYY-MM-DD regardless of input format
    const toDay = (dateStr) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      if (Number.isNaN(d.getTime())) return dateStr.slice(0, 10);
      return d.toISOString().slice(0, 10);
    };

    // Count orders per date
    const countByDate = {};
    orders.forEach((o) => {
      const day = toDay(o.created_at);
      if (day) countByDate[day] = (countByDate[day] || 0) + 1;
    });

    const data = labels.map((label) => countByDate[toDay(label)] || 0);

    return { data, labels };
  }, [orders, trafficVisitors?.labels]);

  // Metric cards data
  const metricCards = useMemo(() => [
    {
      label: t('total_orders'),
      tooltip: t('metric_tooltip_orders'),
      value: analyticsOrders || ordersCount || 0,
      data: totalOrdersData,
      color: theme.palette.primary.main,
      icon: 'solar:bag-4-bold-duotone',
    },
    {
      label: t('total_revenue'),
      tooltip: t('metric_tooltip_revenue'),
      value: totalRevenue || 0,
      data: totalRevenueData,
      color: theme.palette.info.main,
      icon: 'solar:wallet-money-bold-duotone',
    },
    {
      label: t('total_visitors'),
      tooltip: t('metric_tooltip_visitors'),
      value: totalVisitors || 0,
      data: totalVisitorsData,
      color: theme.palette.warning.main,
      icon: 'solar:users-group-rounded-bold-duotone',
    },
    {
      label: t('total_product_views'),
      tooltip: t('metric_tooltip_views'),
      value: totalProductViews || 0,
      data: totalProductViewsData,
      color: theme.palette.success.main,
      icon: 'solar:eye-bold-duotone',
    },
  ], [t, theme, analyticsOrders, ordersCount, totalOrdersData, totalRevenue, totalRevenueData, totalVisitors, totalVisitorsData, totalProductViews, totalProductViewsData]);

  if (gradeLoading) {
    return <DashboardSkeleton themeStretch={settings.themeStretch} />;
  }

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'}>
      {isNewUser && <Walktour steps={tourSteps} run={tourRun} callback={tourCallback} />}

      <Grid container spacing={3}>
        {/* ===== GRADE A & B: Original layout ===== */}
        {!isThirdGradeUser && (
          <>
            {/* Welcome Banner */}
            <Grid xs={12} md={8} data-tour="welcome-banner">
              <WelcomeNewUser
                userName={user?.name}
                productsCount={productsCount}
                img={<MotivationIllustration />}
              />
            </Grid>

            {/* Events Calendar */}
            <Grid xs={12} md={4}>
              <EcommerceEventsCalendar />
            </Grid>

            {/* Setup Checklist - Only for new users or incomplete setup */}
            {isNewUser && (
              <Grid xs={12} data-tour="setup-checklist">
                <SetupChecklist
                  productsCount={productsCount}
                  ordersCount={ordersCount}
                  hasMedia={hasMedia}
                  isPhoneVerified={user?.is_phone_verified ?? true}
                  onRefresh={handleRefreshData}
                />
              </Grid>
            )}

            {/* B Grade Merchant: has products but no orders - show EmptyStateOrders */}
            {isBGradeMerchant && (
              <Grid xs={12}>
                <EmptyStateOrders hasProducts />
              </Grid>
            )}
          </>
        )}

        {/* ===== GRADE C: Operational command center ===== */}
        {isThirdGradeUser && (
          <>
            {/* Row 1: Metrics 2x2 (md=3) + Chart (md=5) + Calendar (md=4) */}
            <Grid xs={12} md={3}>
              <DashboardMetrics
                metrics={metricCards}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
              />
            </Grid>

            <Grid xs={12} md={5}>
              <DashboardChart
                visitorsData={trafficVisitors.data}
                visitorsLabels={trafficVisitors.labels}
                ordersData={ordersTimeSeries.data}
                ordersLabels={ordersTimeSeries.labels}
                loading={trafficLoading || ordersLoading}
              />
            </Grid>

            <Grid xs={12} md={4}>
              <EcommerceEventsCalendar />
            </Grid>

            {/* Row 2: Action Center (md=4) + Data Table (md=5) + Funnel (md=3) */}
            <Grid xs={12} md={4}>
              <ActionCenter
                pendingOrders={pendingOrders}
                ordersToShip={ordersToShip}
                lowStockCount={lowStockTotal || 0}
                draftProducts={draftProducts}
              />
            </Grid>

            <Grid xs={12} md={5}>
              <DashboardDataTable
                orders={orders}
                ordersLoading={ordersLoading}
                topProducts={topProducts}
                topProductsLoading={topProductsLoading}
                lowStockInventory={lowStockItems}
                lowStockLoading={lowStockLoading}
              />
            </Grid>

            <Grid xs={12} md={3}>
              <DashboardFunnel
                funnel={funnelData}
                loading={funnelLoading}
              />
            </Grid>
          </>
        )}
      </Grid>
    </Container>
  );
}

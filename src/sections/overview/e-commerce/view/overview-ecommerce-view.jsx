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
import ConnectionError from 'src/components/connection-error';
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
  const { products, productsLoading, productsError, productsMutate } = useGetProducts();
  const { orders, ordersLoading, ordersError, mutate: ordersMutate } = useGetOrders();
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

  // Show skeleton while core data is loading or on connection error (prevents grade misclassification)
  const isStillLoading = productsLoading || ordersLoading;
  const hasConnectionError = !isStillLoading && ((productsError && !products?.length) || (ordersError && !orders?.length));
  const gradeLoading = isStillLoading || hasConnectionError;

  const productsCount = products?.length || 0;
  const ordersCount = orders?.length || 0;
  const hasMedia = mediaTotal > 0 || (media && media.length > 0);

  // Determine if user is new (no products)
  const isNewUser = !gradeLoading && productsCount === 0;
  // B grade merchant: has products but no orders yet
  const isBGradeMerchant = !gradeLoading && productsCount > 0 && ordersCount === 0;
  // Third grade user: has products and orders (established merchant)
  const isThirdGradeUser = !gradeLoading && !isNewUser && !isBGradeMerchant;

  // HEADER.H_DESKTOP(80) + SPACING(8) = 88px  → Main py = 88px top + 88px bottom = 176px
  const MAIN_VERTICAL_PADDING = 176;

  // Analytics state
  const [dateRange, setDateRange] = useState('-7d');

  // Fetch analytics data only for third grade users
  const {
    totalOrders: analyticsOrders,
    totalOrdersData,
    totalRevenue,
    totalRevenueData,
    totalVisitors,
    totalVisitorsData,
    overviewLoading,
  } = useGetAnalyticsOverview(isThirdGradeUser ? dateRange : null);

  // Fetch traffic time-series (hourly for 1-day, daily otherwise)
  const trafficInterval = dateRange === '-1d' ? 'hour' : 'day';
  const {
    visitors: trafficVisitors,
    productViews: trafficProductViews,
    orderCompleted: trafficOrders,
    trafficLoading,
  } = useGetAnalyticsTraffic(isThirdGradeUser ? dateRange : null, trafficInterval);

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

  // Metric cards data — prefer overview time-series, fallback to traffic time-series
  const metricCards = useMemo(() => [
    {
      label: t('total_orders'),
      tooltip: t('metric_tooltip_orders'),
      value: analyticsOrders || ordersCount || 0,
      data: totalOrdersData?.length ? totalOrdersData : trafficOrders.data,
      color: theme.palette.primary.main,
      icon: 'solar:bag-4-bold-duotone',
    },
    {
      label: t('total_visitors'),
      tooltip: t('metric_tooltip_visitors'),
      value: totalVisitors || 0,
      data: totalVisitorsData?.length ? totalVisitorsData : trafficVisitors.data,
      color: theme.palette.success.main,
      icon: 'solar:users-group-rounded-bold-duotone',
    },
    {
      label: t('total_revenue'),
      tooltip: t('metric_tooltip_revenue'),
      value: totalRevenue || 0,
      data: totalRevenueData,
      color: theme.palette.info.main,
      icon: 'solar:wallet-money-bold-duotone',
      suffix: t('currency_da'),
      span: 2,
    },
  ], [t, theme, analyticsOrders, ordersCount, totalOrdersData, totalRevenue, totalRevenueData, totalVisitors, totalVisitorsData, trafficOrders.data, trafficVisitors.data]);

  const handleRetry = useCallback(() => {
    productsMutate?.();
    ordersMutate?.();
    mediaMutate?.();
  }, [productsMutate, ordersMutate, mediaMutate]);

  if (isStillLoading) {
    return <DashboardSkeleton themeStretch={settings.themeStretch} />;
  }

  if (hasConnectionError) {
    return <ConnectionError onRetry={handleRetry} sx={{ flexGrow: 1 }} />;
  }

  return (
    <Container
      maxWidth={settings.themeStretch ? false : 'xl'}
      sx={{
        ...(isThirdGradeUser && {
          height: { lg: `calc(100vh - ${MAIN_VERTICAL_PADDING}px)` },
          overflow: { lg: 'auto' },
        }),
      }}
    >
      {isNewUser && <Walktour steps={tourSteps} run={tourRun} callback={tourCallback} />}

      <Grid
        container
        spacing={3}
        sx={{
          ...(isThirdGradeUser && {
            height: { lg: '100%' },
          }),
        }}
      >
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
            {/* Row 1: Metrics + DataTable + Calendar */}
            <Grid xs={12} md={6} lg={3} sx={{ height: { lg: '50%' } }}>
              <DashboardMetrics
                metrics={metricCards}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
              />
            </Grid>

            <Grid xs={12} md={6} lg={6} sx={{ height: { lg: '50%' } }}>
              <DashboardDataTable
                orders={orders}
                ordersLoading={ordersLoading}
                topProducts={topProducts}
                topProductsLoading={topProductsLoading}
                lowStockInventory={lowStockItems}
                lowStockLoading={lowStockLoading}
              />
            </Grid>

            <Grid xs={12} lg={3} sx={{ height: { lg: '50%' } }}>
              <EcommerceEventsCalendar />
            </Grid>

            {/* Row 2: ActionCenter + Chart + Funnel */}
            <Grid xs={12} md={6} lg={3} sx={{ height: { lg: '50%' } }}>
              <ActionCenter
                pendingOrders={pendingOrders}
                ordersToShip={ordersToShip}
                lowStockCount={lowStockTotal || 0}
                draftProducts={draftProducts}
              />
            </Grid>

            <Grid xs={12} md={6} lg={6} sx={{ height: { lg: '50%' } }}>
              <DashboardChart
                visitorsData={trafficVisitors.data}
                visitorsLabels={trafficVisitors.days || trafficVisitors.labels}
                ordersData={trafficOrders.data}
                ordersLabels={trafficOrders.days || trafficOrders.labels}
                loading={trafficLoading}
                interval={trafficInterval}
              />
            </Grid>

            <Grid xs={12} lg={3} sx={{ height: { lg: '50%' } }}>
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

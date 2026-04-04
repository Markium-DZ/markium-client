import { useState, useContext, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import Container from '@mui/material/Container';
import Grid from '@mui/material/Unstable_Grid2';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import { useTheme } from '@mui/material/styles';
import { Link as RouterLink } from 'react-router-dom';

import { useGetProducts } from 'src/api/product';
import { useGetOrders } from 'src/api/orders';
import { useGetMedia } from 'src/api/media';
import { useGetMyStore } from 'src/api/store';
import { useGetLowStockInventory } from 'src/api/inventory';
import {
  useGetAnalyticsOverview,
  useGetAnalyticsTraffic,
  useGetAnalyticsTopProducts,
  useGetAnalyticsFunnel,
  useGetAnalyticsCapabilities,
} from 'src/api/analytics';

import { AuthContext } from 'src/auth/context/jwt';
import { paths } from 'src/routes/paths';
import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';
import ConnectionError from 'src/components/connection-error';

import {
  SetupChecklist,
  EmptyStateOrders,
  YouTubeEmbed,
  PixelSetupPrompt,
} from 'src/sections/dashboard/onboarding';

import {
  ActionCenter,
  DashboardDataTable,
} from 'src/sections/dashboard/active-merchant';

import AnalyticsGate from '../../analytics/analytics-gate';
import EcommerceEventsCalendar from '../ecommerce-events-calendar';
import DashboardMetrics from '../dashboard-metrics';
import DashboardChart from '../dashboard-chart';
import DashboardFunnel from '../dashboard-funnel';
import DashboardSkeleton from './dashboard-skeleton';

// ----------------------------------------------------------------------

export default function OverviewEcommerceView() {
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();
  const theme = useTheme();
  const { products, productsLoading, productsError, productsMutate } = useGetProducts();
  const { orders, ordersLoading, ordersError, mutate: ordersMutate } = useGetOrders();
  const { media, total: mediaTotal, mutate: mediaMutate } = useGetMedia(1, 1);
  const { store, mutate: storeMutate } = useGetMyStore(user?.store?.slug);

  const settings = useSettingsContext();

  // Refresh data when tasks are completed in SetupChecklist
  const handleRefreshData = useCallback(() => {
    productsMutate?.();
    mediaMutate?.();
    storeMutate?.();
  }, [productsMutate, mediaMutate, storeMutate]);

  // Show skeleton while core data is loading or on connection error (prevents grade misclassification)
  const isStillLoading = productsLoading || ordersLoading;
  const hasConnectionError = !isStillLoading && ((productsError && !products?.length) || (ordersError && !orders?.length));
  const gradeLoading = isStillLoading || hasConnectionError;

  const productsCount = products?.length || 0;
  const ordersCount = orders?.length || 0;
  const hasMedia = mediaTotal > 0 || (media && media.length > 0);

  const hasDeployedProduct = products?.some((p) => p.status === 'deployed');
  const onboardingCompleted = !!store?.config?.onboarding_completed || hasDeployedProduct;

  // Determine if user is new (no products, or has products but hasn't completed onboarding step 3)
  const isNewUser = !gradeLoading && (productsCount === 0 || (productsCount > 0 && !onboardingCompleted));
  // B grade merchant: has products, completed onboarding, but no orders yet
  const isBGradeMerchant = !gradeLoading && productsCount > 0 && onboardingCompleted && ordersCount === 0;
  // Third grade user: has products and orders (established merchant)
  const isThirdGradeUser = !gradeLoading && !isNewUser && !isBGradeMerchant;

  // Check if any pixel is already configured — if so, hide the pixel setup prompt
  const storePixels = store?.config?.pixels;
  const showPixelSetup = !storePixels || !['facebook_pixel', 'tiktok_pixel', 'google_analytics'].some((key) => {
    const cfg = storePixels?.[key];
    return cfg?.enabled && (cfg?.pixel_id || cfg?.tracking_id);
  });

  // HEADER.H_DESKTOP(80) + SPACING(8) = 88px  → Main py = 88px top + 88px bottom = 176px
  const MAIN_VERTICAL_PADDING = 176;

  // Analytics state
  const [dateRange, setDateRange] = useState('-7d');

  // Fetch analytics capabilities to gate data fetching by subscription
  const { sections: analyticsSections } = useGetAnalyticsCapabilities();
  const canAccessTraffic = analyticsSections?.traffic?.accessible ?? false;
  const canAccessFunnel = analyticsSections?.funnel?.accessible ?? false;
  const canAccessOverview = analyticsSections?.overview?.accessible ?? false;

  // Fetch analytics data for Grade B and Grade C merchants
  const shouldFetchAnalytics = isThirdGradeUser || isBGradeMerchant;
  const {
    totalOrders: analyticsOrders,
    totalOrdersData,
    totalRevenue,
    totalRevenueData,
    totalVisitors,
    totalVisitorsData,
    overviewLoading,
  } = useGetAnalyticsOverview(shouldFetchAnalytics && canAccessOverview ? dateRange : null);

  // Fetch traffic time-series (hourly for 1-day, daily otherwise)
  const trafficInterval = dateRange === '-1d' ? 'hour' : 'day';
  const {
    visitors: trafficVisitors,
    productViews: trafficProductViews,
    orderCompleted: trafficOrders,
    trafficLoading,
  } = useGetAnalyticsTraffic(shouldFetchAnalytics && canAccessTraffic ? dateRange : null, trafficInterval);

  const { topProducts, topProductsLoading } = useGetAnalyticsTopProducts(isThirdGradeUser && canAccessOverview ? dateRange : null);

  const {
    funnel: funnelData,
    funnelLoading,
  } = useGetAnalyticsFunnel(isThirdGradeUser && canAccessFunnel ? dateRange : null);

  // Low stock data (fetches 10 items for dashboard table + total count)
  const {
    inventory: lowStockItems,
    inventoryLoading: lowStockLoading,
    total: lowStockTotal,
  } = useGetLowStockInventory(1, 10);

  // Derived data for Grade C widgets
  const pendingOrders = useMemo(
    () => (orders || []).filter((o) => (o.status?.key || o.status) === 'pending').length,
    [orders]
  );

  const ordersToShip = useMemo(
    () => (orders || []).filter((o) => (o.status?.key || o.status) === 'confirmed').length,
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
      color: theme.palette.info.main,
      icon: 'solar:users-group-rounded-bold-duotone',
    },
    {
      label: t('total_revenue'),
      tooltip: t('metric_tooltip_revenue'),
      value: totalRevenue || 0,
      data: totalRevenueData,
      color: theme.palette.secondary.main,
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
        ...((isThirdGradeUser || isBGradeMerchant) && {
          height: { lg: `calc(100vh - ${MAIN_VERTICAL_PADDING}px)` },
          overflow: { lg: 'auto' },
        }),
      }}
    >
      <Grid
        container
        spacing={3}
        sx={{
          ...((isThirdGradeUser || isBGradeMerchant) && {
            height: { lg: '100%' },
          }),
        }}
      >
        {/* ===== GRADE A: Clean centered checklist ===== */}
        {isNewUser && (
          <Grid xs={12} data-tour="setup-checklist">
            <SetupChecklist
              userName={user?.name}
              productsCount={productsCount}
              ordersCount={ordersCount}
              hasMedia={hasMedia}
              isPhoneVerified={user?.is_phone_verified ?? true}
              onboardingCompleted={onboardingCompleted}
              products={products}
              onRefresh={handleRefreshData}
            />
          </Grid>
        )}

        {/* ===== GRADE B: Metrics + Chart + Calendar + EmptyOrders + Video ===== */}
        {isBGradeMerchant && (
          <>
            {/* Row 1: Metrics + Chart + Calendar (same as Grade C) */}
            <Grid xs={12} md={6} lg={3} sx={{ height: { lg: '50%' } }}>
              <DashboardMetrics
                metrics={metricCards}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
              />
            </Grid>

            <Grid xs={12} md={6} lg={6} sx={{ height: { lg: '50%' } }}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardHeader
                  title={t('analytics_traffic')}
                  action={
                    <Button
                      component={RouterLink}
                      to={paths.dashboard.general.analytics}
                      size="small"
                      endIcon={<Iconify icon="eva:arrow-ios-forward-fill" sx={{ transform: theme.direction === 'rtl' ? 'scaleX(-1)' : 'none' }} />}
                    >
                      {t('analytics_overview')}
                    </Button>
                  }
                />
                <AnalyticsGate sectionKey="traffic">
                  <Box sx={{ flexGrow: 1, minHeight: 0 }}>
                    <DashboardChart
                      visitorsData={trafficVisitors.data}
                      visitorsLabels={trafficVisitors.days || trafficVisitors.labels}
                      ordersData={trafficOrders.data}
                      ordersLabels={trafficOrders.days || trafficOrders.labels}
                      loading={trafficLoading}
                      interval={trafficInterval}
                    />
                  </Box>
                </AnalyticsGate>
              </Card>
            </Grid>

            <Grid xs={12} lg={3} sx={{ height: { lg: '50%' } }}>
              <EcommerceEventsCalendar />
            </Grid>

            {/* Row 2: EmptyStateOrders (compact) + Pixel Setup + YouTubeEmbed */}
            <Grid xs={12} lg={showPixelSetup ? 6 : 9} sx={{ height: { lg: '50%' } }}>
              <EmptyStateOrders hasProducts compact sx={{ height: '100%' }} />
            </Grid>

            {showPixelSetup && (
              <Grid xs={12} lg={3} sx={{ height: { lg: '50%' } }}>
                <PixelSetupPrompt store={store} onStoreRefresh={storeMutate} sx={{ height: '100%' }} />
              </Grid>
            )}

            <Grid xs={12} lg={3} sx={{ height: { lg: '50%' } }}>
              <YouTubeEmbed />
            </Grid>
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
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardHeader
                  title={t('analytics_traffic')}
                  action={
                    <Button
                      component={RouterLink}
                      to={paths.dashboard.general.analytics}
                      size="small"
                      endIcon={<Iconify icon="eva:arrow-ios-forward-fill" sx={{ transform: theme.direction === 'rtl' ? 'scaleX(-1)' : 'none' }} />}
                    >
                      {t('analytics_overview')}
                    </Button>
                  }
                />
                <AnalyticsGate sectionKey="traffic">
                  <Box sx={{ flexGrow: 1, minHeight: 0 }}>
                    <DashboardChart
                      visitorsData={trafficVisitors.data}
                      visitorsLabels={trafficVisitors.days || trafficVisitors.labels}
                      ordersData={trafficOrders.data}
                      ordersLabels={trafficOrders.days || trafficOrders.labels}
                      loading={trafficLoading}
                      interval={trafficInterval}
                    />
                  </Box>
                </AnalyticsGate>
              </Card>
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

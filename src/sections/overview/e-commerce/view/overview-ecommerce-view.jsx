import { useState, useContext, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';

import { useGetProducts } from 'src/api/product';
import { useGetOrders } from 'src/api/orders';
import { useGetMedia } from 'src/api/media';
import { useGetLowStockInventory } from 'src/api/inventory';
import {
  useGetAnalyticsOverview,
  useGetAnalyticsTopProducts,
} from 'src/api/analytics';

import { AuthContext } from 'src/auth/context/jwt';

import { useSettingsContext } from 'src/components/settings';
import { MotivationIllustration } from 'src/assets/illustrations';
import { Walktour, useWalktour } from 'src/components/walktour';
import Iconify from 'src/components/iconify';

import EcommerceEventsCalendar from '../ecommerce-events-calendar';
import { MetricCard } from '../ecommerce-analytics-tabs';
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
  const [dateRange] = useState('-30d');

  // Fetch analytics data only for third grade users
  const {
    totalOrders: analyticsOrders,
    totalOrdersData,
    totalRevenue,
    totalRevenueData,
    totalVisitors,
    totalVisitorsData,
    totalProductViews,
    totalProductViewsData,
  } = useGetAnalyticsOverview(isThirdGradeUser ? dateRange : null);

  const { topProducts, topProductsLoading } = useGetAnalyticsTopProducts(isThirdGradeUser ? dateRange : null);

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

  // Metric cards data for standalone rendering
  const metricCards = useMemo(() => [
    {
      label: t('total_orders'),
      tooltip: t('tooltip_total_orders'),
      value: analyticsOrders || ordersCount || 0,
      data: totalOrdersData,
      color: theme.palette.primary.main,
      icon: 'solar:cart-large-minimalistic-bold-duotone',
      href: paths.dashboard.order.root,
    },
    {
      label: t('total_revenue'),
      tooltip: t('tooltip_total_revenue'),
      value: totalRevenue || 0,
      data: totalRevenueData,
      color: theme.palette.info.main,
      icon: 'solar:dollar-minimalistic-bold-duotone',
      href: paths.dashboard.order.root,
    },
    {
      label: t('total_visitors'),
      tooltip: t('tooltip_total_visitors'),
      value: totalVisitors || 0,
      data: totalVisitorsData,
      color: theme.palette.warning.main,
      icon: 'solar:users-group-rounded-bold-duotone',
      href: null,
    },
    {
      label: t('total_product_views'),
      tooltip: t('tooltip_total_product_views'),
      value: totalProductViews || 0,
      data: totalProductViewsData,
      color: theme.palette.success.main,
      icon: 'solar:eye-bold-duotone',
      href: paths.dashboard.product.root,
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
            {/* Row 1: Metrics 2x2 (md=3) + Placeholder (md=5) + Calendar (md=4) */}
            <Grid xs={12} md={3} sx={{ minHeight: 300 }}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gridTemplateRows: 'repeat(2, 1fr)',
                  gap: 1.5,
                  height: '100%',
                }}
              >
                {metricCards.map((metric) => (
                  <MetricCard
                    key={metric.label}
                    metric={metric}
                    compact
                    onClick={metric.href ? () => router.push(metric.href) : undefined}
                  />
                ))}
              </Box>
            </Grid>

            <Grid xs={12} md={5}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: (thm) => alpha(thm.palette.grey[500], 0.04),
                  border: (thm) => `1px dashed ${alpha(thm.palette.grey[500], 0.2)}`,
                }}
              >
                <Box sx={{ textAlign: 'center', p: 3 }}>
                  <Iconify
                    icon="solar:widget-add-bold-duotone"
                    width={40}
                    sx={{ color: 'text.disabled', mb: 1 }}
                  />
                  <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                    {t('coming_soon')}
                  </Typography>
                </Box>
              </Card>
            </Grid>

            <Grid xs={12} md={4}>
              <EcommerceEventsCalendar />
            </Grid>

            {/* Row 2: Action Center (md=4) + Data Table (md=8) */}
            <Grid xs={12} md={4}>
              <ActionCenter
                pendingOrders={pendingOrders}
                ordersToShip={ordersToShip}
                lowStockCount={lowStockTotal || 0}
                draftProducts={draftProducts}
              />
            </Grid>

            <Grid xs={12} md={8}>
              <DashboardDataTable
                orders={orders}
                ordersLoading={ordersLoading}
                topProducts={topProducts}
                topProductsLoading={topProductsLoading}
                lowStockInventory={lowStockItems}
                lowStockLoading={lowStockLoading}
              />
            </Grid>
          </>
        )}
      </Grid>
    </Container>
  );
}

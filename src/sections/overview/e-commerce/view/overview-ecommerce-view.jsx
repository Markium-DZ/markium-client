import { useState, useContext, useCallback } from 'react';

import Container from '@mui/material/Container';
import Grid from '@mui/material/Unstable_Grid2';

import { useGetProducts } from 'src/api/product';
import { useGetOrders } from 'src/api/orders';
import { useGetMedia } from 'src/api/media';
import { useGetMyStore } from 'src/api/store';
import {
  useGetAnalyticsOverview,
  useGetAnalyticsTraffic,
  useGetAnalyticsFunnel,
  useGetAnalyticsTopProducts,
} from 'src/api/analytics';

import { AuthContext } from 'src/auth/context/jwt';

import { useSettingsContext } from 'src/components/settings';
import { MotivationIllustration } from 'src/assets/illustrations';

import DashboardSkeleton from './dashboard-skeleton';
import EcommerceEventsCalendar from '../ecommerce-events-calendar';
import EcommerceAnalyticsTabs from '../ecommerce-analytics-tabs';

import {
  SetupChecklist,
  WelcomeNewUser,
  WaitingForOrders,
} from 'src/sections/dashboard/onboarding';

// ----------------------------------------------------------------------

export default function OverviewEcommerceView() {
  const { user } = useContext(AuthContext);
  const { products, productsLoading, productsMutate } = useGetProducts();
  const { orders, ordersLoading } = useGetOrders();
  const { media, total: mediaTotal, mutate: mediaMutate, mediaLoading } = useGetMedia(1, 1);
  const { store } = useGetMyStore(user?.store?.slug);

  const settings = useSettingsContext();

  // Refresh data when tasks are completed in SetupChecklist
  const handleRefreshData = useCallback(() => {
    productsMutate?.();
    mediaMutate?.();
  }, [productsMutate, mediaMutate]);

  const productsCount = products?.length || 0;
  const ordersCount = orders?.length || 0;
  const hasMedia = mediaTotal > 0 || (media && media.length > 0);
  const isStoreCustomized = Boolean(store?.logo);

  // Loading state - show skeleton before tier determination
  const isDataLoading = productsLoading || ordersLoading || mediaLoading;

  // Setup complete = all 3 checklist steps done
  const setupComplete = productsCount > 0 && hasMedia && isStoreCustomized;

  // New tier logic
  const isNewUser = !setupComplete;                           // checklist incomplete
  const isWaitingForOrders = setupComplete && ordersCount === 0; // store ready, no orders
  const isEstablished = setupComplete && ordersCount > 0;       // has orders

  // Analytics state
  const [dateRange, setDateRange] = useState('-30d');
  const [currentTab, setCurrentTab] = useState('overview');

  // Fetch analytics data only for established users
  const {
    totalOrders: analyticsOrders,
    totalOrdersData,
    totalRevenue,
    totalRevenueData,
    totalVisitors,
    totalVisitorsData,
    totalProductViews,
    totalProductViewsData,
    overviewLoading: analyticsLoading,
  } = useGetAnalyticsOverview(isEstablished ? dateRange : null);

  const { visitors, productViews, trafficLoading } = useGetAnalyticsTraffic(isEstablished ? dateRange : null);

  const { funnel, funnelLoading } = useGetAnalyticsFunnel(isEstablished ? dateRange : null);

  const { topProducts, topProductsLoading } = useGetAnalyticsTopProducts(isEstablished ? dateRange : null);

  // Show skeleton while loading to prevent flash of wrong tier
  if (isDataLoading) {
    return <DashboardSkeleton themeStretch={settings.themeStretch} />;
  }

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'}>
      <Grid container spacing={3}>
        {/* Welcome Banner */}
        <Grid xs={12} md={8} order={{ xs: 1, md: 1 }}>
          <WelcomeNewUser
            userName={user?.name}
            productsCount={productsCount}
            ordersCount={ordersCount}
            isNewUser={isNewUser}
            showSetupHint={isNewUser}
            img={<MotivationIllustration />}
          />
        </Grid>

        {/* Events Calendar */}
        <Grid xs={12} md={4} order={{ xs: 3, md: 2 }} data-tour="calendar">
          <EcommerceEventsCalendar />
        </Grid>

        {/* Setup Checklist - Only when setup incomplete */}
        {isNewUser && (
          <Grid xs={12} order={{ xs: 2, md: 3 }}>
            <SetupChecklist
              productsCount={productsCount}
              hasMedia={hasMedia}
              isStoreCustomized={isStoreCustomized}
              isPhoneVerified={user?.is_phone_verified ?? true}
              onRefresh={handleRefreshData}
            />
          </Grid>
        )}

        {/* Waiting for Orders: setup complete but no orders yet */}
        {isWaitingForOrders && (
          <Grid xs={12} order={{ xs: 2, md: 3 }} data-tour="waiting-orders">
            <WaitingForOrders storeSlug={user?.store?.slug} />
          </Grid>
        )}

        {/* Analytics Tabs - Only for established merchants */}
        {isEstablished && (
          <Grid xs={12} order={{ xs: 2, md: 3 }}>
            <EcommerceAnalyticsTabs
              // Overview data
              totalOrders={analyticsOrders || ordersCount || 0}
              totalOrdersData={totalOrdersData}
              totalRevenue={totalRevenue || 0}
              totalRevenueData={totalRevenueData}
              totalVisitors={totalVisitors || 0}
              totalVisitorsData={totalVisitorsData}
              totalProductViews={totalProductViews || 0}
              totalProductViewsData={totalProductViewsData}
              overviewLoading={analyticsLoading}
              // Traffic data
              visitors={visitors}
              productViews={productViews}
              trafficLoading={trafficLoading}
              // Funnel data
              funnel={funnel}
              funnelLoading={funnelLoading}
              // Top products data
              topProducts={topProducts}
              topProductsLoading={topProductsLoading}
              // Date range & tab controls
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              currentTab={currentTab}
              onTabChange={setCurrentTab}
            />
          </Grid>
        )}
      </Grid>
    </Container>
  );
}

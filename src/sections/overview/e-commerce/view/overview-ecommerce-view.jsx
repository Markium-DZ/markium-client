import { useContext, useCallback } from 'react';

import Container from '@mui/material/Container';
import Grid from '@mui/material/Unstable_Grid2';

import { useGetProducts } from 'src/api/product';
import { useGetOrders } from 'src/api/orders';
import { useGetMedia } from 'src/api/media';
import {
  useGetAnalyticsOverview,
  useGetAnalyticsTraffic,
  useGetAnalyticsFunnel,
  useGetAnalyticsTopProducts,
} from 'src/api/analytics';

import { AuthContext } from 'src/auth/context/jwt';

import { useSettingsContext } from 'src/components/settings';
import { MotivationIllustration } from 'src/assets/illustrations';


import EcommerceEventsCalendar from '../ecommerce-events-calendar';
import EcommerceAnalyticsTabs from '../ecommerce-analytics-tabs';

import {
  SetupChecklist,
  WelcomeNewUser,
  EmptyStateProducts,
  EmptyStateOrders,
} from 'src/sections/dashboard/onboarding';

// ----------------------------------------------------------------------

export default function OverviewEcommerceView() {
  const { user } = useContext(AuthContext);
  const { products, productsMutate } = useGetProducts();
  const { orders } = useGetOrders();
  const { media, total: mediaTotal, mutate: mediaMutate } = useGetMedia(1, 1);

  const settings = useSettingsContext();

  // Refresh data when tasks are completed in SetupChecklist
  const handleRefreshData = useCallback(() => {
    productsMutate?.();
    mediaMutate?.();
  }, [productsMutate, mediaMutate]);

  const productsCount = products?.length || 0;
  const ordersCount = orders?.length || 0;
  const hasMedia = mediaTotal > 0 || (media && media.length > 0);

  // Determine if user is new (no products)
  const isNewUser = productsCount === 0;
  // B grade merchant: has products but no orders yet
  const isBGradeMerchant = productsCount > 0 && ordersCount === 0;
  // Third grade user: has products and orders (established merchant)
  const isThirdGradeUser = !isNewUser && !isBGradeMerchant;

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
    overviewLoading: analyticsLoading,
  } = useGetAnalyticsOverview(isThirdGradeUser ? '-30d' : '-30d');

  const { visitors, productViews, trafficLoading } = useGetAnalyticsTraffic(isThirdGradeUser ? '-30d' : null);

  const { funnel, funnelLoading } = useGetAnalyticsFunnel(isThirdGradeUser ? '-30d' : null);

  const { topProducts, topProductsLoading } = useGetAnalyticsTopProducts(isThirdGradeUser ? '-30d' : null);

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'}>
      <Grid container spacing={3}>
        {/* Welcome Banner - Different for new vs existing users */}
        <Grid xs={12} md={8}>
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
          <Grid xs={12}>
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

        {/* Analytics Tabs - Only show when user has orders (third grade users) */}
        {isThirdGradeUser && (
          <Grid xs={12}>
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
            />
          </Grid>
        )}

        {/* Conditional Content Based on User State */}
        {isNewUser && (
          <Grid xs={12}>
            <EmptyStateProducts />
          </Grid>
        )}
      </Grid>
    </Container>
  );
}

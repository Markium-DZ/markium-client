import { useContext, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material/styles';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Unstable_Grid2';

import { useGetProducts } from 'src/api/product';
import { useGetOrders } from 'src/api/orders';
import { useGetMedia } from 'src/api/media';
import { useGetAnalyticsOverview, useGetAnalyticsTraffic } from 'src/api/analytics';

import { AuthContext } from 'src/auth/context/jwt';

import { useSettingsContext } from 'src/components/settings';
import { MotivationIllustration } from 'src/assets/illustrations';


import EcommerceWelcome from '../ecommerce-welcome';
import EcommerceEventsCalendar from '../ecommerce-events-calendar';
import EcommerceYearlySales from '../ecommerce-yearly-sales';
import EcommerceSaleByGender from '../ecommerce-sale-by-gender';
import EcommerceWidgetSummary from '../ecommerce-widget-summary';

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

  const theme = useTheme();
  const settings = useSettingsContext();
  const { t } = useTranslation();

  // Refresh data when tasks are completed in SetupChecklist
  const handleRefreshData = useCallback(() => {
    productsMutate?.();
    mediaMutate?.();
  }, [productsMutate, mediaMutate]);

  const productsCount = products?.length || 0;
  const ordersCount = orders?.length || 0;
  const hasMedia = mediaTotal > 0 || (media && media.length > 0);
  const pendingOrdersCount = orders?.filter((i) => i.status === 'pending')?.length || 0;
  const deliveredOrdersCount = orders?.filter((i) => i.status === 'delivered')?.length || 0;

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
  } = useGetAnalyticsOverview(isThirdGradeUser ? '-30d' : null);

  const { visitors, productViews } = useGetAnalyticsTraffic(isThirdGradeUser ? '-30d' : 'day');

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

        {/* Stats Cards - Only show when user has orders (third grade users) */}
        {isThirdGradeUser && (
          <>
            <Grid xs={12} md={4}>
              <EcommerceWidgetSummary
                title={t('total_orders')}
                total={analyticsOrders || ordersCount || 0}
                chart={{
                  series: totalOrdersData.length > 0 ? totalOrdersData.slice(-10) : [22, 8, 35, 50, 82, 84, 77, 12, 87, 43],
                }}
                loading={analyticsLoading}
              />
            </Grid>

            <Grid xs={12} md={4}>
              <EcommerceWidgetSummary
                title={t('total_revenue')}
                total={totalRevenue || "0"}
                chart={{
                  colors: [theme.palette.info.light, theme.palette.info.main],
                  series: totalRevenueData.length > 0 ? totalRevenueData.slice(-10) : [56, 47, 40, 62, 73, 30, 23, 54, 67, 68],
                }}
                loading={analyticsLoading}
              />
            </Grid>

            <Grid xs={12} md={4}>
              <EcommerceWidgetSummary
                title={t('total_visitors')}
                total={totalVisitors || "0"}
                chart={{
                  colors: [theme.palette.warning.light, theme.palette.warning.main],
                  series: totalVisitorsData.length > 0 ? totalVisitorsData.slice(-10) : [40, 70, 75, 70, 50, 28, 7, 64, 38, 27],
                }}
                loading={analyticsLoading}
              />
            </Grid>

            <Grid xs={12} md={4}>
              <EcommerceWidgetSummary
                title={t('total_product_views')}
                total={totalProductViews}
                chart={{
                  colors: [theme.palette.success.light, theme.palette.success.main],
                  series: totalProductViewsData.length > 0 ? totalProductViewsData.slice(-10) : [20, 30, 45, 60, 55, 70, 65, 80, 75, 90],
                }}
                loading={analyticsLoading}
              />
            </Grid>
          </>
        )}


        {/* Conditional Content Based on User State */}
        {isNewUser ? (
          // New User View - Empty states with guidance
          <>
            <Grid xs={12}>
              <EmptyStateProducts />
            </Grid>
          </>
        ) : isThirdGradeUser && (
          // Active User View with orders - Show charts and data
          <>
            {/* <Grid xs={12} md={6} lg={4}>
              <EcommerceSaleByGender
                title={t('order_status')}
                total={ordersCount}
                chart={{
                  series: [
                    { label: t('pending'), value: pendingOrdersCount },
                    { label: t('delivered'), value: deliveredOrdersCount },
                  ],
                }}
              />
            </Grid> */}

            <Grid xs={12} md={6} lg={8}>
              <EcommerceYearlySales
                title={t('visitors_and_views')}
                subheader={t('last_30_days')}
                chart={{
                  categories: visitors.labels?.slice(-12) || [
                    t('jan'),
                    t('feb'),
                    t('mar'),
                    t('apr'),
                    t('may'),
                    t('jun'),
                    t('jul'),
                    t('aug'),
                    t('sep'),
                    t('oct'),
                    t('nov'),
                    t('dec'),
                  ],
                  series: [
                    {
                      year: t('current_period'),
                      data: [
                        {
                          name: t('total_visitors'),
                          data: visitors.data?.slice(-12) || [10, 41, 35, 51, 49, 62, 69, 91, 148, 35, 51, 49],
                        },
                        {
                          name: t('product_views'),
                          data: productViews.data?.slice(-12) || [10, 34, 13, 56, 77, 88, 99, 77, 45, 13, 56, 77],
                        },
                      ],
                    },
                  ],
                }}
              />
            </Grid>
          </>
        )}
      </Grid>
    </Container>
  );
}

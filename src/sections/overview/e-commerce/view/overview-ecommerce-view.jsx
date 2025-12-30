import { useContext, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Unstable_Grid2';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useGetProducts } from 'src/api/product';
import { useGetOrders } from 'src/api/orders';
import { useGetMedia } from 'src/api/media';

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
  const router = useRouter();

  // Refresh data when tasks are completed in SetupChecklist
  const handleRefreshData = useCallback(() => {
    productsMutate?.();
    mediaMutate?.();
  }, [productsMutate, mediaMutate]);

  const productsCount = products?.length || 0;
  const ordersCount = orders?.length || 0;
  const hasMedia = mediaTotal > 0 || (media && media.length > 0);
  const confirmedOrdersCount = orders?.filter((i) => i.status === 'confirmed')?.length || 0;
  const pendingOrdersCount = orders?.filter((i) => i.status === 'pending')?.length || 0;
  const deliveredOrdersCount = orders?.filter((i) => i.status === 'delivered')?.length || 0;

  // Determine if user is new (no products)
  const isNewUser = productsCount === 0;
  // B grade merchant: has products but no orders yet
  const isBGradeMerchant = productsCount > 0 && ordersCount === 0;

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

        {/* Stats Cards - Only show when user has orders */}
        {!isNewUser && !isBGradeMerchant && (
          <>
            <Grid xs={12} md={4}>
              <EcommerceWidgetSummary
                title={t('products_published')}
                percent={2.6}
                total={productsCount}
                chart={{
                  series: [22, 8, 35, 50, 82, 84, 77, 12, 87, 43],
                }}
              />
            </Grid>

            <Grid xs={12} md={4}>
              <EcommerceWidgetSummary
                title={t('orders_received')}
                percent={-0.1}
                total={ordersCount}
                chart={{
                  colors: [theme.palette.info.light, theme.palette.info.main],
                  series: [56, 47, 40, 62, 73, 30, 23, 54, 67, 68],
                }}
              />
            </Grid>

            <Grid xs={12} md={4}>
              <EcommerceWidgetSummary
                title={t('order_confirmed')}
                percent={0.6}
                total={confirmedOrdersCount}
                chart={{
                  colors: [theme.palette.warning.light, theme.palette.warning.main],
                  series: [40, 70, 75, 70, 50, 28, 7, 64, 38, 27],
                }}
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
        ) : !isBGradeMerchant && (
          // Active User View with orders - Show charts and data
          <>
            <Grid xs={12} md={6} lg={4}>
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
            </Grid>

            <Grid xs={12} md={6} lg={8}>
              <EcommerceYearlySales
                title={t('orders_and_revenue')}
                subheader={t('yearly_comparison')}
                chart={{
                  categories: [
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
                      year: '2024',
                      data: [
                        {
                          name: t('total_revenue'),
                          data: [10, 41, 35, 51, 49, 62, 69, 91, 148, 35, 51, 49],
                        },
                        {
                          name: t('total_orders'),
                          data: [10, 34, 13, 56, 77, 88, 99, 77, 45, 13, 56, 77],
                        },
                      ],
                    },
                    {
                      year: '2025',
                      data: [
                        {
                          name: t('total_revenue'),
                          data: [51, 35, 41, 10, 91, 69, 62, 148, 91, 69, 62, 49],
                        },
                        {
                          name: t('total_orders'),
                          data: [56, 13, 34, 10, 77, 99, 88, 45, 77, 99, 88, 77],
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

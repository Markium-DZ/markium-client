import PropTypes from 'prop-types';
import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Badge from '@mui/material/Badge';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { alpha, useTheme } from '@mui/material/styles';

import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';

import { formatDistanceToNow } from 'date-fns';
import { fr, enUS, arSA } from 'date-fns/locale';

import { fCurrency, fNumber } from 'src/utils/format-number';

import { getOrderStatus } from 'src/constants/order-status';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import ZaityListView from 'src/sections/ZaityTables/zaity-list-view';

// ----------------------------------------------------------------------

const DATE_LOCALES = { fr, en: enUS, ar: arSA };

const TAB_VALUES = {
  ORDERS: 'orders',
  TOP_PRODUCTS: 'top_products',
  LOW_STOCK: 'low_stock',
};

// ----------------------------------------------------------------------

export default function DashboardDataTable({
  orders = [],
  ordersLoading = false,
  topProducts = [],
  topProductsLoading = false,
  lowStockInventory = [],
  lowStockLoading = false,
}) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const router = useRouter();

  const [currentTab, setCurrentTab] = useState(TAB_VALUES.ORDERS);
  const [page, setPage] = useState(0);
  const ROWS_PER_PAGE = 5;

  const handleChangeTab = (event, newValue) => {
    setCurrentTab(newValue);
    setPage(0);
  };

  // ---- TAB 1: Recent Orders ----

  const recentOrdersData = useMemo(() => {
    const sorted = [...(orders || [])]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10);

    return sorted.map((order) => {
      const statusConfig = getOrderStatus(order?.status);
      const color = statusConfig?.color || 'default';
      const translatedStatus = statusConfig ? t(statusConfig.labelKey) : '';

      const firstItem = order?.items?.[0];
      const productName = firstItem?.product?.name || '-';
      const extraCount = (order?.items?.length || 1) - 1;

      return {
        ...order,
        id: order.id,
        customer_name: order?.customer?.full_name || order?.shipping_name || '-',
        product_summary: extraCount > 0 ? `${productName} +${extraCount}` : productName,
        total_formatted: order?.total_price ?? order?.total ?? 0,
        c_status: translatedStatus,
        color,
      };
    });
  }, [orders, t]);

  const ordersTableHead = useMemo(
    () => [
      {
        id: 'customer_name',
        label: t('customer'),
        type: 'text',
        width: 140,
      },
      {
        id: 'product_summary',
        label: t('product'),
        type: 'text',
        width: 160,
      },
      {
        id: 'total_formatted',
        label: t('price'),
        type: 'render',
        width: 100,
        render: (row) => (
          <Typography variant="subtitle2" noWrap>
            {fCurrency(row.total_formatted)}
          </Typography>
        ),
      },
      {
        id: 'c_status',
        label: t('status'),
        type: 'label',
        width: 100,
      },
      {
        id: 'created_at',
        label: t('date'),
        type: 'render',
        width: 100,
        render: (row) => (
          <Typography variant="body2" noWrap sx={{ color: 'text.secondary' }}>
            {row.created_at
              ? formatDistanceToNow(new Date(row.created_at), {
                  addSuffix: true,
                  locale: DATE_LOCALES[i18n.language] || enUS,
                }).replace(/\s*تقريباً|about\s+|il y a\s+/g, '')
              : '–'}
          </Typography>
        ),
      },
    ],
    [t, i18n.language]
  );

  // ---- TAB 2: Top Products ----

  const topProductsData = useMemo(
    () =>
      (topProducts || []).map((product, index) => ({
        id: product.breakdown_value || index,
        name: product.breakdown_value || '-',
        views_count: product.count || 0,
      })),
    [topProducts]
  );

  const topProductsTableHead = useMemo(
    () => [
      {
        id: 'name',
        label: t('product'),
        type: 'render',
        width: 200,
        render: (row) => (
          <Typography variant="subtitle2" noWrap>
            {row.name}
          </Typography>
        ),
      },
      {
        id: 'views_count',
        label: t('views'),
        type: 'render',
        width: 100,
        render: (row) => (
          <Typography variant="body2">{fNumber(row.views_count)}</Typography>
        ),
      },
    ],
    [t]
  );

  // ---- TAB 3: Low Stock ----

  const lowStockData = useMemo(
    () =>
      (lowStockInventory || []).map((item) => {
        const variantOptions = item.variant?.options
          ?.map((opt) => opt.value || opt.name)
          .filter(Boolean)
          .join(' / ');

        return {
          ...item,
          id: item.id,
          product_name: item.product?.name || '-',
          media_url: item.variant?.media?.full_url || null,
          variant_label: variantOptions || '-',
          quantity: item.quantity ?? 0,
          low_stock_threshold: item.low_stock_threshold ?? '-',
          is_critical: item.is_out_of_stock || item.quantity === 0,
        };
      }),
    [lowStockInventory]
  );

  const lowStockTableHead = useMemo(
    () => [
      {
        id: 'product_name',
        label: t('product'),
        type: 'render',
        width: 200,
        render: (row) => (
          <Stack direction="row" alignItems="center" spacing={1.5}>
            {row.media_url && (
              <Avatar
                src={row.media_url}
                alt={row.product_name}
                variant="rounded"
                sx={{ width: 36, height: 36 }}
              />
            )}
            <Typography variant="subtitle2" noWrap>
              {row.product_name}
            </Typography>
          </Stack>
        ),
      },
      {
        id: 'variant_label',
        label: t('variant'),
        type: 'text',
        width: 120,
      },
      {
        id: 'quantity',
        label: t('stock'),
        type: 'render',
        width: 80,
        render: (row) => (
          <Label
            variant="soft"
            color={row.is_critical ? 'error' : 'warning'}
            sx={{ fontWeight: 700 }}
          >
            {row.quantity}
          </Label>
        ),
      },
      {
        id: 'low_stock_threshold',
        label: t('threshold'),
        type: 'text',
        width: 80,
      },
    ],
    [t]
  );

  // ---- Tab config ----

  const tabs = [
    {
      value: TAB_VALUES.ORDERS,
      label: t('recent_orders'),
      icon: 'solar:bag-4-bold',
      count: recentOrdersData.length,
    },
    {
      value: TAB_VALUES.TOP_PRODUCTS,
      label: t('top_products'),
      icon: 'solar:star-bold',
      count: topProductsData.length,
    },
    {
      value: TAB_VALUES.LOW_STOCK,
      label: t('low_stock'),
      icon: 'solar:danger-triangle-bold',
      count: lowStockData.length,
    },
  ];

  // Pagination helpers
  const currentData = useMemo(() => {
    if (currentTab === TAB_VALUES.ORDERS) return recentOrdersData;
    if (currentTab === TAB_VALUES.TOP_PRODUCTS) return topProductsData;
    if (currentTab === TAB_VALUES.LOW_STOCK) return lowStockData;
    return [];
  }, [currentTab, recentOrdersData, topProductsData, lowStockData]);

  const totalCount = currentData.length;
  const totalPages = Math.ceil(totalCount / ROWS_PER_PAGE);
  const pageData = useMemo(
    () => currentData.slice(page * ROWS_PER_PAGE, page * ROWS_PER_PAGE + ROWS_PER_PAGE),
    [currentData, page]
  );

  const from = totalCount === 0 ? 0 : page * ROWS_PER_PAGE + 1;
  const to = Math.min((page + 1) * ROWS_PER_PAGE, totalCount);

  const handlePrevPage = useCallback(() => setPage((p) => Math.max(0, p - 1)), []);
  const handleNextPage = useCallback(() => setPage((p) => Math.min(totalPages - 1, p + 1)), [totalPages]);

  const viewAllConfig = {
    [TAB_VALUES.ORDERS]: { label: t('view_all_orders'), path: paths.dashboard.order.root },
    [TAB_VALUES.TOP_PRODUCTS]: { label: t('view_all_products'), path: paths.dashboard.product.root },
    [TAB_VALUES.LOW_STOCK]: { label: t('view_all'), path: paths.dashboard.inventory.lowStock },
  };

  const isLoading =
    (currentTab === TAB_VALUES.ORDERS && ordersLoading) ||
    (currentTab === TAB_VALUES.TOP_PRODUCTS && topProductsLoading) ||
    (currentTab === TAB_VALUES.LOW_STOCK && lowStockLoading);

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Tabs header */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
        <Tabs
          value={currentTab}
          onChange={handleChangeTab}
          sx={{
            px: 2.5,
            '& .MuiTab-root': {
              minHeight: 48,
              py: 0,
            },
          }}
        >
          {tabs.map((tab) => (
            <Tab
              key={tab.value}
              value={tab.value}
              label={
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Iconify icon={tab.icon} width={18} />
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <Badge
                      badgeContent={tab.count}
                      color={tab.value === TAB_VALUES.LOW_STOCK ? 'error' : 'primary'}
                      max={99}
                      sx={{
                        '& .MuiBadge-badge': {
                          position: 'static',
                          transform: 'none',
                          fontSize: '0.65rem',
                          minWidth: 18,
                          height: 18,
                        },
                      }}
                    />
                  )}
                </Stack>
              }
            />
          ))}
        </Tabs>
      </Box>

      {/* Tab content */}
      <Box sx={{ flexGrow: 1, minHeight: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress size={36} />
          </Box>
        ) : (
          <>
            {currentTab === TAB_VALUES.ORDERS && (
              <ZaityListView
                TABLE_HEAD={ordersTableHead}
                zaityTableDate={pageData}
                dense="small"
                rowsPerPage={ROWS_PER_PAGE}
                hidePagination
              />
            )}

            {currentTab === TAB_VALUES.TOP_PRODUCTS && (
              <ZaityListView
                TABLE_HEAD={topProductsTableHead}
                zaityTableDate={pageData}
                dense="small"
                rowsPerPage={ROWS_PER_PAGE}
                hidePagination
              />
            )}

            {currentTab === TAB_VALUES.LOW_STOCK && (
              <ZaityListView
                TABLE_HEAD={lowStockTableHead}
                zaityTableDate={pageData}
                dense="small"
                rowsPerPage={ROWS_PER_PAGE}
                hidePagination
              />
            )}
          </>
        )}
      </Box>

      {/* Footer: View All + Pagination */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 2.5, py: 1.5, borderTop: 1, borderColor: 'divider', flexShrink: 0, mt: 'auto' }}
      >
        <Button
          size="small"
          color="inherit"
          endIcon={<Iconify icon="solar:arrow-right-linear" width={16} />}
          onClick={() => router.push(viewAllConfig[currentTab].path)}
          sx={{ fontWeight: 600 }}
        >
          {viewAllConfig[currentTab].label}
        </Button>

        {totalCount > 0 && (
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Typography variant="caption" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
              {from}–{to} {t('of')} {totalCount}
            </Typography>
            <IconButton size="small" onClick={handlePrevPage} disabled={page === 0}>
              <Iconify icon={theme.direction === 'rtl' ? 'solar:alt-arrow-right-linear' : 'solar:alt-arrow-left-linear'} width={18} />
            </IconButton>
            <IconButton size="small" onClick={handleNextPage} disabled={page >= totalPages - 1}>
              <Iconify icon={theme.direction === 'rtl' ? 'solar:alt-arrow-left-linear' : 'solar:alt-arrow-right-linear'} width={18} />
            </IconButton>
          </Stack>
        )}
      </Stack>
    </Card>
  );
}

DashboardDataTable.propTypes = {
  orders: PropTypes.array,
  ordersLoading: PropTypes.bool,
  topProducts: PropTypes.array,
  topProductsLoading: PropTypes.bool,
  lowStockInventory: PropTypes.array,
  lowStockLoading: PropTypes.bool,
};

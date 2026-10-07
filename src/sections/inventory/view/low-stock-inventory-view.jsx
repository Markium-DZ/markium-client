import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';

import { useTranslate } from 'src/locales';
import { useGetLowStockInventory } from 'src/api/inventory';
import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { LoadingScreen } from 'src/components/loading-screen';
import Iconify from 'src/components/iconify';
import CustomPopover, { usePopover } from 'src/components/custom-popover';
import ZaityListView from 'src/sections/ZaityTables/zaity-list-view';
import ZaityHeadContainer from 'src/sections/ZaityTables/ZaityHeadContainer';
import ZaityTableFilters from 'src/sections/ZaityTables/ZaityTableFilters';
import InventoryAdjustmentDialog from 'src/sections/inventory/inventory-adjustment-dialog';
import InventoryMobileCard from 'src/sections/inventory/inventory-mobile-card';
import { fCurrency } from 'src/utils/format-number';

// ----------------------------------------------------------------------

// Actions component for each inventory row
const InventoryActions = ({ item, onOpenAdjustment }) => {
  const popover = usePopover();
  const { t } = useTranslate();

  return (
    <Box>
      <IconButton
        color={popover.open ? 'inherit' : 'default'}
        onClick={(e) => {
          e.stopPropagation();
          popover.onOpen(e);
        }}
      >
        <Iconify icon="eva:more-vertical-fill" />
      </IconButton>

      <CustomPopover
        open={popover.open}
        onClose={popover.onClose}
        arrow="right-top"
        sx={{ width: 180 }}
      >
        <MenuItem
          onClick={(e) => {
            e.stopPropagation();
            onOpenAdjustment(item);
            popover.onClose();
          }}
        >
          <Iconify icon="solar:slider-vertical-bold" sx={{ mr: 1 }} />
          {t('adjust_inventory')}
        </MenuItem>
      </CustomPopover>
    </Box>
  );
};

// ----------------------------------------------------------------------

export default function LowStockInventoryView() {
  const { t } = useTranslate();

  const [page, setPage] = useState(1);
  const [allInventory, setAllInventory] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [dataFiltered, setDataFiltered] = useState([]);
  const [adjustmentDialog, setAdjustmentDialog] = useState({ open: false, item: null });

  const { inventory, inventoryLoading, inventoryError, totalPages, total, mutate } = useGetLowStockInventory(page, 20);

  const handleOpenAdjustment = (item) => {
    setAdjustmentDialog({ open: true, item });
  };

  const handleCloseAdjustment = () => {
    setAdjustmentDialog({ open: false, item: null });
  };

  const handleAdjustmentSuccess = async () => {
    await mutate();
  };

  // Append new inventory items to the list
  useEffect(() => {
    if (inventory && inventory.length > 0) {
      setAllInventory((prev) => {
        // Avoid duplicates
        const existingIds = new Set(prev.map((item) => item.id));
        const newItems = inventory.filter((item) => !existingIds.has(item.id));
        return [...prev, ...newItems];
      });
    }
  }, [inventory]);

  // Handle infinite scroll
  const handleScroll = useCallback(() => {
    if (inventoryLoading || page >= totalPages) return;

    const scrolledToBottom =
      window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100;

    if (scrolledToBottom) {
      setPage((prev) => prev + 1);
    }
  }, [inventoryLoading, page, totalPages]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Format variant options
  const formatOptions = (options) => {
    if (!options || options.length === 0) return '-';
    return options.map((opt) => `${opt.name}: ${opt.value}`).join(', ');
  };

  // Get stock status
  const getStockStatus = (item) => {
    if (item.is_out_of_stock) {
      return { label: t('out_of_stock'), color: 'error' };
    }
    if (item.is_low_stock) {
      return { label: t('low_stock'), color: 'warning' };
    }
    return { label: t('in_stock'), color: 'success' };
  };

  // Reformulate table data
  const reformulateTable = (data) => {
    return data.map((item) => {
      const stockStatus = getStockStatus(item);
      return {
        ...item,
        id: item.id,
        product_info: (
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar
              src={item.variant?.media?.full_url}
              alt={item.product?.name}
              variant="rounded"
              sx={{ width: 48, height: 48 }}
            />
            <Box
              component={RouterLink}
              to={paths.dashboard.inventory.details(item.id)}
               sx={{
                  color: 'primary.main',
                  textDecoration: 'none',
                  fontWeight: 500,
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
            >
              <Typography
                variant="subtitle2"
                noWrap
                sx={{
                  textDecoration: 'none',
                  fontWeight: 500,
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                {item.product?.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {item.product?.ref}
              </Typography>
            </Box>
          </Stack>
        ),
        variant_options: formatOptions(item.variant?.options),
        sku: (
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
            {item.sku}
          </Typography>
        ),
        price: fCurrency(item.variant?.price),
        quantity: item.quantity,
        low_stock_threshold: (
          <Typography variant="body2" color="text.secondary">
            {item.low_stock_threshold || '-'}
          </Typography>
        ),
        reserved_quantity: (
          <Typography variant="body2" color="text.secondary">
            {item.reserved_quantity}
          </Typography>
        ),
        available_quantity: (
          <Typography variant="subtitle2" color="warning.main">
            {item.available_quantity}
          </Typography>
        ),
        c_status: (
          <Chip
            label={stockStatus.label}
            color={stockStatus.color}
            size="small"
            variant="soft"
          />
        ),
      };
    });
  };

  // Table head configuration
  const TABLE_HEAD = [
    {
      id: 'product_info',
      label: t('product'),
      type: 'render',
      render: (item) => item.product_info,
      width: 250
    },
    { id: 'variant_options', label: t('variant'), type: 'text', width: 180 },
    {
      id: 'sku',
      label: t('sku'),
      type: 'render',
      render: (item) => item.sku,
      width: 140
    },
    { id: 'price', label: t('price'), type: 'text', width: 120, align: 'right' },
    { id: 'quantity', label: t('quantity'), type: 'text', width: 100, align: 'right' },
    {
      id: 'low_stock_threshold',
      label: t('threshold'),
      type: 'render',
      render: (item) => item.low_stock_threshold,
      width: 100,
      align: 'right'
    },
    {
      id: 'available_quantity',
      label: t('available'),
      type: 'render',
      render: (item) => item.available_quantity,
      width: 100,
      align: 'right'
    },
    {
      id: 'c_status',
      label: t('status'),
      type: 'render',
      render: (item) => item.c_status,
      width: 120
    },
    {
      id: 'actions',
      label: t('actions'),
      type: 'threeDots',
      component: (item) => <InventoryActions item={item} onOpenAdjustment={handleOpenAdjustment} />,
      width: 60,
      align: 'right'
    },
  ];

  // Filters configuration
  const filters = [
    {
      key: 'search',
      label: t('search'),
      match: (item, value) => {
        const lowerValue = value?.toLowerCase();
        return (
          item?.product?.name?.toLowerCase().includes(lowerValue) ||
          item?.product?.ref?.toLowerCase().includes(lowerValue) ||
          item?.sku?.toLowerCase().includes(lowerValue) ||
          item?.variant?.options?.some((opt) =>
            opt.value?.toLowerCase().includes(lowerValue)
          )
        );
      },
    },
  ];

  const defaultFilters = {
    search: '',
  };

  useEffect(() => {
    setDataFiltered(reformulateTable(allInventory));
  }, [allInventory]);

  useEffect(() => {
    setTableData(reformulateTable(allInventory));
  }, [allInventory]);

  return (
    <ZaityHeadContainer
      heading={t('low_stock_inventory')}
      links={[
        { name: t('dashboard'), href: paths.dashboard.root },
        { name: t('inventory'), href: paths.dashboard.inventory.root },
        { name: t('low_stock') },
      ]}
    >
      {!inventoryLoading && inventoryError && allInventory.length === 0 && (
        <Alert severity="warning" icon={<Iconify icon="solar:cloud-cross-bold" width={22} />} sx={{ mb: 2 }}>
          {t('no_connection_notice')}
        </Alert>
      )}

      {total > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="subtitle2">
            {t('low_stock_alert', { count: total })}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('low_stock_alert_description')}
          </Typography>
        </Alert>
      )}

      <Card>
        <ZaityTableFilters
          data={dataFiltered}
          tableData={tableData}
          setTableDate={setDataFiltered}
          items={filters}
          defaultFilters={defaultFilters}
          dataFiltered={tableData}
          searchText={`${t('search_by')} ${t('product')} ${t('or_any_value')} ...`}
        >
          {inventoryLoading && allInventory.length === 0 ? (
            <LoadingScreen sx={{ my: 8 }} color="primary" />
          ) : (
            <ZaityListView
              TABLE_HEAD={[...TABLE_HEAD]}
              dense="medium"
              zaityTableDate={dataFiltered || []}
              mobileCardRender={(row) => (
                <InventoryMobileCard
                  row={row}
                  onOpenAdjustment={handleOpenAdjustment}
                />
              )}
            />
          )}
        </ZaityTableFilters>
      </Card>

      <InventoryAdjustmentDialog
        open={adjustmentDialog.open}
        onClose={handleCloseAdjustment}
        inventoryItem={adjustmentDialog.item}
        onSuccess={handleAdjustmentSuccess}
      />
    </ZaityHeadContainer>
  );
}

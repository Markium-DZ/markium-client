import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';

import { useTranslate } from 'src/locales';
import { useGetInventoryItems, useGetInventoryItem } from 'src/api/inventory';
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { LoadingScreen } from 'src/components/loading-screen';
import ZaityListView from 'src/sections/ZaityTables/zaity-list-view';
import ZaityHeadContainer from 'src/sections/ZaityTables/ZaityHeadContainer';
import ZaityTableFilters from 'src/sections/ZaityTables/ZaityTableFilters';
import ZaityTableTabs from 'src/sections/ZaityTables/ZaityTableTabs';
import Iconify from 'src/components/iconify';
import { fDateTime } from 'src/utils/format-time';

// ----------------------------------------------------------------------

export default function InventoryItemsView() {
  const { t } = useTranslate();
  const { id } = useParams();
  const router = useRouter();

  const [tableData, setTableData] = useState([]);
  const [dataFiltered, setDataFiltered] = useState([]);

  const { inventoryItem, inventoryItemLoading } = useGetInventoryItem(id);
  const { items, itemsLoading } = useGetInventoryItems(id);

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'success';
      case 'sold':
        return 'primary';
      case 'reserved':
        return 'warning';
      case 'damaged':
        return 'error';
      case 'in_transit':
        return 'info';
      case 'returned':
        return 'secondary';
      default:
        return 'default';
    }
  };

  // Reformulate table data
  const reformulateTable = (data) => {
    return data.map((item) => ({
      id: item.id,
      onClick: () => router.push(paths.dashboard.inventory.itemTracking(id, item.id)),
      serial_number: (
        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
          {item.serial_number || '-'}
        </Typography>
      ),
      identifier: (
        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
          {item.identifier || '-'}
        </Typography>
      ),
      status: (
        <Chip
          label={t(item.status)}
          color={getStatusColor(item.status)}
          size="small"
          variant="soft"
        />
      ),
      location: item.location || '-',
      created_at: fDateTime(item.created_at),
      updated_at: fDateTime(item.updated_at),
    }));
  };

  // Table head configuration
  const TABLE_HEAD = [
    {
      id: 'serial_number',
      label: t('serial_number'),
      type: 'render',
      render: (item) => item.serial_number,
      width: 180,
    },
    {
      id: 'identifier',
      label: t('identifier'),
      type: 'render',
      render: (item) => item.identifier,
      width: 180,
    },
    {
      id: 'status',
      label: t('status'),
      type: 'render',
      render: (item) => item.status,
      width: 140,
    },
    { id: 'location', label: t('location'), type: 'text', width: 180 },
    { id: 'created_at', label: t('created_at'), type: 'text', width: 180 },
    { id: 'updated_at', label: t('updated_at'), type: 'text', width: 180 },
  ];

  // Filters configuration
  const filters = [
    {
      key: 'search',
      label: t('search'),
      match: (item, value) => {
        const lowerValue = value?.toLowerCase();
        return (
          item?.serial_number?.toLowerCase().includes(lowerValue) ||
          item?.identifier?.toLowerCase().includes(lowerValue) ||
          item?.location?.toLowerCase().includes(lowerValue)
        );
      },
    },
  ];

  const defaultFilters = {
    search: '',
  };

  // Tabs for item status
  const statusItems = [
    { key: 'all', label: t('all'), match: () => true },
    {
      key: 'available',
      label: t('available'),
      match: (item) => item.status === 'available',
      color: 'success',
    },
    {
      key: 'sold',
      label: t('sold'),
      match: (item) => item.status === 'sold',
      color: 'primary',
    },
    {
      key: 'reserved',
      label: t('reserved'),
      match: (item) => item.status === 'reserved',
      color: 'warning',
    },
    {
      key: 'damaged',
      label: t('damaged'),
      match: (item) => item.status === 'damaged',
      color: 'error',
    },
  ];

  const filterFunction = (data, filters) => {
    const activeTab = filters.tabKey;
    const item = statusItems.find((i) => i?.key === activeTab);
    if (item?.match) return data.filter((d) => item.match(d, filters));
    return data;
  };

  useEffect(() => {
    if (items && items.length > 0) {
      const formatted = reformulateTable(items);
      setTableData(formatted);
      setDataFiltered(formatted);
    }
  }, [items]);

  if (inventoryItemLoading) {
    return <LoadingScreen />;
  }

  if (!inventoryItem) {
    return (
      <ZaityHeadContainer
        heading={t('inventory_items')}
        links={[
          { name: t('dashboard'), href: paths.dashboard.root },
          { name: t('inventory'), href: paths.dashboard.inventory.root },
          { name: t('items') },
        ]}
      >
        <Card sx={{ p: 5, textAlign: 'center' }}>
          <Iconify icon="solar:box-bold" width={64} sx={{ color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            {t('inventory_item_not_found')}
          </Typography>
        </Card>
      </ZaityHeadContainer>
    );
  }

  return (
    <ZaityHeadContainer
      heading={`${t('items')}: ${inventoryItem.product?.name || ''}`}
      links={[
        { name: t('dashboard'), href: paths.dashboard.root },
        { name: t('inventory'), href: paths.dashboard.inventory.root },
        {
          name: inventoryItem.product?.name || '',
          href: paths.dashboard.inventory.details(id),
        },
        { name: t('items') },
      ]}
    >
      <Card>
        <ZaityTableTabs
          key="item_status"
          data={tableData}
          items={statusItems}
          defaultFilters={defaultFilters}
          setTableDate={setDataFiltered}
          filterFunction={filterFunction}
        >
          <ZaityTableFilters
            data={dataFiltered}
            tableData={tableData}
            setTableDate={setDataFiltered}
            items={filters}
            defaultFilters={defaultFilters}
            dataFiltered={tableData}
            searchText={`${t('search_by')} ${t('serial_number')} ${t('or')} ${t('identifier')} ...`}
          >
            {itemsLoading ? (
              <LoadingScreen sx={{ my: 8 }} color="primary" />
            ) : items && items.length > 0 ? (
              <ZaityListView
                TABLE_HEAD={[...TABLE_HEAD]}
                dense="medium"
                zaityTableDate={dataFiltered || []}
              />
            ) : (
              <Box sx={{ textAlign: 'center', py: 10 }}>
                <Iconify icon="solar:box-bold" width={64} sx={{ color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  {t('no_items_found')}
                </Typography>
                <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
                  {t('no_individual_items_tracked')}
                </Typography>
              </Box>
            )}
          </ZaityTableFilters>
        </ZaityTableTabs>
      </Card>
    </ZaityHeadContainer>
  );
}

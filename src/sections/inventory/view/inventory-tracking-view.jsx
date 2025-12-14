import { useParams } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent';
import Chip from '@mui/material/Chip';

import { useTranslate } from 'src/locales';
import { useGetInventoryTransactions, useGetInventoryItem } from 'src/api/inventory';
import { paths } from 'src/routes/paths';
import { LoadingScreen } from 'src/components/loading-screen';
import Iconify from 'src/components/iconify';
import ZaityHeadContainer from 'src/sections/ZaityTables/ZaityHeadContainer';
import { fDateTime } from 'src/utils/format-time';

// ----------------------------------------------------------------------

export default function InventoryTrackingView() {
  const { t } = useTranslate();
  const { id } = useParams();

  const { inventoryItem, inventoryItemLoading } = useGetInventoryItem(id);
  const { transactions, transactionsLoading } = useGetInventoryTransactions(id);

  const getEventIcon = (eventType) => {
    switch (eventType) {
      case 'sale':
        return { icon: 'solar:cart-check-bold', color: 'error' };
      case 'purchase':
      case 'restock':
        return { icon: 'solar:box-bold', color: 'success' };
      case 'adjustment':
        return { icon: 'solar:slider-vertical-bold', color: 'secondary' };
      case 'reservation':
        return { icon: 'solar:lock-bold', color: 'warning' };
      case 'release':
        return { icon: 'solar:unlock-bold', color: 'success' };
      case 'damage':
        return { icon: 'solar:danger-bold', color: 'error' };
      case 'loss':
        return { icon: 'solar:close-circle-bold', color: 'error' };
      case 'return':
        return { icon: 'solar:restart-bold', color: 'info' };
      default:
        return { icon: 'solar:history-bold', color: 'default' };
    }
  };

  if (inventoryItemLoading || transactionsLoading) {
    return <LoadingScreen />;
  }

  if (!inventoryItem) {
    return (
      <ZaityHeadContainer
        heading={t('inventory_tracking')}
        links={[
          { name: t('dashboard'), href: paths.dashboard.root },
          { name: t('inventory'), href: paths.dashboard.inventory.root },
          { name: t('tracking') },
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
      heading={`${t('inventory_tracking')}: ${inventoryItem.product?.name || ''}`}
      links={[
        { name: t('dashboard'), href: paths.dashboard.root },
        { name: t('inventory'), href: paths.dashboard.inventory.root },
        { name: inventoryItem.product?.name || '', href: paths.dashboard.inventory.details(id) },
        { name: t('tracking') },
      ]}
    >
      <Card sx={{ p: 3 }}>
        {/* Summary Header */}
        <Stack direction="row" spacing={3} sx={{ mb: 4, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="overline" color="text.secondary">
              {t('product')}
            </Typography>
            <Typography variant="h6">{inventoryItem.product?.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t('sku')}: {inventoryItem.sku}
            </Typography>
          </Box>
          <Box>
            <Typography variant="overline" color="text.secondary">
              {t('current_quantity')}
            </Typography>
            <Typography variant="h4">{inventoryItem.quantity}</Typography>
          </Box>
          <Box>
            <Typography variant="overline" color="text.secondary">
              {t('available')}
            </Typography>
            <Typography variant="h4" color="primary.main">
              {inventoryItem.available_quantity}
            </Typography>
          </Box>
          <Box>
            <Typography variant="overline" color="text.secondary">
              {t('reserved')}
            </Typography>
            <Typography variant="h4" color="warning.main">
              {inventoryItem.reserved_quantity}
            </Typography>
          </Box>
        </Stack>

        {/* Timeline */}
        {transactions && transactions.length > 0 ? (
          <Timeline position="right">
            {transactions.map((transaction, index) => {
              const { icon, color } = getEventIcon(transaction.type);
              return (
                <TimelineItem key={transaction.id || index}>
                  <TimelineOppositeContent color="text.secondary" sx={{ flex: 0.3 }}>
                    <Typography variant="caption">{fDateTime(transaction.created_at)}</Typography>
                  </TimelineOppositeContent>
                  <TimelineSeparator>
                    <TimelineDot color={color}>
                      <Iconify icon={icon} width={20} />
                    </TimelineDot>
                    {index < transactions.length - 1 && <TimelineConnector />}
                  </TimelineSeparator>
                  <TimelineContent>
                    <Stack spacing={1}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="subtitle2">
                          {transaction.type_description || t(transaction.type)}
                        </Typography>
                        {transaction.type && (
                          <Chip label={transaction.type_description || t(transaction.type)} size="small" variant="soft" color={color} />
                        )}
                      </Stack>

                      {/* Quantity Change */}
                      <Typography variant="body2" color="text.secondary">
                        {t('quantity_change')}:
                        <Typography
                          component="span"
                          variant="body2"
                          sx={{
                            ml: 1,
                            fontWeight: 600,
                            color: transaction.quantity > 0 ? 'success.main' : 'error.main',
                          }}
                        >
                          {transaction.formatted_quantity || transaction.quantity}
                        </Typography>
                      </Typography>

                      {/* Before and After */}
                      {transaction.quantity_before !== undefined && transaction.quantity_after !== undefined && (
                        <Typography variant="body2" color="text.secondary">
                          {transaction.quantity_before} → {transaction.quantity_after}
                        </Typography>
                      )}

                      {/* Reference (Order, etc.) */}
                      {transaction.reference_type && transaction.reference_id && (
                        <Typography variant="caption" color="primary.main">
                          {t(transaction.reference_type)} #{transaction.reference_id}
                        </Typography>
                      )}

                      {/* Notes */}
                      {transaction.notes && (
                        <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                          {transaction.notes}
                        </Typography>
                      )}
                    </Stack>
                  </TimelineContent>
                </TimelineItem>
              );
            })}
          </Timeline>
        ) : (
          <Box sx={{ textAlign: 'center', py: 5 }}>
            <Iconify icon="solar:history-bold" width={64} sx={{ color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              {t('no_tracking_data')}
            </Typography>
            <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
              {t('no_inventory_movements_recorded')}
            </Typography>
          </Box>
        )}
      </Card>
    </ZaityHeadContainer>
  );
}

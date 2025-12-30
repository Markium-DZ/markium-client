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
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';

import { useTranslate } from 'src/locales';
import { useGetItemTracking, useGetInventoryItem } from 'src/api/inventory';
import { paths } from 'src/routes/paths';
import { LoadingScreen } from 'src/components/loading-screen';
import Iconify from 'src/components/iconify';
import ZaityHeadContainer from 'src/sections/ZaityTables/ZaityHeadContainer';
import { fDateTime } from 'src/utils/format-time';

// ----------------------------------------------------------------------

export default function ItemTrackingView() {
  const { t } = useTranslate();
  const { id: inventoryId, itemId } = useParams();

  const { inventoryItem, inventoryItemLoading } = useGetInventoryItem(inventoryId);
  const { itemTracking, itemTrackingLoading, itemDetails } = useGetItemTracking(inventoryId, itemId);

  const getEventIcon = (eventType) => {
    switch (eventType) {
      case 'created':
        return { icon: 'solar:add-circle-bold', color: 'success' };
      case 'assigned':
        return { icon: 'solar:tag-bold', color: 'info' };
      case 'transferred':
        return { icon: 'solar:shuffle-bold', color: 'warning' };
      case 'sold':
        return { icon: 'solar:cart-check-bold', color: 'primary' };
      case 'returned':
        return { icon: 'solar:restart-bold', color: 'secondary' };
      case 'damaged':
        return { icon: 'solar:danger-bold', color: 'error' };
      case 'repaired':
        return { icon: 'solar:settings-bold', color: 'success' };
      case 'location_changed':
        return { icon: 'solar:map-point-bold', color: 'info' };
      case 'status_changed':
        return { icon: 'solar:refresh-bold', color: 'secondary' };
      default:
        return { icon: 'solar:history-bold', color: 'default' };
    }
  };

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

  if (inventoryItemLoading || itemTrackingLoading) {
    return <LoadingScreen />;
  }

  if (!inventoryItem || !itemDetails) {
    return (
      <ZaityHeadContainer
        heading={t('item_tracking')}
        links={[
          { name: t('dashboard'), href: paths.dashboard.root },
          { name: t('inventory'), href: paths.dashboard.inventory.root },
          { name: t('tracking') },
        ]}
      >
        <Card sx={{ p: 5, textAlign: 'center' }}>
          <Iconify icon="solar:box-bold" width={64} sx={{ color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            {t('item_not_found')}
          </Typography>
        </Card>
      </ZaityHeadContainer>
    );
  }

  return (
    <ZaityHeadContainer
      heading={`${t('item_tracking')}: ${itemDetails.serial_number || itemDetails.identifier}`}
      links={[
        { name: t('dashboard'), href: paths.dashboard.root },
        { name: t('inventory'), href: paths.dashboard.inventory.root },
        { name: inventoryItem.product?.name || '', href: paths.dashboard.inventory.details(inventoryId) },
        { name: t('items'), href: paths.dashboard.inventory.items(inventoryId) },
        { name: itemDetails.serial_number || itemDetails.identifier },
      ]}
    >
      <Stack spacing={3}>
        {/* Item Summary */}
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>
            {t('item_details')}
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="overline" color="text.secondary">
                {t('serial_number')}
              </Typography>
              <Typography variant="h6" sx={{ fontFamily: 'monospace' }}>
                {itemDetails.serial_number || '-'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="overline" color="text.secondary">
                {t('identifier')}
              </Typography>
              <Typography variant="h6" sx={{ fontFamily: 'monospace' }}>
                {itemDetails.identifier || '-'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="overline" color="text.secondary">
                {t('status')}
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                <Chip
                  label={t(itemDetails.status)}
                  color={getStatusColor(itemDetails.status)}
                  size="small"
                  variant="soft"
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="overline" color="text.secondary">
                {t('location')}
              </Typography>
              <Typography variant="body1">{itemDetails.location || '-'}</Typography>
            </Grid>
          </Grid>

          {itemDetails.notes && (
            <>
              <Divider sx={{ my: 3 }} />
              <Box>
                <Typography variant="overline" color="text.secondary">
                  {t('notes')}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {itemDetails.notes}
                </Typography>
              </Box>
            </>
          )}
        </Card>

        {/* Timeline */}
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>
            {t('tracking_history')}
          </Typography>
          {itemTracking && itemTracking.length > 0 ? (
            <Timeline position="right">
              {itemTracking.map((event, index) => {
                const { icon, color } = getEventIcon(event.type);
                return (
                  <TimelineItem key={event.id || index}>
                    <TimelineOppositeContent color="text.secondary" sx={{ flex: 0.3 }}>
                      <Typography variant="caption">{fDateTime(event.created_at)}</Typography>
                    </TimelineOppositeContent>
                    <TimelineSeparator>
                      <TimelineDot color={color}>
                        <Iconify icon={icon} width={20} />
                      </TimelineDot>
                      {index < itemTracking.length - 1 && <TimelineConnector />}
                    </TimelineSeparator>
                    <TimelineContent>
                      <Stack spacing={1}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography variant="subtitle2">
                            {event.description || t(event.type)}
                          </Typography>
                          {event.type && <Chip label={t(event.type)} size="small" variant="soft" />}
                        </Stack>

                        {event.from_status && event.to_status && (
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Chip
                              label={t(event.from_status)}
                              size="small"
                              color={getStatusColor(event.from_status)}
                              variant="soft"
                            />
                            <Iconify icon="solar:arrow-right-linear" width={16} />
                            <Chip
                              label={t(event.to_status)}
                              size="small"
                              color={getStatusColor(event.to_status)}
                              variant="soft"
                            />
                          </Stack>
                        )}

                        {event.from_location && event.to_location && (
                          <Typography variant="body2" color="text.secondary">
                            {t('location')}: {event.from_location} → {event.to_location}
                          </Typography>
                        )}

                        {event.order_id && (
                          <Typography variant="caption" color="primary.main">
                            {t('order')} #{event.order_id}
                          </Typography>
                        )}

                        {event.user && (
                          <Typography variant="caption" color="text.disabled">
                            {t('by')}: {event.user.name || event.user.email}
                          </Typography>
                        )}

                        {event.notes && (
                          <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
                            {event.notes}
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
                {t('no_item_movements_recorded')}
              </Typography>
            </Box>
          )}
        </Card>
      </Stack>
    </ZaityHeadContainer>
  );
}

import PropTypes from 'prop-types';

import Card from '@mui/material/Card';
import Timeline from '@mui/lab/Timeline';
import TimelineDot from '@mui/lab/TimelineDot';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineItem, { timelineItemClasses } from '@mui/lab/TimelineItem';

import { fToNow } from 'src/utils/format-time';
import { useTranslate } from 'src/locales';
import { useLocales } from 'src/locales';
import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

const STATUS_ICON = {
  pending: 'solar:clock-circle-bold',
  confirmed: 'solar:check-circle-bold',
  shipment_created: 'solar:delivery-bold',
  shipped: 'solar:box-bold',
  in_transit: 'solar:delivery-bold',
  out_for_delivery: 'solar:map-point-wave-bold',
  delivered: 'solar:verified-check-bold',
  failed: 'solar:close-circle-bold',
  returned: 'solar:undo-left-bold',
  cancelled: 'solar:close-circle-bold',
  preparing: 'solar:clock-circle-bold',
  parcel_created: 'solar:delivery-bold',
};

const STATUS_COLOR = {
  pending: 'warning',
  confirmed: 'secondary',
  shipment_created: 'primary',
  shipped: 'info',
  in_transit: 'info',
  out_for_delivery: 'primary',
  delivered: 'success',
  failed: 'error',
  returned: 'error',
  cancelled: 'error',
  preparing: 'warning',
  parcel_created: 'primary',
};

// Get localized status name from an order timeline entry (status is an object)
function getTimelineStatusLabel(entry, langValue) {
  const status = entry?.status;
  if (!status) return entry?.note || '—';

  if (langValue === 'ar' && status.name_ar) return status.name_ar;
  return status.name || status.key || '—';
}

// Extract status key — handles both string and object {key, name, name_ar}
function getStatusKey(status) {
  if (!status) return '';
  if (typeof status === 'string') return status;
  return status.key || '';
}

// Readable label for tracking_history entries
function getTrackingLabel(entry, langValue) {
  const status = entry?.status;
  if (typeof status === 'object' && status !== null) {
    if (langValue === 'ar' && status.name_ar) return status.name_ar;
    return status.name || status.key?.replace(/_/g, ' ') || '—';
  }
  return entry?.description || (typeof status === 'string' ? status.replace(/_/g, ' ') : '—');
}

// Build location string from wilaya_name and commune_name
function getLocationText(entry) {
  const parts = [entry?.commune_name, entry?.wilaya_name].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : null;
}

// ----------------------------------------------------------------------

export default function OrderDetailsHistory({ currentOrder }) {
  const { t, i18n } = useTranslate();
  const { currentLang } = useLocales();
  const langValue = currentLang?.value || 'en';

  const shipment = currentOrder?.active_shipment;
  const trackingHistory = shipment?.tracking_history || [];

  // Use tracking_history (filtered) when shipment exists, otherwise fall back to order.timeline
  const hasTrackingHistory = shipment && trackingHistory.length > 0;

  let events;

  if (hasTrackingHistory) {
    events = trackingHistory
      .filter((entry) => entry.source !== 'webhook')
      .map((entry, idx) => {
        const sk = getStatusKey(entry.status);
        return {
          key: `tracking-${idx}`,
          label: getTrackingLabel(entry, langValue),
          location: getLocationText(entry),
          time: entry.timestamp,
          statusKey: sk,
          icon: STATUS_ICON[sk] || 'solar:delivery-bold',
          color: STATUS_COLOR[sk] || 'grey',
        };
      })
      .sort((a, b) => new Date(b.time) - new Date(a.time));
  } else {
    const orderTimeline = currentOrder?.timeline || [];
    events = orderTimeline
      .map((entry) => ({
        key: `order-${entry.id}`,
        label: getTimelineStatusLabel(entry, langValue),
        location: null,
        time: entry.created_at,
        statusKey: entry.status?.key,
        icon: STATUS_ICON[entry.status?.key] || 'solar:clock-circle-bold',
        color: STATUS_COLOR[entry.status?.key] || 'grey',
      }))
      .sort((a, b) => new Date(b.time) - new Date(a.time));
  }

  if (events.length === 0) return null;

  return (
    <Card>
      <CardHeader title={hasTrackingHistory ? t('tracking_status') : t('order_history')} />

      <Timeline
        sx={{
          p: 2,
          pb: 1,
          m: 0,
          [`& .${timelineItemClasses.root}:before`]: {
            flex: 0,
            padding: 0,
          },
        }}
      >
        {events.map((event, index) => {
          const isLast = index === events.length - 1;
          const isFirst = index === 0;

          return (
            <TimelineItem key={event.key}>
              <TimelineSeparator>
                <TimelineDot
                  color={event.color}
                  variant={isFirst ? 'filled' : 'outlined'}
                  sx={{ m: 0, p: 0.75 }}
                >
                  <Iconify icon={event.icon} width={16} />
                </TimelineDot>
                {!isLast && <TimelineConnector />}
              </TimelineSeparator>

              <TimelineContent sx={{ py: 0.5, px: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.25 }}>
                  {event.label}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {event.location && (
                    <>{event.location} · </>
                  )}
                  {fToNow(event.time, i18n.language)}
                </Typography>
              </TimelineContent>
            </TimelineItem>
          );
        })}
      </Timeline>
    </Card>
  );
}

OrderDetailsHistory.propTypes = {
  currentOrder: PropTypes.object,
};

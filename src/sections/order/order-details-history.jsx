import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Timeline from '@mui/lab/Timeline';
import TimelineDot from '@mui/lab/TimelineDot';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineItem, { timelineItemClasses } from '@mui/lab/TimelineItem';

import { fDateTime } from 'src/utils/format-time';
import { useTranslate } from 'src/locales';
import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

// Build timeline events from actual order timestamps
function buildTimelineEvents(order) {
  if (!order) return [];

  const events = [];
  const ts = order.active_shipment?.timestamps;

  if (order.created_at) {
    events.push({
      key: 'pending',
      labelKey: 'pending',
      time: order.created_at,
      icon: 'solar:clock-circle-bold',
      color: 'warning',
    });
  }

  if (order.confirmed_at) {
    events.push({
      key: 'confirmed',
      labelKey: 'order_confirmed',
      time: order.confirmed_at,
      icon: 'solar:check-circle-bold',
      color: 'secondary',
    });
  }

  if (ts?.created_at) {
    events.push({
      key: 'shipment_created',
      labelKey: 'shipment_created',
      time: ts.created_at,
      icon: 'solar:delivery-bold',
      color: 'primary',
    });
  }

  if (ts?.shipped_at) {
    events.push({
      key: 'shipped',
      labelKey: 'shipped',
      time: ts.shipped_at,
      icon: 'solar:box-bold',
      color: 'info',
    });
  }

  if (ts?.delivered_at) {
    events.push({
      key: 'delivered',
      labelKey: 'delivered',
      time: ts.delivered_at,
      icon: 'solar:verified-check-bold',
      color: 'success',
    });
  }

  if ((order.status?.key || order.status) === 'cancelled') {
    events.push({
      key: 'cancelled',
      labelKey: 'cancelled',
      time: order.cancelled_at || order.updated_at,
      icon: 'solar:close-circle-bold',
      color: 'error',
    });
  }

  // Most recent first
  events.sort((a, b) => new Date(b.time) - new Date(a.time));

  return events;
}

// ----------------------------------------------------------------------

export default function OrderDetailsHistory({ currentOrder }) {
  const { t } = useTranslate();

  const events = buildTimelineEvents(currentOrder);

  if (events.length === 0) return null;

  return (
    <Card>
      <CardHeader title={t('order_history')} />

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
                  {t(event.labelKey)}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {fDateTime(event.time)}
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

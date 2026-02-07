import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Timeline from '@mui/lab/Timeline';
import TimelineDot from '@mui/lab/TimelineDot';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineItem, { timelineItemClasses } from '@mui/lab/TimelineItem';

import { fDateTime } from 'src/utils/format-time';
import { t } from 'i18next';

// ----------------------------------------------------------------------

export default function OrderDetailsHistory({ currentOrder,history }) {
  const shipment = currentOrder?.activeShipment;

  const renderSummary = (
    <Stack
      spacing={2}
      component={Paper}
      variant="outlined"
      sx={{
        p: 2.5,
        minWidth: 260,
        flexShrink: 0,
        borderRadius: 2,
        typography: 'body2',
        borderStyle: 'dashed',
      }}
    >
      <Stack spacing={0.5}>
        <Box sx={{ color: 'text.disabled' }}>{t('order_time')}</Box>
        {fDateTime(currentOrder?.created_at)}
      </Stack>
      {currentOrder?.confirmed_at && (
        <Stack spacing={0.5}>
          <Box sx={{ color: 'text.disabled' }}>{t('confirmation_time')}</Box>
          {fDateTime(currentOrder?.confirmed_at)}
        </Stack>
      )}
      {shipment?.shipped_at && (
        <Stack spacing={0.5}>
          <Box sx={{ color: 'text.disabled' }}>{t('shipping_time')}</Box>
          {fDateTime(shipment.shipped_at)}
        </Stack>
      )}
      {shipment?.delivered_at && (
        <Stack spacing={0.5}>
          <Box sx={{ color: 'text.disabled' }}>{t('delivery_time')}</Box>
          {fDateTime(shipment.delivered_at)}
        </Stack>
      )}
    </Stack>
  );

  const renderTimeline = (
    <Timeline
      sx={{
        p: 0,
        m: 0,
        [`& .${timelineItemClasses.root}:before`]: {
          flex: 0,
          padding: 0,
        },
      }}
    >
      {history?.timeline.map((item, index) => {
        const firstTimeline = index === 0;

        const lastTimeline = index === history?.timeline.length - 1;

        return (
          <TimelineItem key={item.title}>
            <TimelineSeparator>
              <TimelineDot color={(firstTimeline && 'primary') || 'grey'} />
              {lastTimeline ? null : <TimelineConnector />}
            </TimelineSeparator>

            <TimelineContent>
              <Typography variant="subtitle2">{item.title}</Typography>

              <Box sx={{ color: 'text.disabled', typography: 'caption', mt: 0.5 }}>
                {fDateTime(item.time)}
              </Box>
            </TimelineContent>
          </TimelineItem>
        );
      })}
    </Timeline>
  );

  return (
    <Card>
      <CardHeader title={t("history")} />
      <Stack
        spacing={3}
        alignItems={{ md: 'flex-start' }}
        direction={{ xs: 'column-reverse', md: 'row' }}
        sx={{ p: 3 }}
      >
        {renderTimeline}

        {renderSummary}
      </Stack>
    </Card>
  );
}

// OrderDetailshistory?.propTypes = {
//   history: PropTypes.object,
// };

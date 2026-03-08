import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

import { fDate, fTime, fToNow } from 'src/utils/format-time';
import { useTranslate } from 'src/locales';
import { getOrderStatusColor } from 'src/constants/order-status';
import Iconify from 'src/components/iconify';
import Label from 'src/components/label';

// ----------------------------------------------------------------------

export default function OrderTrackingAnalytics({ trackingAnalytics }) {
  const { t, i18n } = useTranslate();

  const hasViews = trackingAnalytics?.views_count > 0;

  return (
    <Card>
      <CardHeader
        title={t('tracking_page_views')}
        titleTypographyProps={{ variant: 'subtitle1' }}
        avatar={
          <Iconify
            icon="solar:eye-bold-duotone"
            width={24}
            sx={{ color: 'info.main' }}
          />
        }
      />

      {!hasViews ? (
        <Stack
          alignItems="center"
          spacing={1}
          sx={{ p: 3, pt: 1 }}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: (theme) => alpha(theme.palette.text.disabled, 0.08),
            }}
          >
            <Iconify
              icon="solar:eye-closed-linear"
              width={24}
              sx={{ color: 'text.disabled' }}
            />
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
            {t('tracking_no_views_yet')}
          </Typography>
        </Stack>
      ) : (
        <Stack sx={{ p: 2, pt: 0 }} spacing={2}>
          {/* Summary */}
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            flexWrap="wrap"
            sx={{
              px: 2,
              py: 1.5,
              borderRadius: 1.5,
              bgcolor: (theme) => alpha(theme.palette.info.main, 0.06),
              border: (theme) => `1px dashed ${alpha(theme.palette.info.main, 0.2)}`,
            }}
          >
            <Iconify icon="solar:eye-bold" width={18} sx={{ color: 'info.main', flexShrink: 0 }} />
            <Typography variant="subtitle2" sx={{ color: 'info.dark', fontWeight: 700 }}>
              {trackingAnalytics.views_count}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {t('tracking_views_count', { count: trackingAnalytics.views_count })}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled', ml: 'auto !important' }}>
              {t('tracking_last_viewed')} {fToNow(trackingAnalytics.last_viewed_at, i18n.language)}
            </Typography>
          </Stack>

          {/* Views timeline */}
          <Stack spacing={0}>
            {[...trackingAnalytics.views].reverse().map((view, index) => {
              const isFirst = index === 0;
              const isLast = index === trackingAnalytics.views.length - 1;
              const statusKey = typeof view.status === 'object' ? view.status?.key : view.status;

              return (
                <Stack
                  key={`${view.viewed_at}-${index}`}
                  direction="row"
                  alignItems="flex-start"
                  spacing={1.5}
                  sx={{ position: 'relative', pb: isLast ? 0 : 2 }}
                >
                  {/* Vertical line + dot */}
                  <Stack alignItems="center" sx={{ position: 'relative', pt: 0.25 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: isFirst ? 'info.main' : 'text.disabled',
                        flexShrink: 0,
                        zIndex: 1,
                      }}
                    />
                    {!isLast && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 12,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 1.5,
                          bottom: 0,
                          bgcolor: 'divider',
                        }}
                      />
                    )}
                  </Stack>

                  {/* Content */}
                  <Stack spacing={0.25} sx={{ minWidth: 0, flex: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={0.5} flexWrap="wrap">
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {t('tracking_viewed_while')}
                      </Typography>
                      <Label
                        variant="soft"
                        color={getOrderStatusColor(statusKey)}
                        sx={{ height: 20, fontSize: '0.65rem' }}
                      >
                        {t(statusKey)}
                      </Label>
                    </Stack>
                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                      {fDate(view.viewed_at, 'MMM d, yyyy')} {t('at')} {fTime(view.viewed_at, 'HH:mm')}
                    </Typography>
                  </Stack>
                </Stack>
              );
            })}
          </Stack>
        </Stack>
      )}
    </Card>
  );
}

OrderTrackingAnalytics.propTypes = {
  trackingAnalytics: PropTypes.shape({
    views_count: PropTypes.number,
    first_viewed_at: PropTypes.string,
    last_viewed_at: PropTypes.string,
    views: PropTypes.arrayOf(
      PropTypes.shape({
        viewed_at: PropTypes.string,
        status: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
      })
    ),
  }),
};

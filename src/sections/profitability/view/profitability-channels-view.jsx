import { useState } from 'react';

import {
  Container,
  Card,
  CardActionArea,
  Typography,
  Stack,
  Box,
  CircularProgress,
} from '@mui/material';
import { alpha } from '@mui/material/styles';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useGetChannelsOverview } from 'src/api/profitability';
import { useTranslate } from 'src/locales';
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import EmptyContent from 'src/components/empty-content';
import Label from 'src/components/label';
import Iconify from 'src/components/iconify';

import ProfitabilityDateFilter from '../components/profitability-date-filter';
import ProfitabilitySummaryCards from '../components/profitability-summary-cards';
import ProfitabilityGate from '../components/profitability-gate';
import { DEFAULT_DATE_RANGE, CHANNEL_ICONS, fmtAmount, fmtPct } from '../constants';

// ----------------------------------------------------------------------

export default function ProfitabilityChannelsView() {
  const settings = useSettingsContext();
  const { t } = useTranslate();
  const router = useRouter();

  const [dateFrom, setDateFrom] = useState(DEFAULT_DATE_RANGE);

  const {
    channels,
    totalMarketingSpend,
    totalAttributedRevenue,
    overallMarketingROI,
    channelsLoading,
    channelsError,
    channelsForbidden,
  } = useGetChannelsOverview(dateFrom);

  const avgSpendPerChannel = channels.length > 0 ? totalMarketingSpend / channels.length : 0;

  const summaryCards = [
    { title: t('active_channels'), value: channels.length, icon: 'solar:global-bold-duotone', color: 'info' },
    { title: t('total_marketing_spend'), value: totalMarketingSpend, suffix: 'DA', icon: 'solar:bill-list-bold-duotone', color: 'warning' },
    { title: t('total_attributed_revenue'), value: totalAttributedRevenue, suffix: 'DA', icon: 'solar:wallet-money-bold-duotone', color: 'primary' },
    { title: t('avg_spend_per_channel'), value: avgSpendPerChannel, suffix: 'DA', icon: 'solar:chart-square-bold-duotone', color: 'secondary' },
  ];

  const content = (
    <Stack spacing={3}>
      <ProfitabilitySummaryCards cards={summaryCards} />

      {channels.length === 0 ? (
        <EmptyContent title={t('no_data')} />
      ) : (
        <Box
          display="grid"
          gridTemplateColumns={{
            xs: 'repeat(1, 1fr)',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
          }}
          gap={2.5}
        >
          {channels.map((row) => {
            const roiPositive = typeof row.roi === 'number' && row.roi >= 0;
            const channelIcon = CHANNEL_ICONS[row.channel] || CHANNEL_ICONS.other;

            return (
              <Card key={row.channel} sx={{ overflow: 'visible' }}>
                <CardActionArea
                  onClick={() => router.push(paths.dashboard.profitability.channel(row.channel))}
                  sx={{ p: 3, height: '100%' }}
                >
                  <Stack spacing={2.5}>
                    {/* Channel icon + name + ROI */}
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 1.5,
                            bgcolor: (theme) => alpha(theme.palette.info.main, 0.08),
                          }}
                        >
                          <Iconify icon={channelIcon} width={26} sx={{ color: 'info.main' }} />
                        </Box>
                        <Typography variant="subtitle1" fontWeight={700}>
                          {t(`channel_${row.channel}`)}
                        </Typography>
                      </Stack>

                      <Label variant="soft" color={roiPositive ? 'success' : 'error'} sx={{ fontSize: '0.8125rem' }}>
                        {fmtPct(row.roi)}
                      </Label>
                    </Stack>

                    {/* Metrics grid */}
                    <Box
                      display="grid"
                      gridTemplateColumns="repeat(2, 1fr)"
                      gap={1.5}
                    >
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.25, display: 'block' }}>
                          {t('total_spend')}
                        </Typography>
                        <Typography variant="subtitle2" fontWeight={600} color="warning.main">
                          {fmtAmount(row.total_spend)}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.25, display: 'block' }}>
                          {t('attributed_revenue')}
                        </Typography>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {fmtAmount(row.attributed_revenue)}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.25, display: 'block' }}>
                          {t('campaigns_count')}
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <Iconify icon="solar:clipboard-list-bold-duotone" width={16} sx={{ color: 'text.disabled' }} />
                          <Typography variant="subtitle2" fontWeight={600}>
                            {row.campaigns_count}
                          </Typography>
                        </Stack>
                      </Box>

                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.25, display: 'block' }}>
                          {t('products_reached')}
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <Iconify icon="solar:box-bold-duotone" width={16} sx={{ color: 'text.disabled' }} />
                          <Typography variant="subtitle2" fontWeight={600}>
                            {row.products_reached}
                          </Typography>
                        </Stack>
                      </Box>
                    </Box>

                    {/* Bottom bar - spend vs revenue */}
                    <Box sx={{ position: 'relative', height: 6, borderRadius: 3, bgcolor: (theme) => alpha(theme.palette.grey[500], 0.12) }}>
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          height: '100%',
                          borderRadius: 3,
                          width: `${Math.min(100, (row.attributed_revenue && row.total_spend) ? (row.total_spend / row.attributed_revenue) * 100 : 0)}%`,
                          bgcolor: (theme) => roiPositive ? theme.palette.success.main : theme.palette.error.main,
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </Box>
                  </Stack>
                </CardActionArea>
              </Card>
            );
          })}
        </Box>
      )}
    </Stack>
  );

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading={t('channels_overview')}
        links={[
          { name: t('dashboard'), href: paths.dashboard.root },
          { name: t('profitability'), href: paths.dashboard.profitability.root },
          { name: t('channels_overview') },
        ]}
        action={<ProfitabilityDateFilter value={dateFrom} onChange={setDateFrom} />}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {channelsLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : channelsError && !channelsForbidden ? (
        <EmptyContent title={t('error')} description={t('error_loading_data', 'Could not load data. Please try again.')} />
      ) : (
        <ProfitabilityGate forbidden={channelsForbidden}>
          {content}
        </ProfitabilityGate>
      )}
    </Container>
  );
}

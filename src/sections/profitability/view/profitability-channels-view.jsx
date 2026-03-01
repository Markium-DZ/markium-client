import { useState } from 'react';

import {
  Container,
  Card,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TableHead,
  Typography,
  Stack,
  Box,
  CircularProgress,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useGetChannelsOverview } from 'src/api/profitability';
import { useTranslate } from 'src/locales';
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import EmptyContent from 'src/components/empty-content';

import ProfitabilityDateFilter from '../components/profitability-date-filter';
import ProfitabilitySummaryCards from '../components/profitability-summary-cards';
import ProfitabilityGate from '../components/profitability-gate';
import ChannelIcon from '../components/channel-icon';
import { DEFAULT_DATE_RANGE, fmtAmount, fmtPct } from '../constants';

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
    channelsForbidden,
  } = useGetChannelsOverview(dateFrom);

  const summaryCards = [
    { title: t('total_marketing_spend'), value: totalMarketingSpend, suffix: 'DA', icon: 'solar:bill-list-bold-duotone', color: 'warning' },
    { title: t('total_attributed_revenue'), value: totalAttributedRevenue, suffix: 'DA', icon: 'solar:wallet-money-bold-duotone', color: 'primary' },
    { title: t('overall_marketing_roi'), value: fmtPct(overallMarketingROI), icon: 'solar:graph-up-bold-duotone', color: 'success' },
  ];

  const content = (
    <Stack spacing={3}>
      <ProfitabilitySummaryCards cards={summaryCards} />

      {channels.length === 0 ? (
        <EmptyContent title={t('no_data')} />
      ) : (
        <Card>
          <CardHeader title={t('channels_overview')} />
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('channel')}</TableCell>
                  <TableCell align="right">{t('total_spend')}</TableCell>
                  <TableCell align="right">{t('campaigns_count')}</TableCell>
                  <TableCell align="right">{t('products_reached')}</TableCell>
                  <TableCell align="right">{t('attributed_revenue')}</TableCell>
                  <TableCell align="right">{t('roi')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {channels.map((row) => (
                  <TableRow
                    key={row.channel}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => router.push(paths.dashboard.profitability.channel(row.channel))}
                  >
                    <TableCell>
                      <ChannelIcon channel={row.channel} />
                    </TableCell>
                    <TableCell align="right">{fmtAmount(row.total_spend)}</TableCell>
                    <TableCell align="right">{row.campaigns_count}</TableCell>
                    <TableCell align="right">{row.products_reached}</TableCell>
                    <TableCell align="right">{fmtAmount(row.attributed_revenue)}</TableCell>
                    <TableCell align="right">{fmtPct(row.roi)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
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
      ) : (
        <ProfitabilityGate forbidden={channelsForbidden}>
          {content}
        </ProfitabilityGate>
      )}
    </Container>
  );
}

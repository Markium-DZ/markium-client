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

import { useGetCampaignsROI } from 'src/api/profitability';
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

export default function ProfitabilityCampaignsView() {
  const settings = useSettingsContext();
  const { t } = useTranslate();

  const [dateFrom, setDateFrom] = useState(DEFAULT_DATE_RANGE);

  const {
    campaigns,
    totalMarketingSpend,
    totalRevenue,
    overallMarketingROI,
    campaignsLoading,
    campaignsForbidden,
  } = useGetCampaignsROI(dateFrom);

  const summaryCards = [
    { title: t('total_marketing_spend'), value: totalMarketingSpend, suffix: 'DA', icon: 'solar:bill-list-bold-duotone', color: 'warning' },
    { title: t('total_revenue'), value: totalRevenue, suffix: 'DA', icon: 'solar:wallet-money-bold-duotone', color: 'primary' },
    { title: t('overall_marketing_roi'), value: fmtPct(overallMarketingROI), icon: 'solar:graph-up-bold-duotone', color: 'success' },
  ];

  const content = (
    <Stack spacing={3}>
      <ProfitabilitySummaryCards cards={summaryCards} />

      {campaigns.length === 0 ? (
        <EmptyContent title={t('no_data')} />
      ) : (
        <Card>
          <CardHeader title={t('campaigns_roi')} />
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('campaign_name')}</TableCell>
                  <TableCell>{t('channel')}</TableCell>
                  <TableCell align="right">{t('spend')}</TableCell>
                  <TableCell align="right">{t('attributed_revenue')}</TableCell>
                  <TableCell align="right">{t('roi')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {campaigns.map((row, index) => (
                  <TableRow key={index} hover>
                    <TableCell>
                      <Typography variant="subtitle2">{row.campaign_name}</Typography>
                    </TableCell>
                    <TableCell>
                      <ChannelIcon channel={row.channel} />
                    </TableCell>
                    <TableCell align="right">{fmtAmount(row.spend)}</TableCell>
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
        heading={t('campaigns_roi')}
        links={[
          { name: t('dashboard'), href: paths.dashboard.root },
          { name: t('profitability'), href: paths.dashboard.profitability.root },
          { name: t('campaigns_roi') },
        ]}
        action={<ProfitabilityDateFilter value={dateFrom} onChange={setDateFrom} />}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {campaignsLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        <ProfitabilityGate forbidden={campaignsForbidden}>
          {content}
        </ProfitabilityGate>
      )}
    </Container>
  );
}

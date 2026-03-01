import PropTypes from 'prop-types';
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

import { useGetChannelDetail } from 'src/api/profitability';
import { useTranslate } from 'src/locales';
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import EmptyContent from 'src/components/empty-content';

import ProfitabilityDateFilter from '../components/profitability-date-filter';
import ProfitabilitySummaryCards from '../components/profitability-summary-cards';
import ProfitabilityGate from '../components/profitability-gate';
import ChannelIcon from '../components/channel-icon';
import { DEFAULT_DATE_RANGE } from '../constants';

// ----------------------------------------------------------------------

export default function ProfitabilityChannelView({ channel }) {
  const settings = useSettingsContext();
  const { t } = useTranslate();

  const [dateFrom, setDateFrom] = useState(DEFAULT_DATE_RANGE);

  const {
    channelName,
    totalSpend,
    campaignsCount,
    productsReached,
    attributedRevenue,
    roi,
    channelCampaigns,
    channelDetailLoading,
    channelDetailForbidden,
  } = useGetChannelDetail(channel, dateFrom);

  const fmtAmount = (val) =>
    typeof val === 'number' ? `${val.toLocaleString('fr-DZ', { minimumFractionDigits: 0 })} DA` : '—';

  const fmtPct = (val) =>
    typeof val === 'number' ? `${val.toFixed(1)}%` : '—';

  const summaryCards = [
    { title: t('total_spend'), value: totalSpend, suffix: 'DA', icon: 'solar:bill-list-bold-duotone', color: 'warning' },
    { title: t('campaigns_count'), value: campaignsCount, icon: 'solar:clipboard-list-bold-duotone', color: 'info' },
    { title: t('products_reached'), value: productsReached, icon: 'solar:box-bold-duotone', color: 'primary' },
    { title: t('attributed_revenue'), value: attributedRevenue, suffix: 'DA', icon: 'solar:wallet-money-bold-duotone', color: 'success' },
    { title: t('roi'), value: fmtPct(roi), icon: 'solar:graph-up-bold-duotone', color: 'success' },
  ];

  const content = (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <ChannelIcon channel={channelName} showLabel={false} />
        <Typography variant="h5">{t(`channel_${channelName}`)}</Typography>
      </Box>

      <ProfitabilitySummaryCards cards={summaryCards} />

      {channelCampaigns.length === 0 ? (
        <EmptyContent title={t('no_data')} />
      ) : (
        <Card>
          <CardHeader title={t('campaigns')} />
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('campaign_name')}</TableCell>
                  <TableCell>{t('product')}</TableCell>
                  <TableCell align="right">{t('spend')}</TableCell>
                  <TableCell align="right">{t('attributed_revenue')}</TableCell>
                  <TableCell align="right">{t('roi')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {channelCampaigns.map((row, index) => (
                  <TableRow key={index} hover>
                    <TableCell>
                      <Typography variant="subtitle2">{row.campaign_name}</Typography>
                    </TableCell>
                    <TableCell>{row.product_name || '—'}</TableCell>
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
        heading={t(`channel_${channelName}`)}
        links={[
          { name: t('dashboard'), href: paths.dashboard.root },
          { name: t('profitability'), href: paths.dashboard.profitability.root },
          { name: t('channels_overview'), href: paths.dashboard.profitability.channels },
          { name: t(`channel_${channelName}`) },
        ]}
        action={<ProfitabilityDateFilter value={dateFrom} onChange={setDateFrom} />}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {channelDetailLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        <ProfitabilityGate forbidden={channelDetailForbidden}>
          {content}
        </ProfitabilityGate>
      )}
    </Container>
  );
}

ProfitabilityChannelView.propTypes = {
  channel: PropTypes.string.isRequired,
};

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
  Chip,
} from '@mui/material';
import { alpha } from '@mui/material/styles';

import { paths } from 'src/routes/paths';

import { useGetChannelDetail } from 'src/api/profitability';
import { useTranslate } from 'src/locales';
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import EmptyContent from 'src/components/empty-content';
import Label from 'src/components/label';
import Iconify from 'src/components/iconify';

import ProfitabilityDateFilter from '../components/profitability-date-filter';
import ProfitabilitySummaryCards from '../components/profitability-summary-cards';
import ProfitabilityGate from '../components/profitability-gate';
import ChannelIcon from '../components/channel-icon';
import { DEFAULT_DATE_RANGE, fmtAmount, fmtPct, CHANNEL_ICONS } from '../constants';

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
    channelDetailError,
    channelDetailForbidden,
  } = useGetChannelDetail(channel, dateFrom);

  const summaryCards = [
    { title: t('total_spend'), value: totalSpend, suffix: 'DA', icon: 'solar:bill-list-bold-duotone', color: 'warning' },
    { title: t('campaigns_count'), value: campaignsCount, icon: 'solar:clipboard-list-bold-duotone', color: 'info' },
    { title: t('products_reached'), value: productsReached, icon: 'solar:box-bold-duotone', color: 'primary' },
    { title: t('attributed_revenue'), value: attributedRevenue, suffix: 'DA', icon: 'solar:wallet-money-bold-duotone', color: 'success' },
    { title: t('roi'), value: fmtPct(roi), icon: 'solar:graph-up-bold-duotone', color: 'success' },
  ];

  const channelIcon = CHANNEL_ICONS[channelName] || CHANNEL_ICONS.other;

  const content = (
    <Stack spacing={3}>
      {/* Channel header */}
      <Card sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box
            sx={{
              width: 48,
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 1.5,
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
            }}
          >
            <Iconify icon={channelIcon} width={28} sx={{ color: 'primary.main' }} />
          </Box>
          <Box>
            <Typography variant="h5">{t(`channel_${channelName}`)}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t('channel_detail_subtitle')}
            </Typography>
          </Box>
        </Stack>
      </Card>

      <ProfitabilitySummaryCards cards={summaryCards} />

      {channelCampaigns.length === 0 ? (
        <EmptyContent title={t('no_data')} />
      ) : (
        <Card>
          <CardHeader
            title={t('campaigns')}
            action={
              <Chip
                label={`${channelCampaigns.length} ${t('campaigns')}`}
                size="small"
                variant="soft"
                color="warning"
              />
            }
          />
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
                {channelCampaigns.map((row, index) => {
                  const roiPositive = typeof row.roi === 'number' && row.roi >= 0;
                  return (
                    <TableRow
                      key={index}
                      hover
                      sx={{
                        '&:hover': { bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04) },
                      }}
                    >
                      <TableCell>
                        <Typography variant="subtitle2">{row.campaign_name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {row.product_name || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600} color="warning.main">
                          {fmtAmount(row.spend)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={500}>
                          {fmtAmount(row.attributed_revenue)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Label variant="soft" color={roiPositive ? 'success' : 'error'}>
                          {fmtPct(row.roi)}
                        </Label>
                      </TableCell>
                    </TableRow>
                  );
                })}
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
      ) : channelDetailError && !channelDetailForbidden ? (
        <EmptyContent title={t('error')} description={t('error_loading_data', 'Could not load data. Please try again.')} />
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

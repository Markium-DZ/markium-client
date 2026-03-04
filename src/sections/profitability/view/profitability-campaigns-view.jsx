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

import { useGetCampaignsROI } from 'src/api/profitability';
import { useTranslate } from 'src/locales';
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import EmptyContent from 'src/components/empty-content';
import Label from 'src/components/label';

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
    campaignsError,
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
          <CardHeader
            title={t('campaigns_roi')}
            action={
              <Chip
                label={`${campaigns.length} ${t('campaigns')}`}
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
                  <TableCell>{t('channel')}</TableCell>
                  <TableCell align="right">{t('spend')}</TableCell>
                  <TableCell align="right">{t('attributed_revenue')}</TableCell>
                  <TableCell align="right">{t('roi')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {campaigns.map((row, index) => {
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
                        <ChannelIcon channel={row.channel} />
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
      ) : campaignsError && !campaignsForbidden ? (
        <EmptyContent title={t('error')} description={t('error_loading_data', 'Could not load data. Please try again.')} />
      ) : (
        <ProfitabilityGate forbidden={campaignsForbidden}>
          {content}
        </ProfitabilityGate>
      )}
    </Container>
  );
}

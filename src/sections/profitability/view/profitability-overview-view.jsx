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

import { useGetStorePnL } from 'src/api/profitability';
import { useTranslate } from 'src/locales';
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';

import ProfitabilityDateFilter from '../components/profitability-date-filter';
import ProfitabilitySummaryCards from '../components/profitability-summary-cards';
import CostBreakdownChart from '../components/cost-breakdown-chart';
import ProfitabilityGate from '../components/profitability-gate';
import ChannelIcon from '../components/channel-icon';
import { DEFAULT_DATE_RANGE, fmtAmount, fmtPct } from '../constants';

// ----------------------------------------------------------------------

export default function ProfitabilityOverviewView() {
  const settings = useSettingsContext();
  const { t } = useTranslate();
  const router = useRouter();

  const [dateFrom, setDateFrom] = useState(DEFAULT_DATE_RANGE);

  const {
    summary,
    topProducts,
    topCampaigns,
    unitsSold,
    costPerUnit,
    profitPerUnit,
    storePnLLoading,
    storePnLForbidden,
  } = useGetStorePnL(dateFrom);

  const summaryCards = [
    { title: t('total_revenue'), value: summary.total_revenue ?? 0, suffix: 'DA', icon: 'solar:wallet-money-bold-duotone', color: 'primary' },
    { title: t('total_costs'), value: summary.total_costs ?? 0, suffix: 'DA', icon: 'solar:bill-list-bold-duotone', color: 'warning' },
    { title: t('gross_profit'), value: summary.gross_profit ?? 0, suffix: 'DA', icon: 'solar:graph-up-bold-duotone', color: 'success' },
    { title: t('profit_margin'), value: fmtPct(summary.profit_margin_pct), icon: 'solar:chart-square-bold-duotone', color: 'info' },
  ];

  const content = (
    <Stack spacing={3}>
      <ProfitabilitySummaryCards cards={summaryCards} />

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
        <Box sx={{ flex: 2 }}>
          <CostBreakdownChart costsBreakdown={summary.costs_breakdown} />
        </Box>

        <Stack spacing={2} sx={{ flex: 1 }}>
          <Card sx={{ p: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {t('units_sold')}
            </Typography>
            <Typography variant="h4">{unitsSold.toLocaleString('fr-DZ')}</Typography>
          </Card>
          <Card sx={{ p: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {t('cost_per_unit')}
            </Typography>
            <Typography variant="h4">{fmtAmount(costPerUnit)}</Typography>
          </Card>
          <Card sx={{ p: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {t('profit_per_unit')}
            </Typography>
            <Typography variant="h4" color="success.main">{fmtAmount(profitPerUnit)}</Typography>
          </Card>
        </Stack>
      </Stack>

      {topProducts?.length > 0 && (
        <Card>
          <CardHeader title={t('top_profitable_products')} />
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('product')}</TableCell>
                  <TableCell align="right">{t('revenue')}</TableCell>
                  <TableCell align="right">{t('units_sold')}</TableCell>
                  <TableCell align="right">{t('total_costs')}</TableCell>
                  <TableCell align="right">{t('gross_profit')}</TableCell>
                  <TableCell align="right">{t('margin')}</TableCell>
                  <TableCell align="right">{t('profit_per_unit')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {topProducts.map((row) => (
                  <TableRow
                    key={row.product_id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => router.push(paths.dashboard.profitability.product(row.product_id))}
                  >
                    <TableCell>
                      <Typography variant="subtitle2">{row.product_name}</Typography>
                    </TableCell>
                    <TableCell align="right">{fmtAmount(row.revenue)}</TableCell>
                    <TableCell align="right">{row.units_sold}</TableCell>
                    <TableCell align="right">{fmtAmount(row.total_costs)}</TableCell>
                    <TableCell align="right">
                      <Typography color="success.main" fontWeight={600}>
                        {fmtAmount(row.gross_profit)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{fmtPct(row.profit_margin_pct)}</TableCell>
                    <TableCell align="right">{fmtAmount(row.profit_per_unit)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {topCampaigns?.length > 0 && (
        <Card>
          <CardHeader title={t('top_costly_campaigns')} />
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('campaign_name')}</TableCell>
                  <TableCell>{t('channel')}</TableCell>
                  <TableCell align="right">{t('spend')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {topCampaigns.map((row, index) => (
                  <TableRow key={index} hover>
                    <TableCell>{row.campaign_name}</TableCell>
                    <TableCell>
                      <ChannelIcon channel={row.channel} />
                    </TableCell>
                    <TableCell align="right">{fmtAmount(row.total_spend)}</TableCell>
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
        heading={t('profitability')}
        links={[
          { name: t('dashboard'), href: paths.dashboard.root },
          { name: t('profitability') },
          { name: t('profitability_overview') },
        ]}
        action={<ProfitabilityDateFilter value={dateFrom} onChange={setDateFrom} />}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {storePnLLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        <ProfitabilityGate forbidden={storePnLForbidden}>
          {content}
        </ProfitabilityGate>
      )}
    </Container>
  );
}

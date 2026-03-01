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
  LinearProgress,
  Chip,
} from '@mui/material';
import { alpha } from '@mui/material/styles';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useGetStorePnL } from 'src/api/profitability';
import { useTranslate } from 'src/locales';
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import Iconify from 'src/components/iconify';

import ProfitabilityDateFilter from '../components/profitability-date-filter';
import ProfitabilitySummaryCards from '../components/profitability-summary-cards';
import CostBreakdownChart from '../components/cost-breakdown-chart';
import ProfitabilityGate from '../components/profitability-gate';
import ChannelIcon from '../components/channel-icon';
import { DEFAULT_DATE_RANGE, fmtAmount, fmtPct } from '../constants';

// ----------------------------------------------------------------------

function MarginBar({ value }) {
  const clamped = Math.max(0, Math.min(100, value || 0));
  const barColor = value >= 30 ? 'success' : value >= 15 ? 'warning' : 'error';

  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 120 }}>
      <LinearProgress
        variant="determinate"
        value={clamped}
        color={barColor}
        sx={{
          flex: 1,
          height: 6,
          borderRadius: 3,
          bgcolor: (theme) => alpha(theme.palette.grey[500], 0.12),
        }}
      />
      <Typography variant="caption" fontWeight={600} sx={{ minWidth: 40, textAlign: 'right' }}>
        {fmtPct(value)}
      </Typography>
    </Stack>
  );
}

function ProfitValue({ value }) {
  const isPositive = typeof value === 'number' && value >= 0;
  return (
    <Typography variant="body2" fontWeight={600} color={isPositive ? 'success.main' : 'error.main'}>
      {fmtAmount(value)}
    </Typography>
  );
}

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

      {/* Cost chart + unit metrics */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
        <Box sx={{ flex: 2 }}>
          <CostBreakdownChart costsBreakdown={summary.costs_breakdown} />
        </Box>

        <Stack spacing={2} sx={{ flex: 1 }}>
          <Card sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
              <Iconify icon="solar:box-bold-duotone" width={20} sx={{ color: 'info.main' }} />
              <Typography variant="subtitle2" color="text.secondary">
                {t('units_sold')}
              </Typography>
            </Stack>
            <Typography variant="h3" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
              {unitsSold.toLocaleString('fr-DZ')}
            </Typography>
          </Card>

          <Card sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
              <Iconify icon="solar:tag-price-bold-duotone" width={20} sx={{ color: 'warning.main' }} />
              <Typography variant="subtitle2" color="text.secondary">
                {t('cost_per_unit')}
              </Typography>
            </Stack>
            <Typography variant="h3" sx={{ fontWeight: 700, letterSpacing: '-0.02em', color: 'warning.main' }}>
              {fmtAmount(costPerUnit)}
            </Typography>
          </Card>

          <Card
            sx={{
              p: 3,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              bgcolor: (theme) => alpha(theme.palette.success.main, 0.04),
              border: (theme) => `1px solid ${alpha(theme.palette.success.main, 0.12)}`,
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
              <Iconify icon="solar:graph-up-bold-duotone" width={20} sx={{ color: 'success.main' }} />
              <Typography variant="subtitle2" color="text.secondary">
                {t('profit_per_unit')}
              </Typography>
            </Stack>
            <Typography variant="h3" sx={{ fontWeight: 700, letterSpacing: '-0.02em', color: 'success.main' }}>
              {fmtAmount(profitPerUnit)}
            </Typography>
          </Card>
        </Stack>
      </Stack>

      {/* Top profitable products */}
      {topProducts?.length > 0 && (
        <Card>
          <CardHeader
            title={t('top_profitable_products')}
            action={
              <Chip
                label={`${topProducts.length} ${t('products')}`}
                size="small"
                variant="soft"
                color="success"
              />
            }
          />
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('product')}</TableCell>
                  <TableCell align="right">{t('revenue')}</TableCell>
                  <TableCell align="right">{t('units_sold')}</TableCell>
                  <TableCell align="right">{t('total_costs')}</TableCell>
                  <TableCell align="right">{t('gross_profit')}</TableCell>
                  <TableCell align="right" sx={{ minWidth: 160 }}>{t('margin')}</TableCell>
                  <TableCell align="right">{t('profit_per_unit')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {topProducts.map((row, idx) => (
                  <TableRow
                    key={row.product_id}
                    hover
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04) },
                    }}
                    onClick={() => router.push(paths.dashboard.profitability.product(row.product_id))}
                  >
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: 0.75,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: (theme) => alpha(theme.palette.grey[500], 0.08),
                            typography: 'caption',
                            fontWeight: 700,
                            color: 'text.secondary',
                          }}
                        >
                          {idx + 1}
                        </Box>
                        <Typography variant="subtitle2">{row.product_name}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={500}>{fmtAmount(row.revenue)}</Typography>
                    </TableCell>
                    <TableCell align="right">{row.units_sold}</TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="text.secondary">{fmtAmount(row.total_costs)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <ProfitValue value={row.gross_profit} />
                    </TableCell>
                    <TableCell align="right">
                      <MarginBar value={row.profit_margin_pct} />
                    </TableCell>
                    <TableCell align="right">
                      <ProfitValue value={row.profit_per_unit} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Top costly campaigns */}
      {topCampaigns?.length > 0 && (
        <Card>
          <CardHeader
            title={t('top_costly_campaigns')}
            action={
              <Chip
                label={`${topCampaigns.length} ${t('campaigns')}`}
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
                </TableRow>
              </TableHead>
              <TableBody>
                {topCampaigns.map((row, index) => (
                  <TableRow key={index} hover>
                    <TableCell>
                      <Typography variant="subtitle2">{row.campaign_name}</Typography>
                    </TableCell>
                    <TableCell>
                      <ChannelIcon channel={row.channel} />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600} color="warning.main">
                        {fmtAmount(row.total_spend)}
                      </Typography>
                    </TableCell>
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

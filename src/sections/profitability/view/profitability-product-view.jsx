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
  Button,
  CircularProgress,
} from '@mui/material';
import { alpha } from '@mui/material/styles';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useGetProductPnL } from 'src/api/profitability';
import { useTranslate } from 'src/locales';
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import Iconify from 'src/components/iconify';
import Label from 'src/components/label';

import ProfitabilityDateFilter from '../components/profitability-date-filter';
import ProfitabilitySummaryCards from '../components/profitability-summary-cards';
import ProfitabilityGate from '../components/profitability-gate';
import ChannelIcon from '../components/channel-icon';
import { DEFAULT_DATE_RANGE, COST_TYPE_LABELS, COST_TYPE_COLORS, fmtAmount, fmtPct } from '../constants';

// ----------------------------------------------------------------------

export default function ProfitabilityProductView({ id }) {
  const settings = useSettingsContext();
  const { t } = useTranslate();
  const router = useRouter();

  const [dateFrom, setDateFrom] = useState(DEFAULT_DATE_RANGE);

  const {
    productInfo,
    revenue,
    unitsSold,
    costs,
    totalCosts,
    grossProfit,
    profitMargin,
    profitPerUnit,
    productPnLLoading,
    productPnLForbidden,
  } = useGetProductPnL(id, dateFrom);

  const productName = productInfo?.name || productInfo?.product_name || id;

  const summaryCards = [
    { title: t('revenue'), value: revenue, suffix: 'DA', icon: 'solar:wallet-money-bold-duotone', color: 'primary' },
    { title: t('units_sold'), value: unitsSold, icon: 'solar:box-bold-duotone', color: 'info' },
    { title: t('total_costs'), value: totalCosts, suffix: 'DA', icon: 'solar:bill-list-bold-duotone', color: 'warning' },
    { title: t('gross_profit'), value: grossProfit, suffix: 'DA', icon: 'solar:graph-up-bold-duotone', color: 'success' },
    { title: t('profit_margin'), value: fmtPct(profitMargin), icon: 'solar:chart-square-bold-duotone', color: 'info' },
  ];

  const costEntries = Object.entries(costs || {});
  const marketingCosts = costs?.marketing;
  const marketingCampaigns = marketingCosts?.campaigns || [];

  const content = (
    <Stack spacing={3}>
      <ProfitabilitySummaryCards cards={summaryCards} />

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
        {/* Profit per unit highlight card */}
        <Card
          sx={{
            p: 3,
            flex: 1,
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

        {/* Manage costs button */}
        <Card
          sx={{
            p: 3,
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: (theme) => alpha(theme.palette.info.main, 0.04),
              borderColor: (theme) => alpha(theme.palette.info.main, 0.2),
            },
          }}
          onClick={() => router.push(paths.dashboard.product.costs(id))}
        >
          <Stack alignItems="center" spacing={1}>
            <Iconify icon="solar:settings-bold-duotone" width={32} sx={{ color: 'info.main' }} />
            <Typography variant="subtitle1" fontWeight={600}>
              {t('manage_costs')}
            </Typography>
          </Stack>
        </Card>
      </Stack>

      {/* Cost breakdown table */}
      {costEntries.length > 0 && (
        <Card>
          <CardHeader title={t('cost_breakdown')} />
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('cost_type')}</TableCell>
                  <TableCell align="right">{t('total')}</TableCell>
                  <TableCell align="right">{t('per_unit')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {costEntries.map(([type, data]) => (
                  <TableRow key={type} hover>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            borderRadius: 0.5,
                            bgcolor: COST_TYPE_COLORS[type] || '#919EAB',
                            flexShrink: 0,
                          }}
                        />
                        <Typography variant="subtitle2">
                          {t(COST_TYPE_LABELS[type] || type)}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600} color="warning.main">
                        {fmtAmount(data?.total)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="text.secondary">
                        {fmtAmount(data?.per_unit)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Marketing campaigns */}
      {marketingCampaigns.length > 0 && (
        <Card>
          <CardHeader
            title={t('marketing_campaigns')}
            action={
              <Label variant="soft" color="warning">
                {`${marketingCampaigns.length} ${t('campaigns')}`}
              </Label>
            }
          />
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('campaign_name')}</TableCell>
                  <TableCell>{t('channel')}</TableCell>
                  <TableCell align="right">{t('spend')}</TableCell>
                  <TableCell align="right">{t('attributed_orders')}</TableCell>
                  <TableCell align="right">{t('roi')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {marketingCampaigns.map((campaign, index) => {
                  const roiPositive = typeof campaign.roi === 'number' && campaign.roi >= 0;
                  return (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Typography variant="subtitle2">{campaign.campaign_name}</Typography>
                      </TableCell>
                      <TableCell>
                        <ChannelIcon channel={campaign.channel} />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600} color="warning.main">
                          {fmtAmount(campaign.spend)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{campaign.attributed_orders ?? '—'}</TableCell>
                      <TableCell align="right">
                        <Label variant="soft" color={roiPositive ? 'success' : 'error'}>
                          {fmtPct(campaign.roi)}
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
        heading={productName}
        links={[
          { name: t('dashboard'), href: paths.dashboard.root },
          { name: t('profitability'), href: paths.dashboard.profitability.root },
          { name: t('products_pnl'), href: paths.dashboard.profitability.products },
          { name: productName },
        ]}
        action={<ProfitabilityDateFilter value={dateFrom} onChange={setDateFrom} />}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {productPnLLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        <ProfitabilityGate forbidden={productPnLForbidden}>
          {content}
        </ProfitabilityGate>
      )}
    </Container>
  );
}

ProfitabilityProductView.propTypes = {
  id: PropTypes.string.isRequired,
};

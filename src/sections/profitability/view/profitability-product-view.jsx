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

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useGetProductPnL } from 'src/api/profitability';
import { useTranslate } from 'src/locales';
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import Iconify from 'src/components/iconify';

import ProfitabilityDateFilter from '../components/profitability-date-filter';
import ProfitabilitySummaryCards from '../components/profitability-summary-cards';
import ProfitabilityGate from '../components/profitability-gate';
import ChannelIcon from '../components/channel-icon';
import { DEFAULT_DATE_RANGE, COST_TYPE_LABELS, fmtAmount, fmtPct } from '../constants';

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
        <Box sx={{ flex: 1 }}>
          <Card sx={{ p: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {t('profit_per_unit')}
            </Typography>
            <Typography variant="h4" color="success.main">
              {fmtAmount(profitPerUnit)}
            </Typography>
          </Card>
        </Box>

        <Box sx={{ flex: 1 }}>
          <Button
            variant="outlined"
            size="large"
            startIcon={<Iconify icon="solar:settings-bold-duotone" />}
            onClick={() => router.push(paths.dashboard.product.costs(id))}
            sx={{ height: '100%', width: '100%' }}
          >
            {t('manage_costs')}
          </Button>
        </Box>
      </Stack>

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
                  <TableRow key={type}>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {t(COST_TYPE_LABELS[type] || type)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{fmtAmount(data?.total)}</TableCell>
                    <TableCell align="right">{fmtAmount(data?.per_unit)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {marketingCampaigns.length > 0 && (
        <Card>
          <CardHeader title={t('marketing_campaigns')} />
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
                {marketingCampaigns.map((campaign, index) => (
                  <TableRow key={index} hover>
                    <TableCell>{campaign.campaign_name}</TableCell>
                    <TableCell>
                      <ChannelIcon channel={campaign.channel} />
                    </TableCell>
                    <TableCell align="right">{fmtAmount(campaign.spend)}</TableCell>
                    <TableCell align="right">{campaign.attributed_orders ?? '—'}</TableCell>
                    <TableCell align="right">{fmtPct(campaign.roi)}</TableCell>
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

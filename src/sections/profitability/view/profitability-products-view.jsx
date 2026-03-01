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

import { useGetProductsPnL } from 'src/api/profitability';
import { useTranslate } from 'src/locales';
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import EmptyContent from 'src/components/empty-content';
import Iconify from 'src/components/iconify';

import ProfitabilityDateFilter from '../components/profitability-date-filter';
import ProfitabilityGate from '../components/profitability-gate';
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

// ----------------------------------------------------------------------

export default function ProfitabilityProductsView() {
  const settings = useSettingsContext();
  const { t } = useTranslate();
  const router = useRouter();

  const [dateFrom, setDateFrom] = useState(DEFAULT_DATE_RANGE);

  const {
    products,
    productsPnLLoading,
    productsPnLForbidden,
  } = useGetProductsPnL(dateFrom);

  const content = (
    <Stack spacing={3}>
      {products.length === 0 ? (
        <EmptyContent title={t('no_data')} />
      ) : (
        <Card>
          <CardHeader
            title={t('products_pnl')}
            action={
              <Chip
                label={`${products.length} ${t('products')}`}
                size="small"
                variant="soft"
                color="primary"
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
                {products.map((row) => {
                  const isPositive = typeof row.gross_profit === 'number' && row.gross_profit >= 0;
                  return (
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
                          <Iconify
                            icon={isPositive ? 'solar:graph-up-bold-duotone' : 'solar:graph-down-bold-duotone'}
                            width={18}
                            sx={{ color: isPositive ? 'success.main' : 'error.main' }}
                          />
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
                        <Typography variant="body2" fontWeight={600} color={isPositive ? 'success.main' : 'error.main'}>
                          {fmtAmount(row.gross_profit)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <MarginBar value={row.profit_margin_pct} />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600} color={isPositive ? 'success.main' : 'error.main'}>
                          {fmtAmount(row.profit_per_unit)}
                        </Typography>
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
        heading={t('products_pnl')}
        links={[
          { name: t('dashboard'), href: paths.dashboard.root },
          { name: t('profitability'), href: paths.dashboard.profitability.root },
          { name: t('products_pnl') },
        ]}
        action={<ProfitabilityDateFilter value={dateFrom} onChange={setDateFrom} />}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {productsPnLLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        <ProfitabilityGate forbidden={productsPnLForbidden}>
          {content}
        </ProfitabilityGate>
      )}
    </Container>
  );
}

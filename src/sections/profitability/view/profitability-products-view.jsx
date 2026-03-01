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

import { useGetProductsPnL } from 'src/api/profitability';
import { useTranslate } from 'src/locales';
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import EmptyContent from 'src/components/empty-content';

import ProfitabilityDateFilter from '../components/profitability-date-filter';
import ProfitabilityGate from '../components/profitability-gate';
import { DEFAULT_DATE_RANGE } from '../constants';

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

  const fmtAmount = (val) =>
    typeof val === 'number' ? `${val.toLocaleString('fr-DZ', { minimumFractionDigits: 0 })} DA` : '—';

  const fmtPct = (val) =>
    typeof val === 'number' ? `${val.toFixed(1)}%` : '—';

  const content = (
    <Stack spacing={3}>
      {products.length === 0 ? (
        <EmptyContent title={t('no_data')} />
      ) : (
        <Card>
          <CardHeader title={t('products_pnl')} />
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
                {products.map((row) => (
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

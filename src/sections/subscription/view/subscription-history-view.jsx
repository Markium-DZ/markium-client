import { useState } from 'react';

import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';

import { useTranslate } from 'src/locales';

import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

import Label from 'src/components/label';
import Scrollbar from 'src/components/scrollbar';
import { useSettingsContext } from 'src/components/settings';
import {
  useTable,
  TableNoData,
  TableHeadCustom,
  TableSkeleton,
} from 'src/components/table';

import { useGetSubscriptionPayments } from 'src/api/subscriptions';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'created_at', label: 'Date', width: 160 },
  { id: 'package', label: 'Package', width: 160 },
  { id: 'amount', label: 'Amount', width: 140 },
  { id: 'payment_method', label: 'Payment Method', width: 140 },
  { id: 'status', label: 'Status', width: 120 },
];

// ----------------------------------------------------------------------

export default function SubscriptionHistoryView() {
  const { t } = useTranslate();
  const settings = useSettingsContext();
  const table = useTable({ defaultOrderBy: 'created_at', defaultOrder: 'desc' });

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const { payments, pagination, paymentsLoading, paymentsEmpty } = useGetSubscriptionPayments(
    page,
    rowsPerPage
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage + 1);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(1);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      case 'canceled':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 5 }}>
        <Typography variant="h4">{t('payment_history')}</Typography>
      </Stack>

      <Card>
        <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
          <Scrollbar>
            <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 800 }}>
              <TableHeadCustom
                order={table.order}
                orderBy={table.orderBy}
                headLabel={TABLE_HEAD.map((head) => ({
                  ...head,
                  label: t(head.label.toLowerCase().replace(/ /g, '_')),
                }))}
                onSort={table.onSort}
              />

              <TableBody>
                {paymentsLoading ? (
                  [...Array(rowsPerPage)].map((_, index) => (
                    <TableSkeleton key={index} sx={{ height: 72 }} />
                  ))
                ) : (
                  <>
                    {payments.map((payment) => (
                      <TableRow key={payment.id} hover>
                        <TableCell>
                          {fDate(payment.created_at)}
                        </TableCell>

                        <TableCell>
                          <Typography variant="subtitle2">
                            {payment.package?.name || '-'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {payment.package?.billing_cycle || ''}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography variant="subtitle2">
                            {fCurrency(payment.amount)} {payment.currency?.toUpperCase() || 'DZD'}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Label variant="soft" color="info">
                            {payment.payment_method?.toUpperCase() || '-'}
                          </Label>
                        </TableCell>

                        <TableCell>
                          <Label variant="soft" color={getStatusColor(payment.status)}>
                            {t(payment.status)}
                          </Label>
                        </TableCell>
                      </TableRow>
                    ))}

                    {paymentsEmpty && (
                      <TableNoData notFound={paymentsEmpty} />
                    )}
                  </>
                )}
              </TableBody>
            </Table>
          </Scrollbar>
        </TableContainer>

        <TablePagination
          page={page - 1}
          component="div"
          count={pagination?.total || 0}
          rowsPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          rowsPerPageOptions={[5, 10, 25]}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>
    </Container>
  );
}

import { useState, useCallback, useEffect } from 'react';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import { alpha, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';
import TableContainer from '@mui/material/TableContainer';
import { RouterLink } from 'src/routes/components';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';

import { isAfter, isBetween } from 'src/utils/format-time';

import { _orders, ORDER_STATUS_OPTIONS } from 'src/_mock';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { useSnackbar } from 'src/components/snackbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  TableNoData,
  getComparator,
  TableEmptyRows,
  TableHeadCustom,
  TableSelectedAction,
  TablePaginationCustom,
} from 'src/components/table';

import { useLocales, useTranslate } from 'src/locales';
import { useGetMainSpecs } from 'src/api/settings';
import { useValues } from 'src/api/utils';
import OrderTableRow from './zaity-table-row';
import OrderTableFiltersResult from './zaity-table-filters-result';
import OrderTableToolbar from './zaity-table-toolbar';

// ----------------------------------------------------------------------

const STATUS_OPTIONS = [{ value: 'all', label: 'All' }, ...ORDER_STATUS_OPTIONS];

const defaultFilters = {
  name: '',
  status: 'all',
  startDate: null,
  endDate: null,
};

// ----------------------------------------------------------------------

export default function ZaityListView({ TABLE_HEAD, dense, zaityTableDate, onSelectedRows,maxWidth,rowsPerPage,minHeight,height , rowsPerPageOptions, hidePagination, mobileCardRender }) {
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const table = useTable({ defaultOrderBy: 'orderNumber' });

  const router = useRouter();

  const confirm = useBoolean();

  const [tableData, setTableData] = useState(zaityTableDate);
  useEffect(() => {
    setTableData(zaityTableDate);
    table.onResetPage();
  }, [zaityTableDate])

  const [filters, setFilters] = useState(defaultFilters);

  const dateError = isAfter(filters.startDate, filters.endDate);

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters,
    dateError,
  });

  const dataInPage = dataFiltered.slice(
    table.page * (rowsPerPage || table.rowsPerPage),
    table.page * (rowsPerPage || table.rowsPerPage) + (rowsPerPage || table.rowsPerPage)
  );

  

  const denseHeight = table.dense ? 56 : 56 + 20;

  const canReset =
    !!filters.name || filters.status !== 'all' || (!!filters.startDate && !!filters.endDate);

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleFilters = useCallback(
    (name, value) => {
      table.onResetPage();
      setFilters((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    },
    [table]
  );

  const handleResetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const handleSelectRows = useCallback(() => {
    const selectedRows = tableData.filter((row) => !table.selected.includes(row.id));
  }, [dataFiltered.length, dataInPage.length, enqueueSnackbar, table, tableData]);

  const handleViewRow = useCallback(
    (id) => {
      router.push(paths.dashboard.settings.details(id));
    },
    [router]
  );

  const handleEditRow = useCallback(
    (id) => {
      router.push(paths.dashboard.settings.edit(id));
    },
    [router]
  );

  const handleFilterStatus = useCallback(
    (event, newValue) => {
      handleFilters('status', newValue);
    },
    [handleFilters]
  );
  const paginatedData = dataFiltered.slice(
    table.page * (rowsPerPage || table.rowsPerPage),
    table.page * (rowsPerPage || table.rowsPerPage) + (rowsPerPage || table.rowsPerPage)
  );

  return (
    <>
      {isMobile && mobileCardRender ? (
        /* Mobile card layout */
        <Box sx={{ px: 1, py: 1 }}>
          {notFound ? (
            <TableNoData notFound={notFound} />
          ) : (
            paginatedData.map((row) => (
              <Box key={row?.id}>
                {mobileCardRender(row)}
              </Box>
            ))
          )}
        </Box>
      ) : (
        /* Desktop table layout */
        <TableContainer sx={{ position: 'relative', overflow: 'hidden', height: height ? `${height}px` : 'auto' }}>
          <Scrollbar sx={{ maxHeight: height ? `${height}px` : 'none' }}>
            <Table size={dense} sx={{ minWidth: 660 , maxWidth ,minHeight, height: height ? `${height}px` : undefined }}>
              <TableHeadCustom
                order={table.order}
                orderBy={table.orderBy}
                headLabel={TABLE_HEAD}
                rowCount={dataFiltered.length}
                numSelected={table.selected.length}
                onSort={table.onSort}
              />

              <TableBody>
                {paginatedData
                  .map((row) => (
                    <OrderTableRow
                      TABLE_HEAD={TABLE_HEAD}
                      key={row?.id}
                      row={row}
                      selected={table.selected.includes(row.id)}
                      onSelectRow={() => table.onSelectRow(row.id)}
                    />
                  ))}

                <TableEmptyRows
                  height={denseHeight}
                  emptyRows={emptyRows(table.page, (rowsPerPage || table.rowsPerPage), dataFiltered.length)}
                />
                <TableNoData notFound={notFound} />
              </TableBody>
            </Table>
          </Scrollbar>
        </TableContainer>
      )}

      {!hidePagination && (
        <TablePaginationCustom
          rowsPerPageOptions={rowsPerPageOptions}
          count={dataFiltered.length}
          page={table.page}
          rowsPerPage={(rowsPerPage || table.rowsPerPage)}
          onPageChange={table.onChangePage}
          onRowsPerPageChange={table.onChangeRowsPerPage}
          dense={table.dense}
          onChangeDense={table.onChangeDense}
        />
      )}
    </>
  );
}

// ----------------------------------------------------------------------

function applyFilter({ inputData, comparator, filters, dateError }) {
  const { status, name, startDate, endDate } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index]);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (name) {
    inputData = inputData.filter(
      (order) =>
        order.orderNumber.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
        order.customer.name.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
        order.customer.email.toLowerCase().indexOf(name.toLowerCase()) !== -1
    );
  }

  if (status !== 'all') {
    inputData = inputData.filter((order) => (order.status?.key || order.status) === status);
  }

  if (!dateError) {
    if (startDate && endDate) {
      inputData = inputData.filter((order) => isBetween(order.createdAt, startDate, endDate));
    }
  }

  return inputData;
}

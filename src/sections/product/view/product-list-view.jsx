import isEqual from 'lodash/isEqual';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import TablePagination from '@mui/material/TablePagination';
import {
  DataGrid,
  GridToolbarExport,
  GridActionsCellItem,
  GridToolbarContainer,
  GridToolbarQuickFilter,
  GridToolbarFilterButton,
  GridToolbarColumnsButton,
} from '@mui/x-data-grid';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useBoolean } from 'src/hooks/use-boolean';
import { useTranslate } from 'src/locales';

import { useGetProducts } from 'src/api/product';
import { PRODUCT_STOCK_OPTIONS } from 'src/_mock';

import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';
import EmptyContent from 'src/components/empty-content';
import ConnectionError from 'src/components/connection-error';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';

import ProductTableToolbar from '../product-table-toolbar';
import ProductTableFiltersResult from '../product-table-filters-result';
import ProductMobileCard from '../product-mobile-card';
import {
  RenderCellStock,
  RenderCellPrice,
  RenderCellPublish,
  RenderCellProduct,
  RenderCellCreatedAt,
  RenderCellDiscount,
  RenderCellStatus,
} from '../product-table-row';

// ----------------------------------------------------------------------

const STATUS_OPTIONS = [
  { value: 'deployed', label: 'Deployed' },
  { value: 'draft', label: 'Draft' },
];

const defaultFilters = {
  status: [],
  stock: [],
};

const HIDE_COLUMNS = {
  category: false,
};

const HIDE_COLUMNS_TOGGLABLE = ['category', 'actions'];

// ----------------------------------------------------------------------

export default function ProductListView() {
  const { enqueueSnackbar } = useSnackbar();

  const { t } = useTranslate();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const confirmRows = useBoolean();

  const router = useRouter();

  const settings = useSettingsContext();

  const [mobilePage, setMobilePage] = useState(0);
  const [mobileRowsPerPage, setMobileRowsPerPage] = useState(10);

  const { products, productsLoading, productsError, productsMutate } = useGetProducts();

  const [tableData, setTableData] = useState([]);

  const [filters, setFilters] = useState(defaultFilters);

  const [selectedRowIds, setSelectedRowIds] = useState([]);

  const [columnVisibilityModel, setColumnVisibilityModel] = useState(HIDE_COLUMNS);

  useEffect(() => {
    if (products?.length) {
      setTableData(products);
    }
  }, [products]);

  const dataFiltered = applyFilter({
    inputData: tableData,
    filters,
  });

  const canReset = !isEqual(defaultFilters, filters);

  const handleFilters = useCallback((name, value) => {
    setFilters((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const handleDeleteRow = useCallback(
    (id) => {
      const deleteRow = tableData.filter((row) => row.id !== id);

      enqueueSnackbar(t('delete_success'));

      setTableData(deleteRow);
    },
    [enqueueSnackbar, tableData, t]
  );

  const handleDeleteRows = useCallback(() => {
    const deleteRows = tableData.filter((row) => !selectedRowIds.includes(row.id));

    enqueueSnackbar(t('delete_success'));

    setTableData(deleteRows);
  }, [enqueueSnackbar, selectedRowIds, tableData, t]);

  const handleEditRow = useCallback(
    (id) => {
      router.push(paths.dashboard.product.edit(id));
    },
    [router]
  );

  const handleViewRow = useCallback(
    (id) => {
      router.push(paths.dashboard.product.details(id));
    },
    [router]
  );

  const columns = [
    {
      field: 'category',
      headerName: t('category'),
      width: 140,
      filterable: false,
    },
    {
      field: 'name',
      headerName: t('product_name'),
      flex: 1,
      minWidth: 320,
      hideable: false,
      renderCell: (params) => <RenderCellProduct params={params} />,
    },
    {
      field: 'quantity',
      headerName: t('quantity'),
      width: 100,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'is_in_stock',
      headerName: t('stock_status'),
      width: 130,
      renderCell: (params) => <RenderCellStock params={params} />,
    },
    {
      field: 'sale_price',
      headerName: t('sale_price'),
      width: 120,
      renderCell: (params) => <RenderCellPrice params={params} field="sale_price" />,
    },
    {
      field: 'real_price',
      headerName: t('real_price'),
      width: 120,
      renderCell: (params) => <RenderCellPrice params={params} field="real_price" />,
    },
    {
      field: 'has_discount',
      headerName: t('discount'),
      width: 130,
      renderCell: (params) => <RenderCellDiscount params={params} />,
    },
    {
      field: 'status',
      headerName: t('status'),
      width: 120,
      type: 'singleSelect',
      valueOptions: STATUS_OPTIONS,
      renderCell: (params) => <RenderCellStatus params={params} />,
    },
    {
      field: 'created_at',
      headerName: t('created_at'),
      width: 160,
      renderCell: (params) => <RenderCellCreatedAt params={params} />,
    },
    {
      type: 'actions',
      field: 'actions',
      headerName: ' ',
      align: 'right',
      headerAlign: 'right',
      width: 80,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      getActions: (params) => [
        <GridActionsCellItem
          showInMenu
          icon={<Iconify icon="solar:eye-bold" />}
          label={t('view')}
          onClick={() => handleViewRow(params.row.id)}
        />,
        <GridActionsCellItem
          showInMenu
          icon={<Iconify icon="solar:pen-bold" />}
          label={t('edit')}
          onClick={() => handleEditRow(params.row.id)}
        />,
        <GridActionsCellItem
          showInMenu
          icon={<Iconify icon="solar:trash-bin-trash-bold" />}
          label={t('delete')}
          onClick={() => {
            handleDeleteRow(params.row.id);
          }}
          sx={{ color: 'error.main' }}
        />,
      ],
    },
  ];

  const getTogglableColumns = () =>
    columns
      .filter((column) => !HIDE_COLUMNS_TOGGLABLE.includes(column.field))
      .map((column) => column.field);

  return (
    <>
      <Container
        maxWidth={settings.themeStretch ? false : 'lg'}
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <CustomBreadcrumbs
          heading={t('list')}
          links={[
            { name: t('dashboard'), href: paths.dashboard.root },
            {
              name: t('products'),
              href: paths.dashboard.product.root,
            },
            { name: t('list') },
          ]}
          action={
            <Button
              component={RouterLink}
              href={paths.dashboard.product.new}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              {t('new_product')}
            </Button>
          }
          sx={{
            mb: {
              xs: 3,
              md: 5,
            },
          }}
        />

        {!productsLoading && productsError && !products?.length ? (
          <Card sx={{ p: 3 }}>
            <ConnectionError onRetry={() => productsMutate?.()} />
          </Card>
        ) : isMobile ? (
          /* Mobile card layout */
          <Box>
            {dataFiltered.length === 0 ? (
              <Card sx={{ p: 3 }}>
                <EmptyContent title={t('no_data')} />
              </Card>
            ) : (
              <>
                {dataFiltered
                  .slice(
                    mobilePage * mobileRowsPerPage,
                    mobilePage * mobileRowsPerPage + mobileRowsPerPage
                  )
                  .map((product) => (
                    <ProductMobileCard
                      key={product.id}
                      product={product}
                      onViewRow={() => handleViewRow(product.id)}
                      onEditRow={() => handleEditRow(product.id)}
                      onDeleteRow={() => handleDeleteRow(product.id)}
                    />
                  ))}

                <Card sx={{ mt: 1 }}>
                  <TablePagination
                    component="div"
                    count={dataFiltered.length}
                    page={mobilePage}
                    rowsPerPage={mobileRowsPerPage}
                    onPageChange={(e, newPage) => setMobilePage(newPage)}
                    onRowsPerPageChange={(e) => {
                      setMobileRowsPerPage(parseInt(e.target.value, 10));
                      setMobilePage(0);
                    }}
                    rowsPerPageOptions={[5, 10, 25]}
                  />
                </Card>
              </>
            )}
          </Box>
        ) : (
          /* Desktop DataGrid */
          <Card
            sx={{
              height: { xs: 800, md: 2 },
              flexGrow: { md: 1 },
              display: { md: 'flex' },
              flexDirection: { md: 'column' },
            }}
          >
            <DataGrid
              checkboxSelection
              disableRowSelectionOnClick
              rows={dataFiltered}
              columns={columns}
              loading={productsLoading}
              getRowHeight={() => 'auto'}
              pageSizeOptions={[5, 10, 25]}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 10 },
                },
              }}
              onRowSelectionModelChange={(newSelectionModel) => {
                setSelectedRowIds(newSelectionModel);
              }}
              columnVisibilityModel={columnVisibilityModel}
              onColumnVisibilityModelChange={(newModel) => setColumnVisibilityModel(newModel)}
              slots={{
                toolbar: () => (
                  <>
                    <GridToolbarContainer>
                      <ProductTableToolbar
                        filters={filters}
                        onFilters={handleFilters}
                        stockOptions={PRODUCT_STOCK_OPTIONS}
                        publishOptions={STATUS_OPTIONS}
                      />

                      <GridToolbarQuickFilter />

                      <Stack
                        spacing={1}
                        flexGrow={1}
                        direction="row"
                        alignItems="center"
                        justifyContent="flex-end"
                      >
                        {!!selectedRowIds.length && (
                          <Button
                            size="small"
                            color="error"
                            startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                            onClick={confirmRows.onTrue}
                          >
                            {t('delete')} ({selectedRowIds.length})
                          </Button>
                        )}

                        <GridToolbarColumnsButton />
                        <GridToolbarFilterButton />
                        <GridToolbarExport />
                      </Stack>
                    </GridToolbarContainer>

                    {canReset && (
                      <ProductTableFiltersResult
                        filters={filters}
                        onFilters={handleFilters}
                        onResetFilters={handleResetFilters}
                        results={dataFiltered.length}
                        sx={{ p: 2.5, pt: 0 }}
                      />
                    )}
                  </>
                ),
                noRowsOverlay: () => <EmptyContent title={t('no_data')} />,
                noResultsOverlay: () => <EmptyContent title={t('no_results_found')} />,
              }}
              slotProps={{
                columnsPanel: {
                  getTogglableColumns,
                },
              }}
            />
          </Card>
        )}
      </Container>

      <ConfirmDialog
        open={confirmRows.value}
        onClose={confirmRows.onFalse}
        title={t('delete')}
        content={
          <>
            {t('are_you_sure_delete')} <strong> {selectedRowIds.length} </strong> {t('items')}?
          </>
        }
        action={
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              handleDeleteRows();
              confirmRows.onFalse();
            }}
          >
            {t('delete')}
          </Button>
        }
      />
    </>
  );
}

// ----------------------------------------------------------------------

function applyFilter({ inputData, filters }) {
  const { stock, status } = filters;

  if (stock.length) {
    inputData = inputData.filter((product) => {
      if (stock.includes('in_stock')) return product.is_in_stock;
      if (stock.includes('out_of_stock')) return !product.is_in_stock;
      return true;
    });
  }

  if (status.length) {
    inputData = inputData.filter((product) => status.includes(product.status));
  }

  return inputData;
}

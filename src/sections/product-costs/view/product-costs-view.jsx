import PropTypes from 'prop-types';
import { useState, useCallback } from 'react';

import {
  Container,
  Button,
  Card,
  Table,
  TableBody,
  TableContainer,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { useGetProduct } from 'src/api/product';
import { useGetProductCosts, deleteProductCost } from 'src/api/product-costs';

import { useTranslate } from 'src/locales';
import { useBoolean } from 'src/hooks/use-boolean';
import { useSettingsContext } from 'src/components/settings';
import { useSnackbar } from 'src/components/snackbar';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import Iconify from 'src/components/iconify';
import EmptyContent from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { useTable, TableHeadCustom, TablePaginationCustom } from 'src/components/table';
import { LoadingScreen } from 'src/components/loading-screen';

import CostFormDialog from '../cost-form-dialog';
import CostRow, { COST_TABLE_HEAD } from '../cost-row';

export default function ProductCostsView({ id }) {
  const { t } = useTranslate();
  const settings = useSettingsContext();
  const { enqueueSnackbar } = useSnackbar();
  const table = useTable({ defaultOrderBy: 'type' });

  const { product } = useGetProduct(id);
  const { costs, costsLoading, costsEmpty, costsMutate } = useGetProductCosts(id);

  const formDialog = useBoolean();
  const confirmDelete = useBoolean();

  const [editingCost, setEditingCost] = useState(null);
  const [deletingCostId, setDeletingCostId] = useState(null);

  const handleAdd = useCallback(() => {
    setEditingCost(null);
    formDialog.onTrue();
  }, [formDialog]);

  const handleEdit = useCallback(
    (cost) => {
      setEditingCost(cost);
      formDialog.onTrue();
    },
    [formDialog]
  );

  const handleDeleteClick = useCallback(
    (costId) => {
      setDeletingCostId(costId);
      confirmDelete.onTrue();
    },
    [confirmDelete]
  );

  const handleDeleteConfirm = useCallback(async () => {
    try {
      await deleteProductCost(id, deletingCostId);
      enqueueSnackbar(t('cost_deleted'), { variant: 'success' });
      costsMutate();
      confirmDelete.onFalse();
    } catch (err) {
      enqueueSnackbar(err.message || t('error'), { variant: 'error' });
    }
  }, [id, deletingCostId, costsMutate, confirmDelete, enqueueSnackbar, t]);

  const handleFormSuccess = useCallback(() => {
    costsMutate();
  }, [costsMutate]);

  const dataInPage = costs.slice(
    table.page * table.rowsPerPage,
    table.page * table.rowsPerPage + table.rowsPerPage
  );

  if (costsLoading) {
    return <LoadingScreen />;
  }

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading={t('costs')}
        links={[
          { name: t('dashboard'), href: paths.dashboard.root },
          { name: t('products'), href: paths.dashboard.product.root },
          { name: product?.name || '...' },
          { name: t('costs') },
        ]}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={handleAdd}
          >
            {t('add_cost')}
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {costsEmpty ? (
        <EmptyContent
          filled
          title={t('no_costs_yet')}
          description={t('no_costs_description')}
          action={
            <Button
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={handleAdd}
              sx={{ mt: 2 }}
            >
              {t('add_cost')}
            </Button>
          }
          sx={{ py: 10 }}
        />
      ) : (
        <Card>
          <TableContainer>
            <Table>
              <TableHeadCustom
                headLabel={COST_TABLE_HEAD.map((col) => ({
                  ...col,
                  label: col.label ? t(col.label) : '',
                }))}
              />
              <TableBody>
                {dataInPage.map((cost) => (
                  <CostRow
                    key={cost.id}
                    cost={cost}
                    product={product}
                    onEdit={() => handleEdit(cost)}
                    onDelete={() => handleDeleteClick(cost.id)}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePaginationCustom
            count={costs.length}
            page={table.page}
            rowsPerPage={table.rowsPerPage}
            onPageChange={table.onChangePage}
            onRowsPerPageChange={table.onChangeRowsPerPage}
          />
        </Card>
      )}

      <CostFormDialog
        open={formDialog.value}
        onClose={formDialog.onFalse}
        productId={id}
        currentCost={editingCost}
        variants={product?.variants || []}
        optionDefinitions={product?.option_definitions || []}
        onSuccess={handleFormSuccess}
      />

      <ConfirmDialog
        open={confirmDelete.value}
        onClose={confirmDelete.onFalse}
        title={t('delete_cost')}
        content={t('confirm_delete_cost')}
        action={
          <Button variant="contained" color="error" onClick={handleDeleteConfirm}>
            {t('delete')}
          </Button>
        }
      />
    </Container>
  );
}

ProductCostsView.propTypes = {
  id: PropTypes.string.isRequired,
};

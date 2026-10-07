import PropTypes from 'prop-types';
import { useState, useCallback } from 'react';

import {
  Box,
  Button,
  Table,
  TableBody,
  TableContainer,
  Stack,
} from '@mui/material';

import { useGetProductCosts, deleteProductCost } from 'src/api/product-costs';

import { useTranslate } from 'src/locales';
import { useBoolean } from 'src/hooks/use-boolean';
import { useSnackbar } from 'src/components/snackbar';
import Iconify from 'src/components/iconify';
import EmptyContent from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { useTable, TableHeadCustom, TablePaginationCustom } from 'src/components/table';

import CostFormDialog from 'src/sections/product-costs/cost-form-dialog';
import CostRow, { COST_TABLE_HEAD } from 'src/sections/product-costs/cost-row';

export default function ProductDetailsCosts({ product }) {
  const { t } = useTranslate();
  const { enqueueSnackbar } = useSnackbar();
  const table = useTable({ defaultOrderBy: 'type' });

  const productId = String(product?.id);
  const { costs, costsLoading, costsEmpty, costsMutate } = useGetProductCosts(productId);

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
      await deleteProductCost(productId, deletingCostId);
      enqueueSnackbar(t('cost_deleted'), { variant: 'success' });
      costsMutate();
      confirmDelete.onFalse();
    } catch (err) {
      enqueueSnackbar(err.message || t('error'), { variant: 'error' });
    }
  }, [productId, deletingCostId, costsMutate, confirmDelete, enqueueSnackbar, t]);

  const handleFormSuccess = useCallback(() => {
    costsMutate();
  }, [costsMutate]);

  const dataInPage = costs.slice(
    table.page * table.rowsPerPage,
    table.page * table.rowsPerPage + table.rowsPerPage
  );

  if (costsLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          py: 5,
          '@keyframes shimmer': {
            '0%': { backgroundPosition: '-200% 0' },
            '100%': { backgroundPosition: '200% 0' },
          },
        }}
      >
        <Box
          component="span"
          sx={{
            typography: 'body2',
            fontWeight: 600,
            color: 'transparent',
            backgroundImage: (theme) =>
              `linear-gradient(90deg, ${theme.palette.text.disabled} 25%, ${theme.palette.text.secondary} 50%, ${theme.palette.text.disabled} 75%)`,
            backgroundSize: '200% 100%',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            animation: 'shimmer 1.5s ease-in-out infinite',
          }}
        >
          {t('loading')}...
        </Box>
      </Box>
    );
  }

  return (
    <>
      <Stack direction="row" justifyContent="flex-end" sx={{ px: 3, pt: 2, pb: 1 }}>
        <Button
          size="small"
          variant="contained"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={handleAdd}
        >
          {t('add_cost')}
        </Button>
      </Stack>

      {costsEmpty ? (
        <EmptyContent
          title={t('no_costs_yet')}
          description={t('no_costs_description')}
          action={
            <Button
              variant="contained"
              size="small"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={handleAdd}
              sx={{ mt: 2 }}
            >
              {t('add_cost')}
            </Button>
          }
          sx={{ py: 5 }}
        />
      ) : (
        <>
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
        </>
      )}

      <CostFormDialog
        open={formDialog.value}
        onClose={formDialog.onFalse}
        productId={productId}
        currentCost={editingCost}
        variants={product?.variants || []}
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
    </>
  );
}

ProductDetailsCosts.propTypes = {
  product: PropTypes.object.isRequired,
};

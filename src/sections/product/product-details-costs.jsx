import PropTypes from 'prop-types';
import { useState, useCallback } from 'react';

import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  IconButton,
  MenuItem,
  Tooltip,
  Typography,
  Stack,
} from '@mui/material';

import { useGetProductCosts, deleteProductCost } from 'src/api/product-costs';

import { useTranslate } from 'src/locales';
import { useBoolean } from 'src/hooks/use-boolean';
import { useSnackbar } from 'src/components/snackbar';
import Iconify from 'src/components/iconify';
import EmptyContent from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog';
import CustomPopover, { usePopover } from 'src/components/custom-popover';
import { useTable, TableHeadCustom, TablePaginationCustom } from 'src/components/table';
import Label from 'src/components/label';

import CostFormDialog from 'src/sections/product-costs/cost-form-dialog';
import CostTypeBadge from 'src/sections/product-costs/cost-type-badge';
import { getChannelConfig } from 'src/sections/product-costs/constants';

const TABLE_HEAD = [
  { id: 'type', label: 'cost_type' },
  { id: 'scope', label: 'scope' },
  { id: 'amount', label: 'amount' },
  { id: 'details', label: 'details' },
  { id: 'notes', label: 'notes' },
  { id: 'actions', label: '', width: 50 },
];

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
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
        <Typography variant="body2" color="text.secondary">
          {t('loading')}...
        </Typography>
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
                headLabel={TABLE_HEAD.map((col) => ({
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

function CostRow({ cost, product, onEdit, onDelete }) {
  const { t } = useTranslate();
  const popover = usePopover();

  const variant = cost.variant_id
    ? product?.variants?.find((v) => v.id === cost.variant_id)
    : null;

  const renderDetails = () => {
    const parts = [];

    if (cost.type === 'marketing') {
      if (cost.campaign_name) parts.push(cost.campaign_name);
      if (cost.channel) {
        const ch = getChannelConfig(cost.channel);
        parts.push(t(ch.labelKey));
      }
    }

    if (cost.type === 'custom' && cost.custom_type_name) {
      parts.push(cost.custom_type_name);
    }

    if (variant) {
      parts.push(variant.name || variant.title || `#${variant.id}`);
    }

    return parts.join(' · ') || '—';
  };

  return (
    <>
      <TableRow hover>
        <TableCell>
          <CostTypeBadge type={cost.type} customTypeName={cost.custom_type_name} />
        </TableCell>

        <TableCell>
          <Label variant="soft" color={cost.scope === 'per_unit' ? 'info' : 'warning'}>
            {t(cost.scope === 'per_unit' ? 'scope_per_unit' : 'scope_global')}
          </Label>
        </TableCell>

        <TableCell>
          <Typography variant="body2" fontWeight={600}>
            {Number(cost.amount).toLocaleString('fr-DZ', { minimumFractionDigits: 2 })} DA
          </Typography>
        </TableCell>

        <TableCell>
          <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
            {renderDetails()}
          </Typography>
        </TableCell>

        <TableCell>
          {cost.notes ? (
            <Tooltip title={cost.notes}>
              <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 150 }}>
                {cost.notes}
              </Typography>
            </Tooltip>
          ) : (
            '—'
          )}
        </TableCell>

        <TableCell align="right">
          <IconButton onClick={popover.onOpen}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>
      </TableRow>

      <CustomPopover
        open={popover.open}
        onClose={popover.onClose}
        arrow="right-top"
      >
        <MenuItem
          onClick={() => {
            popover.onClose();
            onEdit();
          }}
        >
          <Iconify icon="solar:pen-bold" />
          {t('edit')}
        </MenuItem>

        <MenuItem
          onClick={() => {
            popover.onClose();
            onDelete();
          }}
          sx={{ color: 'error.main' }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" />
          {t('delete')}
        </MenuItem>
      </CustomPopover>
    </>
  );
}

CostRow.propTypes = {
  cost: PropTypes.object.isRequired,
  product: PropTypes.object,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

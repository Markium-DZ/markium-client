import { useState } from 'react';
import PropTypes from 'prop-types';

import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';

import { useTranslate } from 'src/locales';
import { adjustInventoryQuantity } from 'src/api/inventory';
import { useSnackbar } from 'src/components/snackbar';

// ----------------------------------------------------------------------

export default function InventoryAdjustmentDialog({ open, onClose, inventoryItem, onSuccess }) {
  const { t } = useTranslate();
  const { enqueueSnackbar } = useSnackbar();

  const [quantity, setQuantity] = useState('');
  const [type, setType] = useState('restock');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!quantity || quantity <= 0) {
      enqueueSnackbar(t('please_enter_valid_quantity'), { variant: 'error' });
      return;
    }

    try {
      setSubmitting(true);
      await adjustInventoryQuantity(inventoryItem.id, {
        quantity: parseInt(quantity, 10),
        type,
        notes,
      });

      enqueueSnackbar(t('inventory_adjusted_successfully'), { variant: 'success' });

      // Reset form
      setQuantity('');
      setType('restock');
      setNotes('');

      if (onSuccess) {
        await onSuccess();
      }

      onClose();
    } catch (error) {
      console.error('Failed to adjust inventory:', error);
      enqueueSnackbar(error.message || t('failed_to_adjust_inventory'), { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setQuantity('');
      setType('restock');
      setNotes('');
      onClose();
    }
  };

  const calculateNewQuantity = () => {
    const currentQty = inventoryItem?.quantity || 0;
    const adjustQty = parseInt(quantity, 10) || 0;

    // Types that increase quantity: restock, return
    if (type === 'restock' || type === 'return') {
      return currentQty + adjustQty;
    }
    // Types that decrease quantity: damage, loss, adjustment (can be negative)
    return Math.max(0, currentQty - adjustQty);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('adjust_inventory')}</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          {inventoryItem && (
            <Alert severity="info">
              <Typography variant="body2">
                <strong>{inventoryItem.product?.name}</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('current_quantity')}: {inventoryItem.quantity}
              </Typography>
            </Alert>
          )}

          <TextField
            select
            fullWidth
            label={t('adjustment_type')}
            value={type}
            onChange={(e) => setType(e.target.value)}
            disabled={submitting}
          >
            <MenuItem value="restock">{t('restock')}</MenuItem>
            <MenuItem value="adjustment">{t('adjustment')}</MenuItem>
            <MenuItem value="damage">{t('damage')}</MenuItem>
            <MenuItem value="loss">{t('loss')}</MenuItem>
            <MenuItem value="return">{t('return')}</MenuItem>
          </TextField>

          <TextField
            fullWidth
            type="number"
            label={t('quantity')}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            disabled={submitting}
            inputProps={{ min: 1 }}
            helperText={
              quantity && inventoryItem
                ? `${t('new_quantity')}: ${calculateNewQuantity()}`
                : ''
            }
          />

          <TextField
            fullWidth
            multiline
            rows={3}
            label={t('notes')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={submitting}
            placeholder={t('adjustment_notes_placeholder')}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>
          {t('cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting || !quantity}
        >
          {submitting ? t('adjusting') : t('adjust')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

InventoryAdjustmentDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  inventoryItem: PropTypes.object,
  onSuccess: PropTypes.func,
};

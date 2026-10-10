import { useState } from 'react';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import ToggleButton from '@mui/material/ToggleButton';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import useMediaQuery from '@mui/material/useMediaQuery';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import showError from 'src/utils/show_error';

import { useTranslate } from 'src/locales';
import { adjustInventoryQuantity } from 'src/api/inventory';

import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';

// ----------------------------------------------------------------------

// Backend contract (POST /inventory/{id}/adjust):
//   add    → quantity 1..10000,  type restock|return            → +quantity
//   remove → quantity 1..10000,  type damage|loss|adjustment    → −quantity
//   set    → quantity 0..100000 (new on-hand), type adjustment  → quantity − current
const MODES = {
  add: { icon: 'mingcute:add-line', types: ['restock', 'return'], defaultType: 'restock', min: 1, max: 10000 },
  remove: { icon: 'eva:minus-fill', types: ['damage', 'loss', 'adjustment'], defaultType: 'adjustment', min: 1, max: 10000 },
  set: { icon: 'solar:pen-bold', types: ['adjustment'], defaultType: 'adjustment', min: 0, max: 100000 },
};

export default function InventoryAdjustmentDialog({ open, onClose, inventoryItem, onSuccess }) {
  const { t } = useTranslate();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [mode, setMode] = useState('add');
  const [quantity, setQuantity] = useState('');
  const [type, setType] = useState(MODES.add.defaultType);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const config = MODES[mode];
  const current = Number(inventoryItem?.quantity) || 0;
  const reserved = Number(inventoryItem?.reserved_quantity) || 0;

  const hasInput = quantity !== '' && quantity !== null;
  const qty = hasInput ? Number(quantity) : NaN;
  const qtyValid = Number.isInteger(qty) && qty >= config.min && qty <= config.max;

  let newQuantity = current;
  if (qtyValid) {
    if (mode === 'add') newQuantity = current + qty;
    else if (mode === 'remove') newQuantity = current - qty;
    else newQuantity = qty;
  }
  const delta = newQuantity - current;

  // Validation message (null = OK to submit)
  let error = null;
  if (hasInput && !qtyValid) {
    error = t('inventory_adjust.invalid_quantity', { min: config.min, max: config.max });
  } else if (qtyValid && newQuantity < 0) {
    error = t('inventory_adjust.below_zero');
  } else if (qtyValid && newQuantity < reserved) {
    error = t('inventory_adjust.below_reserved', { reserved });
  } else if (qtyValid && mode === 'set' && delta === 0) {
    error = t('inventory_adjust.no_change');
  }

  const canSubmit = qtyValid && !error && !submitting;

  const reset = () => {
    setMode('add');
    setQuantity('');
    setType(MODES.add.defaultType);
    setNotes('');
  };

  const handleChangeMode = (_event, value) => {
    if (!value) return;
    setMode(value);
    setType(MODES[value].defaultType);
    setQuantity('');
  };

  const handleSubmit = async () => {
    if (!canSubmit || !inventoryItem) return;

    try {
      setSubmitting(true);
      await adjustInventoryQuantity(inventoryItem.id, {
        mode,
        quantity: qty,
        type: mode === 'set' ? 'adjustment' : type,
        notes: notes || undefined,
      });

      enqueueSnackbar(t('inventory_adjust.success'), { variant: 'success' });

      reset();

      if (onSuccess) {
        await onSuccess();
      }

      onClose();
    } catch (err) {
      showError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      reset();
      onClose();
    }
  };

  const deltaColor = (() => {
    if (delta > 0) return 'success.main';
    if (delta < 0) return 'error.main';
    return 'text.secondary';
  })();

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth fullScreen={isMobile}>
      <DialogTitle>{t('inventory_adjust.title')}</DialogTitle>

      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {inventoryItem && (
            <Box>
              <Typography variant="subtitle2" noWrap>
                {inventoryItem.product?.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('inventory_adjust.current')}: {current}
                {reserved > 0 && ` · ${t('inventory_adjust.reserved')}: ${reserved}`}
              </Typography>
            </Box>
          )}

          <ToggleButtonGroup
            exclusive
            fullWidth
            size="small"
            color="primary"
            value={mode}
            onChange={handleChangeMode}
            disabled={submitting}
          >
            {Object.keys(MODES).map((key) => (
              <ToggleButton key={key} value={key} sx={{ gap: 0.75, py: 1 }}>
                <Iconify icon={MODES[key].icon} width={18} />
                {t(`inventory_adjust.mode_${key}`)}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          {mode !== 'set' && (
            <TextField
              select
              fullWidth
              label={t('inventory_adjust.type_label')}
              value={type}
              onChange={(e) => setType(e.target.value)}
              disabled={submitting}
            >
              {config.types.map((option) => (
                <MenuItem key={option} value={option}>
                  {t(`inventory_adjust.type_${option}`)}
                </MenuItem>
              ))}
            </TextField>
          )}

          <TextField
            fullWidth
            autoFocus={!isMobile}
            type="number"
            label={mode === 'set' ? t('inventory_adjust.new') : t('quantity')}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            disabled={submitting}
            error={!!error}
            helperText={error || (mode === 'set' ? t('inventory_adjust.set_helper') : '')}
            inputProps={{ min: config.min, max: config.max, step: 1, inputMode: 'numeric' }}
          />

          {/* Live preview: current → new */}
          <Box
            sx={{
              p: 2,
              borderRadius: 1.5,
              bgcolor: 'background.neutral',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: 1.5,
            }}
          >
            <Stack alignItems="center">
              <Typography variant="caption" color="text.secondary">
                {t('inventory_adjust.current')}
              </Typography>
              <Typography variant="h5">{current}</Typography>
            </Stack>

            <Iconify
              icon="eva:arrow-forward-fill"
              width={22}
              sx={{ color: 'text.disabled', transform: theme.direction === 'rtl' ? 'scaleX(-1)' : 'none' }}
            />

            <Stack alignItems="center">
              <Typography variant="caption" color="text.secondary">
                {t('inventory_adjust.new')}
              </Typography>
              <Typography variant="h5" sx={{ color: error ? 'error.main' : 'text.primary' }}>
                {qtyValid ? newQuantity : '—'}
              </Typography>
            </Stack>

            {qtyValid && delta !== 0 && (
              <Typography variant="subtitle2" sx={{ color: deltaColor }} dir="ltr">
                ({delta > 0 ? `+${delta}` : delta})
              </Typography>
            )}
          </Box>

          {reserved > 0 && mode !== 'add' && !error && (
            <Alert severity="info" variant="outlined" sx={{ py: 0 }}>
              {t('inventory_adjust.reserved_hint', { reserved })}
            </Alert>
          )}

          <TextField
            fullWidth
            multiline
            rows={2}
            label={t('notes')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={submitting}
            placeholder={t('inventory_adjust.notes_placeholder')}
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={handleClose} disabled={submitting}>
          {t('cancel')}
        </Button>
        <LoadingButton variant="contained" onClick={handleSubmit} loading={submitting} disabled={!canSubmit}>
          {t('inventory_adjust.save')}
        </LoadingButton>
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

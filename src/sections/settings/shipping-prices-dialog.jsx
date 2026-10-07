import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import InputAdornment from '@mui/material/InputAdornment';

import { useTranslate } from 'src/locales';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export const MAX_PRICE = 100000;

const isNil = (value) => value === null || value === undefined;

function validatePrice(value, t) {
  if (value === '' || value === null || value === undefined) {
    return t('shipping_prices_price_required');
  }
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || number > MAX_PRICE) {
    return t('shipping_prices_price_invalid');
  }
  return '';
}

// ----------------------------------------------------------------------

export default function ShippingPricesDialog({
  open,
  onClose,
  onSubmit,
  count,
  communeName,
  initialHome,
  initialDesk,
}) {
  const { t } = useTranslate();

  const [home, setHome] = useState('');
  const [desk, setDesk] = useState('');
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Reset / prefill every time the dialog opens
  useEffect(() => {
    if (open) {
      setHome(isNil(initialHome) ? '' : String(initialHome));
      setDesk(isNil(initialDesk) ? '' : String(initialDesk));
      setTouched(false);
      setSubmitting(false);
    }
  }, [open, initialHome, initialDesk]);

  const homeError = touched ? validatePrice(home, t) : '';
  const deskError = touched ? validatePrice(desk, t) : '';

  const handleSubmit = async (event) => {
    event?.preventDefault();
    setTouched(true);
    if (validatePrice(home, t) || validatePrice(desk, t)) return;

    setSubmitting(true);
    try {
      await onSubmit({ home_price: Number(home), desk_price: Number(desk) });
    } finally {
      setSubmitting(false);
    }
  };

  const currency = t('currency_symbol');

  return (
    <Dialog
      fullWidth
      maxWidth="xs"
      open={open}
      onClose={submitting ? undefined : onClose}
      PaperProps={{ component: 'form', onSubmit: handleSubmit, noValidate: true }}
    >
      <DialogTitle sx={{ pb: 1 }}>{t('shipping_prices_dialog_title')}</DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          {communeName
            ? t('shipping_prices_dialog_applies_to_one', { name: communeName })
            : t('shipping_prices_dialog_applies_to', { count })}
        </Typography>

        <Stack spacing={2.5}>
          <TextField
            autoFocus
            fullWidth
            type="number"
            label={t('shipping_prices_home_price')}
            value={home}
            onChange={(e) => setHome(e.target.value)}
            error={!!homeError}
            helperText={homeError || ' '}
            inputProps={{ min: 0, max: MAX_PRICE, step: 'any', inputMode: 'decimal' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="solar:home-2-bold-duotone" width={20} />
                </InputAdornment>
              ),
              endAdornment: <InputAdornment position="end">{currency}</InputAdornment>,
            }}
          />

          <TextField
            fullWidth
            type="number"
            label={t('shipping_prices_desk_price')}
            value={desk}
            onChange={(e) => setDesk(e.target.value)}
            error={!!deskError}
            helperText={deskError || ' '}
            inputProps={{ min: 0, max: MAX_PRICE, step: 'any', inputMode: 'decimal' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="solar:shop-2-bold-duotone" width={20} />
                </InputAdornment>
              ),
              endAdornment: <InputAdornment position="end">{currency}</InputAdornment>,
            }}
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={onClose} disabled={submitting}>
          {t('cancel')}
        </Button>
        <LoadingButton type="submit" variant="contained" loading={submitting}>
          {t('save')}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}

ShippingPricesDialog.propTypes = {
  communeName: PropTypes.string,
  count: PropTypes.number,
  initialDesk: PropTypes.number,
  initialHome: PropTypes.number,
  onClose: PropTypes.func,
  onSubmit: PropTypes.func,
  open: PropTypes.bool,
};

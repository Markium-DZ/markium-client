import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';

import { fCurrency } from 'src/utils/format-number';

// ----------------------------------------------------------------------

export default function SubscriptionSummary({
  selectedPackage,
  paymentMethod,
  loading,
  onCheckout,
  sx,
  ...other
}) {
  const { t } = useTranslate();

  const renderPrice = selectedPackage && (
    <Stack direction="row" justifyContent="flex-end" alignItems="baseline">
      <Typography variant="h2">
        {fCurrency(selectedPackage.price)}
      </Typography>

      <Typography
        component="span"
        sx={{
          alignSelf: 'center',
          color: 'text.disabled',
          ml: 1,
          typography: 'body2',
        }}
      >
        {selectedPackage.currency?.toUpperCase() || 'DZD'}
        {selectedPackage.billing_cycle && ` / ${t(selectedPackage.billing_cycle)}`}
      </Typography>
    </Stack>
  );

  const canCheckout = selectedPackage && paymentMethod;

  return (
    <Box
      sx={{
        p: 5,
        borderRadius: 2,
        bgcolor: 'background.neutral',
        ...sx,
      }}
      {...other}
    >
      <Typography variant="h6" sx={{ mb: 5 }}>
        {t('summary')}
      </Typography>

      <Stack spacing={2.5}>
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('subscription')}
          </Typography>

          {selectedPackage ? (
            <Label color="primary">{selectedPackage.name}</Label>
          ) : (
            <Typography variant="body2" sx={{ color: 'text.disabled' }}>
              {t('select_package')}
            </Typography>
          )}
        </Stack>

        <Stack direction="row" justifyContent="space-between">
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('payment_method')}
          </Typography>

          {paymentMethod ? (
            <Label color="info">{paymentMethod.toUpperCase()}</Label>
          ) : (
            <Typography variant="body2" sx={{ color: 'text.disabled' }}>
              {t('select_payment_method')}
            </Typography>
          )}
        </Stack>

        {renderPrice}

        <Divider sx={{ borderStyle: 'dashed' }} />

        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="subtitle1">{t('total')}</Typography>

          <Typography variant="subtitle1">
            {selectedPackage ? `${fCurrency(selectedPackage.price)} ${selectedPackage.currency?.toUpperCase() || 'DZD'}` : '-'}
          </Typography>
        </Stack>

        <Divider sx={{ borderStyle: 'dashed' }} />
      </Stack>

      <Button
        fullWidth
        size="large"
        variant="contained"
        disabled={!canCheckout || loading}
        onClick={onCheckout}
        sx={{ mt: 5, mb: 3 }}
      >
        {loading ? (
          <CircularProgress size={24} color="inherit" />
        ) : (
          t('proceed_to_payment')
        )}
      </Button>

      <Stack alignItems="center" spacing={1}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Iconify icon="solar:shield-check-bold" sx={{ color: 'success.main' }} />
          <Typography variant="subtitle2">{t('secure_payment')}</Typography>
        </Stack>

        <Typography variant="caption" sx={{ color: 'text.disabled', textAlign: 'center' }}>
          {t('secure_payment_description')}
        </Typography>
      </Stack>
    </Box>
  );
}

SubscriptionSummary.propTypes = {
  selectedPackage: PropTypes.object,
  paymentMethod: PropTypes.string,
  loading: PropTypes.bool,
  onCheckout: PropTypes.func,
  sx: PropTypes.object,
};

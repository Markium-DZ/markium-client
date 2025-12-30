import * as Yup from 'yup';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import Button from '@mui/material/Button';
import Grid from '@mui/material/Unstable_Grid2';
import LoadingButton from '@mui/lab/LoadingButton';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';

import Iconify from 'src/components/iconify';
import FormProvider from 'src/components/hook-form';
import { useTranslate } from 'src/locales';
import { useGetEnabledPaymentMethods } from 'src/api/payment';

import { useCheckoutContext } from './context';
import CheckoutSummary from './checkout-summary';
import CheckoutDelivery from './checkout-delivery';
import CheckoutBillingInfo from './checkout-billing-info';
import CheckoutPaymentMethods from './checkout-payment-methods';

// ----------------------------------------------------------------------

const DELIVERY_OPTIONS = [
  {
    value: 0,
    label: 'Free',
    description: '5-7 Days delivery',
  },
  {
    value: 10,
    label: 'Standard',
    description: '3-5 Days delivery',
  },
  {
    value: 20,
    label: 'Express',
    description: '2-3 Days delivery',
  },
];

const CARDS_OPTIONS = [
  { value: 'ViSa1', label: '**** **** **** 1212 - Jimmy Holland' },
  { value: 'ViSa2', label: '**** **** **** 2424 - Shawn Stokes' },
  { value: 'MasterCard', label: '**** **** **** 4545 - Cole Armstrong' },
];

// Payment method mapping for icons
const PAYMENT_ICONS = {
  credit_card: ['logos:mastercard', 'logos:visa'],
  mada: ['logos:mastercard'], // Mada uses Mastercard network
  bank: ['solar:bank-bold'],
  cod: ['solar:wad-of-money-bold'],
  subscription: ['solar:restart-bold'],
};

export default function CheckoutPayment() {
  const checkout = useCheckoutContext();
  const { t } = useTranslate();

  // Fetch enabled payment methods from API
  const { paymentMethods, paymentMethodsLoading, paymentMethodsError } = useGetEnabledPaymentMethods();

  // Transform API payment methods to component format
  const paymentOptions = useMemo(() => {
    return paymentMethods.map((connection) => {
      const providerIdentifier = connection.provider?.identifier || '';
      const providerName = connection.provider?.name || connection.name;

      return {
        value: providerIdentifier,
        label: providerName,
        description: connection.provider?.description || t(`${providerIdentifier}_description`),
        icons: PAYMENT_ICONS[providerIdentifier] || ['solar:card-bold'],
      };
    });
  }, [paymentMethods, t]);

  const PaymentSchema = Yup.object().shape({
    payment: Yup.string().required('Payment is required'),
  });

  const defaultValues = {
    delivery: checkout.shipping,
    payment: '',
  };

  const methods = useForm({
    resolver: yupResolver(PaymentSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      checkout.onNextStep();
      checkout.onReset();
      console.info('DATA', data);
    } catch (error) {
      console.error(error);
    }
  });

  // Show loading state
  if (paymentMethodsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  // Show error state
  if (paymentMethodsError) {
    return (
      <Alert severity="error">
        <Typography variant="body2">
          {t('error_loading_payment_methods')}
        </Typography>
      </Alert>
    );
  }

  // Show empty state
  if (!paymentOptions || paymentOptions.length === 0) {
    return (
      <Alert severity="warning">
        <Typography variant="body2">
          {t('no_payment_methods_configured')}
        </Typography>
      </Alert>
    );
  }

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid xs={12} md={8}>
          <CheckoutDelivery onApplyShipping={checkout.onApplyShipping} options={DELIVERY_OPTIONS} />

          <CheckoutPaymentMethods
            cardOptions={CARDS_OPTIONS}
            options={paymentOptions}
            sx={{ my: 3 }}
          />

          <Button
            size="small"
            color="inherit"
            onClick={checkout.onBackStep}
            startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
          >
            {t('back')}
          </Button>
        </Grid>

        <Grid xs={12} md={4}>
          <CheckoutBillingInfo billing={checkout.billing} onBackStep={checkout.onBackStep} />

          <CheckoutSummary
            total={checkout.total}
            subTotal={checkout.subTotal}
            discount={checkout.discount}
            shipping={checkout.shipping}
            onEdit={() => checkout.onGotoStep(0)}
          />

          <LoadingButton
            fullWidth
            size="large"
            type="submit"
            variant="contained"
            loading={isSubmitting}
          >
            {t('complete_order')}
          </LoadingButton>
        </Grid>
      </Grid>
    </FormProvider>
  );
}

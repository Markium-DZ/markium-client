import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';

import { useTranslate } from 'src/locales';

import { useSnackbar } from 'src/components/snackbar';
import FormProvider, {
  RHFTextField,
  RHFSelect,
} from 'src/components/hook-form';
import showError from 'src/utils/show_error';
import VerificationGate from 'src/components/verification-gate/verification-gate';

// ----------------------------------------------------------------------

export default function SystemPointsForm() {
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslate();

  const [loading, setLoading] = useState(false);

  // TODO: Fetch current points data from API
  const currentPointsData = {
    available_points: 150,
    used_points: 50,
    total_points_purchased: 200,
    points_per_product: 1,
    last_purchase_date: '2024-01-15',
    next_reset_date: '2025-01-01',
  };

  const BuyPointsSchema = Yup.object().shape({
    points_package: Yup.string().required(t('points_package_is_required')),
    payment_method: Yup.string().required(t('payment_method_is_required')),
  });

  const defaultValues = useMemo(
    () => ({
      points_package: '100',
      payment_method: 'credit_card',
    }),
    []
  );

  const methods = useForm({
    resolver: yupResolver(BuyPointsSchema),
    defaultValues,
  });

  const {
    watch,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const values = watch();

  const onSubmit = handleSubmit(async (data) => {
    try {
      setLoading(true);

      // TODO: Implement API call to purchase points
      console.log('Points purchase data:', data);

      // Simulated API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      enqueueSnackbar(t('points_purchased_successfully'), { variant: 'success' });
      setLoading(false);
    } catch (error) {
      setLoading(false);
      showError(error);
    }
  });

  const pointsPackages = [
    { value: '50', label: t('points_package_50'), price: 25, bonus: 0 },
    { value: '100', label: t('points_package_100'), price: 45, bonus: 10 },
    { value: '250', label: t('points_package_250'), price: 100, bonus: 25 },
    { value: '500', label: t('points_package_500'), price: 180, bonus: 50 },
    { value: '1000', label: t('points_package_1000'), price: 320, bonus: 100 },
  ];

  const selectedPackage = pointsPackages.find((pkg) => pkg.value === values.points_package);

  const calculateTotalPrice = () => {
    if (!selectedPackage) return 0;
    return selectedPackage.price;
  };

  const calculateTotalPoints = () => {
    if (!selectedPackage) return 0;
    return parseInt(selectedPackage.value) + selectedPackage.bonus;
  };

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        {/* Current Points Status */}
        <Grid xs={12}>
          <Alert severity="info" icon={false}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" spacing={2}>
              <Box>
                <AlertTitle>{t('current_points_status')}</AlertTitle>
                <Typography variant="body2">
                  {t('available_points')}: <strong>{currentPointsData.available_points}</strong> | 
                  {t('used_points')}: <strong>{currentPointsData.used_points}</strong> | 
                  {t('total_purchased')}: <strong>{currentPointsData.total_points_purchased}</strong>
                </Typography>
              </Box>
              <Box>
                <Chip 
                  label={`${currentPointsData.available_points} ${t('points_available')}`} 
                  color="success" 
                  size="small" 
                />
              </Box>
            </Stack>
          </Alert>
        </Grid>

        {/* Points Information */}
        <Grid xs={12}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              {t('points_system_information')}
            </Typography>

            <Stack spacing={3}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2">{t('points_per_product')}:</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {currentPointsData.points_per_product} {t('point')}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2">{t('last_purchase_date')}:</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {currentPointsData.last_purchase_date}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2">{t('next_reset_date')}:</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {currentPointsData.next_reset_date}
                </Typography>
              </Box>

              <Divider />

              <Alert severity="warning">
                <Typography variant="body2">
                  {t('points_reset_warning')}
                </Typography>
              </Alert>
            </Stack>
          </Card>
        </Grid>

        {/* Buy Points Section */}
        <Grid xs={12}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              {t('buy_points')}
            </Typography>

            <Stack spacing={3}>
              <RHFSelect name="points_package" label={t('select_points_package')}>
                {pointsPackages.map((pkg) => (
                  <option key={pkg.value} value={pkg.value}>
                    {pkg.label} - ${pkg.price}
                    {pkg.bonus > 0 && ` (+${pkg.bonus} ${t('bonus_points')})`}
                  </option>
                ))}
              </RHFSelect>

              <RHFSelect name="payment_method" label={t('payment_method')}>
                <option value="credit_card">{t('credit_card')}</option>
                <option value="paypal">{t('paypal')}</option>
                <option value="bank_transfer">{t('bank_transfer')}</option>
              </RHFSelect>

              {/* Purchase Summary */}
              <Card sx={{ p: 2, bgcolor: 'background.neutral' }}>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">{t('package')}:</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {selectedPackage?.label}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">{t('base_points')}:</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {selectedPackage?.value} {t('points')}
                    </Typography>
                  </Box>
                  {selectedPackage?.bonus > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="success.main">
                        {t('bonus_points')}:
                      </Typography>
                      <Typography variant="body2" color="success.main" fontWeight="medium">
                        +{selectedPackage.bonus} {t('points')}
                      </Typography>
                    </Box>
                  )}
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      pt: 1,
                      borderTop: (theme) => `dashed 1px ${theme.palette.divider}`,
                    }}
                  >
                    <Typography variant="subtitle1">{t('total_points')}:</Typography>
                    <Typography variant="h6" color="primary.main">
                      {calculateTotalPoints()} {t('points')}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      pt: 1,
                      borderTop: (theme) => `dashed 1px ${theme.palette.divider}`,
                    }}
                  >
                    <Typography variant="subtitle1">{t('total_price')}:</Typography>
                    <Typography variant="h6" color="primary.main">
                      ${calculateTotalPrice()}
                    </Typography>
                  </Box>
                </Stack>
              </Card>
            </Stack>
          </Card>
        </Grid>

        {/* Actions */}
        <Grid xs={12}>
          <Stack direction="row" justifyContent="flex-end" spacing={2}>
            <Button variant="outlined" size="large">
              {t('view_transaction_history')}
            </Button>
            <VerificationGate>
              <LoadingButton
                type="submit"
                variant="contained"
                size="large"
                loading={isSubmitting || loading}
              >
                {t('purchase_points')}
              </LoadingButton>
            </VerificationGate>
          </Stack>
        </Grid>
      </Grid>
    </FormProvider>
  );
}
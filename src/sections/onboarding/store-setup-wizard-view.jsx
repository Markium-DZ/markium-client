import { useState, useEffect, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import Step from '@mui/material/Step';
import Stepper from '@mui/material/Stepper';
import StepLabel from '@mui/material/StepLabel';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

import axios, { endpoints } from 'src/utils/axios';
import { useAuthContext } from 'src/auth/hooks';
import { useTranslation } from 'react-i18next';

import StoreSetupBasics from './store-setup-basics';
import StoreSetupBranding from './store-setup-branding';
import StoreSetupCategories from './store-setup-categories';

// ----------------------------------------------------------------------

const STEPS = ['store_basics', 'branding', 'product_categories'];

// ----------------------------------------------------------------------

export default function StoreSetupWizardView() {
  const { refreshUser } = useAuthContext();
  const { t } = useTranslation();

  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch setup status to resume at correct step
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await axios.get(endpoints.storeSetup.status);
        const status = response.data.data;

        const stepMap = { basics: 0, branding: 1, categories: 2, complete: 2 };
        const step = stepMap[status.current_step] ?? 0;
        setActiveStep(step);

        // If already complete, refresh user so guard redirects to dashboard
        if (status.is_complete) {
          await refreshUser();
        }
      } catch (error) {
        // If 404 or no status, start from step 0
        console.error('Failed to fetch setup status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [refreshUser]);

  const handleNext = useCallback(() => {
    setActiveStep((prev) => prev + 1);
  }, []);

  const handleComplete = useCallback(async () => {
    await refreshUser();
  }, [refreshUser]);

  if (loading) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ py: 10 }}>
        <CircularProgress />
      </Stack>
    );
  }

  return (
    <Stack spacing={4}>
      <Stack spacing={1} sx={{ textAlign: 'center' }}>
        <Typography variant="h4">
          {t('setup_your_store')}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('setup_your_store_description')}
        </Typography>
      </Stack>

      <Stepper activeStep={activeStep} alternativeLabel>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{t(label)}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box sx={{ mt: 3 }}>
        {activeStep === 0 && (
          <StoreSetupBasics onNext={handleNext} />
        )}
        {activeStep === 1 && (
          <StoreSetupBranding onNext={handleNext} />
        )}
        {activeStep === 2 && (
          <StoreSetupCategories onComplete={handleComplete} />
        )}
      </Box>
    </Stack>
  );
}

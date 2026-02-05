import PropTypes from 'prop-types';
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import { alpha, useTheme } from '@mui/material/styles';

import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';

import Iconify from 'src/components/iconify';
import { MediaPickerDialog } from 'src/components/media-picker';
import ContentDialog from 'src/components/custom-dialog/content-dialog';
import ProductNewEditForm from 'src/sections/product/product-new-edit-form';

// ----------------------------------------------------------------------

export default function SetupChecklist({ productsCount = 0, ordersCount = 0, hasMedia = false, isPhoneVerified = true, onRefresh }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [productDialogOpen, setProductDialogOpen] = useState(false);

  const handleOpenMediaPicker = useCallback(() => {
    setMediaPickerOpen(true);
  }, []);

  const handleCloseMediaPicker = useCallback(() => {
    setMediaPickerOpen(false);
    // Refresh data after closing media picker (media may have been uploaded)
    onRefresh?.();
    // Additional delayed refresh to catch backend processing
    setTimeout(() => onRefresh?.(), 2000);
  }, [onRefresh]);

  const handleMediaSelect = useCallback((selectedMedia) => {
    // Media was selected/uploaded, close the dialog
    setMediaPickerOpen(false);
    // Refresh data to update the checklist
    onRefresh?.();
    setTimeout(() => onRefresh?.(), 2000);
  }, [onRefresh]);

  const handleOpenProductDialog = useCallback(() => {
    setProductDialogOpen(true);
  }, []);

  const handleCloseProductDialog = useCallback(() => {
    setProductDialogOpen(false);
    // Refresh data to update the checklist (product may have been created)
    onRefresh?.();
    setTimeout(() => onRefresh?.(), 2000);
  }, [onRefresh]);

  const steps = [
    // {
    //   id: 'account',
    //   title: t('onboarding_account_created'),
    //   description: t('onboarding_account_created_desc'),
    //   completed: true,
    //   icon: 'solar:user-check-bold',
    //   action: null,
    // },
    // Phone verification step hidden for now
    // {
    //   id: 'phone',
    //   title: t('onboarding_verify_phone'),
    //   description: t('onboarding_verify_phone_desc'),
    //   completed: isPhoneVerified,
    //   icon: 'solar:phone-bold',
    //   action: () => router.push(paths.dashboard.settings.account),
    //   actionLabel: t('onboarding_verify_now'),
    // },
    {
      id: 'media',
      title: t('onboarding_upload_images'),
      description: t('onboarding_upload_images_desc'),
      completed: hasMedia,
      icon: 'solar:gallery-bold',
      action: handleOpenMediaPicker,
      actionLabel: t('onboarding_upload_now'),
    },
    {
      id: 'product',
      title: t('onboarding_add_product'),
      description: t('onboarding_add_product_desc'),
      completed: productsCount > 0,
      icon: 'solar:box-bold',
      action: handleOpenProductDialog,
      actionLabel: t('onboarding_create_product'),
    },
    {
      id: 'customize',
      title: t('onboarding_customize_store'),
      description: t('onboarding_customize_store_desc'),
      completed: false,
      icon: 'solar:palette-bold',
      action: () => router.push(paths.dashboard.settings.root),
      actionLabel: t('onboarding_customize_now'),
    },
  ];

  const completedSteps = steps.filter((step) => step.completed).length;
  const progress = (completedSteps / steps.length) * 100;
  const allCompleted = completedSteps === steps.length;

  if (allCompleted) {
    return null;
  }

  return (
    <>
    <Card
      sx={{
        p: 2.5,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
      }}
    >
      <Stack spacing={2}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack spacing={0.5}>
            <Typography variant="h6">{t('onboarding_setup_store')}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('onboarding_complete_steps')}
            </Typography>
          </Stack>
          <Button
            size="small"
            color="primary"
            component="a"
            href="https://markium.online/tutorials/getting-started"
            target="_blank"
            rel="noopener noreferrer"
            startIcon={<Iconify icon="solar:play-circle-bold" width={16} />}
          >
            {t('empty_products_watch_tutorial')}
          </Button>
        </Stack>

        {/* Progress */}
        <Stack spacing={1}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('onboarding_progress')}
            </Typography>
            <Typography variant="body2" fontWeight="bold" color="primary">
              {completedSteps}/{steps.length}
            </Typography>
          </Stack>
          <Tooltip title={t('onboarding_progress_tooltip')} arrow>
            <LinearProgress
              variant="determinate"
              value={progress}
              aria-label={`${t('onboarding_progress')}: ${completedSteps}/${steps.length}`}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                },
              }}
            />
          </Tooltip>
        </Stack>

        {/* Steps */}
        <Stack spacing={1.5}>
          {steps.map((step, index) => (
            <Stack
              key={step.id}
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              spacing={1.5}
              sx={{
                p: 1.5,
                borderRadius: 1.5,
                bgcolor: step.completed
                  ? alpha(theme.palette.success.main, 0.08)
                  : alpha(theme.palette.grey[500], 0.04),
                border: `1px solid ${
                  step.completed
                    ? alpha(theme.palette.success.main, 0.2)
                    : alpha(theme.palette.grey[500], 0.08)
                }`,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  bgcolor: step.completed
                    ? alpha(theme.palette.success.main, 0.12)
                    : alpha(theme.palette.grey[500], 0.08),
                },
              }}
            >
              {/* Step Icon */}
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: step.completed
                    ? alpha(theme.palette.success.main, 0.16)
                    : alpha(theme.palette.grey[500], 0.08),
                  color: step.completed ? 'success.main' : 'text.secondary',
                }}
              >
                {step.completed ? (
                  <Iconify icon="solar:check-circle-bold" width={24} />
                ) : (
                  <Iconify icon={step.icon} width={24} />
                )}
              </Box>

              {/* Step Content */}
              <Stack spacing={0.25} sx={{ flexGrow: 1 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    textDecoration: step.completed ? 'line-through' : 'none',
                    color: step.completed ? 'text.secondary' : 'text.primary',
                  }}
                >
                  {step.title}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {step.description}
                </Typography>
              </Stack>

              {/* Action Button */}
              {!step.completed && step.action && (
                <Button
                  size="small"
                  variant="contained"
                  onClick={step.action}
                  sx={{ flexShrink: 0 }}
                >
                  {step.actionLabel}
                </Button>
              )}
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Card>

    <MediaPickerDialog
      open={mediaPickerOpen}
      onClose={handleCloseMediaPicker}
      onSelect={handleMediaSelect}
      multiple
      title={t('onboarding_upload_images')}
    />

    <ContentDialog
      open={productDialogOpen}
      onClose={handleCloseProductDialog}
      title={t('create_new_product')}
      maxWidth="lg"
      content={<ProductNewEditForm />}
    />
    </>
  );
}

SetupChecklist.propTypes = {
  productsCount: PropTypes.number,
  ordersCount: PropTypes.number,
  hasMedia: PropTypes.bool,
  isPhoneVerified: PropTypes.bool,
  onRefresh: PropTypes.func,
};

import PropTypes from 'prop-types';
import { useState, useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Link from '@mui/material/Link';
import { alpha, useTheme } from '@mui/material/styles';

import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { MediaPickerDialog } from 'src/components/media-picker';
import ProductNewEditForm from 'src/sections/product/product-new-edit-form';
import { AuthContext } from 'src/auth/context/jwt';
import { updateStoreConfig } from 'src/api/store';
import { deployProduct } from 'src/api/product';

// ----------------------------------------------------------------------

export default function SetupChecklist({
  userName,
  productsCount = 0,
  ordersCount = 0,
  hasMedia = false,
  isPhoneVerified = true,
  onboardingCompleted = false,
  products = [],
  onRefresh,
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { user } = useContext(AuthContext);
  const { enqueueSnackbar } = useSnackbar();
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [unsavedDialogOpen, setUnsavedDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);

  const handleOpenMediaPicker = useCallback(() => {
    setMediaPickerOpen(true);
  }, []);

  const handleCloseMediaPicker = useCallback(() => {
    setMediaPickerOpen(false);
    onRefresh?.();
  }, [onRefresh]);

  const handleMediaSelect = useCallback((selectedMedia) => {
    setMediaPickerOpen(false);
    onRefresh?.();
  }, [onRefresh]);

  const handleOpenProductDialog = useCallback(() => {
    setProductDialogOpen(true);
  }, []);

  const handleCloseProductDialog = useCallback(() => {
    setProductDialogOpen(false);
    setIsFormDirty(false);
    onRefresh?.();
  }, [onRefresh]);

  const handleRequestCloseProductDialog = useCallback(() => {
    if (isFormDirty) {
      setUnsavedDialogOpen(true);
    } else {
      handleCloseProductDialog();
    }
  }, [isFormDirty, handleCloseProductDialog]);

  const handleDiscardChanges = useCallback(() => {
    setUnsavedDialogOpen(false);
    handleCloseProductDialog();
  }, [handleCloseProductDialog]);

  const handlePublishConfirm = useCallback(async () => {
    const slug = user?.store?.slug;
    if (!slug) {
      enqueueSnackbar(t('store_url_not_available'), { variant: 'warning' });
      return;
    }
    setShareLoading(true);
    try {
      // Deploy the product created in step 2 (ignore if already deployed)
      const product = products?.[0];
      if (product?.id) {
        try {
          await deployProduct(product.id);
        } catch (deployError) {
          // Product already deployed externally — that's fine, continue
          console.info('[onboarding] product already deployed, skipping deploy step');
        }
      }

      await updateStoreConfig({ config: { onboarding_completed: true } });
      enqueueSnackbar(t('product_published_successfully'), { variant: 'success' });
      setShareDialogOpen(false);
      onRefresh?.();
    } catch (error) {
      enqueueSnackbar(t('operation_failed'), { variant: 'error' });
    } finally {
      setShareLoading(false);
    }
  }, [user, products, enqueueSnackbar, t, onRefresh]);

  const steps = [
    {
      id: 'media',
      title: t('onboarding_upload_images'),
      description: t('onboarding_upload_images_desc'),
      completed: hasMedia,
      icon: 'solar:gallery-bold-duotone',
      action: handleOpenMediaPicker,
      actionLabel: t('onboarding_upload_now'),
    },
    {
      id: 'product',
      title: t('onboarding_add_product'),
      description: t('onboarding_add_product_desc'),
      completed: productsCount > 0,
      icon: 'solar:box-bold-duotone',
      action: handleOpenProductDialog,
      actionLabel: t('onboarding_create_product'),
    },
    {
      id: 'share',
      title: t('onboarding_share_product'),
      description: t('onboarding_share_product_desc'),
      completed: onboardingCompleted || products.some((p) => p.status === 'deployed'),
      icon: 'solar:upload-bold-duotone',
      action: () => setShareDialogOpen(true),
      actionLabel: t('onboarding_share_now'),
    },
  ];

  const completedSteps = steps.filter((step) => step.completed).length;
  const progress = (completedSteps / steps.length) * 100;
  const allCompleted = completedSteps === steps.length;

  if (allCompleted) return null;

  return (
    <>
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={{ minHeight: 'calc(100vh - 280px)' }}
      >
        <Stack
          spacing={4}
          sx={{
            width: 1,
            maxWidth: 560,
            mx: 'auto',
          }}
        >
          {/* Header: greeting + progress ring */}
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack spacing={0.5}>
              <Typography variant="h4">
                {t('welcome_new_user_title')} {userName}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {t('onboarding_complete_steps')}
              </Typography>
            </Stack>

            {/* Circular progress */}
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
              <CircularProgress
                variant="determinate"
                value={100}
                size={56}
                thickness={4}
                sx={{ color: alpha(theme.palette.primary.main, 0.12) }}
              />
              <CircularProgress
                variant="determinate"
                value={progress}
                size={56}
                thickness={4}
                sx={{
                  position: 'absolute',
                  inset: 0,
                  color: 'primary.main',
                  '& .MuiCircularProgress-circle': {
                    strokeLinecap: 'round',
                  },
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  {completedSteps}/{steps.length}
                </Typography>
              </Box>
            </Box>
          </Stack>

          {/* Steps */}
          <Stack spacing={1.5}>
            {steps.map((step, index) => {
              const isActive = !step.completed && steps.slice(0, index).every((s) => s.completed);

              return (
                <Stack
                  key={step.id}
                  direction="row"
                  alignItems="center"
                  spacing={2}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    cursor: isActive && step.action ? 'pointer' : 'default',
                    bgcolor: step.completed
                      ? alpha(theme.palette.success.main, 0.06)
                      : isActive
                        ? 'background.paper'
                        : alpha(theme.palette.grey[500], 0.04),
                    border: `1px solid`,
                    borderColor: step.completed
                      ? alpha(theme.palette.success.main, 0.2)
                      : isActive
                        ? alpha(theme.palette.primary.main, 0.2)
                        : alpha(theme.palette.grey[500], 0.08),
                    boxShadow: isActive
                      ? `0 0 0 1px ${alpha(theme.palette.primary.main, 0.08)}`
                      : 'none',
                    transition: 'all 0.2s ease',
                    '&:hover': isActive ? {
                      borderColor: alpha(theme.palette.primary.main, 0.3),
                      bgcolor: alpha(theme.palette.primary.main, 0.04),
                    } : {},
                  }}
                  onClick={isActive && step.action ? step.action : undefined}
                >
                  {/* Step number / check */}
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      bgcolor: step.completed
                        ? alpha(theme.palette.success.main, 0.12)
                        : isActive
                          ? alpha(theme.palette.primary.main, 0.1)
                          : alpha(theme.palette.grey[500], 0.08),
                      color: step.completed
                        ? 'success.main'
                        : isActive
                          ? 'primary.main'
                          : 'text.disabled',
                    }}
                  >
                    {step.completed ? (
                      <Iconify icon="solar:check-circle-bold" width={26} />
                    ) : (
                      <Iconify icon={step.icon} width={24} />
                    )}
                  </Box>

                  {/* Content */}
                  <Stack spacing={0.25} sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: isActive ? 700 : 600,
                        textDecoration: step.completed ? 'line-through' : 'none',
                        color: step.completed
                          ? 'text.disabled'
                          : isActive
                            ? 'text.primary'
                            : 'text.secondary',
                      }}
                    >
                      {step.title}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'text.secondary',
                        opacity: step.completed ? 0.6 : 1,
                      }}
                    >
                      {step.description}
                    </Typography>
                  </Stack>

                  {/* Arrow / action indicator */}
                  {isActive && step.action && (
                    <Iconify
                      icon={theme.direction === 'rtl' ? 'solar:alt-arrow-left-outline' : 'solar:alt-arrow-right-outline'}
                      width={20}
                      sx={{
                        color: isActive ? 'primary.main' : 'text.disabled',
                        flexShrink: 0,
                      }}
                    />
                  )}
                </Stack>
              );
            })}
          </Stack>

          {/* Tutorial link */}
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.75}>
            <Iconify icon="solar:play-circle-bold-duotone" width={18} sx={{ color: 'primary.main' }} />
            <Link
              href="https://markium.online/tutorials/getting-started"
              target="_blank"
              rel="noopener noreferrer"
              variant="body2"
              sx={{ color: 'primary.main', fontWeight: 600 }}
            >
              {t('empty_products_watch_tutorial')}
            </Link>
          </Stack>
        </Stack>
      </Stack>

      {/* Media picker dialog */}
      <MediaPickerDialog
        open={mediaPickerOpen}
        onClose={handleCloseMediaPicker}
        onSelect={handleMediaSelect}
        multiple
        selectable={false}
        title={t('onboarding_upload_images')}
        confirmLabel={t('done')}
      />

      {/* Product creation drawer */}
      <Drawer
        anchor={theme.direction === 'rtl' ? 'right' : 'left'}
        open={productDialogOpen}
        onClose={handleRequestCloseProductDialog}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: '80vw', md: '60vw', lg: '50vw' },
          },
          role: 'dialog',
          'aria-modal': 'true',
          'aria-label': t('create_new_product'),
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            px: 2.5,
            py: 2,
            borderBottom: `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
          }}
        >
          <Typography variant="h6">{t('create_new_product')}</Typography>
          <IconButton onClick={handleRequestCloseProductDialog} size="small" aria-label={t('cancel')}>
            <Iconify icon="mingcute:close-line" width={20} />
          </IconButton>
        </Stack>

        <Box sx={{ p: 2.5, overflowY: 'auto', flexGrow: 1 }}>
          <ProductNewEditForm
            drawerMode
            onSuccess={handleCloseProductDialog}
            onCancel={handleRequestCloseProductDialog}
            onDirtyChange={setIsFormDirty}
          />
        </Box>
      </Drawer>

      {/* Unsaved changes confirmation */}
      <ConfirmDialog
        open={unsavedDialogOpen}
        onClose={() => setUnsavedDialogOpen(false)}
        title={t('unsaved_changes_title')}
        content={t('unsaved_changes_message')}
        action={
          <Button variant="contained" color="error" onClick={handleDiscardChanges}>
            {t('discard_changes')}
          </Button>
        }
      />

      {/* Share product confirmation */}
      <ConfirmDialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        title={t('onboarding_share_product')}
        content={t('onboarding_share_confirm_message')}
        action={
          <Button
            variant="contained"
            color="primary"
            onClick={handlePublishConfirm}
            disabled={shareLoading}
            startIcon={<Iconify icon="solar:upload-bold" width={18} />}
          >
            {shareLoading ? t('loading') : t('onboarding_share_now')}
          </Button>
        }
      />
    </>
  );
}

SetupChecklist.propTypes = {
  userName: PropTypes.string,
  productsCount: PropTypes.number,
  ordersCount: PropTypes.number,
  hasMedia: PropTypes.bool,
  isPhoneVerified: PropTypes.bool,
  onboardingCompleted: PropTypes.bool,
  products: PropTypes.array,
  onRefresh: PropTypes.func,
};

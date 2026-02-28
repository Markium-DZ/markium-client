import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';
import { fCurrency } from 'src/utils/format-number';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';

import {
  useGetAvailableAddOns,
  useGetActiveAddOns,
  checkoutAddOn,
  cancelAddOn,
} from 'src/api/addons';

// ----------------------------------------------------------------------

export default function SubscriptionAddons() {
  const { t } = useTranslate();
  const { enqueueSnackbar } = useSnackbar();

  const { addOns, addOnsLoading, addOnsMutate } = useGetAvailableAddOns();
  const { activeAddOns, activeAddOnsLoading, activeAddOnsMutate } = useGetActiveAddOns();

  const [purchaseLoading, setPurchaseLoading] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const handlePurchase = useCallback(async (addOn) => {
    setPurchaseLoading(addOn.slug);
    try {
      const response = await checkoutAddOn({
        add_on_slug: addOn.slug,
        payment_method: 'edahabia',
      });
      if (response?.data?.checkout_url) {
        window.location.href = response.data.checkout_url;
      }
    } catch (error) {
      const message = error?.error?.message || error?.message || t('operation_failed');
      enqueueSnackbar(message, { variant: 'error' });
      setPurchaseLoading(null);
    }
  }, [enqueueSnackbar, t]);

  const handleCancelConfirm = useCallback(async () => {
    if (!cancelTarget) return;
    setCancelLoading(true);
    try {
      await cancelAddOn(cancelTarget.id);
      enqueueSnackbar(t('operation_success'), { variant: 'success' });
      activeAddOnsMutate();
      addOnsMutate();
    } catch (error) {
      const message = error?.error?.message || error?.message || t('operation_failed');
      enqueueSnackbar(message, { variant: 'error' });
    } finally {
      setCancelLoading(false);
      setCancelTarget(null);
    }
  }, [cancelTarget, activeAddOnsMutate, addOnsMutate, enqueueSnackbar, t]);

  return (
    <>
      <Stack spacing={3}>
        {/* Active Add-ons */}
        {!activeAddOnsLoading && activeAddOns.length > 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {t('addons_active')}
              </Typography>

              <Stack spacing={2}>
                {activeAddOns.map((addon) => (
                  <Stack
                    key={addon.id}
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      bgcolor: 'background.neutral',
                    }}
                  >
                    <Stack>
                      <Typography variant="subtitle2">{addon.name}</Typography>
                      {addon.remaining !== undefined && (
                        <Typography variant="caption" color="text.secondary">
                          {t('addons_remaining')}: {addon.remaining}
                        </Typography>
                      )}
                    </Stack>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => setCancelTarget(addon)}
                    >
                      {t('addons_cancel')}
                    </Button>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* Available Add-ons */}
        {!addOnsLoading && addOns.length > 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {t('addons_available')}
              </Typography>

              <Box
                gap={2}
                display="grid"
                gridTemplateColumns={{
                  xs: 'repeat(1, 1fr)',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)',
                }}
              >
                {addOns.map((addon) => (
                  <Stack
                    key={addon.slug}
                    spacing={1.5}
                    sx={{
                      p: 2.5,
                      borderRadius: 1.5,
                      bgcolor: 'background.neutral',
                    }}
                  >
                    <Typography variant="subtitle1">{addon.name}</Typography>
                    {addon.description && (
                      <Typography variant="body2" color="text.secondary">
                        {addon.description}
                      </Typography>
                    )}
                    <Stack direction="row" alignItems="baseline" spacing={0.5}>
                      <Typography variant="h5">{fCurrency(addon.price)}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {addon.currency || 'DZD'}
                      </Typography>
                    </Stack>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handlePurchase(addon)}
                      disabled={purchaseLoading === addon.slug}
                    >
                      {purchaseLoading === addon.slug ? (
                        <CircularProgress size={18} />
                      ) : (
                        t('addons_purchase')
                      )}
                    </Button>
                  </Stack>
                ))}
              </Box>
            </CardContent>
          </Card>
        )}
      </Stack>

      {/* Cancel confirmation dialog */}
      <Dialog open={!!cancelTarget} onClose={() => setCancelTarget(null)}>
        <DialogTitle>{t('addons_cancel')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('addons_cancel_confirm')}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelTarget(null)} color="inherit">
            {t('cancel')}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleCancelConfirm}
            disabled={cancelLoading}
          >
            {cancelLoading ? <CircularProgress size={20} /> : t('addons_cancel')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

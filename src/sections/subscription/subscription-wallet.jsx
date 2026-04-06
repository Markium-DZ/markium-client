import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import { alpha, useTheme } from '@mui/material/styles';

import { useTranslate } from 'src/locales';
import { fCurrency } from 'src/utils/format-number';
import { fDateTime } from 'src/utils/format-time';

import Iconify from 'src/components/iconify';
import Label from 'src/components/label';
import { useSnackbar } from 'src/components/snackbar';
import VerificationGate from 'src/components/verification-gate/verification-gate';

import { useGetWalletBalance, useGetWalletTransactions, walletTopup } from 'src/api/wallet';

// ----------------------------------------------------------------------

export default function SubscriptionWallet() {
  const { t } = useTranslate();
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();

  const { balance, currency, balanceLoading } = useGetWalletBalance();
  const { transactions, transactionsLoading } = useGetWalletTransactions(1, 5);

  const [topupOpen, setTopupOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');
  const [topupLoading, setTopupLoading] = useState(false);

  const handleOpenTopup = useCallback(() => {
    setTopupOpen(true);
    setTopupAmount('');
  }, []);

  const handleCloseTopup = useCallback(() => {
    setTopupOpen(false);
  }, []);

  const handleTopup = useCallback(async () => {
    const amount = Number(topupAmount);
    if (!amount || amount <= 0) return;

    setTopupLoading(true);
    try {
      const response = await walletTopup({ amount, payment_method: 'edahabia' });
      if (response?.data?.checkout_url) {
        window.location.href = response.data.checkout_url;
      }
    } catch (error) {
      const message = error?.error?.message || error?.message || t('operation_failed');
      enqueueSnackbar(message, { variant: 'error' });
      setTopupLoading(false);
    }
  }, [topupAmount, enqueueSnackbar, t]);

  return (
    <>
      <Card sx={{ height: '100%' }}>
        <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
          <Stack spacing={3}>
            {/* Header */}
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: alpha(theme.palette.warning.main, 0.12),
                  flexShrink: 0,
                }}
              >
                <Iconify
                  icon="solar:wallet-bold"
                  width={24}
                  sx={{ color: 'warning.dark' }}
                />
              </Box>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                {t('wallet_balance')}
              </Typography>
            </Stack>

            {/* Balance */}
            <Stack direction="row" alignItems="baseline" justifyContent="space-between">
              <Stack direction="row" alignItems="baseline" spacing={1}>
                <Typography variant="h3">
                  {balanceLoading ? (
                    <CircularProgress size={28} />
                  ) : (
                    fCurrency(balance) || '0'
                  )}
                </Typography>
                {!balanceLoading && (
                  <Typography variant="subtitle1" color="text.secondary">
                    {currency}
                  </Typography>
                )}
              </Stack>

              <VerificationGate>
                <Button
                  variant="contained"
                  size="small"
                  color="warning"
                  startIcon={<Iconify icon="solar:add-circle-bold" />}
                  onClick={handleOpenTopup}
                  sx={{ flexShrink: 0 }}
                >
                  {t('wallet_topup')}
                </Button>
              </VerificationGate>
            </Stack>

            {/* Recent transactions */}
            {!transactionsLoading && transactions.length > 0 && (
              <>
                <Divider />
                <Stack spacing={1.5}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {t('wallet_transactions')}
                  </Typography>

                  {transactions.map((tx) => (
                    <Stack
                      key={tx.id}
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ py: 0.5 }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Label color={tx.type === 'credit' ? 'success' : 'error'}>
                          {t(`wallet_${tx.type}`)}
                        </Label>
                        <Typography variant="body2">{tx.description}</Typography>
                      </Stack>
                      <Stack alignItems="flex-end">
                        <Typography
                          variant="subtitle2"
                          color={tx.type === 'credit' ? 'success.main' : 'error.main'}
                        >
                          {tx.type === 'credit' ? '+' : '-'}
                          {fCurrency(tx.amount) || '0'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {fDateTime(tx.created_at)}
                        </Typography>
                      </Stack>
                    </Stack>
                  ))}
                </Stack>
              </>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Top-up dialog */}
      <Dialog open={topupOpen} onClose={handleCloseTopup} maxWidth="xs" fullWidth>
        <DialogTitle>{t('wallet_topup')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            type="number"
            label={t('wallet_topup')}
            value={topupAmount}
            onChange={(e) => setTopupAmount(e.target.value)}
            sx={{ mt: 2 }}
            inputProps={{ min: 1000 }}
            helperText={`${t('wallet_minimum_amount')}: 1,000 DZD`}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTopup} color="inherit">
            {t('cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleTopup}
            disabled={topupLoading || !topupAmount || Number(topupAmount) <= 0}
          >
            {topupLoading ? <CircularProgress size={20} /> : t('wallet_topup')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

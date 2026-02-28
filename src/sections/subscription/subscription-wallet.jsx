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
import Chip from '@mui/material/Chip';

import { useTranslate } from 'src/locales';
import { fCurrency } from 'src/utils/format-number';
import { fDateTime } from 'src/utils/format-time';

import Iconify from 'src/components/iconify';
import Label from 'src/components/label';
import { useSnackbar } from 'src/components/snackbar';

import { useGetWalletBalance, useGetWalletTransactions, walletTopup } from 'src/api/wallet';

// ----------------------------------------------------------------------

export default function SubscriptionWallet() {
  const { t } = useTranslate();
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
      <Card>
        <CardContent>
          <Stack spacing={3}>
            {/* Balance header */}
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="h6">{t('wallet_balance')}</Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<Iconify icon="solar:add-circle-bold" />}
                onClick={handleOpenTopup}
              >
                {t('wallet_topup')}
              </Button>
            </Stack>

            {/* Balance amount */}
            <Typography variant="h3">
              {balanceLoading ? (
                <CircularProgress size={24} />
              ) : (
                `${fCurrency(balance)} ${currency}`
              )}
            </Typography>

            {/* Recent transactions */}
            {!transactionsLoading && transactions.length > 0 && (
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
                        {tx.type === 'credit' ? '+' : '-'}{fCurrency(tx.amount)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {fDateTime(tx.created_at)}
                      </Typography>
                    </Stack>
                  </Stack>
                ))}
              </Stack>
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
            inputProps={{ min: 100 }}
            helperText={`${t('wallet_minimum_amount')}: 100 DZD`}
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

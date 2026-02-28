import Chip from '@mui/material/Chip';

import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';

import { fCurrency } from 'src/utils/format-number';

import Iconify from 'src/components/iconify';

import { useGetWalletBalance } from 'src/api/wallet';

// ----------------------------------------------------------------------

export default function SubscriptionWalletWidget() {
  const router = useRouter();
  const { balance, currency, balanceLoading } = useGetWalletBalance();

  if (balanceLoading) {
    return null;
  }

  return (
    <Chip
      icon={<Iconify icon="solar:wallet-bold" width={18} />}
      label={`${fCurrency(balance)} ${currency}`}
      size="small"
      variant="soft"
      color="primary"
      onClick={() => router.push(paths.dashboard.subscription.root)}
      sx={{ cursor: 'pointer' }}
    />
  );
}

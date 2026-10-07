import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';
import { useLocales } from 'src/locales';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

const getLocalizedName = (item, currentLang) => {
  if (!item) return '';
  const langValue = currentLang?.value || 'en';
  switch (langValue) {
    case 'ar':
      return item.name_ar || item.name || item.key;
    case 'fr':
      return item.name || item.key;
    case 'en':
    default:
      return item.key || item.name;
  }
};

export default function OrderDetailsInfo({ customer, shippingAddress }) {
  const { t } = useTranslate();
  const { currentLang } = useLocales();

  const getLocalizedFullAddress = () => {
    if (!shippingAddress) return '';
    const parts = [];
    if (shippingAddress.street_address) parts.push(shippingAddress.street_address);
    if (shippingAddress.commune) parts.push(getLocalizedName(shippingAddress.commune, currentLang));
    if (shippingAddress.wilaya) {
      const wilayaName = getLocalizedName(shippingAddress.wilaya, currentLang);
      const code = shippingAddress.wilaya.code;
      parts.push(code ? `${wilayaName} (${code})` : wilayaName);
    }
    return parts.filter(Boolean).join(', ');
  };

  return (
    <Card>
      {/* Customer */}
      <CardHeader title={t('customer_info')} />
      <Stack spacing={1.5} sx={{ px: 3, pb: 2 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar
            alt={customer?.full_name || customer?.name}
            src={customer?.avatarUrl}
            sx={{ width: 36, height: 36 }}
          >
            {customer?.full_name?.[0] || customer?.first_name?.[0] || '?'}
          </Avatar>
          <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
            {customer?.full_name || customer?.name}
          </Typography>
        </Stack>

        {customer?.phone && (
          <Stack direction="row" spacing={1} alignItems="center">
            <Iconify icon="solar:phone-bold" width={18} sx={{ color: 'text.disabled' }} />
            <Typography variant="body2">{customer.phone}</Typography>
          </Stack>
        )}

        {customer?.email && (
          <Stack direction="row" spacing={1} alignItems="center">
            <Iconify icon="solar:letter-bold" width={18} sx={{ color: 'text.disabled' }} />
            <Typography variant="body2">{customer.email}</Typography>
          </Stack>
        )}
      </Stack>

      <Divider sx={{ borderStyle: 'dashed' }} />

      {/* Address */}
      <CardHeader title={t('shipping_address')} />
      <Stack spacing={1} sx={{ px: 3, pb: 3 }}>
        <Stack direction="row" spacing={1} alignItems="flex-start">
          <Iconify icon="solar:map-point-bold" width={18} sx={{ color: 'text.disabled', mt: 0.25 }} />
          <Typography variant="body2">
            {getLocalizedFullAddress() || '-'}
          </Typography>
        </Stack>
      </Stack>
    </Card>
  );
}

OrderDetailsInfo.propTypes = {
  customer: PropTypes.object,
  shippingAddress: PropTypes.object,
};

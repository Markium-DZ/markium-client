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

// Helper function to get localized name based on current language
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

  // Build localized full address
  const getLocalizedFullAddress = () => {
    if (!shippingAddress) return '';

    const parts = [];

    if (shippingAddress.street_address) {
      parts.push(shippingAddress.street_address);
    }

    if (shippingAddress.commune) {
      parts.push(getLocalizedName(shippingAddress.commune, currentLang));
    }

    if (shippingAddress.wilaya) {
      parts.push(getLocalizedName(shippingAddress.wilaya, currentLang));
    }

    return parts.filter(Boolean).join(', ');
  };

  const renderCustomer = (
    <>
      <CardHeader
        title={t('customer_info')}
      />
      <Stack spacing={2} sx={{ p: 3 }}>
        <Stack direction="row" spacing={2}>
          <Avatar
            alt={customer?.full_name || customer?.name}
            src={customer?.avatarUrl}
            sx={{ width: 48, height: 48 }}
          >
            {customer?.full_name?.[0] || customer?.first_name?.[0] || '?'}
          </Avatar>

          <Stack spacing={0.5} alignItems="flex-start" sx={{ typography: 'body2', flexGrow: 1 }}>
            <Typography variant="subtitle2">{customer?.full_name || customer?.name}</Typography>

            {(customer?.first_name || customer?.last_name) && (
              <Box sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                {customer?.first_name} {customer?.last_name}
              </Box>
            )}
          </Stack>
        </Stack>

        <Stack spacing={1.5}>
          {customer?.phone && (
            <Stack direction="row" spacing={1} alignItems="center">
              <Iconify icon="solar:phone-bold" width={20} sx={{ color: 'text.secondary' }} />
              <Typography variant="body2">{customer.phone}</Typography>
            </Stack>
          )}

          {customer?.email && (
            <Stack direction="row" spacing={1} alignItems="center">
              <Iconify icon="solar:letter-bold" width={20} sx={{ color: 'text.secondary' }} />
              <Typography variant="body2">{customer.email}</Typography>
            </Stack>
          )}
        </Stack>
      </Stack>
    </>
  );

  const renderShipping = (
    <>
      <CardHeader
        title={t('shipping_address')}
      />
      <Stack spacing={2} sx={{ p: 3, typography: 'body2' }}>
        {shippingAddress?.street_address && (
          <Stack direction="row" spacing={1}>
            <Iconify icon="solar:map-point-bold" width={20} sx={{ color: 'text.secondary', mt: 0.25 }} />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                {t('street_address')}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {shippingAddress.street_address}
              </Typography>
            </Box>
          </Stack>
        )}

        {(shippingAddress?.commune || shippingAddress?.wilaya) && (
          <Stack spacing={1}>
            {shippingAddress?.commune && (
              <Stack direction="row" spacing={1}>
                <Box sx={{ width: 20 }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('commune')}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {getLocalizedName(shippingAddress.commune, currentLang)}
                  </Typography>
                </Box>
              </Stack>
            )}

            {shippingAddress?.wilaya && (
              <Stack direction="row" spacing={1}>
                <Box sx={{ width: 20 }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('wilaya')}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {getLocalizedName(shippingAddress.wilaya, currentLang)} ({shippingAddress.wilaya.code})
                  </Typography>
                </Box>
              </Stack>
            )}
          </Stack>
        )}

        {shippingAddress && (
          <Box sx={{
            p: 1.5,
            bgcolor: (theme) => theme.palette.grey[100],
            borderRadius: 1,
            borderLeft: (theme) => `3px solid ${theme.palette.primary.main}`
          }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
              {t('full_address')}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {getLocalizedFullAddress()}
            </Typography>
          </Box>
        )}
      </Stack>
    </>
  );

  return (
    <Card>
      {renderCustomer}

      <Divider sx={{ borderStyle: 'dashed' }} />

      {renderShipping}
    </Card>
  );
}

OrderDetailsInfo.propTypes = {
  customer: PropTypes.object,
  shippingAddress: PropTypes.object,
};

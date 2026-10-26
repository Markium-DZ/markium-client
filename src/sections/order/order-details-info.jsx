import PropTypes from 'prop-types';
import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';

import { useTranslate } from 'src/locales';
import { useLocales } from 'src/locales';

import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';
import showError from 'src/utils/show_error';
import { updateOrderDeliveryType } from 'src/api/orders';

import OrderDeliveryTypeLabel from './order-delivery-type-label';

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

export default function OrderDetailsInfo({ customer, shippingAddress, deliveryType, orderId, canChangeDeliveryType = false, onDeliveryTypeChanged }) {

  const { t } = useTranslate();

  const { enqueueSnackbar } = useSnackbar();
  const [deliveryMenuAnchor, setDeliveryMenuAnchor] = useState(null);
  const [savingDeliveryType, setSavingDeliveryType] = useState(false);

  const handleChangeDeliveryType = async (newType) => {
    setDeliveryMenuAnchor(null);
    if (!orderId || newType === deliveryType) return;
    try {
      setSavingDeliveryType(true);
      await updateOrderDeliveryType(orderId, newType);
      enqueueSnackbar(t('delivery_type_updated'), { variant: 'success' });
      await onDeliveryTypeChanged?.();
    } catch (error) {
      showError(error);
    } finally {
      setSavingDeliveryType(false);
    }
  };

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
            <Typography
              component="a"
              href={`tel:${customer.phone}`}
              variant="body2"
              dir="ltr"
              sx={{
                color: 'primary.main',
                fontWeight: 600,
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              {customer.phone}
            </Typography>
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

        {(deliveryType || canChangeDeliveryType) && (
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Iconify icon="solar:delivery-bold" width={18} sx={{ color: 'text.disabled' }} />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('delivery_type')}
            </Typography>
            <OrderDeliveryTypeLabel deliveryType={deliveryType ?? null} />
            {canChangeDeliveryType && (
              <>
                <Button
                  size="small"
                  color="inherit"
                  disabled={savingDeliveryType}
                  onClick={(e) => setDeliveryMenuAnchor(e.currentTarget)}
                  startIcon={<Iconify icon="solar:pen-bold" width={14} />}
                  sx={{ minWidth: 0, px: 1, fontSize: '0.75rem' }}
                >
                  {t('change')}
                </Button>
                <Menu
                  anchorEl={deliveryMenuAnchor}
                  open={!!deliveryMenuAnchor}
                  onClose={() => setDeliveryMenuAnchor(null)}
                >
                  {['home', 'stop_desk'].map((type) => (
                    <MenuItem
                      key={type}
                      selected={type === deliveryType}
                      onClick={() => handleChangeDeliveryType(type)}
                    >
                      <ListItemText
                        primary={t(type === 'home' ? 'delivery_home' : 'delivery_stop_desk')}
                        secondary={t('delivery_type_reprice_hint')}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </MenuItem>
                  ))}
                </Menu>
              </>
            )}
          </Stack>
        )}
      </Stack>
    </Card>
  );
}

OrderDetailsInfo.propTypes = {
  customer: PropTypes.object,
  shippingAddress: PropTypes.object,
  deliveryType: PropTypes.oneOf(['home', 'stop_desk', null]),
  orderId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  canChangeDeliveryType: PropTypes.bool,
  onDeliveryTypeChanged: PropTypes.func,
};

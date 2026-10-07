import PropTypes from 'prop-types';

import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export const DELIVERY_TYPE_CONFIG = {
  home: { labelKey: 'delivery_home', icon: 'solar:home-2-bold-duotone', color: 'info' },
  stop_desk: { labelKey: 'delivery_stop_desk', icon: 'solar:shop-bold', color: 'secondary' },
};

// Compact chip showing the order's delivery type (home / stop-desk).
// Legacy orders (delivery_type = null) render an em dash.
export default function OrderDeliveryTypeLabel({ deliveryType, sx }) {
  const { t } = useTranslate();

  const config = DELIVERY_TYPE_CONFIG[deliveryType];

  if (!config) {
    return (
      <Typography variant="body2" color="text.disabled" component="span">
        —
      </Typography>
    );
  }

  return (
    <Label
      variant="soft"
      color={config.color}
      startIcon={<Iconify icon={config.icon} width={14} />}
      sx={{ whiteSpace: 'nowrap', ...sx }}
    >
      {t(config.labelKey)}
    </Label>
  );
}

OrderDeliveryTypeLabel.propTypes = {
  deliveryType: PropTypes.oneOf(['home', 'stop_desk', null]),
  sx: PropTypes.object,
};

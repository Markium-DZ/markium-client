import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';

import { useTranslate } from 'src/locales';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

/**
 * Shows that an order was uploaded to a shipping company's platform:
 * "Creating…" while the carrier hasn't confirmed it, then "<Carrier>" with its logo.
 * Renders nothing when the order has no shipment.
 */
export default function OrderShipmentBadge({ shipment, sx }) {
  const { t } = useTranslate();

  if (!shipment) return null;

  const provider = { ...(shipment?.connection?.provider || {}), ...(shipment?.provider || {}) };
  const carrier = provider.name || t('shipping');
  const isCreating = !shipment.tracking_number;

  const tooltip = isCreating
    ? t('shipment_creating_hint')
    : `${t('shipment_uploaded_to', { carrier })} · ${shipment.tracking_number}`;

  // Already shipped and the carrier has a logo → show the full logo
  if (!isCreating && provider.logo) {
    return (
      <Tooltip title={tooltip}>
        <Box
          component="img"
          src={provider.logo}
          alt={carrier}
          sx={{
            height: 26,
            width: 'auto',
            maxWidth: 96,
            objectFit: 'contain',
            borderRadius: 0.75,
            bgcolor: 'common.white',
            border: (theme) => `1px solid ${theme.palette.divider}`,
            px: 0.5,
            py: 0.25,
            display: 'block',
            ...sx,
          }}
        />
      </Tooltip>
    );
  }

  return (
    <Tooltip title={tooltip}>
      <Label
        variant="soft"
        color={isCreating ? 'default' : 'info'}
        startIcon={
          <Iconify icon={isCreating ? 'svg-spinners:ring-resize' : 'solar:delivery-bold'} width={14} />
        }
        sx={{ height: 22, fontSize: 11, maxWidth: 1, ...sx }}
      >
        <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {isCreating ? t('shipment_creating') : carrier}
        </Box>
      </Label>
    </Tooltip>
  );
}

OrderShipmentBadge.propTypes = {
  shipment: PropTypes.object,
  sx: PropTypes.object,
};

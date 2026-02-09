import { useState, useCallback } from 'react';
import PropTypes from 'prop-types';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';

import { RouterLink } from 'src/routes/components';

import { fDateTime } from 'src/utils/format-time';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import CustomPopover, { usePopover } from 'src/components/custom-popover';
import { ORDER_STATUSES, getOrderStatusColor, getOrderStatusOptions } from 'src/constants/order-status';
import { t } from 'i18next';

// ----------------------------------------------------------------------

const NEXT_STATUS_MAP = {
  pending: {
    next: 'confirmed',
    labelKey: 'confirm_order',
    icon: 'solar:check-circle-bold',
    color: 'secondary',
  },
  confirmed: {
    action: 'scroll_to_shipping',
    labelKey: 'create_shipment',
    icon: 'solar:delivery-bold',
    color: 'info',
  },
  shipment_created: {
    next: 'shipped',
    labelKey: 'mark_shipped',
    icon: 'solar:box-bold',
    color: 'info',
  },
  shipped: {
    next: 'delivered',
    labelKey: 'mark_delivered',
    icon: 'solar:verified-check-bold',
    color: 'success',
  },
};

// ----------------------------------------------------------------------

export default function OrderDetailsToolbar({
  status,
  backLink,
  createdAt,
  orderNumber,
  onChangeStatus,
  onShipOrder,
  loading,
}) {
  const morePopover = usePopover();
  const [statusExpanded, setStatusExpanded] = useState(false);

  const statuses = getOrderStatusOptions(t);
  const nextAction = NEXT_STATUS_MAP[status];

  const currentIndex = ORDER_STATUSES.findIndex((s) => s.key === status);

  const handleNextStatus = () => {
    if (!nextAction) return;

    if (nextAction.action === 'scroll_to_shipping') {
      onShipOrder?.();
    } else {
      onChangeStatus(nextAction.next);
    }
  };

  const handleToggleStatusList = useCallback(() => {
    setStatusExpanded((prev) => !prev);
  }, []);

  const handleCloseMore = useCallback(() => {
    morePopover.onClose();
    setStatusExpanded(false);
  }, [morePopover]);

  return (
    <>
      <Stack
        spacing={3}
        direction={{ xs: 'column', md: 'row' }}
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      >
        <Stack spacing={1} direction="row" alignItems="flex-start">
          <IconButton component={RouterLink} href={backLink}>
            <Iconify icon="eva:arrow-ios-back-fill" />
          </IconButton>

          <Stack spacing={0.5}>
            <Stack spacing={1} direction="row" alignItems="center">
              <Typography variant="h4"> {t('order')} {orderNumber} </Typography>
              <Label
                variant="soft"
                color={getOrderStatusColor(status)}
              >
                {t(status)}
              </Label>
            </Stack>

            <Typography variant="body2" sx={{ color: 'text.disabled' }}>
              {fDateTime(createdAt)}
            </Typography>
          </Stack>
        </Stack>

        <Stack
          flexGrow={1}
          spacing={1.5}
          direction="row"
          alignItems="center"
          justifyContent="flex-end"
        >
          {nextAction && (
            <Button
              variant="contained"
              color={nextAction.color}
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Iconify icon={nextAction.icon} />}
              onClick={handleNextStatus}
              disabled={loading}
            >
              {t(nextAction.labelKey)}
            </Button>
          )}

          <Button
            color="inherit"
            variant="outlined"
            startIcon={<Iconify icon="solar:printer-minimalistic-bold" />}
          >
            {t('print')}
          </Button>

          <Button
            color="inherit"
            variant="outlined"
            endIcon={<Iconify icon="eva:more-vertical-fill" />}
            onClick={morePopover.onOpen}
          >
            {t('more')}
          </Button>
        </Stack>
      </Stack>

      {/* More actions popover with nested status list */}
      <CustomPopover
        open={morePopover.open}
        onClose={handleCloseMore}
        arrow="top-right"
        sx={{ minWidth: 200 }}
      >
        <MenuItem onClick={handleToggleStatusList}>
          <Iconify icon="solar:refresh-circle-bold" sx={{ mr: 1 }} />
          {t('change_status')}
          <Iconify
            icon={statusExpanded ? 'eva:arrow-ios-upward-fill' : 'eva:arrow-ios-downward-fill'}
            width={16}
            sx={{ ml: 'auto' }}
          />
        </MenuItem>

        <Collapse in={statusExpanded}>
          <Divider sx={{ borderStyle: 'dashed' }} />

          {statuses.map((option) => {
            const optionIndex = ORDER_STATUSES.findIndex((s) => s.key === option.value);
            const isPast = optionIndex <= currentIndex && option.value !== 'cancelled';
            const isCurrent = option.value === status;

            return (
              <MenuItem
                key={option.value}
                selected={isCurrent}
                disabled={isPast}
                onClick={() => {
                  handleCloseMore();
                  onChangeStatus(option.value);
                }}
                sx={{
                  pl: 4,
                  color: isPast ? 'text.disabled' : `${option.color}.main`,
                  '&:hover': {
                    backgroundColor: isPast ? undefined : `${option.color}.lighter`,
                  },
                }}
              >
                <Iconify icon={option.icon} sx={{ mr: 1 }} />
                {option.label}
              </MenuItem>
            );
          })}
        </Collapse>
      </CustomPopover>
    </>
  );
}

OrderDetailsToolbar.propTypes = {
  backLink: PropTypes.string,
  createdAt: PropTypes.string,
  onChangeStatus: PropTypes.func,
  onShipOrder: PropTypes.func,
  orderNumber: PropTypes.string,
  status: PropTypes.string,
  loading: PropTypes.bool,
};

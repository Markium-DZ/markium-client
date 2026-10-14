import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';

import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { useResponsive } from 'src/hooks/use-responsive';
import { useCopyToClipboard } from 'src/hooks/use-copy-to-clipboard';

import { fCurrency } from 'src/utils/format-number';

import { useLocales, useTranslate } from 'src/locales';
import { NAV_HEIGHT as BOTTOM_NAV_HEIGHT } from 'src/layouts/dashboard/bottom-nav';

import Iconify from 'src/components/iconify';
import CustomPopover, { usePopover } from 'src/components/custom-popover';

import SelectionActionButton from './selection-action-button';
import OrdersBulkShippingActions from './OrdersBulkShippingActions';
import {
  WHATSAPP_MAX_CHARS,
  buildWhatsAppShareUrl,
  buildOrdersShareMessage,
} from '../utils/order-share-message';

// ----------------------------------------------------------------------

const canNativeShare = () => typeof navigator !== 'undefined' && typeof navigator.share === 'function';

// Clipboard API can be missing in some webviews / non-secure contexts.
function legacyCopy(text) {
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

// ----------------------------------------------------------------------

export default function OrdersSelectionBar({ selectedOrders, onClear, onRefresh }) {
  const { t } = useTranslate();
  const { currentLang } = useLocales();
  const { copy } = useCopyToClipboard();
  const popover = usePopover();
  // The phone bottom navigation shows below lg → use the floating action bar there
  const isMobile = useResponsive('down', 'lg');

  const count = selectedOrders.length;

  // Phone: while the floating bar is shown, hide the chat button (it would sit on top
  // of the bar) and pad the page bottom so the last orders stay reachable.
  const showFloatingBar = isMobile && count > 0;
  useEffect(() => {
    if (!showFloatingBar) return undefined;
    window.dispatchEvent(new CustomEvent('assistant:fab-visibility', { detail: { hidden: true } }));
    const previousPadding = document.body.style.paddingBottom;
    document.body.style.paddingBottom = '140px';
    return () => {
      window.dispatchEvent(new CustomEvent('assistant:fab-visibility', { detail: { hidden: false } }));
      document.body.style.paddingBottom = previousPadding;
    };
  }, [showFloatingBar]);

  if (!count) return null;

  // Builds the message; reports blurred exclusions. Returns null when nothing is shareable.
  const prepareMessage = () => {
    const { text, included, excluded } = buildOrdersShareMessage(selectedOrders, {
      t,
      lang: currentLang?.value,
      formatMoney: fCurrency,
    });

    if (excluded.length) {
      enqueueSnackbar(t('orders_share_blurred_excluded', { count: excluded.length }), {
        variant: 'warning',
      });
    }
    if (!included.length) {
      enqueueSnackbar(t('orders_share_nothing_to_share'), { variant: 'error' });
      return null;
    }
    return text;
  };

  const handleNativeShare = async () => {
    popover.onClose();
    const text = prepareMessage();
    if (!text) return;
    try {
      await navigator.share({ text });
    } catch (error) {
      // User dismissed the share sheet — nothing to report.
      if (error?.name !== 'AbortError') {
        enqueueSnackbar(t('orders_share_failed'), { variant: 'error' });
      }
    }
  };

  const handleWhatsApp = () => {
    popover.onClose();
    const text = prepareMessage();
    if (!text) return;
    if (text.length > WHATSAPP_MAX_CHARS) {
      enqueueSnackbar(t('orders_share_too_long'), { variant: 'warning' });
      return;
    }
    window.open(buildWhatsAppShareUrl(text), '_blank', 'noopener,noreferrer');
  };

  const handleCopy = async () => {
    popover.onClose();
    const text = prepareMessage();
    if (!text) return;
    const ok = (await copy(text)) || legacyCopy(text);
    enqueueSnackbar(ok ? t('orders_share_copied') : t('orders_share_copy_failed'), {
      variant: ok ? 'success' : 'error',
    });
  };

  const sharePopover = (
    <CustomPopover
      open={popover.open}
      onClose={popover.onClose}
      arrow={isMobile ? 'bottom-center' : 'top-right'}
      sx={{ width: 220 }}
    >
      {canNativeShare() && (
        <MenuItem onClick={handleNativeShare}>
          <Iconify icon="solar:share-circle-bold" />
          {t('orders_share_native')}
        </MenuItem>
      )}
      <MenuItem onClick={handleWhatsApp}>
        <Iconify icon="logos:whatsapp-icon" />
        {t('orders_share_whatsapp')}
      </MenuItem>
      <MenuItem onClick={handleCopy}>
        <Iconify icon="solar:copy-bold" />
        {t('orders_share_copy')}
      </MenuItem>
    </CustomPopover>
  );

  // ---- Phone: fixed action bar above the bottom navigation ----
  if (isMobile) {
    return (
      <>
        <Paper
          elevation={12}
          sx={{
            position: 'fixed',
            insetInline: 8,
            bottom: `calc(${BOTTOM_NAV_HEIGHT + 8}px + env(safe-area-inset-bottom))`,
            zIndex: (theme) => theme.zIndex.appBar + 2,
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ px: 1.5, py: 0.75, bgcolor: 'primary.lighter' }}
          >
            <IconButton size="small" onClick={onClear} aria-label={t('orders_clear_selection')}>
              <Iconify icon="eva:close-fill" width={18} />
            </IconButton>
            <Typography variant="subtitle2" sx={{ color: 'primary.darker', flexGrow: 1 }}>
              {t('orders_selected_count', { count })}
            </Typography>
          </Stack>

          <Stack direction="row" sx={{ px: 0.5, py: 0.5 }}>
            <OrdersBulkShippingActions
              compact
              selectedOrders={selectedOrders}
              onRefresh={onRefresh}
              onClear={onClear}
            />
            <SelectionActionButton
              compact
              icon="solar:share-bold"
              label={t('share')}
              count={count}
              onClick={popover.onOpen}
            />
          </Stack>
        </Paper>
        {sharePopover}
      </>
    );
  }

  // ---- Desktop: toolbar on top of the list ----
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1.5}
      sx={{
        px: 2,
        py: 1.25,
        bgcolor: 'primary.lighter',
        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
      }}
    >
      <Tooltip title={t('orders_clear_selection')}>
        <IconButton size="small" onClick={onClear}>
          <Iconify icon="eva:close-fill" width={20} />
        </IconButton>
      </Tooltip>

      <Typography variant="subtitle1" sx={{ color: 'primary.darker', flexGrow: 1 }}>
        {t('orders_selected_count', { count })}
      </Typography>

      <Stack direction="row" spacing={1} alignItems="center">
        <OrdersBulkShippingActions selectedOrders={selectedOrders} onRefresh={onRefresh} onClear={onClear} />
        <SelectionActionButton
          icon="solar:share-bold"
          label={t('share')}
          count={count}
          onClick={popover.onOpen}
        />
      </Stack>

      {sharePopover}
    </Stack>
  );
}

OrdersSelectionBar.propTypes = {
  selectedOrders: PropTypes.array,
  onClear: PropTypes.func,
  onRefresh: PropTypes.func,
};

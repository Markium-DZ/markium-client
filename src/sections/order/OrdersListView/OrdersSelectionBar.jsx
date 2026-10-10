import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';

import Iconify from 'src/components/iconify';
import { useLocales, useTranslate } from 'src/locales';
import { fCurrency } from 'src/utils/format-number';
import { useCopyToClipboard } from 'src/hooks/use-copy-to-clipboard';
import CustomPopover, { usePopover } from 'src/components/custom-popover';

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

export default function OrdersSelectionBar({ selectedOrders, onClear }) {
  const { t } = useTranslate();
  const { currentLang } = useLocales();
  const { copy } = useCopyToClipboard();
  const popover = usePopover();

  const count = selectedOrders.length;

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

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1}
      sx={{
        px: { xs: 1.5, md: 2.5 },
        py: 1,
        bgcolor: 'primary.lighter',
        borderRadius: { xs: 1, md: 0 },
        mx: { xs: 1, md: 0 },
        mb: { xs: 1, md: 0 },
      }}
    >
      <Typography variant="subtitle2" sx={{ color: 'primary.darker', flexGrow: 1 }}>
        {t('orders_selected_count', { count })}
      </Typography>

      <Button size="small" color="inherit" onClick={onClear}>
        {t('orders_clear_selection')}
      </Button>

      <Button
        size="small"
        variant="contained"
        color="primary"
        startIcon={<Iconify icon="solar:share-bold" />}
        onClick={popover.onOpen}
      >
        {t('share')}
      </Button>

      <CustomPopover open={popover.open} onClose={popover.onClose} arrow="top-right" sx={{ width: 220 }}>
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
    </Stack>
  );
}

OrdersSelectionBar.propTypes = {
  selectedOrders: PropTypes.array,
  onClear: PropTypes.func,
};

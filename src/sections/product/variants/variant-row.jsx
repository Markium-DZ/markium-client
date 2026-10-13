import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ButtonBase from '@mui/material/ButtonBase';

import { useTranslate } from 'src/locales';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

/**
 * One compact, read-only variant line: label · stock · price · edit.
 * Tapping the line opens the edit dialog for that variant.
 */
export default function VariantRow({ variant, label, onEdit }) {
  const { t } = useTranslate();

  const isActive = variant.is_active ?? true;
  const quantity = Number(variant.quantity) || 0;

  return (
    <ButtonBase
      onClick={onEdit}
      aria-label={`${t('variants_edit_details')}: ${label || variant.sku || ''}`}
      sx={{
        width: 1,
        px: { xs: 1.5, sm: 2 },
        py: 1,
        gap: 1.5,
        display: 'flex',
        alignItems: 'center',
        textAlign: 'start',
        '&:hover': { bgcolor: 'action.hover' },
        '&:not(:last-of-type)': { borderBottom: '1px dashed', borderBottomColor: 'divider' },
      }}
    >
      <Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <Typography variant="body2" noWrap sx={{ fontWeight: 600, opacity: isActive ? 1 : 0.5 }}>
          {label || variant.sku || t('variant')}
        </Typography>
        {!isActive && (
          <Iconify icon="solar:eye-closed-bold" width={16} sx={{ color: 'text.disabled', flexShrink: 0 }} />
        )}
      </Box>

      <Typography
        variant="body2"
        sx={{ flexShrink: 0, minWidth: 48, textAlign: 'end', color: quantity > 0 ? 'text.secondary' : 'error.main' }}
      >
        {quantity} {t('variants_pcs')}
      </Typography>

      <Typography variant="body2" sx={{ flexShrink: 0, minWidth: 72, textAlign: 'end', fontWeight: 600 }}>
        {variant.price ?? '-'} {t('currency_da')}
      </Typography>

      <Iconify icon="solar:pen-bold" width={16} sx={{ color: 'text.disabled', flexShrink: 0 }} />
    </ButtonBase>
  );
}

VariantRow.propTypes = {
  variant: PropTypes.object.isRequired,
  label: PropTypes.string,
  onEdit: PropTypes.func.isRequired,
};

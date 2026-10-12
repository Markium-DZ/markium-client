import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';

import { useTranslate } from 'src/locales';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';

import { effectiveValue } from './variant-utils';

// ----------------------------------------------------------------------

const NO_ERRORS = {};

/**
 * One editable variant row: label | stock | price | visible | edit.
 * Desktop: a single line. Mobile: label on top, inputs below.
 */
export default function VariantRowEditor({ variant, label, draft, errors = NO_ERRORS, disabled, onChange, onEdit }) {
  const { t } = useTranslate();

  const quantity = effectiveValue(variant, draft, 'quantity');
  const price = effectiveValue(variant, draft, 'price');
  const isActive = effectiveValue(variant, draft, 'is_active');
  const isDirty = Boolean(draft);

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      alignItems={{ xs: 'stretch', sm: 'center' }}
      spacing={{ xs: 1.5, sm: 2 }}
      sx={{
        px: { xs: 2, sm: 2.5 },
        py: 1.5,
        position: 'relative',
        // Unsaved rows get a primary accent on the leading edge
        borderInlineStart: '3px solid',
        borderInlineStartColor: isDirty ? 'primary.main' : 'transparent',
        '&:not(:last-of-type)': { borderBottom: '1px dashed', borderBottomColor: 'divider' },
      }}
    >
      {/* Label */}
      <Box sx={{ flexGrow: 1, minWidth: 0, opacity: isActive ? 1 : 0.6 }}>
        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
          <Typography variant="subtitle2" noWrap>
            {label || variant.sku || t('variant')}
          </Typography>
          {variant.is_default && (
            <Label color="info" variant="soft">
              {t('default')}
            </Label>
          )}
          {!isActive && (
            <Label color="default" variant="soft" startIcon={<Iconify icon="solar:eye-closed-bold" />}>
              {t('variants_hidden')}
            </Label>
          )}
        </Stack>
        {label && variant.sku && (
          <Typography variant="caption" color="text.disabled" noWrap component="div">
            {variant.sku}
          </Typography>
        )}
      </Box>

      {/* Inputs */}
      <Stack direction="row" alignItems="flex-start" spacing={1.5} sx={{ flexShrink: 0 }}>
        <TextField
          size="small"
          type="number"
          label={t('stock')}
          value={quantity}
          disabled={disabled}
          onChange={(event) => onChange('quantity', event.target.value)}
          error={!!errors.quantity}
          helperText={errors.quantity ? t(errors.quantity) : undefined}
          inputProps={{ min: 0, step: 1, inputMode: 'numeric' }}
          sx={{ width: { xs: 1, sm: 110 } }}
        />

        <TextField
          size="small"
          type="number"
          label={t('price')}
          value={price}
          disabled={disabled}
          onChange={(event) => onChange('price', event.target.value)}
          error={!!errors.price}
          helperText={errors.price ? t(errors.price) : undefined}
          inputProps={{ min: 0, step: '0.01', inputMode: 'decimal' }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Typography variant="caption" color="text.disabled">
                  {t('currency_da')}
                </Typography>
              </InputAdornment>
            ),
          }}
          sx={{ width: { xs: 1, sm: 150 } }}
        />
      </Stack>

      {/* Visible + edit */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent={{ xs: 'space-between', sm: 'flex-end' }}
        spacing={0.5}
        sx={{ flexShrink: 0 }}
      >
        <FormControlLabel
          sx={{ mx: 0 }}
          control={
            <Switch
              size="small"
              checked={Boolean(isActive)}
              disabled={disabled}
              onChange={(event) => onChange('is_active', event.target.checked)}
            />
          }
          label={
            <Typography variant="body2" color="text.secondary">
              {t('variants_visible')}
            </Typography>
          }
        />

        <Tooltip title={t('variants_edit_details')}>
          <span>
            <IconButton size="small" disabled={disabled} onClick={onEdit} aria-label={t('variants_edit_details')}>
              <Iconify icon="solar:pen-bold" width={18} />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
    </Stack>
  );
}

VariantRowEditor.propTypes = {
  variant: PropTypes.object.isRequired,
  label: PropTypes.string,
  draft: PropTypes.object,
  errors: PropTypes.object,
  disabled: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  onEdit: PropTypes.func,
};

import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';

import VariantRowEditor from './variant-row-editor';
import { totalStock, validateDraft } from './variant-utils';

// ----------------------------------------------------------------------

/** First variant image → color swatch → the option value itself. */
function GroupThumbnail({ colorHex, image, label }) {
  const common = {
    width: 44,
    height: 44,
    flexShrink: 0,
    borderRadius: 1.25,
    border: '1px solid',
    borderColor: 'divider',
  };

  if (image) {
    return <Box component="img" src={image} alt={label} sx={{ ...common, objectFit: 'cover' }} />;
  }

  if (colorHex) {
    return <Box sx={{ ...common, borderRadius: '50%', bgcolor: colorHex }} />;
  }

  return (
    <Box
      sx={{
        ...common,
        px: 0.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.neutral',
        typography: 'caption',
        fontWeight: 700,
        color: 'text.secondary',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
      }}
    >
      {label ? String(label).slice(0, 4) : <Iconify icon="solar:layers-bold-duotone" width={22} sx={{ color: 'text.disabled' }} />}
    </Box>
  );
}

GroupThumbnail.propTypes = {
  colorHex: PropTypes.string,
  image: PropTypes.string,
  label: PropTypes.string,
};

// ----------------------------------------------------------------------

export default function VariantGroupCard({ group, drafts, disabled, onFieldChange, onEdit }) {
  const { t } = useTranslate();

  const variants = group.rows.map((row) => row.variant);
  const stock = totalStock(variants, drafts);
  const changedCount = variants.filter((variant) => drafts[variant.id]).length;

  return (
    <Card variant="outlined" sx={{ borderRadius: 1.5 }}>
      {/* Group header */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{ px: { xs: 2, sm: 2.5 }, py: 1.5, bgcolor: 'background.neutral' }}
      >
        <GroupThumbnail colorHex={group.colorHex} image={group.image} label={group.label} />

        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" noWrap>
            {group.label || t('variants_all')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t('variants_count', { count: variants.length })}
          </Typography>
        </Box>

        {changedCount > 0 && (
          <Label color="primary" variant="soft">
            {t('variants_changed_count', { count: changedCount })}
          </Label>
        )}

        <Stack alignItems="flex-end" sx={{ flexShrink: 0 }}>
          <Typography variant="caption" color="text.secondary">
            {t('variants_total_stock')}
          </Typography>
          <Typography variant="subtitle2" color={stock > 0 ? 'text.primary' : 'error.main'}>
            {stock}
          </Typography>
        </Stack>
      </Stack>

      {/* Rows */}
      <Box>
        {group.rows.map(({ variant, label }) => (
          <VariantRowEditor
            key={variant.id}
            variant={variant}
            label={label}
            draft={drafts[variant.id]}
            errors={validateDraft(drafts[variant.id])}
            disabled={disabled}
            onChange={(field, value) => onFieldChange(variant, field, value)}
            onEdit={() => onEdit(variant)}
          />
        ))}
      </Box>
    </Card>
  );
}

VariantGroupCard.propTypes = {
  group: PropTypes.shape({
    key: PropTypes.string,
    label: PropTypes.string,
    colorHex: PropTypes.string,
    image: PropTypes.string,
    rows: PropTypes.array,
  }).isRequired,
  drafts: PropTypes.object.isRequired,
  disabled: PropTypes.bool,
  onFieldChange: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
};

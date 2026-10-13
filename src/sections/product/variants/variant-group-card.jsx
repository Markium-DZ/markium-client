import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';

import Iconify from 'src/components/iconify';

import VariantRow from './variant-row';
import { totalStock } from './variant-utils';

// ----------------------------------------------------------------------

/** First variant image → color swatch → the option value itself. */
function GroupThumbnail({ colorHex, image, label }) {
  const common = {
    width: 36,
    height: 36,
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

export default function VariantGroupCard({ group, onEdit }) {
  const { t } = useTranslate();

  const variants = group.rows.map((row) => row.variant);
  const stock = totalStock(variants);

  return (
    <Card variant="outlined" sx={{ borderRadius: 1.5 }}>
      {/* Group header */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.25}
        sx={{ px: { xs: 1.5, sm: 2 }, py: 1, bgcolor: 'background.neutral' }}
      >
        <GroupThumbnail colorHex={group.colorHex} image={group.image} label={group.label} />

        <Typography variant="subtitle2" noWrap sx={{ flexGrow: 1, minWidth: 0 }}>
          {group.label || t('variants_all')}
        </Typography>

        <Typography
          variant="caption"
          sx={{ flexShrink: 0, fontWeight: 600, color: stock > 0 ? 'text.secondary' : 'error.main' }}
        >
          {t('variants_total_stock')}: {stock}
        </Typography>
      </Stack>

      {/* Rows — tap one to edit it */}
      <Box>
        {group.rows.map(({ variant, label }) => (
          <VariantRow key={variant.id} variant={variant} label={label} onEdit={() => onEdit(variant)} />
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
  onEdit: PropTypes.func.isRequired,
};

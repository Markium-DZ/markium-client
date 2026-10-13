import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';

import Iconify from 'src/components/iconify';

import { groupVariants } from './variants/variant-utils';
import VariantGroupCard from './variants/variant-group-card';
import ProductVariantEditDialog from './product-variant-edit-dialog';
import AddOptionValueDialog from './product-add-option-value-dialog';

// ----------------------------------------------------------------------

/**
 * Variants grouped by the first option (e.g. one card per Color), one compact
 * read-only line per remaining combination. Tapping a line opens the edit dialog
 * for that variant (stock, price, visibility, images…).
 */
export default function ProductDetailsVariants({ product, optionDefinitions, onRefresh }) {
  const { t } = useTranslate();

  const variants = useMemo(() => product?.variants || [], [product?.variants]);
  const hasOptionDefinitions = (product?.option_definitions || []).length > 0;

  const groups = useMemo(
    () => groupVariants(variants, optionDefinitions || []),
    [variants, optionDefinitions]
  );

  const [selectedVariant, setSelectedVariant] = useState(null);
  const [openAddDialog, setOpenAddDialog] = useState(false);

  return (
    <Box sx={{ p: { xs: 1.5, sm: 3 } }}>
      {/* Header with Add button */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 2 }}
      >
        <Typography variant="h6">{t('product_variants')}</Typography>
        {hasOptionDefinitions && (
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:add-circle-bold" width={16} />}
            onClick={() => setOpenAddDialog(true)}
          >
            {t('add_option_value')}
          </Button>
        )}
      </Stack>

      {groups.length > 0 ? (
        <Stack spacing={1.5}>
          {groups.map((group) => (
            <VariantGroupCard key={group.key} group={group} onEdit={setSelectedVariant} />
          ))}
        </Stack>
      ) : (
        <Card sx={{ p: 5, textAlign: 'center' }}>
          <Iconify icon="solar:box-bold" width={64} sx={{ color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            {t('no_variants_yet')}
          </Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
            {t('no_variants_description')}
          </Typography>
        </Card>
      )}

      {/* Full edit dialog (SKU, compare-at, cost, media, weight, default…) */}
      <ProductVariantEditDialog
        open={!!selectedVariant}
        onClose={() => setSelectedVariant(null)}
        variant={selectedVariant}
        productId={product?.id}
        onSuccess={() => onRefresh?.()}
      />

      {/* Add Option Value Dialog */}
      <AddOptionValueDialog
        open={openAddDialog}
        onClose={() => setOpenAddDialog(false)}
        product={product}
        onRefresh={onRefresh}
      />
    </Box>
  );
}

ProductDetailsVariants.propTypes = {
  product: PropTypes.object,
  optionDefinitions: PropTypes.array,
  onRefresh: PropTypes.func,
};

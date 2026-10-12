import PropTypes from 'prop-types';
import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';
import { updateProductVariant } from 'src/api/product';

import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';

import VariantSaveBar from './variants/variant-save-bar';
import VariantGroupCard from './variants/variant-group-card';
import ProductVariantEditDialog from './product-variant-edit-dialog';
import AddOptionValueDialog from './product-add-option-value-dialog';
import {
  groupVariants,
  validateDraft,
  draftToPayload,
  applyFieldChange,
} from './variants/variant-utils';

// ----------------------------------------------------------------------

/**
 * Grouped variant editor: one card per value of the first option (e.g. per Color),
 * one row per remaining combination with inline stock / price / visibility.
 * Edits are kept as local drafts and saved together from the sticky save bar.
 */
export default function ProductDetailsVariants({ product, optionDefinitions, onRefresh }) {
  const { t } = useTranslate();
  const { enqueueSnackbar } = useSnackbar();

  const variants = useMemo(() => product?.variants || [], [product?.variants]);
  const hasOptionDefinitions = (product?.option_definitions || []).length > 0;

  const groups = useMemo(
    () => groupVariants(variants, optionDefinitions || []),
    [variants, optionDefinitions]
  );

  // { [variantId]: { quantity?, price?, is_active? } } — only changed fields
  const [drafts, setDrafts] = useState({});
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const [selectedVariant, setSelectedVariant] = useState(null);
  const [openAddDialog, setOpenAddDialog] = useState(false);

  const changedIds = Object.keys(drafts);
  const hasErrors = changedIds.some((id) => Object.keys(validateDraft(drafts[id])).length > 0);

  const handleFieldChange = useCallback((variant, field, value) => {
    setDrafts((prev) => {
      const nextDraft = applyFieldChange(variant, prev[variant.id], field, value);
      const next = { ...prev };
      if (nextDraft) next[variant.id] = nextDraft;
      else delete next[variant.id];
      return next;
    });
  }, []);

  const handleDiscard = useCallback(() => setDrafts({}), []);

  const handleSave = useCallback(async () => {
    const entries = Object.entries(drafts);
    if (!entries.length || hasErrors) return;

    setSaving(true);
    setProgress({ done: 0, total: entries.length });

    // Sequential: keeps inventory adjustments ordered and lets us show progress
    const failedIds = [];
    for (let i = 0; i < entries.length; i += 1) {
      const [variantId, draft] = entries[i];
      try {
        // eslint-disable-next-line no-await-in-loop
        await updateProductVariant(product?.id, variantId, draftToPayload(draft));
      } catch (error) {
        console.error('Error updating variant:', variantId, error);
        failedIds.push(variantId);
      }
      setProgress({ done: i + 1, total: entries.length });
    }

    // Keep only the failed rows' drafts so the merchant can retry them
    setDrafts((prev) =>
      failedIds.reduce((acc, id) => (prev[id] ? { ...acc, [id]: prev[id] } : acc), {})
    );

    try {
      await onRefresh?.();
    } finally {
      setSaving(false);
    }

    const savedCount = entries.length - failedIds.length;
    if (savedCount > 0) {
      enqueueSnackbar(t('variants_saved', { count: savedCount }), { variant: 'success' });
    }
    if (failedIds.length > 0) {
      enqueueSnackbar(t('variants_save_failed', { count: failedIds.length }), { variant: 'error' });
    }
  }, [drafts, hasErrors, product?.id, onRefresh, enqueueSnackbar, t]);

  const handleEditSuccess = () => {
    // The full dialog saved this variant → its inline draft is stale
    if (selectedVariant) {
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[selectedVariant.id];
        return next;
      });
    }
    onRefresh?.();
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header with Add button */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
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
        <Stack spacing={2}>
          {groups.map((group) => (
            <VariantGroupCard
              key={group.key}
              group={group}
              drafts={drafts}
              disabled={saving}
              onFieldChange={handleFieldChange}
              onEdit={setSelectedVariant}
            />
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

      <VariantSaveBar
        count={changedIds.length}
        saving={saving}
        progress={progress}
        hasErrors={hasErrors}
        onSave={handleSave}
        onDiscard={handleDiscard}
      />

      {/* Full edit dialog (SKU, compare-at, cost, media, weight, default…) */}
      <ProductVariantEditDialog
        open={!!selectedVariant}
        onClose={() => setSelectedVariant(null)}
        variant={selectedVariant}
        productId={product?.id}
        onSuccess={handleEditSuccess}
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

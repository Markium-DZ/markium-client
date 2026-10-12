import PropTypes from 'prop-types';
import { useRef, useState, useEffect, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { useResponsive } from 'src/hooks/use-responsive';

import { useTranslate } from 'src/locales';
import { useGetWilayas } from 'src/api/settings';
import {
  extractShippingRates,
  useGetCommuneShippingRates,
  bulkSetShippingRatesByWilaya,
} from 'src/api/shipping';

import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';

import { PrepareError, prepareImages } from './prepare-images';
import { buildReviewRows, buildSavePayload } from './review-model';
import ShippingImportReviewTable from './shipping-import-review-table';

// ----------------------------------------------------------------------

const ACCEPT =
  'application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif';

export default function ShippingImportDialog({ open, onClose }) {
  const { t, i18n } = useTranslate();
  const smDown = useResponsive('down', 'sm');
  const { enqueueSnackbar } = useSnackbar();

  const { wilayas } = useGetWilayas();
  const { rates, mutate } = useGetCommuneShippingRates();

  const inputRef = useRef(null);
  const abortRef = useRef(null);

  const [step, setStep] = useState('upload'); // 'upload' | 'reading' | 'review'
  const [error, setError] = useState('');
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ carrier: null, truncated: false, warnings: [] });
  const [saving, setSaving] = useState(false);

  const abortImport = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  useEffect(() => abortImport, [abortImport]);

  const reset = useCallback(() => {
    setStep('upload');
    setError('');
    setRows([]);
    setMeta({ carrier: null, truncated: false, warnings: [] });
    setSaving(false);
  }, []);

  const handleClose = useCallback(() => {
    if (saving) return;
    abortImport();
    reset();
    onClose();
  }, [saving, abortImport, reset, onClose]);

  const handleDialogClose = (event, reason) => {
    if (saving) return;
    if (reason === 'backdropClick') return;
    if (reason === 'escapeKeyDown' && step === 'review') return;
    handleClose();
  };

  const handleFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    // allow re-picking the same file
    // eslint-disable-next-line no-param-reassign
    event.target.value = '';
    if (!files.length) return;

    abortImport();
    const controller = new AbortController();
    abortRef.current = controller;

    setError('');
    setStep('reading');

    try {
      const { images, truncated } = await prepareImages(files);
      if (controller.signal.aborted) return;
      const extraction = await extractShippingRates(images, controller.signal);
      if (controller.signal.aborted) return;

      if (extraction?.document_type !== 'shipping_price_list' || !extraction?.rows?.length) {
        setError(t('shipping_import_not_found'));
        setStep('upload');
        return;
      }

      setRows(buildReviewRows(wilayas, extraction, rates));
      setMeta({
        carrier: extraction.carrier || null,
        truncated: !!truncated,
        warnings: Array.isArray(extraction.warnings) ? extraction.warnings : [],
      });
      setStep('review');
    } catch (err) {
      // closed or superseded: reset silently
      if (controller.signal.aborted || err?.name === 'AbortError') return;
      if (err instanceof PrepareError) {
        setError(
          err.code === 'pdf_protected'
            ? t('shipping_import_pdf_protected')
            : t('shipping_import_unsupported')
        );
      } else if (err?.status === 429) {
        if (err.resetsAt) {
          const time = new Date(err.resetsAt).toLocaleTimeString(i18n?.language);
          setError(t('shipping_import_limit', { time }));
        } else {
          setError(t('shipping_import_too_many'));
        }
      } else if (err?.status === 413) {
        setError(t('shipping_import_too_large'));
      } else {
        setError(t('shipping_import_error'));
      }
      setStep('upload');
    }
  };

  const handleRowChange = useCallback((wilayaId, patch) => {
    setRows((prev) => prev.map((row) => (row.wilaya.id === wilayaId ? { ...row, ...patch } : row)));
  }, []);

  const payload = step === 'review' ? buildSavePayload(rows) : [];
  const count = payload.length;

  const handleSave = async () => {
    setSaving(true);
    try {
      await bulkSetShippingRatesByWilaya(payload);
      await mutate();
      enqueueSnackbar(t('shipping_import_saved', { count }), { variant: 'success' });
      reset();
      onClose();
    } catch (err) {
      enqueueSnackbar(err?.message || t('shipping_import_save_error'), { variant: 'error' });
      setSaving(false);
    }
  };

  const renderUpload = (
    <Stack alignItems="center" spacing={2} sx={{ py: 4, textAlign: 'center' }}>
      <Iconify icon="solar:document-add-bold-duotone" width={64} sx={{ color: 'text.disabled' }} />
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
        {t('shipping_import_hint')}
      </Typography>
      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        accept={ACCEPT}
        onChange={handleFiles}
      />
      <Button
        variant="contained"
        disabled={!wilayas?.length}
        onClick={() => inputRef.current?.click()}
      >
        {error ? t('shipping_import_retry') : t('shipping_import_pick')}
      </Button>
    </Stack>
  );

  const renderReading = (
    <Stack alignItems="center" spacing={2} sx={{ py: 6 }}>
      <CircularProgress />
      <Typography variant="body2" color="text.secondary">
        {t('shipping_import_reading')}
      </Typography>
    </Stack>
  );

  const renderReview = (
    <Stack spacing={2}>
      {meta.carrier ? (
        <Typography variant="subtitle2">
          {t('shipping_import_carrier', { carrier: meta.carrier })}
        </Typography>
      ) : null}
      {meta.truncated ? <Alert severity="info">{t('shipping_import_truncated')}</Alert> : null}
      {meta.warnings.map((warning, index) => (
        <Alert key={index} severity="info">
          {String(warning)}
        </Alert>
      ))}
      <ShippingImportReviewTable rows={rows} onChange={handleRowChange} />
    </Stack>
  );

  return (
    <Dialog
      open={open}
      onClose={handleDialogClose}
      fullWidth
      maxWidth="md"
      fullScreen={smDown}
      scroll="paper"
    >
      <DialogTitle>{t('shipping_import_title')}</DialogTitle>

      <DialogContent>
        {error ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}
        {step === 'upload' && renderUpload}
        {step === 'reading' && renderReading}
        {step === 'review' && renderReview}
      </DialogContent>

      <DialogActions>
        <Button color="inherit" onClick={handleClose} disabled={saving}>
          {t('cancel')}
        </Button>
        {step === 'review' && (
          <LoadingButton
            variant="contained"
            loading={saving}
            disabled={count === 0}
            onClick={handleSave}
          >
            {t('shipping_import_save', { count })}
          </LoadingButton>
        )}
      </DialogActions>
    </Dialog>
  );
}

ShippingImportDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
};

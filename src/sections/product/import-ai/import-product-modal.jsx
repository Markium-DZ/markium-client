import PropTypes from 'prop-types';
import { useRef, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import { useTheme } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import useMediaQuery from '@mui/material/useMediaQuery';
import InputAdornment from '@mui/material/InputAdornment';

import { useTranslate } from 'src/locales';
import { CHAT_HOST_API } from 'src/config-global';

import Iconify from 'src/components/iconify';

import ImportSteps from './import-steps';

// ----------------------------------------------------------------------

const ANALYZE_STEPS = ['read_post', 'collect_images', 'analyze'];

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('accessToken') ?? ''}`,
    'X-Locale': localStorage.getItem('i18nextLng') ?? 'ar',
  };
}

/** Parse an SSE byte stream, invoking onEvent per `data:` line. */
async function readSse(response, onEvent) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    // eslint-disable-next-line no-await-in-loop
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    lines.forEach((line) => {
      if (line.startsWith('data:')) {
        try {
          onEvent(JSON.parse(line.slice(5)));
        } catch {
          /* keep-alive / malformed line — ignore */
        }
      }
    });
  }
}

export default function ImportProductModal({ open, onClose }) {
  const { t } = useTranslate();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  // phase: idle | analyzing | form | publishing | success | error
  const [phase, setPhase] = useState('idle');
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState([]);
  const [draft, setDraft] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', quantity: '' });
  const [optionValues, setOptionValues] = useState([]);
  const [newValue, setNewValue] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [nameError, setNameError] = useState('');
  const [productUrl, setProductUrl] = useState('');
  const [mainImage, setMainImage] = useState('');
  const [customOption, setCustomOption] = useState(false);
  const [customOptionName, setCustomOptionName] = useState('');
  const abortRef = useRef(null);

  const reset = useCallback(() => {
    setPhase('idle');
    setUrl('');
    setEvents([]);
    setDraft(null);
    setForm({ name: '', description: '', price: '', quantity: '' });
    setOptionValues([]);
    setNewValue('');
    setErrorMessage('');
    setNameError('');
    setProductUrl('');
    setCustomOption(false);
    setCustomOptionName('');
  }, []);

  const handleClose = useCallback(() => {
    abortRef.current?.abort();
    onClose();
  }, [onClose]);

  const analyze = useCallback(async () => {
    setPhase('analyzing');
    setEvents([]);
    setErrorMessage('');
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const response = await fetch(`${CHAT_HOST_API}/import/analyze`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ url: url.trim(), locale: localStorage.getItem('i18nextLng') ?? 'ar' }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error('analyze_http');
      let terminal = null;
      await readSse(response, (event) => {
        setEvents((prev) => [...prev, event]);
        if (event.step === 'draft' || event.status === 'error') terminal = event;
      });
      if (terminal?.step === 'draft') {
        const d = terminal.draft;
        setDraft(d);
        setForm({ name: d.name ?? '', description: d.description ?? '', price: '', quantity: '' });
        setOptionValues(d.option?.values ?? []);
        setPhase('form');
      } else {
        setErrorMessage(
          terminal?.step === 'read_post'
            ? t('assistant.import_error_read_post')
            : t('assistant.import_error_analyze'),
        );
        setPhase('error');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setErrorMessage(t('assistant.import_error_generic'));
        setPhase('error');
      }
    }
  }, [url, t]);

  const publish = useCallback(async () => {
    setPhase('publishing');
    setNameError('');
    setEvents([{ step: 'publish', status: 'running' }]);
    try {
      const response = await fetch(`${CHAT_HOST_API}/import/publish`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          url: url.trim(),
          name: form.name,
          description: form.description,
          price: Number(form.price),
          quantity: parseInt(form.quantity, 10),
          tags: draft?.tags ?? [],
          option: optionValues.length > 0
            ? { name: draft?.option?.name || customOptionName || t('assistant.import_option_name_default'), values: optionValues }
            : null,
        }),
      });
      const body = await response.json();
      if (response.status === 422 && body.field === 'name') {
        setNameError(body.message);
        setPhase('form');
        return;
      }
      if (!response.ok) throw new Error(body.message || 'publish_failed');
      setEvents([{ step: 'publish', status: 'done' }]);
      setProductUrl(body.productUrl || '');
      setPhase('success');
    } catch {
      setErrorMessage(t('assistant.import_error_generic'));
      setPhase('error');
    }
  }, [url, form, draft, optionValues, customOptionName, t]);

  const canPublish =
    (form.name ?? '').trim() && (form.description ?? '').trim() && Number(form.price) > 0 && parseInt(form.quantity, 10) > 0;

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm" fullScreen={fullScreen}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Iconify icon="solar:magic-stick-3-bold" width={22} sx={{ color: 'info.main' }} />
        {t('assistant.import_title')}
        <Box sx={{ flexGrow: 1 }} />
        <Button size="small" color="inherit" onClick={handleClose}>
          <Iconify icon="mingcute:close-line" />
        </Button>
      </DialogTitle>

      {/* pt keeps floating field labels from being clipped by the scroll
          boundary (MUI zeroes DialogContent's padding-top after a DialogTitle). */}
      <DialogContent sx={{ pb: 3, pt: 1 }}>
        {(phase === 'idle' || phase === 'error') && (
          <Stack spacing={2.5}>
            <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', px: 1 }}>
              {t('assistant.import_intro')}
            </Typography>

            <Stack direction="row" justifyContent="center" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              {[
                { name: 'Instagram', icon: 'skill-icons:instagram' },
                { name: 'Facebook', icon: 'logos:facebook' },
                { name: 'TikTok', icon: 'logos:tiktok-icon' },
                { name: 'Shopify', icon: 'logos:shopify' },
                { name: 'YouCan', img: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZlcnNpb249IjEuMSIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCI+PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRTExMTZGIj48L3JlY3Q+CjxwYXRoIGQ9Ik0xOC42NTQyIDEyLjA2NjVDMTguNjM2NCAxMi4wMjYyIDE4LjU5NTEgMTIgMTguNTQ5NCAxMkgxMS4xMTM4QzExLjAzMjUgMTIgMTAuOTc3NCAxMi4wNzkzIDExLjAwOTEgMTIuMTUwOUwxNi40MjY1IDI0LjQzMzVDMTYuNDQ0MyAyNC40NzM4IDE2LjQ4NTYgMjQuNSAxNi41MzEzIDI0LjVIMjMuOTYyNEMyNC4wNDM4IDI0LjUgMjQuMDk4OCAyNC40MjA4IDI0LjA2NzIgMjQuMzQ5MUwxOC42NTQyIDEyLjA2NjVaIiBmaWxsPSJ3aGl0ZSI+PC9wYXRoPgo8cGF0aCBkPSJNMzAuMDg1NyAxMkMzMC4wMzk5IDEyIDI5Ljk5ODYgMTIuMDI2MiAyOS45ODA5IDEyLjA2NjZMMjQuNTMxOCAyNC40NTc5TDE5LjA4MjggMzYuODQ5MkMxOS4wNTEzIDM2LjkyMDggMTkuMTA2MyAzNyAxOS4xODc2IDM3QzE5LjE4NzYgMzcgMjYuNTUxMSAzNyAyNi41OTY5IDM3QzI2LjYyOTggMzcgMjYuNjY5NiAzNi45NjU2IDI2LjY4OTMgMzYuOTQ2M0MyNi42OTc4IDM2LjkzOCAyNi43MDQxIDM2LjkyNzkgMjYuNzA4OSAzNi45MTcxTDMyLjE1MDggMjQuNTQyMUMzMi4xNTA4IDI0LjU0MjEgMzcuNTY4NCAxMi4yMjI0IDM3LjU5OTkgMTIuMTUwOEMzNy42MzE0IDEyLjA3OTIgMzcuNTc2MyAxMiAzNy40OTUgMTJIMzAuMDg1N1oiIGZpbGw9IndoaXRlIj48L3BhdGg+Cjwvc3ZnPjxzdHlsZT5AbWVkaWEgKHByZWZlcnMtY29sb3Itc2NoZW1lOiBsaWdodCkgeyA6cm9vdCB7IGZpbHRlcjogbm9uZTsgfSB9CkBtZWRpYSAocHJlZmVycy1jb2xvci1zY2hlbWU6IGRhcmspIHsgOnJvb3QgeyBmaWx0ZXI6IG5vbmU7IH0gfQo8L3N0eWxlPjwvc3ZnPg==' },
              ].map((source) => (
                <Stack
                  key={source.name}
                  direction="row"
                  alignItems="center"
                  spacing={0.75}
                  sx={{ px: 1.25, py: 0.5, borderRadius: 5, bgcolor: 'background.neutral' }}
                >
                  {source.img ? (
                    <Box component="img" src={source.img} alt="" sx={{ width: 16, height: 16, borderRadius: 0.5 }} />
                  ) : (
                    <Iconify icon={source.icon} width={16} />
                  )}
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>{source.name}</Typography>
                </Stack>
              ))}
            </Stack>

            <TextField
              fullWidth
              autoFocus
              label={t('assistant.import_link_label')}
              placeholder={t('assistant.import_link_placeholder')}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            {phase === 'error' && (
              <Typography variant="body2" sx={{ color: 'error.main' }}>
                {errorMessage}
              </Typography>
            )}
            <Button
              variant="contained"
              disabled={!/^https?:\/\/.+/.test(url.trim())}
              onClick={analyze}
              startIcon={<Iconify icon="solar:magic-stick-3-bold" />}
            >
              {phase === 'error' ? t('assistant.import_retry') : t('assistant.import_start')}
            </Button>
          </Stack>
        )}

        {(phase === 'analyzing' || phase === 'publishing') && (
          <ImportSteps events={events} steps={phase === 'analyzing' ? ANALYZE_STEPS : ['publish']} />
        )}

        {phase === 'form' && draft && (
          <Stack spacing={2}>
            <ImportSteps events={events} steps={ANALYZE_STEPS} />
            {draft.previewImages?.[0] && (
              <Stack spacing={1}>
                <Box
                  component="img"
                  src={mainImage || draft.previewImages[0]}
                  alt=""
                  sx={{ width: 1, maxHeight: 180, objectFit: 'cover', borderRadius: 1.5 }}
                />
                {draft.previewImages.length > 1 && (
                  <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 0.5 }}>
                    {draft.previewImages.map((img) => (
                      <Box
                        key={img}
                        component="img"
                        src={img}
                        alt=""
                        onClick={() => setMainImage(img)}
                        sx={{
                          width: 56,
                          height: 56,
                          flexShrink: 0,
                          objectFit: 'cover',
                          borderRadius: 1,
                          cursor: 'pointer',
                          border: (muiTheme) =>
                            `solid 2px ${(mainImage || draft.previewImages[0]) === img ? muiTheme.palette.info.main : 'transparent'}`,
                        }}
                      />
                    ))}
                    {draft.imageCount > draft.previewImages.length && (
                      <Stack
                        alignItems="center"
                        justifyContent="center"
                        sx={{ width: 56, height: 56, flexShrink: 0, borderRadius: 1, bgcolor: 'background.neutral' }}
                      >
                        <Typography variant="caption">+{draft.imageCount - draft.previewImages.length}</Typography>
                      </Stack>
                    )}
                  </Stack>
                )}
              </Stack>
            )}
            <TextField
              fullWidth
              label={t('assistant.import_name')}
              value={form.name}
              error={!!nameError}
              helperText={nameError || ''}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <TextField
              fullWidth
              multiline
              minRows={2}
              label={t('assistant.import_description')}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                type="number"
                label={t('assistant.import_price')}
                value={form.price}
                InputProps={{ endAdornment: <InputAdornment position="end">د.ج</InputAdornment> }}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              />
              <TextField
                fullWidth
                type="number"
                label={t('assistant.import_quantity')}
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
              />
            </Stack>
            {!draft.option && !customOption && (
              <Button
                variant="outlined"
                color="inherit"
                size="small"
                startIcon={<Iconify icon="mingcute:add-line" />}
                onClick={() => {
                  setCustomOption(true);
                  setCustomOptionName(t('assistant.import_option_name_default'));
                }}
              >
                {t('assistant.import_add_option')}
              </Button>
            )}
            {(draft.option || customOption) && (
              <Stack spacing={1}>
                {draft.option ? (
                  <Typography variant="subtitle2">{draft.option.name}</Typography>
                ) : (
                  <TextField
                    size="small"
                    label={t('assistant.import_option_name')}
                    value={customOptionName}
                    sx={{ maxWidth: 220 }}
                    onChange={(e) => setCustomOptionName(e.target.value)}
                  />
                )}
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {optionValues.map((v) => (
                    <Chip
                      key={v.value}
                      label={v.value}
                      size="small"
                      onDelete={() => setOptionValues((vals) => vals.filter((x) => x.value !== v.value))}
                    />
                  ))}
                  <TextField
                    size="small"
                    value={newValue}
                    placeholder={t('assistant.import_option_add')}
                    sx={{ width: 130 }}
                    onChange={(e) => setNewValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newValue.trim()) {
                        setOptionValues((vals) => [...vals, { value: newValue.trim() }]);
                        setNewValue('');
                      }
                    }}
                  />
                </Stack>
              </Stack>
            )}
            <Button variant="contained" size="large" disabled={!canPublish} onClick={publish}>
              {t('assistant.import_publish_cta')}
            </Button>
          </Stack>
        )}

        {phase === 'success' && (
          <Stack spacing={2} alignItems="center" sx={{ py: 3 }}>
            <Iconify icon="solar:check-circle-bold" width={56} sx={{ color: 'success.main' }} />
            <Typography variant="h6">{t('assistant.import_success_title')}</Typography>
            <Stack direction="row" spacing={1}>
              {productUrl && (
                <Button variant="contained" href={productUrl} target="_blank" rel="noopener">
                  {t('assistant.import_view_product')}
                </Button>
              )}
              <Button variant="outlined" onClick={reset}>
                {t('assistant.import_add_another')}
              </Button>
            </Stack>
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}

ImportProductModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
};

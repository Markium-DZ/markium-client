import PropTypes from 'prop-types';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { useForm, Controller, useFieldArray, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Menu from '@mui/material/Menu';
import Tabs from '@mui/material/Tabs';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import { alpha } from '@mui/material/styles';
import MenuItem from '@mui/material/MenuItem';
import Collapse from '@mui/material/Collapse';
import Skeleton from '@mui/material/Skeleton';
import Grid from '@mui/material/Unstable_Grid2';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { useAuthContext } from 'src/auth/hooks';
import {
  useGetHomeLayout,
  replaceHomeLayout,
  useGetSectionsCatalog,
} from 'src/api/store-theme';

import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';
import MediaPickerDialog from 'src/components/media-picker/media-picker-dialog';
import FormProvider, { RHFSelect, RHFTextField } from 'src/components/hook-form';
import VerificationGate from 'src/components/verification-gate/verification-gate';

// ----------------------------------------------------------------------

const EDITOR_LANGS = [
  { value: 'ar', labelKey: 'lang_ar' },
  { value: 'en', labelKey: 'lang_en' },
  { value: 'fr', labelKey: 'lang_fr' },
];

const isHttp = (v) => /^https?:\/\//i.test(v);

const tempId = () => `sec_new_${Math.random().toString(36).slice(2, 10)}`;

// ---- settings <-> form-value coercion ---------------------------------------

function toFormValue(field, stored) {
  if (field.localized) {
    const langs = {};
    EDITOR_LANGS.forEach(({ value }) => {
      if (stored && typeof stored === 'object') langs[value] = stored[value] || '';
      else if (typeof stored === 'string' && value === EDITOR_LANGS[0].value) langs[value] = stored;
      else langs[value] = '';
    });
    return langs;
  }
  if (typeof stored === 'string') return stored;
  return field.input === 'select' ? field.default || '' : '';
}

function toStoredValue(field, formValue) {
  if (field.localized) {
    const cleaned = {};
    let hasAny = false;
    EDITOR_LANGS.forEach(({ value }) => {
      const v = (formValue?.[value] || '').trim();
      if (v) {
        cleaned[value] = v;
        hasAny = true;
      }
    });
    return hasAny ? cleaned : null;
  }
  const v = (formValue || '').trim();
  if (field.input === 'image' || field.input === 'link') {
    if (!v) return null;
    return isHttp(v) || v.startsWith('/') || v.startsWith('#') ? v : null;
  }
  return v || null;
}

const settingsToForm = (fields, stored) =>
  (fields || []).reduce((acc, f) => {
    acc[f.key] = toFormValue(f, stored?.[f.key]);
    return acc;
  }, {});

const formToSettings = (fields, storedRaw, formValues) => {
  // Round-trip: keep any keys the editor doesn't manage, overlay the ones it does.
  const out = { ...(storedRaw || {}) };
  (fields || []).forEach((f) => {
    out[f.key] = toStoredValue(f, formValues?.[f.key]);
  });
  return out;
};

// ----------------------------------------------------------------------

export default function StoreThemeForm() {
  const { t } = useTranslate();
  const { user } = useAuthContext();
  const { enqueueSnackbar } = useSnackbar();

  const { sections, version, layoutLoading, layoutError, mutate } = useGetHomeLayout();
  const { catalog, catalogTypes, catalogLoading } = useGetSectionsCatalog();

  if (layoutLoading || catalogLoading) return <LayoutSkeleton />;

  if (layoutError) {
    return <Alert severity="error">{layoutError?.message || t('failed_to_load_store_theme')}</Alert>;
  }

  return (
    <LayoutEditor
      key={version}
      sections={sections}
      version={version}
      catalog={catalog}
      catalogTypes={catalogTypes}
      storeSlug={user?.store?.slug}
      isPhoneVerified={!!user?.is_phone_verified}
      onSaved={mutate}
      enqueueSnackbar={enqueueSnackbar}
      t={t}
    />
  );
}

// ----------------------------------------------------------------------

function LayoutEditor({
  sections,
  version,
  catalog,
  catalogTypes,
  storeSlug,
  isPhoneVerified,
  onSaved,
  enqueueSnackbar,
  t,
}) {
  const defaultValues = useMemo(
    () => ({
      sections: (sections || []).map((s) => ({
        rowId: s.id,
        id: s.id,
        type: s.type,
        enabled: s.enabled !== false,
        raw: s.settings || {},
        settings: settingsToForm(catalog[s.type], s.settings),
      })),
    }),
    [sections, catalog]
  );

  const methods = useForm({ defaultValues });
  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { isDirty, isSubmitting },
  } = methods;

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const { fields, append, remove, move } = useFieldArray({ control, name: 'sections', keyName: 'rowId' });
  const watchedSections = watch('sections');

  const [addMenuEl, setAddMenuEl] = useState(null);

  const onSubmit = handleSubmit(async (data) => {
    const rows = data.sections || [];
    if (!rows.some((r) => r.enabled)) {
      enqueueSnackbar(t('layout_needs_one_section'), { variant: 'warning' });
      return;
    }
    try {
      const payload = rows.map((r) => ({
        // Server generates ids for new sections; only send existing ones.
        ...(String(r.id).startsWith('sec_new_') ? {} : { id: r.id }),
        type: r.type,
        enabled: !!r.enabled,
        settings: formToSettings(catalog[r.type], r.raw, r.settings),
      }));
      await replaceHomeLayout(payload, version);
      enqueueSnackbar(t('section_saved'), { variant: 'success' });
      onSaved();
    } catch (error) {
      if (error?.status === 409) {
        enqueueSnackbar(t('layout_conflict_reload'), { variant: 'warning' });
        onSaved();
      } else if (error?.status === 403) {
        enqueueSnackbar(t('verify_phone_to_save_changes'), { variant: 'warning' });
      } else {
        enqueueSnackbar(error?.message || t('failed_to_update_section'), { variant: 'error' });
      }
    }
  });

  const handleAdd = (type) => {
    append({
      rowId: tempId(),
      id: tempId(),
      type,
      enabled: true,
      raw: {},
      settings: settingsToForm(catalog[type], {}),
    });
    setAddMenuEl(null);
  };

  const storefrontUrl = storeSlug
    ? (import.meta.env.VITE_STOREFRONT_BASE_URL || 'https://{slug}.markium.online').replace('{slug}', storeSlug)
    : null;

  const previewUrl = storeSlug
    ? (import.meta.env.VITE_STOREFRONT_PREVIEW_URL || `${import.meta.env.VITE_STOREFRONT_BASE_URL || 'https://{slug}.markium.online'}/?preview=1`).replace('{slug}', storeSlug)
    : null;

  // The unsaved draft, in the storefront's layout shape — recomputed as the
  // merchant edits and pushed to the preview iframe.
  const draftLayout = useMemo(() => {
    const rows = watchedSections || [];
    return {
      sections: rows.map((r) => ({
        id: r.id,
        type: r.type,
        enabled: !!r.enabled,
        settings: formToSettings(catalog[r.type], r.raw, r.settings),
      })),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(watchedSections), catalog]);

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid xs={12}>
          <Stack spacing={0.5}>
            <Typography variant="h6">{t('store_theme_home_page')}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t('store_theme_setup_description')}
            </Typography>
          </Stack>
        </Grid>

        {!isPhoneVerified && (
          <Grid xs={12}>
            <Alert
              severity="warning"
              action={
                <Button component={Link} href={paths.dashboard.user.account} size="small" color="inherit" variant="text">
                  {t('verify_now')}
                </Button>
              }
            >
              {t('verify_phone_to_save_changes')}
            </Alert>
          </Grid>
        )}

        {/* Editor column */}
        <Grid xs={12} lg={6}>
          <Stack spacing={2}>
            {fields.map((row, index) => (
              <SectionCard
                key={row.rowId}
                index={index}
                type={watchedSections?.[index]?.type || row.type}
                enabled={watchedSections?.[index]?.enabled}
                fields={catalog[watchedSections?.[index]?.type || row.type] || []}
                isFirst={index === 0}
                isLast={index === fields.length - 1}
                onMoveUp={() => move(index, index - 1)}
                onMoveDown={() => move(index, index + 1)}
                onRemove={() => remove(index)}
                t={t}
              />
            ))}

            <Box>
              <Button
                variant="outlined"
                startIcon={<Iconify icon="mingcute:add-line" width={18} />}
                onClick={(e) => setAddMenuEl(e.currentTarget)}
              >
                {t('add_section')}
              </Button>
              <Menu anchorEl={addMenuEl} open={!!addMenuEl} onClose={() => setAddMenuEl(null)}>
                {(catalogTypes || []).map((type) => (
                  <MenuItem key={type} onClick={() => handleAdd(type)}>
                    {t(`section_type_${type}`)}
                  </MenuItem>
                ))}
              </Menu>
            </Box>

            <Stack
              direction="row"
              justifyContent="flex-end"
              spacing={2}
              sx={{ position: 'sticky', bottom: 0, py: 2, bgcolor: 'background.default', zIndex: 1 }}
            >
              <Button type="button" color="inherit" variant="text" onClick={() => reset(defaultValues)} disabled={!isDirty || isSubmitting}>
                {t('discard')}
              </Button>
              <VerificationGate>
                <LoadingButton type="submit" variant="contained" size="large" loading={isSubmitting} disabled={!isDirty}>
                  {t('save_changes')}
                </LoadingButton>
              </VerificationGate>
            </Stack>
          </Stack>
        </Grid>

        {/* Live preview column */}
        {previewUrl && (
          <Grid xs={12} lg={6}>
            <LivePreview previewUrl={previewUrl} draftLayout={draftLayout} storefrontUrl={storefrontUrl} t={t} />
          </Grid>
        )}
      </Grid>
    </FormProvider>
  );
}

LayoutEditor.propTypes = {
  sections: PropTypes.array.isRequired,
  version: PropTypes.number.isRequired,
  catalog: PropTypes.object.isRequired,
  catalogTypes: PropTypes.array.isRequired,
  storeSlug: PropTypes.string,
  isPhoneVerified: PropTypes.bool.isRequired,
  onSaved: PropTypes.func.isRequired,
  enqueueSnackbar: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
};

// ----------------------------------------------------------------------
// Live preview: embeds the storefront in preview mode and pushes the unsaved
// draft to it via postMessage as the merchant edits.

function LivePreview({ previewUrl, draftLayout, storefrontUrl, t }) {
  const iframeRef = useRef(null);
  const readyRef = useRef(false);

  const post = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    win.postMessage({ source: 'markium-editor', layout: draftLayout }, '*');
  }, [draftLayout]);

  // The storefront tells us when it's mounted and ready to receive drafts.
  useEffect(() => {
    const onMessage = (e) => {
      if (e.data?.source === 'markium-storefront' && e.data.type === 'ready') {
        readyRef.current = true;
        post();
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [post]);

  // Push the draft (debounced) whenever it changes.
  useEffect(() => {
    if (!readyRef.current) return undefined;
    const id = setTimeout(post, 300);
    return () => clearTimeout(id);
  }, [post]);

  return (
    <Card variant="outlined" sx={{ position: { lg: 'sticky' }, top: { lg: 16 }, overflow: 'hidden' }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 2, py: 1.25, borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>
        <Iconify icon="solar:eye-bold" width={18} sx={{ color: 'text.secondary' }} />
        <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
          {t('live_preview')}
        </Typography>
        {storefrontUrl && (
          <Button component={Link} href={storefrontUrl} target="_blank" rel="noopener" size="small" color="inherit" endIcon={<Iconify icon="solar:arrow-right-up-linear" width={16} />}>
            {t('open')}
          </Button>
        )}
      </Stack>
      <Box sx={{ bgcolor: 'grey.100' }}>
        <Box
          component="iframe"
          ref={iframeRef}
          title={t('live_preview')}
          src={previewUrl}
          onLoad={() => readyRef.current && post()}
          sx={{ display: 'block', width: '100%', height: { xs: 460, lg: 'calc(100vh - 160px)' }, border: 0 }}
        />
      </Box>
    </Card>
  );
}

LivePreview.propTypes = {
  previewUrl: PropTypes.string.isRequired,
  draftLayout: PropTypes.object.isRequired,
  storefrontUrl: PropTypes.string,
  t: PropTypes.func.isRequired,
};

// ----------------------------------------------------------------------

function SectionCard({ index, type, enabled, fields, isFirst, isLast, onMoveUp, onMoveDown, onRemove, t }) {
  const [open, setOpen] = useState(true);

  return (
    <Card variant="outlined" sx={{ opacity: enabled ? 1 : 0.6 }}>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{ p: 1.5, pl: 2 }}
      >
        <Iconify icon="solar:widget-bold-duotone" width={20} sx={{ color: 'text.secondary', flexShrink: 0 }} />
        <Typography variant="subtitle2" sx={{ flexGrow: 1, minWidth: 0 }} noWrap>
          {t(`section_type_${type}`)}
        </Typography>

        <Controller
          name={`sections.${index}.enabled`}
          render={({ field }) => (
            <Switch size="small" checked={!!field.value} onChange={(e) => field.onChange(e.target.checked)} />
          )}
        />
        <IconButton size="small" onClick={onMoveUp} disabled={isFirst} aria-label={t('move_up')}>
          <Iconify icon="eva:arrow-ios-upward-fill" width={18} />
        </IconButton>
        <IconButton size="small" onClick={onMoveDown} disabled={isLast} aria-label={t('move_down')}>
          <Iconify icon="eva:arrow-ios-downward-fill" width={18} />
        </IconButton>
        <IconButton size="small" color="error" onClick={onRemove} aria-label={t('remove')}>
          <Iconify icon="solar:trash-bin-trash-bold" width={18} />
        </IconButton>
        {fields.length > 0 && (
          <IconButton size="small" onClick={() => setOpen((v) => !v)} aria-label={t('edit')}>
            <Iconify icon={open ? 'eva:chevron-up-fill' : 'eva:chevron-down-fill'} width={20} />
          </IconButton>
        )}
      </Stack>

      {fields.length > 0 && (
        <Collapse in={open}>
          <Divider />
          <Stack spacing={3} sx={{ p: { xs: 2, sm: 3 } }}>
            {fields.map((f) => (
              <SectionField key={f.key} name={`sections.${index}.settings.${f.key}`} field={f} t={t} />
            ))}
          </Stack>
        </Collapse>
      )}
    </Card>
  );
}

SectionCard.propTypes = {
  index: PropTypes.number.isRequired,
  type: PropTypes.string.isRequired,
  enabled: PropTypes.bool,
  fields: PropTypes.array.isRequired,
  isFirst: PropTypes.bool,
  isLast: PropTypes.bool,
  onMoveUp: PropTypes.func.isRequired,
  onMoveDown: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
};

// ----------------------------------------------------------------------
// Renders one catalog setting by its `input` kind, at a full RHF `name` path.

function SectionField({ name, field, t }) {
  const label = field.label_key ? t(field.label_key) : field.key;
  const hint = field.hint_key ? t(field.hint_key) : undefined;

  switch (field.input) {
    case 'image':
      return <ImageFromLibraryField name={name} label={label} hint={hint} />;

    case 'select':
      return (
        <RHFSelect name={name} label={label} native>
          {(field.allowed_values || []).map((opt) => (
            <option key={opt} value={opt}>
              {t(`${field.label_key}_${opt}`)}
            </option>
          ))}
        </RHFSelect>
      );

    case 'link':
      return <RHFTextField name={name} label={label} helperText={hint} inputProps={{ dir: 'ltr' }} />;

    case 'textarea':
      return field.localized ? (
        <LocalizedTextField name={name} label={label} helperText={hint} multiline rows={3} t={t} />
      ) : (
        <RHFTextField name={name} label={label} helperText={hint} multiline rows={3} />
      );

    case 'text':
    default:
      return field.localized ? (
        <LocalizedTextField name={name} label={label} helperText={hint} t={t} />
      ) : (
        <RHFTextField name={name} label={label} helperText={hint} />
      );
  }
}

SectionField.propTypes = {
  name: PropTypes.string.isRequired,
  field: PropTypes.object.isRequired,
  t: PropTypes.func.isRequired,
};

// ----------------------------------------------------------------------

function LocalizedTextField({ name, label, helperText, multiline, rows, t }) {
  const [lang, setLang] = useState(EDITOR_LANGS[0].value);

  return (
    <Stack spacing={1}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
        <Typography variant="subtitle2">{label}</Typography>
        <Tabs value={lang} onChange={(_, v) => setLang(v)} sx={{ minHeight: 32 }}>
          {EDITOR_LANGS.map((l) => (
            <Tab key={l.value} value={l.value} label={t(l.labelKey)} sx={{ minHeight: 32, py: 0, minWidth: 48 }} />
          ))}
        </Tabs>
      </Stack>
      {EDITOR_LANGS.map((l) => (
        <Box key={l.value} sx={{ display: l.value === lang ? 'block' : 'none' }}>
          <RHFTextField
            name={`${name}.${l.value}`}
            helperText={l.value === lang ? helperText : undefined}
            multiline={multiline}
            rows={rows}
            inputProps={{ dir: l.value === 'ar' ? 'rtl' : 'ltr' }}
          />
        </Box>
      ))}
    </Stack>
  );
}

LocalizedTextField.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  helperText: PropTypes.string,
  multiline: PropTypes.bool,
  rows: PropTypes.number,
  t: PropTypes.func.isRequired,
};

// ----------------------------------------------------------------------

function ImageFromLibraryField({ name, label, hint }) {
  const { t } = useTranslate();
  const { control, setValue, watch } = useFormContext();
  const [pickerOpen, setPickerOpen] = useState(false);
  const value = watch(name);

  const handleSelect = useCallback(
    (selected) => {
      const url = selected?.full_url || '';
      if (url && !isHttp(url)) return;
      setValue(name, url, { shouldDirty: true });
      setPickerOpen(false);
    },
    [name, setValue]
  );

  const handleRemove = useCallback(() => {
    setValue(name, '', { shouldDirty: true });
  }, [name, setValue]);

  return (
    <Controller
      name={name}
      control={control}
      render={() => (
        <Stack spacing={1}>
          <Typography variant="subtitle2">{label}</Typography>

          {value ? (
            <Stack direction="row" spacing={2} alignItems="flex-start">
              <Box
                sx={{
                  width: 140,
                  height: 100,
                  borderRadius: 1,
                  overflow: 'hidden',
                  flexShrink: 0,
                  bgcolor: (theme) => alpha(theme.palette.grey[500], 0.12),
                }}
              >
                <Box component="img" src={value} alt={label} sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </Box>
              <Stack spacing={0.5} sx={{ minWidth: 0, flexGrow: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {hint}
                </Typography>
                <Stack direction="row" spacing={2}>
                  <Link component="button" type="button" underline="hover" variant="caption" onClick={() => setPickerOpen(true)} sx={{ color: 'primary.main', fontWeight: 600 }}>
                    {t('replace')}
                  </Link>
                  <Link component="button" type="button" underline="hover" variant="caption" onClick={handleRemove} sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    {t('remove')}
                  </Link>
                </Stack>
              </Stack>
            </Stack>
          ) : (
            <Box
              role="button"
              tabIndex={0}
              onClick={() => setPickerOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setPickerOpen(true);
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                px: 2,
                py: 2.5,
                borderRadius: 1.5,
                border: (theme) => `1px dashed ${alpha(theme.palette.grey[500], 0.32)}`,
                bgcolor: (theme) => alpha(theme.palette.grey[500], 0.04),
                cursor: 'pointer',
                '&:hover': {
                  borderColor: (theme) => alpha(theme.palette.primary.main, 0.4),
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
                },
              }}
            >
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 1.5,
                  bgcolor: (theme) => alpha(theme.palette.grey[500], 0.12),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Iconify icon="solar:gallery-bold-duotone" width={26} sx={{ color: 'text.disabled' }} />
              </Box>
              <Stack spacing={0.5} sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary">
                  {hint}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Iconify icon="solar:gallery-add-bold" width={16} />}
                  sx={{ alignSelf: 'flex-start', mt: 0.5 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setPickerOpen(true);
                  }}
                >
                  {t('pick_from_library')}
                </Button>
              </Stack>
            </Box>
          )}

          <MediaPickerDialog open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={handleSelect} multiple={false} title={t('pick_from_library')} />
        </Stack>
      )}
    />
  );
}

ImageFromLibraryField.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  hint: PropTypes.string,
};

// ----------------------------------------------------------------------

function LayoutSkeleton() {
  return (
    <Grid container spacing={3}>
      <Grid xs={12}>
        <Stack spacing={1}>
          <Skeleton variant="text" width={220} height={32} />
          <Skeleton variant="text" width={420} height={20} />
        </Stack>
      </Grid>
      <Grid xs={12}>
        <Stack spacing={2}>
          <Skeleton variant="rounded" height={120} />
          <Skeleton variant="rounded" height={64} />
        </Stack>
      </Grid>
    </Grid>
  );
}

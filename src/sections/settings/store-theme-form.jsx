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
import Dialog from '@mui/material/Dialog';
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
import DialogTitle from '@mui/material/DialogTitle';
import ToggleButton from '@mui/material/ToggleButton';
import DialogContent from '@mui/material/DialogContent';
import CardActionArea from '@mui/material/CardActionArea';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { useAuthContext } from 'src/auth/hooks';
import { useGetProducts } from 'src/api/product';
import { updateStoreConfig } from 'src/api/store';
import {
  useGetLayout,
  replaceLayout,
  useGetSectionsCatalog,
} from 'src/api/store-theme';

import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';
import MediaPickerDialog from 'src/components/media-picker/media-picker-dialog';
import FormProvider, { RHFSelect, RHFTextField } from 'src/components/hook-form';
import VerificationGate from 'src/components/verification-gate/verification-gate';

import { STORE_THEMES, STYLE_PRESETS } from './store-themes';

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
  if (field.input === 'items') {
    // Repeatable blocks: coerce each stored item through the item_shape.
    const arr = Array.isArray(stored) ? stored : [];
    return arr.map((item) => settingsToForm(field.item_shape, item));
  }
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
  if (field.input === 'items') {
    const arr = Array.isArray(formValue) ? formValue : [];
    // Items are fully editor-managed: rebuild each from its shape (bounded).
    return arr.slice(0, field.max_items || 20).map((item) => formToSettings(field.item_shape, {}, item));
  }
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

const PAGES = ['home', 'product'];

export default function StoreThemeForm() {
  const { t } = useTranslate();
  const { user } = useAuthContext();
  const { enqueueSnackbar } = useSnackbar();

  const [page, setPage] = useState('home');
  const { sections, version, layoutLoading, layoutError, mutate } = useGetLayout(page);
  const { catalog, catalogTypes, catalogMeta, catalogLoading } = useGetSectionsCatalog();

  if (layoutLoading || catalogLoading) return <LayoutSkeleton />;

  if (layoutError) {
    return <Alert severity="error">{layoutError?.message || t('failed_to_load_store_theme')}</Alert>;
  }

  // Stores saved before the product page became composable have no product
  // layout yet — seed the editor with the static COD core (server assigns ids).
  const effectiveSections =
    page === 'product' && sections.length === 0
      ? [{ id: tempId(), type: 'product-order-v1', enabled: true, settings: {} }]
      : sections;

  return (
    <>
      <Tabs value={page} onChange={(_, v) => setPage(v)} sx={{ mb: 2 }}>
        {PAGES.map((p) => (
          <Tab key={p} value={p} label={t(`layout_page_${p}`)} />
        ))}
      </Tabs>
      <LayoutEditor
      key={`${page}:${version}`}
      page={page}
      sections={effectiveSections}
      version={version}
      catalog={catalog}
      catalogTypes={catalogTypes}
      catalogMeta={catalogMeta}
      storeSlug={user?.store?.slug}
      isPhoneVerified={!!user?.is_phone_verified}
      onSaved={mutate}
      enqueueSnackbar={enqueueSnackbar}
      t={t}
      />
    </>
  );
}

// ----------------------------------------------------------------------

function LayoutEditor({
  page,
  sections,
  version,
  catalog,
  catalogTypes,
  catalogMeta,
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

  const { fields, append, remove, move, replace } = useFieldArray({ control, name: 'sections', keyName: 'rowId' });
  const watchedSections = watch('sections');

  const [addMenuEl, setAddMenuEl] = useState(null);
  const [themeOpen, setThemeOpen] = useState(false);
  // A theme also carries a palette + design style + chrome structure; held until save.
  const [pendingPalette, setPendingPalette] = useState(null);
  const [pendingStyle, setPendingStyle] = useState(null);
  const [pendingStructure, setPendingStructure] = useState(null);

  const applyTheme = (theme) => {
    replace(
      theme.sections.map((s) => ({
        rowId: tempId(),
        id: tempId(),
        type: s.type,
        enabled: s.enabled !== false,
        raw: s.settings || {},
        settings: settingsToForm(catalog[s.type], s.settings),
      }))
    );
    setPendingPalette(theme.palette);
    setPendingStyle(theme.style || null);
    setPendingStructure(theme.structure || null);
    setThemeOpen(false);
  };

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
      await replaceLayout(page, payload, version);
      // A theme also carries palette + style + structure — persist with the layout.
      if (pendingPalette || pendingStyle || pendingStructure) {
        const appearance = {};
        if (pendingPalette) appearance.palette = pendingPalette;
        if (pendingStyle) appearance.style = pendingStyle;
        if (pendingStructure) appearance.structure = pendingStructure;
        await updateStoreConfig({ config: { appearance } });
        setPendingPalette(null);
        setPendingStyle(null);
        setPendingStructure(null);
      }
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

  // Product-page preview needs a real product to render the COD core.
  const { products } = useGetProducts();
  const firstProductSlug = products?.[0]?.slug || products?.[0]?.ref || null;

  const basePreviewUrl = storeSlug
    ? (import.meta.env.VITE_STOREFRONT_PREVIEW_URL || `${import.meta.env.VITE_STOREFRONT_BASE_URL || 'https://{slug}.markium.online'}/?preview=1`).replace('{slug}', storeSlug)
    : null;
  let previewUrl = basePreviewUrl;
  if (page === 'product') {
    previewUrl =
      basePreviewUrl && firstProductSlug
        ? `${basePreviewUrl}&product_slug=${encodeURIComponent(firstProductSlug)}`
        : null;
  }

  // The unsaved draft, in the storefront's layout shape — recomputed as the
  // merchant edits and pushed to the preview iframe.
  const draftLayout = useMemo(() => {
    const rows = watchedSections || [];
    return {
      page,
      sections: rows.map((r) => ({
        id: r.id,
        type: r.type,
        enabled: !!r.enabled,
        settings: formToSettings(catalog[r.type], r.raw, r.settings),
      })),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(watchedSections), catalog, page]);

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid xs={12}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
            <Stack spacing={0.5}>
              <Typography variant="h6">{t('store_theme_home_page')}</Typography>
              <Typography variant="body2" color="text.secondary">
                {t('store_theme_setup_description')}
              </Typography>
            </Stack>
            {page === 'home' && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<Iconify icon="solar:magic-stick-3-bold" width={18} />}
                onClick={() => setThemeOpen(true)}
                sx={{ flexShrink: 0 }}
              >
                {t('change_theme')}
              </Button>
            )}
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
                isStatic={!!catalogMeta?.[watchedSections?.[index]?.type || row.type]?.static}
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
                {(catalogTypes || [])
                  .filter((type) => {
                    const meta = catalogMeta?.[type] || {};
                    // Static sections are pinned by the engine (already present);
                    // page-restricted sections only appear on their pages.
                    if (meta.static) return false;
                    return !meta.pages || meta.pages.includes(page);
                  })
                  .map((type) => (
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
            <LivePreview previewUrl={previewUrl} draftLayout={draftLayout} previewPalette={pendingPalette} previewStyle={pendingStyle} previewStructure={pendingStructure} storefrontUrl={storefrontUrl} t={t} />
          </Grid>
        )}
        {!previewUrl && page === 'product' && (
          <Grid xs={12} lg={6}>
            <Alert severity="info">{t('add_product_to_preview')}</Alert>
          </Grid>
        )}
      </Grid>

      <ThemeGalleryDialog open={themeOpen} onClose={() => setThemeOpen(false)} onApply={applyTheme} t={t} />
    </FormProvider>
  );
}

LayoutEditor.propTypes = {
  page: PropTypes.string.isRequired,
  sections: PropTypes.array.isRequired,
  catalogMeta: PropTypes.object,
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

const PREVIEW_DEVICES = {
  desktop: { w: 1280, icon: 'solar:monitor-bold', labelKey: 'desktop_view' },
  mobile: { w: 390, icon: 'solar:smartphone-bold', labelKey: 'mobile_view' },
};
const PREVIEW_PANE_H = 660;

function LivePreview({ previewUrl, draftLayout, previewPalette, previewStyle, previewStructure, storefrontUrl, t }) {
  const iframeRef = useRef(null);
  const readyRef = useRef(false);
  const paneRef = useRef(null);
  const [device, setDevice] = useState('desktop');
  const [scale, setScale] = useState(0.45);

  const post = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    const appearance = {};
    if (previewPalette) appearance.palette = previewPalette;
    if (previewStyle) appearance.style = previewStyle;
    if (previewStructure) appearance.structure = previewStructure;
    win.postMessage(
      {
        source: 'markium-editor',
        layout: draftLayout,
        appearance: Object.keys(appearance).length ? appearance : undefined,
      },
      '*'
    );
  }, [draftLayout, previewPalette, previewStyle, previewStructure]);

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

  // Render the storefront at a real device width and scale it to fit the pane,
  // so "desktop" shows the actual desktop layout (not a squished narrow view).
  useEffect(() => {
    const el = paneRef.current;
    if (!el) return undefined;
    const measure = () => setScale(Math.min(1, el.clientWidth / PREVIEW_DEVICES[device].w));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [device]);

  const deviceW = PREVIEW_DEVICES[device].w;

  return (
    <Card variant="outlined" sx={{ position: { lg: 'sticky' }, top: { lg: 16 }, overflow: 'hidden' }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 2, py: 1.25, borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>
        <Iconify icon="solar:eye-bold" width={18} sx={{ color: 'text.secondary' }} />
        <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
          {t('live_preview')}
        </Typography>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={device}
          onChange={(_, v) => v && setDevice(v)}
          sx={{ '& .MuiToggleButton-root': { px: 1, py: 0.25 } }}
        >
          {Object.entries(PREVIEW_DEVICES).map(([key, d]) => (
            <ToggleButton key={key} value={key} aria-label={t(d.labelKey)}>
              <Iconify icon={d.icon} width={18} />
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        {storefrontUrl && (
          <Button component={Link} href={storefrontUrl} target="_blank" rel="noopener" size="small" color="inherit" endIcon={<Iconify icon="solar:arrow-right-up-linear" width={16} />}>
            {t('open')}
          </Button>
        )}
      </Stack>
      <Box
        ref={paneRef}
        sx={{ bgcolor: 'grey.200', height: PREVIEW_PANE_H, overflow: 'hidden', display: 'flex', justifyContent: 'center' }}
      >
        {/* Scaled footprint keeps the (transformed) iframe centered without scrollbars */}
        <Box sx={{ width: deviceW * scale, height: PREVIEW_PANE_H, flexShrink: 0 }}>
          <Box
            component="iframe"
            ref={iframeRef}
            title={t('live_preview')}
            src={previewUrl}
            onLoad={() => readyRef.current && post()}
            sx={{
              display: 'block',
              width: deviceW,
              height: PREVIEW_PANE_H / scale,
              border: 0,
              transformOrigin: 'top left',
              transform: `scale(${scale})`,
            }}
          />
        </Box>
      </Box>
    </Card>
  );
}

LivePreview.propTypes = {
  previewUrl: PropTypes.string.isRequired,
  draftLayout: PropTypes.object.isRequired,
  previewPalette: PropTypes.string,
  previewStyle: PropTypes.string,
  previewStructure: PropTypes.string,
  storefrontUrl: PropTypes.string,
  t: PropTypes.func.isRequired,
};

// ----------------------------------------------------------------------
// Theme gallery: pick a curated look. Applying loads it into the editor + live
// preview (nothing is saved until the merchant hits Save).

// A concrete mini-storefront mockup for a theme card: shows the real palette,
// the hero headline/button, and a schematic of the sections below — so the
// merchant sees the actual look, not an abstract colour swatch.
function ThemeCardPreview({ theme }) {
  const heroSection = theme.sections.find((s) => s.type === 'hero-v1');
  const headline = heroSection?.settings?.headline?.en || '';
  const eyebrow = heroSection?.settings?.eyebrow?.en || '';
  const cta = heroSection?.settings?.cta_text?.en || 'Shop';
  const rest = theme.sections.filter((s) => s !== heroSection);
  const c = theme.swatch;
  // Render in the theme's actual display font + corner radius so the card shows
  // the real design difference, not just the colour.
  const style = STYLE_PRESETS[theme.style] || STYLE_PRESETS.editorial;
  const {font} = style;
  const r = style.radius;

  return (
    <Box sx={{ borderRadius: `${Math.min(r, 12)}px`, overflow: 'hidden', bgcolor: '#fff', border: (th) => `1px solid ${th.palette.divider}` }}>
      {/* Storefront header */}
      <Stack direction="row" alignItems="center" spacing={0.75} sx={{ px: 1, py: 0.75, borderBottom: (th) => `1px solid ${th.palette.divider}` }}>
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: c }} />
        <Box sx={{ width: 40, height: 6, borderRadius: 1, bgcolor: c, opacity: 0.85, fontFamily: font }} />
        <Box sx={{ flexGrow: 1 }} />
        {[0, 1, 2].map((i) => (
          <Box key={i} sx={{ width: 10, height: 3, borderRadius: 2, bgcolor: 'grey.300' }} />
        ))}
      </Stack>

      {/* Hero */}
      <Box sx={{ bgcolor: c, px: 1.5, py: 1.5, minHeight: 92, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 0.5 }}>
        {eyebrow && (
          <Typography noWrap sx={{ color: 'rgba(255,255,255,0.85)', fontSize: 7.5, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: font }}>
            {eyebrow}
          </Typography>
        )}
        <Typography noWrap sx={{ color: '#fff', fontFamily: font, fontWeight: 700, fontSize: 19, lineHeight: 1.1 }}>
          {headline}
        </Typography>
        <Box sx={{ mt: 0.5, alignSelf: 'flex-start', bgcolor: '#fff', color: c, fontSize: 8, fontWeight: 700, px: 1, py: 0.4, borderRadius: `${Math.min(r, 12)}px`, fontFamily: font }}>
          {cta}
        </Box>
      </Box>

      {/* Sections below the hero */}
      <Box sx={{ p: 1, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        {rest.length === 0 && <Box sx={{ height: 22, borderRadius: `${Math.min(r, 10)}px`, bgcolor: 'grey.100' }} />}
        {rest.map((s, i) =>
          s.type === 'products-grid-v1' ? (
            <Stack key={i} direction="row" spacing={0.75}>
              {[0, 1, 2].map((j) => (
                <Box key={j} sx={{ flex: 1, height: 26, borderRadius: `${Math.min(r, 10)}px`, bgcolor: 'grey.100' }} />
              ))}
            </Stack>
          ) : (
            <Box key={i} sx={{ height: 20, borderRadius: `${Math.min(r, 10)}px`, bgcolor: alpha(c, 0.16) }} />
          )
        )}
      </Box>
    </Box>
  );
}

ThemeCardPreview.propTypes = { theme: PropTypes.object.isRequired };

function ThemeGalleryDialog({ open, onClose, onApply, t }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack spacing={0.25}>
          <Typography variant="h6">{t('theme_gallery_title')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('theme_gallery_hint')}
          </Typography>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          {STORE_THEMES.map((theme) => (
            <Grid xs={12} sm={6} md={4} key={theme.id}>
              <Card variant="outlined" sx={{ overflow: 'hidden', transition: 'box-shadow .15s', '&:hover': { boxShadow: 6 } }}>
                <CardActionArea onClick={() => onApply(theme)} sx={{ p: 1.5 }}>
                  <Stack spacing={1.25}>
                    {theme.thumb ? (
                      <Box sx={{ borderRadius: 1, overflow: 'hidden', border: (th) => `1px solid ${th.palette.divider}` }}>
                        <Box
                          component="img"
                          src={theme.thumb}
                          alt={t(`theme_${theme.id}`)}
                          loading="lazy"
                          sx={{ display: 'block', width: '100%', aspectRatio: '5 / 3', objectFit: 'cover', objectPosition: 'top' }}
                        />
                      </Box>
                    ) : (
                      <ThemeCardPreview theme={theme} />
                    )}
                    <Stack spacing={0.25}>
                      <Typography variant="subtitle2">{t(`theme_${theme.id}`)}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t(`theme_${theme.id}_desc`)}
                      </Typography>
                    </Stack>
                  </Stack>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
    </Dialog>
  );
}

ThemeGalleryDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onApply: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
};

// ----------------------------------------------------------------------

function SectionCard({ index, type, enabled, isStatic, fields, isFirst, isLast, onMoveUp, onMoveDown, onRemove, t }) {
  const [open, setOpen] = useState(true);

  return (
    <Card variant="outlined" sx={{ opacity: enabled ? 1 : 0.6 }}>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{ p: 1.5, pl: 2 }}
      >
        <Iconify
          icon={isStatic ? 'solar:lock-keyhole-bold-duotone' : 'solar:widget-bold-duotone'}
          width={20}
          sx={{ color: 'text.secondary', flexShrink: 0 }}
        />
        <Typography variant="subtitle2" sx={{ flexGrow: 1, minWidth: 0 }} noWrap>
          {t(`section_type_${type}`)}
        </Typography>

        {/* Static sections are pinned by the engine: always on, not removable. */}
        {!isStatic && (
          <Controller
            name={`sections.${index}.enabled`}
            render={({ field }) => (
              <Switch size="small" checked={!!field.value} onChange={(e) => field.onChange(e.target.checked)} />
            )}
          />
        )}
        <IconButton size="small" onClick={onMoveUp} disabled={isFirst} aria-label={t('move_up')}>
          <Iconify icon="eva:arrow-ios-upward-fill" width={18} />
        </IconButton>
        <IconButton size="small" onClick={onMoveDown} disabled={isLast} aria-label={t('move_down')}>
          <Iconify icon="eva:arrow-ios-downward-fill" width={18} />
        </IconButton>
        {!isStatic && (
          <IconButton size="small" color="error" onClick={onRemove} aria-label={t('remove')}>
            <Iconify icon="solar:trash-bin-trash-bold" width={18} />
          </IconButton>
        )}
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
  isStatic: PropTypes.bool,
  fields: PropTypes.array.isRequired,
  isFirst: PropTypes.bool,
  isLast: PropTypes.bool,
  onMoveUp: PropTypes.func.isRequired,
  onMoveDown: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
};

// ----------------------------------------------------------------------
// Repeatable blocks widget: add/remove/reorder items whose sub-fields come
// from the catalog's item_shape (schema-driven, like everything else).

function ItemsField({ name, field, label, t }) {
  const { control } = useFormContext();
  const { fields, append, remove, move } = useFieldArray({ control, name, keyName: 'rowId' });
  const max = field.max_items || 10;

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="subtitle2">{label}</Typography>
        <Typography variant="caption" color="text.secondary">
          {fields.length}/{max}
        </Typography>
      </Stack>

      {fields.map((row, i) => (
        <Card key={row.rowId} variant="outlined" sx={{ p: 2, bgcolor: 'background.neutral' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
            <Typography variant="caption" color="text.secondary">
              #{i + 1}
            </Typography>
            <Stack direction="row" spacing={0.5}>
              <IconButton size="small" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label={t('move_up')}>
                <Iconify icon="eva:arrow-ios-upward-fill" width={16} />
              </IconButton>
              <IconButton size="small" onClick={() => move(i, i + 1)} disabled={i === fields.length - 1} aria-label={t('move_down')}>
                <Iconify icon="eva:arrow-ios-downward-fill" width={16} />
              </IconButton>
              <IconButton size="small" color="error" onClick={() => remove(i)} aria-label={t('remove')}>
                <Iconify icon="solar:trash-bin-trash-bold" width={16} />
              </IconButton>
            </Stack>
          </Stack>
          <Stack spacing={2.5}>
            {(field.item_shape || []).map((sub) => (
              <SectionField key={sub.key} name={`${name}.${i}.${sub.key}`} field={sub} t={t} />
            ))}
          </Stack>
        </Card>
      ))}

      <Button
        variant="outlined"
        size="small"
        startIcon={<Iconify icon="mingcute:add-line" width={16} />}
        onClick={() => append(settingsToForm(field.item_shape, {}))}
        disabled={fields.length >= max}
        sx={{ alignSelf: 'flex-start' }}
      >
        {t('add_item')}
      </Button>
    </Stack>
  );
}

ItemsField.propTypes = {
  name: PropTypes.string.isRequired,
  field: PropTypes.object.isRequired,
  label: PropTypes.string.isRequired,
  t: PropTypes.func.isRequired,
};

// ----------------------------------------------------------------------
// Renders one catalog setting by its `input` kind, at a full RHF `name` path.

function SectionField({ name, field, t }) {
  const label = field.label_key ? t(field.label_key) : field.key;
  const hint = field.hint_key ? t(field.hint_key) : undefined;

  switch (field.input) {
    case 'items':
      return <ItemsField name={name} field={field} label={label} t={t} />;

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

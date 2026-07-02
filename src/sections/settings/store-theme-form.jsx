import PropTypes from 'prop-types';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { useForm, Controller, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import { alpha } from '@mui/material/styles';
import Skeleton from '@mui/material/Skeleton';
import Grid from '@mui/material/Unstable_Grid2';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { useAuthContext } from 'src/auth/hooks';
import { useGetHomeLayout, patchHomeSection, useGetSectionsCatalog } from 'src/api/store-theme';

import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';
import MediaPickerDialog from 'src/components/media-picker/media-picker-dialog';
import FormProvider, { RHFSelect, RHFTextField } from 'src/components/hook-form';
import VerificationGate from 'src/components/verification-gate/verification-gate';

// ----------------------------------------------------------------------

const HERO_TYPE = 'hero-v1';

// Languages the storefront serves; localized settings carry a value per language.
const EDITOR_LANGS = [
  { value: 'ar', labelKey: 'lang_ar' },
  { value: 'en', labelKey: 'lang_en' },
  { value: 'fr', labelKey: 'lang_fr' },
];

const isHttp = (v) => /^https?:\/\//i.test(v);

// ----------------------------------------------------------------------

export default function StoreThemeForm() {
  const { t } = useTranslate();
  const { user } = useAuthContext();
  const { enqueueSnackbar } = useSnackbar();

  const { sections, layoutLoading, layoutError, mutate } = useGetHomeLayout();
  const { catalog, catalogLoading } = useGetSectionsCatalog();

  const heroSection = useMemo(() => sections.find((s) => s.type === HERO_TYPE) || null, [sections]);
  const heroFields = catalog[HERO_TYPE] || [];

  if (layoutLoading || catalogLoading) return <HeroSkeleton />;

  if (layoutError || !heroSection) {
    return <Alert severity="error">{layoutError?.message || t('failed_to_load_store_theme')}</Alert>;
  }

  return (
    <HeroForm
      heroSection={heroSection}
      fields={heroFields}
      storeSlug={user?.store?.slug}
      isPhoneVerified={!!user?.is_phone_verified}
      onSaved={mutate}
      enqueueSnackbar={enqueueSnackbar}
      t={t}
    />
  );
}

// ----------------------------------------------------------------------
// Coerce stored settings <-> form values.

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

// ----------------------------------------------------------------------

function HeroForm({ heroSection, fields, storeSlug, isPhoneVerified, onSaved, enqueueSnackbar, t }) {
  const defaultValues = useMemo(() => {
    const values = {};
    fields.forEach((f) => {
      values[f.key] = toFormValue(f, heroSection.settings?.[f.key]);
    });
    return values;
  }, [fields, heroSection.settings]);

  const methods = useForm({ defaultValues });
  const {
    handleSubmit,
    reset,
    formState: { isDirty, isSubmitting },
  } = methods;

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      // Whole-object round-trip: preserve any keys the editor doesn't know about,
      // overlay only the fields it manages.
      const settings = { ...(heroSection.settings || {}) };
      fields.forEach((f) => {
        settings[f.key] = toStoredValue(f, data[f.key]);
      });

      await patchHomeSection(heroSection.id, { settings });
      enqueueSnackbar(t('section_saved'), { variant: 'success' });
      reset(data);
      onSaved();
    } catch (error) {
      if (error?.status === 403) {
        enqueueSnackbar(t('verify_phone_to_save_changes'), { variant: 'warning' });
      } else {
        enqueueSnackbar(error?.message || t('failed_to_update_section'), { variant: 'error' });
      }
    }
  });

  const storefrontUrl = storeSlug
    ? (import.meta.env.VITE_STOREFRONT_BASE_URL || 'https://{slug}.markium.online').replace('{slug}', storeSlug)
    : null;

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid xs={12}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
          >
            <Stack spacing={0.5}>
              <Typography variant="h6">{t('store_theme_home_page')}</Typography>
              <Typography variant="body2" color="text.secondary">
                {t('store_theme_setup_description')}
              </Typography>
            </Stack>
            {storefrontUrl && (
              <Button
                component={Link}
                href={storefrontUrl}
                target="_blank"
                rel="noopener"
                color="inherit"
                variant="outlined"
                size="small"
                startIcon={<Iconify icon="solar:eye-bold" width={18} />}
                sx={{ flexShrink: 0 }}
              >
                {t('view_storefront')}
              </Button>
            )}
          </Stack>
        </Grid>

        {!isPhoneVerified && (
          <Grid xs={12}>
            <Alert
              severity="warning"
              action={
                <Button
                  component={Link}
                  href={paths.dashboard.user.account}
                  size="small"
                  color="inherit"
                  variant="text"
                >
                  {t('verify_now')}
                </Button>
              }
            >
              {t('verify_phone_to_save_changes')}
            </Alert>
          </Grid>
        )}

        <Grid xs={12}>
          <Card>
            <CardHeader
              title={t('hero_section')}
              subheader={t('hero_section_description')}
              titleTypographyProps={{ variant: 'h6' }}
            />
            <Divider />
            <Stack spacing={3} sx={{ p: { xs: 2, sm: 3 } }}>
              {fields.map((field) => (
                <SectionField key={field.key} field={field} t={t} />
              ))}
            </Stack>
          </Card>
        </Grid>

        <Grid xs={12}>
          <Stack
            direction="row"
            justifyContent="flex-end"
            spacing={2}
            sx={{ position: 'sticky', bottom: 0, py: 2, bgcolor: 'background.default', zIndex: 1 }}
          >
            <Button
              type="button"
              color="inherit"
              variant="text"
              onClick={() => reset(defaultValues)}
              disabled={!isDirty || isSubmitting}
            >
              {t('discard')}
            </Button>
            <VerificationGate>
              <LoadingButton type="submit" variant="contained" size="large" loading={isSubmitting} disabled={!isDirty}>
                {t('save_changes')}
              </LoadingButton>
            </VerificationGate>
          </Stack>
        </Grid>
      </Grid>
    </FormProvider>
  );
}

HeroForm.propTypes = {
  heroSection: PropTypes.object.isRequired,
  fields: PropTypes.array.isRequired,
  storeSlug: PropTypes.string,
  isPhoneVerified: PropTypes.bool.isRequired,
  onSaved: PropTypes.func.isRequired,
  enqueueSnackbar: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
};

// ----------------------------------------------------------------------
// Renders one catalog setting by its `input` kind.

function SectionField({ field, t }) {
  const label = field.label_key ? t(field.label_key) : field.key;
  const hint = field.hint_key ? t(field.hint_key) : undefined;

  switch (field.input) {
    case 'image':
      return <ImageFromLibraryField name={field.key} label={label} hint={hint} />;

    case 'select':
      return (
        <RHFSelect name={field.key} label={label} native>
          {(field.allowed_values || []).map((opt) => (
            <option key={opt} value={opt}>
              {t(`hero_layout_${opt}`)}
            </option>
          ))}
        </RHFSelect>
      );

    case 'link':
      return <RHFTextField name={field.key} label={label} helperText={hint} inputProps={{ dir: 'ltr' }} />;

    case 'textarea':
      return field.localized ? (
        <LocalizedTextField name={field.key} label={label} helperText={hint} multiline rows={3} t={t} />
      ) : (
        <RHFTextField name={field.key} label={label} helperText={hint} multiline rows={3} />
      );

    case 'text':
    default:
      return field.localized ? (
        <LocalizedTextField name={field.key} label={label} helperText={hint} t={t} />
      ) : (
        <RHFTextField name={field.key} label={label} helperText={hint} />
      );
  }
}

SectionField.propTypes = {
  field: PropTypes.object.isRequired,
  t: PropTypes.func.isRequired,
};

// ----------------------------------------------------------------------
// A text field with a per-language tab strip (value is a { ar, en, fr } map).

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
      // Never persist transient preview URLs (blob:/data:) — the storefront
      // can only load absolute http(s) URLs.
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
                <Box
                  component="img"
                  src={value}
                  alt={label}
                  sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </Box>
              <Stack spacing={0.5} sx={{ minWidth: 0, flexGrow: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {hint}
                </Typography>
                <Stack direction="row" spacing={2}>
                  <Link
                    component="button"
                    type="button"
                    underline="hover"
                    variant="caption"
                    onClick={() => setPickerOpen(true)}
                    sx={{ color: 'primary.main', fontWeight: 600 }}
                  >
                    {t('replace')}
                  </Link>
                  <Link
                    component="button"
                    type="button"
                    underline="hover"
                    variant="caption"
                    onClick={handleRemove}
                    sx={{ color: 'text.secondary', fontWeight: 600 }}
                  >
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
                transition: 'background-color 0.15s, border-color 0.15s',
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

          <MediaPickerDialog
            open={pickerOpen}
            onClose={() => setPickerOpen(false)}
            onSelect={handleSelect}
            multiple={false}
            title={t('pick_from_library')}
          />
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

function HeroSkeleton() {
  return (
    <Grid container spacing={3}>
      <Grid xs={12}>
        <Stack spacing={1}>
          <Skeleton variant="text" width={220} height={32} />
          <Skeleton variant="text" width={420} height={20} />
        </Stack>
      </Grid>
      <Grid xs={12}>
        <Card>
          <CardHeader
            title={<Skeleton variant="text" width={140} />}
            subheader={<Skeleton variant="text" width={280} />}
          />
          <Divider />
          <Stack spacing={3} sx={{ p: 3 }}>
            <Skeleton variant="rounded" height={100} />
            <Skeleton variant="rounded" height={100} />
            <Skeleton variant="rounded" height={56} />
            <Skeleton variant="rounded" height={56} />
          </Stack>
        </Card>
      </Grid>
    </Grid>
  );
}

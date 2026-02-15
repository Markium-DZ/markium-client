import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useRef, useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Fade from '@mui/material/Fade';
import { alpha } from '@mui/material/styles';

import axios, { endpoints } from 'src/utils/axios';
import { useTranslation } from 'react-i18next';

import FormProvider from 'src/components/hook-form/form-provider';
import RHFTextField from 'src/components/hook-form/rhf-text-field';
import { RHFSelect } from 'src/components/hook-form';
import { RHFUploadAvatar } from 'src/components/hook-form/rhf-upload';
import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

const RESERVED_SUBDOMAINS = [
  'be', 'be-test', 'staging', 'admin', 'api', 'www', 'mail', 'ftp', 'smtp',
  'pop', 'imap', 'webmail', 'dashboard', 'app', 'test', 'dev', 'development',
  'production', 'prod', 'demo', 'beta', 'alpha', 'support', 'help', 'docs',
  'status', 'blog', 'cdn', 'static', 'assets', 'media', 'uploads',
];

// ----------------------------------------------------------------------

function HintPanel({ activeField, t, storeSlugValue }) {
  const hints = {
    logo: {
      icon: 'solar:camera-bold-duotone',
      title: t('hint_logo_title'),
      description: t('hint_logo_description'),
      tip: t('hint_logo_tip'),
    },
    store_name: {
      icon: 'solar:shop-bold-duotone',
      title: t('hint_store_name_title'),
      description: t('hint_store_name_description'),
      example: t('hint_store_name_example'),
    },
    store_slug: {
      icon: 'solar:link-bold-duotone',
      title: t('hint_store_slug_title'),
      description: t('hint_store_slug_description'),
      preview: storeSlugValue
        ? `${storeSlugValue}.markium.online`
        : t('hint_store_slug_preview'),
      tip: t('hint_store_slug_tip'),
    },
    language: {
      icon: 'solar:translation-bold-duotone',
      title: t('hint_language_title'),
      description: t('hint_language_description'),
      tip: t('hint_language_tip'),
    },
  };

  const hint = hints[activeField];

  if (!hint) return null;

  return (
    <Stack spacing={2}>
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: 1.5,
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Iconify icon={hint.icon} width={28} sx={{ color: 'primary.main' }} />
      </Box>

      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
        {hint.title}
      </Typography>

      <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
        {hint.description}
      </Typography>

      {hint.example && (
        <Box
          sx={{
            px: 2,
            py: 1.5,
            borderRadius: 1,
            bgcolor: 'background.paper',
            border: (theme) => `1px dashed ${theme.palette.divider}`,
          }}
        >
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {hint.example}
          </Typography>
        </Box>
      )}

      {hint.preview && (
        <Box
          sx={{
            px: 2,
            py: 1.5,
            borderRadius: 1,
            bgcolor: 'background.paper',
            border: (theme) => `1px dashed ${theme.palette.divider}`,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Iconify icon="solar:global-outline" width={18} sx={{ color: 'text.disabled' }} />
          <Typography
            variant="body2"
            dir="ltr"
            sx={{ color: 'primary.main', fontWeight: 600, fontFamily: 'monospace' }}
          >
            {hint.preview}
          </Typography>
        </Box>
      )}

      {hint.tip && (
        <Stack
          direction="row"
          spacing={1}
          alignItems="flex-start"
          sx={{
            px: 2,
            py: 1.5,
            borderRadius: 1,
            bgcolor: (theme) => alpha(theme.palette.info.main, 0.06),
          }}
        >
          <Iconify
            icon="solar:info-circle-outline"
            width={18}
            sx={{ color: 'info.main', mt: 0.2, flexShrink: 0 }}
          />
          <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
            {hint.tip}
          </Typography>
        </Stack>
      )}
    </Stack>
  );
}

HintPanel.propTypes = {
  activeField: PropTypes.string,
  t: PropTypes.func.isRequired,
  storeSlugValue: PropTypes.string,
};

// ----------------------------------------------------------------------

function generateSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics (é -> e, etc.)
    .replace(/[^a-z0-9\s-]/g, '')    // Keep only lowercase latin, digits, spaces, hyphens
    .trim()
    .replace(/\s+/g, '-')            // Replace spaces with hyphens
    .replace(/-+/g, '-')             // Collapse multiple hyphens
    .replace(/^-|-$/g, '');          // Remove leading/trailing hyphens
}

// ----------------------------------------------------------------------

export default function StoreSetupBasics({ onNext }) {
  const { t } = useTranslation();
  const [errorMsg, setErrorMsg] = useState('');
  const [activeField, setActiveField] = useState(null);
  const [panelTop, setPanelTop] = useState(0);
  const blurTimeout = useRef(null);
  const containerRef = useRef(null);
  const fieldRefs = useRef({});
  const lastAutoSlug = useRef('');

  const handleFieldFocus = useCallback((field) => {
    clearTimeout(blurTimeout.current);
    setActiveField(field);
    // Calculate offset relative to the container
    const fieldEl = fieldRefs.current[field];
    const containerEl = containerRef.current;
    if (fieldEl && containerEl) {
      const fieldRect = fieldEl.getBoundingClientRect();
      const containerRect = containerEl.getBoundingClientRect();
      setPanelTop(fieldRect.top - containerRect.top);
    }
  }, []);

  const handleFieldBlur = useCallback(() => {
    // Small delay so clicking another field cancels the hide
    blurTimeout.current = setTimeout(() => {
      setActiveField(null);
    }, 150);
  }, []);

  const BasicsSchema = Yup.object().shape({
    store_name: Yup.string().required(t('store_name_required')),
    store_slug: Yup.string()
      .required(t('store_slug_required'))
      .min(3, t('store_slug_min_length'))
      .max(30, t('store_slug_max_length'))
      .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, t('store_slug_invalid_format'))
      .test('no-start-end-hyphen', t('store_slug_no_hyphen_edges'), (value) => {
        if (!value) return false;
        return !value.startsWith('-') && !value.endsWith('-');
      })
      .test('not-reserved', t('store_slug_reserved'), (value) => {
        if (!value) return false;
        return !RESERVED_SUBDOMAINS.includes(value.toLowerCase());
      }),
    language: Yup.string()
      .required(t('language_required'))
      .oneOf(['ar', 'fr', 'en'], t('language_required')),
    logo: Yup.mixed().nullable(),
  });

  const methods = useForm({
    resolver: yupResolver(BasicsSchema),
    defaultValues: {
      store_name: '',
      store_slug: '',
      language: 'ar',
      logo: null,
    },
  });

  const {
    watch,
    setValue,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = methods;

  const storeNameValue = watch('store_name');
  const storeSlugValue = watch('store_slug');
  const isReservedSlug = storeSlugValue && RESERVED_SUBDOMAINS.includes(storeSlugValue.toLowerCase());

  // Auto-generate slug from store name (stops if user manually edits the slug)
  useEffect(() => {
    const newSlug = generateSlug(storeNameValue || '');
    if (storeSlugValue === lastAutoSlug.current) {
      setValue('store_slug', newSlug, { shouldValidate: !!newSlug });
      lastAutoSlug.current = newSlug;
    }
  }, [storeNameValue, storeSlugValue, setValue]);

  const handleDrop = useCallback(
    (acceptedFiles) => {
      const file = acceptedFiles[0];
      const newFile = Object.assign(file, {
        preview: URL.createObjectURL(file),
      });
      setValue('logo', newFile, { shouldValidate: true });
    },
    [setValue]
  );

  const onSubmit = handleSubmit(async (data) => {
    try {
      setErrorMsg('');
      const formData = new FormData();
      formData.append('name', data.store_name);
      formData.append('slug', data.store_slug);
      formData.append('language', data.language);
      if (data.logo instanceof File) {
        formData.append('logo', data.logo);
      }

      await axios.post(endpoints.storeSetup.basics, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      onNext();
    } catch (error) {
      console.error(error);
      const message = error.error?.message || '';
      const details = error.error?.details ? Object.values(error.error.details).flat().join(' ') : '';
      setErrorMsg(`${message} ${details}`.trim() || t('operation_failed'));
    }
  });

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      {/* Relative container so the hint panel can be absolutely positioned */}
      <Box ref={containerRef} sx={{ position: 'relative' }}>
        {/* Centered form */}
        <Stack spacing={3} sx={{ maxWidth: 520, mx: 'auto' }}>
          {!!errorMsg && (
            <Alert severity="error">{errorMsg}</Alert>
          )}

          <Box
            ref={(el) => { fieldRefs.current.logo = el; }}
            sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}
            onFocus={() => handleFieldFocus('logo')}
            onBlur={handleFieldBlur}
            onClick={() => handleFieldFocus('logo')}
          >
            <RHFUploadAvatar
              name="logo"
              onDrop={handleDrop}
              uploadText={t('upload_photo')}
              updateText={t('update_photo')}
              accept={{ 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.heic', '.heif', '.avif', '.bmp', '.tiff', '.tif', '.svg'] }}
            />
            <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center' }}>
              {t('store_logo_hint')}
            </Typography>
          </Box>

          <Box ref={(el) => { fieldRefs.current.store_name = el; }}>
            <RHFTextField
              name="store_name"
              label={<>{t('store_name')} <span style={{ color: 'red' }}>*</span></>}
              placeholder={t('store_name_hint')}
              onFocus={() => handleFieldFocus('store_name')}
              onBlur={handleFieldBlur}
            />
          </Box>

          <Box ref={(el) => { fieldRefs.current.store_slug = el; }}>
            <RHFTextField
              name="store_slug"
              label={<>{t('store_slug')} <span style={{ color: 'red' }}>*</span></>}
              placeholder={t('store_slug_placeholder')}
              onFocus={() => handleFieldFocus('store_slug')}
              onBlur={handleFieldBlur}
              error={!!errors.store_slug || isReservedSlug}
              helperText={
                <Box component="span" sx={{ display: 'block', mt: 0.5 }}>
                  {isReservedSlug && !errors.store_slug && (
                    <Typography variant="caption" color="error" sx={{ display: 'block', mb: 0.5 }}>
                      {t('store_slug_reserved')}
                    </Typography>
                  )}
                  {errors.store_slug && (
                    <Typography variant="caption" color="error" sx={{ display: 'block', mb: 0.5 }}>
                      {errors.store_slug.message}
                    </Typography>
                  )}
                  {!errors.store_slug && !isReservedSlug && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {t('store_slug_helper')}
                    </Typography>
                  )}
                  {storeSlugValue && !isReservedSlug && !errors.store_slug && (
                    <Typography
                      variant="caption"
                      color="primary.main"
                      sx={{ display: 'block', mt: 0.5, fontWeight: 600 }}
                    >
                      {t('your_store_url')}: {storeSlugValue}.markium.online
                    </Typography>
                  )}
                </Box>
              }
            />
          </Box>

          <Box
            ref={(el) => { fieldRefs.current.language = el; }}
            onFocus={() => handleFieldFocus('language')}
            onBlur={handleFieldBlur}
            onClick={() => handleFieldFocus('language')}
          >
            <RHFSelect name="language" label={<>{t('store_language')} <span style={{ color: 'red' }}>*</span></>}>
              <MenuItem value="ar">{t('arabic')}</MenuItem>
              <MenuItem value="fr">{t('french')}</MenuItem>
              <MenuItem value="en">{t('english')}</MenuItem>
            </RHFSelect>
          </Box>

          <LoadingButton
            fullWidth
            size="large"
            type="submit"
            variant="contained"
            loading={isSubmitting}
            onFocus={() => setActiveField(null)}
          >
            {t('next')}
          </LoadingButton>
        </Stack>

        {/* Floating hint panel — absolutely positioned, hidden on mobile */}
        <Fade in={!!activeField}>
          <Paper
            elevation={0}
            sx={{
              display: { xs: 'none', lg: 'block' },
              position: 'absolute',
              top: panelTop,
              insetInlineStart: 'calc(50% + 290px)',
              width: 300,
              p: 3,
              borderRadius: 2,
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
              border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
              transition: 'top 0.25s ease',
            }}
          >
            <HintPanel activeField={activeField} t={t} storeSlugValue={storeSlugValue} />
          </Paper>
        </Fade>
      </Box>
    </FormProvider>
  );
}

StoreSetupBasics.propTypes = {
  onNext: PropTypes.func.isRequired,
};

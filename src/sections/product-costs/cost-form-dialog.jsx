import PropTypes from 'prop-types';
import * as Yup from 'yup';
import { useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Box,
  Typography,
  Autocomplete,
  TextField,
  InputAdornment,
  Collapse,
  Avatar,
  Card,
  Tooltip,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import LoadingButton from '@mui/lab/LoadingButton';

import { useTranslate } from 'src/locales';
import { useSnackbar } from 'src/components/snackbar';
import FormProvider, { RHFTextField } from 'src/components/hook-form';
import Iconify from 'src/components/iconify';
import { fNumber } from 'src/utils/format-number';
import { createProductCost, updateProductCost } from 'src/api/product-costs';
import showError from 'src/utils/show_error';

import { COST_TYPES, MARKETING_CHANNELS, SCOPE_OPTIONS } from './constants';

export default function CostFormDialog({
  open,
  onClose,
  productId,
  currentCost,
  variants,
  optionDefinitions,
  onSuccess,
}) {
  const { t } = useTranslate();
  const { enqueueSnackbar } = useSnackbar();
  const isEdit = !!currentCost;

  const CostSchema = useMemo(
    () =>
      Yup.object().shape({
        type: Yup.string().required(t('cost_type') + ' ' + t('name_is_required')).oneOf(COST_TYPES.map((ct) => ct.value)),
        scope: Yup.string().required().oneOf(['per_unit', 'global']),
        amount: Yup.number()
          .typeError(t('amount') + ' ' + t('name_is_required'))
          .required(t('amount') + ' ' + t('name_is_required'))
          .min(0)
          .max(99999999.99),
        custom_type_name: Yup.string().when('type', {
          is: 'custom',
          then: (schema) => schema.required(t('custom_type_name') + ' ' + t('name_is_required')),
          otherwise: (schema) => schema.nullable(),
        }),
        campaign_name: Yup.string().when('type', {
          is: 'marketing',
          then: (schema) => schema.required(t('campaign_name') + ' ' + t('name_is_required')),
          otherwise: (schema) => schema.nullable(),
        }),
        channel: Yup.string().when('type', {
          is: 'marketing',
          then: (schema) => schema.required(t('channel') + ' ' + t('name_is_required')).oneOf(MARKETING_CHANNELS.map((ch) => ch.value)),
          otherwise: (schema) => schema.nullable(),
        }),
        variant_id: Yup.mixed()
          .transform((value) => (value === 'all' || value === '' ? null : Number(value)))
          .nullable(),
        notes: Yup.string().max(1000).nullable(),
      }),
    [t]
  );

  const defaultValues = useMemo(
    () => ({
      type: currentCost?.type || 'buy_price',
      scope: currentCost?.scope || 'per_unit',
      amount: currentCost?.amount ? Number(currentCost.amount) : '',
      custom_type_name: currentCost?.custom_type_name || '',
      campaign_name: currentCost?.campaign_name || '',
      channel: currentCost?.channel || '',
      variant_id: currentCost?.variant_id || 'all',
      notes: currentCost?.notes || '',
    }),
    [currentCost]
  );

  const methods = useForm({
    resolver: yupResolver(CostSchema),
    defaultValues,
  });

  const {
    reset,
    watch,
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const watchType = watch('type');

  const ALL_VARIANTS_OPTION = { id: 'all', _isAll: true };
  const variantOptions = [ALL_VARIANTS_OPTION, ...(variants || [])];

  const getVariantLabel = (v) => {
    if (!v) return '';
    const optLabels = (v.options || []).map((opt) => {
      const def = optionDefinitions?.find((d) => d.id === opt.option_definition_id);
      const val = def?.values?.find((vl) => vl.id === opt.value_id);
      return val?.value || '';
    }).filter(Boolean);
    return optLabels.length > 0 ? optLabels.join(' / ') : (v.sku || `#${v.id}`);
  };

  useEffect(() => {
    reset(defaultValues);
  }, [currentCost, reset, defaultValues]);

  const handleSave = async (data, addAnother = false) => {
    try {
      const body = {
        type: data.type,
        scope: data.scope,
        amount: data.amount,
        currency: 'DZD',
      };

      if (data.type === 'custom') body.custom_type_name = data.custom_type_name;
      if (data.type === 'marketing') {
        body.campaign_name = data.campaign_name;
        body.channel = data.channel;
      }
      if (data.variant_id) body.variant_id = data.variant_id;
      if (data.notes) body.notes = data.notes;

      if (isEdit) {
        await updateProductCost(productId, currentCost.id, body);
        enqueueSnackbar(t('cost_updated'), { variant: 'success' });
      } else {
        await createProductCost(productId, body);
        enqueueSnackbar(t('cost_created'), { variant: 'success' });
      }

      onSuccess?.();

      if (addAnother) {
        reset({
          type: data.type,
          scope: data.scope,
          amount: '',
          custom_type_name: '',
          campaign_name: '',
          channel: data.channel || '',
          variant_id: 'all',
          notes: '',
        });
      } else {
        onClose();
      }
    } catch (err) {
      showError(err);
    }
  };

  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={onClose}>
      <DialogTitle>{isEdit ? t('edit_cost') : t('add_cost')}</DialogTitle>

      <FormProvider methods={methods}>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Controller
              name="type"
              control={methods.control}
              render={({ field, fieldState: { error } }) => {
                const selected = COST_TYPES.find((ct) => ct.value === field.value);
                return (
                  <Autocomplete
                    value={selected || null}
                    onChange={(_, newVal) => {
                      field.onChange(newVal?.value || '');
                    }}
                    options={COST_TYPES}
                    getOptionLabel={(opt) => t(opt.labelKey)}
                    disableClearable
                    blurOnSelect
                    isOptionEqualToValue={(opt, val) => opt.value === val?.value}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={t('cost_type')}
                        placeholder={t('type_or_select_cost')}
                        error={!!error}
                        helperText={error?.message}
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <>
                              <InputAdornment position="start">
                                <Box
                                  sx={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 0.75,
                                    bgcolor: (theme) => alpha(selected?.hexColor || theme.palette.grey[500], 0.12),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <Iconify
                                    icon={selected?.icon || 'solar:tag-price-bold-duotone'}
                                    width={16}
                                    sx={{ color: selected?.hexColor || 'text.disabled' }}
                                  />
                                </Box>
                              </InputAdornment>
                              {params.InputProps.startAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                    renderOption={(props, opt) => (
                      <li {...props} key={opt.value}>
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 0.5 }}>
                          <Box
                            sx={{
                              width: 36,
                              height: 36,
                              borderRadius: 1,
                              bgcolor: (theme) => alpha(opt.hexColor, 0.12),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <Iconify icon={opt.icon} width={20} sx={{ color: opt.hexColor }} />
                          </Box>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={600}>
                              {t(opt.labelKey)}
                            </Typography>
                            <Typography variant="caption" color="text.disabled">
                              {t(opt.descriptionKey)}
                            </Typography>
                          </Box>
                        </Stack>
                      </li>
                    )}
                  />
                );
              }}
            />

            <Collapse in={watchType === 'marketing'} unmountOnExit>
              <Stack
                spacing={2}
                sx={{
                  p: 2,
                  borderRadius: 1.5,
                  bgcolor: (theme) => alpha(theme.palette.warning.main, 0.04),
                  border: (theme) => `1px dashed ${alpha(theme.palette.warning.main, 0.2)}`,
                }}
              >
                <RHFTextField name="campaign_name" label={t('campaign_name')} inputProps={{ dir: 'auto' }} />

                <Controller
                  name="channel"
                  control={methods.control}
                  render={({ field, fieldState: { error } }) => {
                    const selectedChannel = MARKETING_CHANNELS.find((ch) => ch.value === field.value);
                    return (
                      <Autocomplete
                        value={selectedChannel || null}
                        onChange={(_, newVal) => field.onChange(newVal?.value || '')}
                        options={MARKETING_CHANNELS}
                        getOptionLabel={(opt) => t(opt.labelKey)}
                        disableClearable
                        isOptionEqualToValue={(opt, val) => opt.value === val?.value}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label={t('channel')}
                            error={!!error}
                            helperText={error?.message}
                            InputProps={{
                              ...params.InputProps,
                              startAdornment: selectedChannel ? (
                                <>
                                  <InputAdornment position="start">
                                    <Iconify icon={selectedChannel.icon} width={20} />
                                  </InputAdornment>
                                  {params.InputProps.startAdornment}
                                </>
                              ) : params.InputProps.startAdornment,
                            }}
                          />
                        )}
                        renderOption={(props, opt) => (
                          <li {...props} key={opt.value}>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <Iconify icon={opt.icon} width={22} />
                              <Typography variant="body2" fontWeight={500}>{t(opt.labelKey)}</Typography>
                            </Stack>
                          </li>
                        )}
                      />
                    );
                  }}
                />
              </Stack>
            </Collapse>

            <Collapse in={watchType === 'custom'} unmountOnExit>
              <Stack
                spacing={2}
                sx={{
                  p: 2,
                  borderRadius: 1.5,
                  bgcolor: (theme) => alpha(theme.palette.error.main, 0.04),
                  border: (theme) => `1px dashed ${alpha(theme.palette.error.main, 0.2)}`,
                }}
              >
                <RHFTextField name="custom_type_name" label={t('custom_type_name')} inputProps={{ dir: 'auto' }} />
              </Stack>
            </Collapse>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1.5 }}>{t('scope')}</Typography>
              <Stack direction="row" spacing={1.5}>
                {SCOPE_OPTIONS.map((opt) => {
                  const isSelected = watch('scope') === opt.value;
                  return (
                    <Card
                      key={opt.value}
                      onClick={() => setValue('scope', opt.value)}
                      sx={{
                        flex: 1,
                        p: 2,
                        cursor: 'pointer',
                        border: (theme) => `1.5px solid ${isSelected ? theme.palette.primary.main : alpha(theme.palette.grey[500], 0.16)}`,
                        bgcolor: (theme) => isSelected ? alpha(theme.palette.primary.main, 0.04) : 'transparent',
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          borderColor: (theme) => isSelected ? theme.palette.primary.main : theme.palette.grey[400],
                        },
                      }}
                    >
                      <Stack spacing={0.75}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Iconify
                            icon={opt.icon}
                            width={20}
                            sx={{ color: isSelected ? 'primary.main' : 'text.disabled' }}
                          />
                          <Typography variant="subtitle2" fontWeight={600}>
                            {t(opt.labelKey)}
                          </Typography>
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          {t(opt.descriptionKey)}
                        </Typography>
                      </Stack>
                    </Card>
                  );
                })}
              </Stack>
            </Box>

            <RHFTextField
              name="amount"
              label={t('amount')}
              type="number"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Typography variant="subtitle2" color="text.secondary">{t('currency_da')}</Typography>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& input[type=number]': { MozAppearance: 'textfield' },
                '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': { WebkitAppearance: 'none', margin: 0 },
              }}
            />

            {watchType === 'buy_price' && variants?.length > 0 && (
              <Controller
                name="variant_id"
                control={methods.control}
                render={({ field }) => {
                  const selectedVariant = field.value === 'all'
                    ? ALL_VARIANTS_OPTION
                    : variants?.find((v) => v.id === field.value) || ALL_VARIANTS_OPTION;
                  return (
                    <Autocomplete
                      value={selectedVariant}
                      onChange={(_, newVal) => {
                        field.onChange(newVal?._isAll ? 'all' : newVal?.id || 'all');
                      }}
                      options={variantOptions}
                      getOptionLabel={(opt) => opt._isAll ? t('all_variants') : getVariantLabel(opt)}
                      disableClearable
                      isOptionEqualToValue={(opt, val) => {
                        if (opt._isAll && val._isAll) return true;
                        return opt.id === val?.id;
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label={t('variant')}
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <>
                                {!selectedVariant?._isAll && selectedVariant?.media?.[0]?.full_url && (
                                  <InputAdornment position="start">
                                    <Avatar
                                      src={selectedVariant.media[0].full_url}
                                      variant="rounded"
                                      sx={{ width: 28, height: 28 }}
                                    />
                                  </InputAdornment>
                                )}
                                {params.InputProps.startAdornment}
                              </>
                            ),
                          }}
                        />
                      )}
                      renderOption={(props, opt) => (
                        <li {...props} key={opt._isAll ? 'all' : opt.id}>
                          {opt._isAll ? (
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <Box
                                sx={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: 1,
                                  bgcolor: (theme) => alpha(theme.palette.info.main, 0.08),
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Iconify icon="solar:layers-bold-duotone" width={20} sx={{ color: 'info.main' }} />
                              </Box>
                              <Typography variant="body2" fontWeight={600}>{t('all_variants')}</Typography>
                            </Stack>
                          ) : (
                            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: '100%' }}>
                              <Avatar
                                src={opt.media?.[0]?.full_url || ''}
                                variant="rounded"
                                sx={{ width: 36, height: 36, bgcolor: 'background.neutral' }}
                              />
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="body2" fontWeight={600} noWrap>
                                  {getVariantLabel(opt)}
                                </Typography>
                                <Typography variant="caption" color="text.disabled">
                                  {opt.price ? `${fNumber(opt.price)} ${t('currency_da')}` : ''}
                                  {opt.sku ? ` · ${opt.sku}` : ''}
                                </Typography>
                              </Box>
                            </Stack>
                          )}
                        </li>
                      )}
                    />
                  );
                }}
              />
            )}

            <RHFTextField name="notes" label={t('notes')} multiline rows={2} />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" color="inherit" onClick={onClose}>
            {t('cancel')}
          </Button>

          {!isEdit && (
            <LoadingButton
              variant="outlined"
              loading={isSubmitting}
              onClick={handleSubmit((data) => handleSave(data, true))}
            >
              {t('save_and_add_another')}
            </LoadingButton>
          )}

          <LoadingButton
            variant="contained"
            loading={isSubmitting}
            onClick={handleSubmit((data) => handleSave(data, false))}
          >
            {isEdit ? t('save_changes') : t('add_cost')}
          </LoadingButton>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
}

CostFormDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  productId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  currentCost: PropTypes.object,
  variants: PropTypes.array,
  optionDefinitions: PropTypes.array,
  onSuccess: PropTypes.func,
};

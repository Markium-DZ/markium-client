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

            {watchType === 'marketing' && (
              <>
                <RHFTextField name="campaign_name" label={t('campaign_name')} />
                <RHFSelect name="channel" label={t('channel')}>
                  {MARKETING_CHANNELS.map((ch) => (
                    <MenuItem key={ch.value} value={ch.value}>
                      {t(ch.labelKey)}
                    </MenuItem>
                  ))}
                </RHFSelect>
              </>
            )}

            {watchType === 'custom' && (
              <RHFTextField name="custom_type_name" label={t('custom_type_name')} />
            )}

            <FormControl>
              <FormLabel>{t('scope')}</FormLabel>
              <RadioGroup
                row
                value={watch('scope')}
                onChange={(e) => setValue('scope', e.target.value)}
              >
                {SCOPE_OPTIONS.map((opt) => (
                  <FormControlLabel
                    key={opt.value}
                    value={opt.value}
                    control={<Radio />}
                    label={t(opt.labelKey)}
                  />
                ))}
              </RadioGroup>
            </FormControl>

            <RHFTextField name="amount" label={t('amount')} type="number" InputProps={{ endAdornment: 'DZD' }} />

            {watchType === 'buy_price' && variants?.length > 0 && (
              <RHFSelect name="variant_id" label={t('variant')}>
                <MenuItem value="all">{t('all_variants')}</MenuItem>
                {variants.map((v) => (
                  <MenuItem key={v.id} value={v.id}>
                    {v.name || v.title || `#${v.id}`}
                  </MenuItem>
                ))}
              </RHFSelect>
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

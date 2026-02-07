import PropTypes from 'prop-types';
import { differenceInDays } from 'date-fns';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Collapse from '@mui/material/Collapse';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';

import { useBoolean } from 'src/hooks/use-boolean';

import { fCurrency } from 'src/utils/format-number';
import { fDate, fTime } from 'src/utils/format-time';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import CustomPopover, { usePopover } from 'src/components/custom-popover';
import { useLocales, useTranslate } from 'src/locales';
import { Card, FormHelperText, Link } from '@mui/material';

import * as Yup from 'yup';
import { useMemo, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import Switch from '@mui/material/Switch';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import FormControlLabel from '@mui/material/FormControlLabel';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { useSnackbar } from 'src/components/snackbar';
import FormProvider, { RHFTextField, RHFUpload, } from 'src/components/hook-form';

import showError from 'src/utils/show_error';
import { deleteRole } from 'src/api/users';
import SimpleAutocomplete from 'src/components/hook-form/rhf-simple-autocomplete';



export function DeleteCurrentRole({ odo, id, close,role, roles,setCarDetails }) {
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslate();

  const NewUserSchema = Yup.object().shape({
    replacement_role_id: Yup.number().positive().required(t('validation_required')),
  });

  const defaultValues = useMemo(
    () => ({
      replacement_role_id: 0
    }),
    []
  );

  const methods = useForm({
    resolver: yupResolver(NewUserSchema),
    defaultValues,
  });

  const {
    reset,
    watch,
    control,
    setValue,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = methods;
  const onSubmit = handleSubmit(async (data) => {
    try {
      const response = await deleteRole(id, {replacement_role_id:data?.replacement_role_id});
      enqueueSnackbar(t("operation_success"), { variant: 'success' });
      close();
    } catch (error) {
      console.error(error);
      showError(error)
    }
  });





  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid xs={12} md={12} sx={{ mt: 3 }}>
           <SimpleAutocomplete  required options={roles} name="replacement_role_id" label={t('replacement_role_id')} placeholder={t('search_by')} />
          {/* <FormHelperText id="component-helper-text">
            {t("must_be_grater_then_old")}
          </FormHelperText> */}
          <Stack alignItems="flex-end" sx={{ mt: 3 }}>
            <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
              {t("submit")}
            </LoadingButton>
          </Stack>
        </Grid>
      </Grid>
    </FormProvider>
  )
}

import FormProvider, { RHFTextField, RHFSelect, RHFAutocomplete, RHFSwitch } from 'src/components/hook-form';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useSnackbar } from 'notistack';
import { useRouter } from 'src/routes/hooks';
import { Box, Card, Grid, Stack } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { t } from 'i18next';
import SimpleAutocomplete from 'src/components/hook-form/rhf-simple-autocomplete';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import RHFTextarea from 'src/components/hook-form/RHFTextarea';
import { renderActionsCell } from '@mui/x-data-grid';
import showError from 'src/utils/show_error';
import { useEffect } from 'react';
import showValidationError from 'src/utils/show_validation_error';

export default function ZaityDynamicForm({ currentItem = {}, schema, fields, onSubmit }) {
  const methods = useForm({
    resolver: yupResolver(schema),
    defaultValues: currentItem,
  });

  const {
    reset,
    watch,
    setValue,
    handleSubmit,
    formState: { isSubmitting ,errors},
  } = methods;
  const values = watch();

  // useEffect(()=>{
  //   showValidationError(errors)
  // },[errors])

  const { enqueueSnackbar } = useSnackbar();
  const router = useRouter();

  const handleFormSubmit = handleSubmit(async (data) => {
    try {
      await onSubmit(data, () => { });
      enqueueSnackbar(t("operation_success"), { variant: 'success' });
      reset();
    } catch (error) {
      console.error(error);
      showError(error)
    }
  });

  return (
    <FormProvider methods={methods} onSubmit={handleFormSubmit}>
      <Grid container spacing={3}>
        <Grid xs={12} md={8}>
          <Card sx={{ p: 3 }}>
            <Box
              rowGap={3}
              columnGap={2}
              display="grid"
              gridTemplateColumns={{
                xs: 'repeat(1, 1fr)',
                sm: 'repeat(1, 1fr)',
              }}
            >
              {fields?.map((field) => (
                <DynamicFormField key={field.name} field={field} values={values}  setValue={setValue} />
              ))}
            </Box>
            <Stack direction="row" justifyContent="flex-end" sx={{ mt: 3 }}>
              <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
                {t("submit")}
              </LoadingButton>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </FormProvider>
  );
}



// src/components/custom-form/DynamicFormField.js


export function DynamicFormField({ field, options = {}, values,setValue }) {
  const { name, label, type, required, data = [], ...rest } = field;

  switch (type) {
    case 'text':
    case 'number':
    case 'email':
      return <RHFTextField required={required} type={type} name={name} label={label} {...rest} />;
    case 'textarea':
      return <RHFTextarea required={required} type={type} name={name} label={label} {...rest} />;

    case 'select':
      return (
        <RHFSelect required={required} name={name} label={label} {...rest}>
          <Divider sx={{ borderStyle: 'dashed' }} />
          {data.map((option) => (
            <MenuItem key={option.id || option.value} value={option.id || option.value}>
              {option.label || option.name || option.key}
            </MenuItem>
          ))}
        </RHFSelect>
      );

    case 'autocomplete':
      return (
        <SimpleAutocomplete
          required={required}
          name={name}
          label={label}
          options={data}
          getOptionLabel={(option) => option.label || option.name || option.key}
          {...rest}
        />
      );

    case 'switch':
      return <RHFSwitch name={name} label={label} {...rest} />;

    case 'date':
      return <DatePicker
        label={label}
        format="dd/MM/yyyy"
        value={values?.[name] ? new Date(values?.[name]) : new Date()}
        onChange={(date) => setValue(name, date)}
        slotProps={{
          textField: {
            fullWidth: true,
          },
        }}
      />

    case 'condition':
      if (field.condition(values[field?.conditionKey])) {
        return <DynamicFormField field={{ ...field, type: field?.conditionType }} value={values} setValue={setValue} />;
      }
      else return  null


    default:
      return <RHFTextField required={required} name={name} label={label} {...rest} />;
  }
  // return <RHFTextField type="date" required={required} name={name} label={label} {...rest} />;
}

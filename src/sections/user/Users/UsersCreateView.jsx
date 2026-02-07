import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useMemo, useCallback, useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { format, getTime, formatDistanceToNow } from 'date-fns';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Grid from '@mui/material/Unstable_Grid2';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import LoadingButton from '@mui/lab/LoadingButton';
import FormControlLabel from '@mui/material/FormControlLabel';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fData } from 'src/utils/format-number';

import { useSnackbar } from 'src/components/snackbar';
import FormProvider, { RHFTextField, RHFSelect, RHFMultiSelect } from 'src/components/hook-form';

import { useLocales, useTranslate } from 'src/locales';

import { useValues } from 'src/api/utils';
import { changeUserPasswordByAdmin, createUser, updateUser, useRoles } from 'src/api/users';
import Label from 'src/components/label';
import showError from 'src/utils/show_error';
import { useSettingsContext } from 'src/components/settings';
import { Container, IconButton, InputAdornment } from '@mui/material';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { useBoolean } from 'src/hooks/use-boolean';
import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function UsersCreateView({ currentUser }) {
  const router = useRouter();
  const settings = useSettingsContext();
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslate();
  const { roles } = useRoles()
  const { currentLang } = useLocales()
  const password2 = useBoolean();
  const password3 = useBoolean();


  const validationSchema = Yup.object({
    name: Yup.string().required(t('name_required')),
   username: Yup.string()
  .required(t('username_required'))
  .min(3, t('username_min_length'))
  .max(30, t('username_max_length'))
  .matches(/^[a-zA-Z][a-zA-Z0-9_.]*$/, t('username_invalid_format'))
  .matches(/^[a-zA-Z0-9_.]+$/, t('username_invalid_characters'))
  .test('no-spaces', t('username_no_spaces'), (value) => {
    return value ? !value.includes(' ') : true;
  }),
    email: Yup.string()
      .email(t('email_invalid'))
      .required(t('email_required')),
    // phone_number: Yup.string()
    //   .required(t('phone_number_required'))
    //   .matches(/^\d{10}$/, t('phone_number_must_be_10_digits')),

    phone_number: Yup.string()
      .required(t('phone_number_required'))
      .matches(/^05\d{8}$/, t('phone_number_must_be_10_digits_starting_with_05')),

    password: Yup.string().when('$currentUser', {
      is: (val) => !val,
      then: (schema) =>
        schema.required(t('password_required')),
      otherwise: (schema) => schema.notRequired(),
    }),

    password_confirmation: Yup.string().when('$currentUser', {
      is: (val) => !val,
      then: (schema) =>
        schema
          .required(t('password_confirmation_required'))
          .oneOf([Yup.ref('password'), null], t('passwords_must_match')),
      otherwise: (schema) => schema.notRequired(),
    }),

    role_id: Yup.array()
      .min(1, t('at_least_one_role_required')),
  });

  const passwordValidationSchema = Yup.object({
    new_password: Yup.string().required(t('new_password_required')),
    confirm_password: Yup.string()
      .required(t('confirm_password_required'))
      .oneOf([Yup.ref('new_password'), null], t('passwords_must_match')),
  });

  const defaultValues = useMemo(
    () => ({
      name: currentUser?.name || '',
      username: currentUser?.username || null,
      email: currentUser?.email || '',
      phone_number: currentUser?.phone_number || null,
      // password: currentUser?.password || '',
      // role_id: currentUser?.role_id || "",
      role_id: currentUser?.role_id || [],
    }),
    [currentUser]
  );


  const methods = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues,
  });
  const methods2 = useForm({
    resolver: yupResolver(passwordValidationSchema),
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
  const {
    handleSubmit: handlePasswordSubmit,
    formState: { isSubmitting: isPasswordSubmitting },
  } = methods2;


  const values = watch();


  useEffect(() => {
    if (currentUser?.id) {
      setValue('name', currentUser?.name);
      setValue('username', currentUser?.username);
      setValue('email', currentUser?.email);
      setValue('phone_number', currentUser?.phone_number);
      // setValue('password', currentUser?.password);
      setValue('role_id', currentUser?.roles.map((role) => role.id));
    }
    console.log("currentUser : ", currentUser);

  }, [currentUser, setValue]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      const body = data;

      if (currentUser?.id) {
        console.log("body : ", body);
        const res = await updateUser(currentUser?.id, body)
      } else {
        console.log("body :", body);
        const res = await createUser(body)
        console.log("res : ", res);
      }
      reset();
      enqueueSnackbar(t("operation_success"));
      router.push(paths.dashboard.user.list);
      // v9W6FPLF hamed
    } catch (error) {
      console.error(error);
      showError(error);
    }
  });



  return (
    <>
      <Container maxWidth={settings.themeStretch ? false : 'lg'}>
        <CustomBreadcrumbs
          heading={currentUser?.id ? t('edit_user') : t("add_user")}
          links={[
            {
              name: t('dashboard'),
              href: paths.dashboard.root,
            },
            {
              name: t('users'),
              href: paths.dashboard.user.root,
            },
            { name: currentUser?.id ? t('edit_user') : t("add_user") },
          ]}
          sx={{
            mb: { xs: 3, md: 5 },
          }}
        />
        <FormProvider methods={methods} onSubmit={onSubmit}>
          <Grid container spacing={3}>
            <Grid xs={12} md={8}>
              <Card sx={{ p: 3 }}>
                <Box
                  rowGap={3}
                  columnGap={2}
                  display="grid"
                  gridTemplateColumns={{
                    xs: 'repeat(1, 1fr)',
                    sm: 'repeat(2, 1fr)',
                  }}
                >
                  {/* Name */}
                  <RHFTextField name="name" label={t('name')} />
                  <RHFTextField name="username" label={t('username')} />
                  <RHFTextField name="email" label={t('email')} type="email" />
                  <RHFTextField
                    name="phone_number"
                    type="text"
                    label={t('phone_number')}
                    error={
                      !values.phone_number ? false : !/^05\d{8}$/.test(values.phone_number)
                    }
                    helperText={
                      !values.phone_number
                        ? null
                        : !/^05\d{8}$/.test(values.phone_number)
                          ? t('phone_number_must_be_10_digits_starting_with_05')
                          : ''
                    }
                  />

                  {/* {currentUser ? null : <RHFTextField name="password" label={t('password')} />}
                  {currentUser ? null : <RHFTextField name="password_confirmation" label={t('confirm_password')} />} */}
                  {
                    currentUser ?
                      null
                      :
                      <>
                        <RHFTextField
                          name="password"
                          label={t('password')}
                          type={password2.value ? 'text' : 'password'}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton onClick={password2.onToggle} edge="end">
                                  <Iconify icon={password2.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                        />
                        <RHFTextField
                          name="password_confirmation"
                          label={t('confirm_password')}
                          type={password3.value ? 'text' : 'password'}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton onClick={password3.onToggle} edge="end">
                                  <Iconify icon={password3.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                        />
                      </>
                  }
                </Box>
                <Box
                  rowGap={3}
                  columnGap={2}
                  display="grid"
                  mt={4}
                  gridTemplateColumns={{
                    xs: 'repeat(1, 1fr)',
                    sm: 'repeat(2, 1fr)',
                  }}
                >

                  <RHFMultiSelect
                    name="role_id"
                    label={t('role')}
                    placeholder={t('select_roles')}
                    chip
                    checkbox
                    options={roles?.map((option) => ({
                      value: option.id,
                      label: option?.translations[1]?.name,
                    }))}
                  />

                </Box>



                <Stack alignItems="flex-end" sx={{ mt: 3 }}>
                  <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
                    {!currentUser ? t('create') : t('saveChange')}
                  </LoadingButton>
                </Stack>
              </Card>
            </Grid>
          </Grid>
        </FormProvider>
      </Container>

    </>
  );
}

UsersCreateView.propTypes = {
  currentUser: PropTypes.object,
};

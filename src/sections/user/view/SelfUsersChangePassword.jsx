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
import { changeUserPassword, createUser, updateUser, useRoles } from 'src/api/users';
import Label from 'src/components/label';
import showError from 'src/utils/show_error';
import { InputAdornment } from '@mui/material';
import { IconButton } from 'yet-another-react-lightbox';
import Iconify from 'src/components/iconify';
import { useBoolean } from 'src/hooks/use-boolean';

// ----------------------------------------------------------------------

export default function SelfUsersChangePassword({ currentUser }) {
  const router = useRouter();

  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslate();
  const { roles } = useRoles()
  const { currentLang } = useLocales()



  const validationSchema = Yup.object({
    current_password: Yup.string().required('Current password is required'),
    new_password: Yup.string().required('New password is required'),
    confirm_password: Yup.string()
      .oneOf([Yup.ref('new_password'), null], t('passwords_must_match'))
      .required('Confirm password is required'),
  });


  const defaultValues = useMemo(
    () => ({
      // password: currentUser?.password || '',
      // password: currentUser?.password || '',
      // password: currentUser?.password || '',
    }),
    [currentUser]
  );


  const methods = useForm({
    resolver: yupResolver(validationSchema),
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

  const values = watch();

  // const [selectedRoles, setSelectedRoles] = useState([])

  useEffect(() => {
    if (currentUser?.id) {
      // setValue('name', currentUser?.name);
      // setValue('username', currentUser?.username);
      // setValue('email', currentUser?.email);
      // setValue('phone_number', currentUser?.phone_number);
      // setValue('password', currentUser?.password);
      // setValue('role_id', currentUser?.roles.map((role) => role.id));
    }
    console.log("currentUser : ", currentUser);

  }, [currentUser, setValue]);

  const selectedRoleIds = watch("role_id");

  const selectedRoles = roles?.filter((role) =>
    selectedRoleIds?.includes(role.id)
  );

  const password = useBoolean();
  const password2 = useBoolean();
  const password3 = useBoolean();



  const onSubmit = handleSubmit(async (data) => {
    try {
      const res = await changeUserPassword({ old_password: data.current_password, new_password: data.new_password,new_password_confirmation:data?.confirm_password });
      console.log("res : ", res);
      reset();
      enqueueSnackbar(t("operation_success"));
      // v9W6FPLF hamed
    } catch (error) {
      console.error(error);
      showError(error);
    }
  });

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid xs={12} md={16}>
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
              {/* Name */}
              <RHFTextField name="current_password" type={"password"} label={t('current_password')} />
              <RHFTextField name="new_password" type={"password"} label={t('new_password')} />
              <RHFTextField name="confirm_password" type={"password"} label={t('confirm_password')} />

              {/* <RHFTextField
                name="current_password"
                label={t('current_password')}
                type={password.value ? 'text' : 'password'}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={password.onToggle} edge="end">
                        <Iconify icon={password.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              /> */}
              {/* <RHFTextField
                name="new_password"
                label={t('new_password')}
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
                name="confirm_password"
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
              /> */}
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
  );
}

SelfUsersChangePassword.propTypes = {
  currentUser: PropTypes.object,
};

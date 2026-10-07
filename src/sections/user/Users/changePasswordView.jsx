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
import { changeUserPassword, changeUserPasswordByAdmin, createUser, updateUser, useRoles } from 'src/api/users';
import Label from 'src/components/label';
import showError from 'src/utils/show_error';
import { useSettingsContext } from 'src/components/settings';
import { Container, IconButton, InputAdornment } from '@mui/material';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import Iconify from 'src/components/iconify';
import { useBoolean } from 'src/hooks/use-boolean';
import { t } from 'i18next';

// ----------------------------------------------------------------------

export default function ChangePasswordView({ currentUser, onClose, selfAccount }) {
    const router = useRouter();
    const { enqueueSnackbar } = useSnackbar();

    const password = useBoolean();
    const password2 = useBoolean();
    const password3 = useBoolean();
    console.log(" currentUser : ", currentUser);

    const validationSchema = Yup.object({
        current_password: Yup.string(),
        new_password: Yup.string()
            .required(t('password_is_required'))
            .min(8, t('password_must_be_at_least_8_characters'))
            .matches(/[A-Z]/, t('password_must_contain_uppercase'))
            .matches(/[a-z]/, t('password_must_contain_lowercase'))
            .matches(/\d/, t('password_must_contain_number'))
            .matches(/[@$!%*?&]/, t('password_must_contain_special_char'))
            .matches(/^[^\u0600-\u06FF]*$/, 'arabic_letters_are_not_allowed'),
        confirm_password: Yup.string().required(t("confirm_password_is_required")),
    });

    const defaultValues = useMemo(
        () => ({

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

    const onPasswordSubmit = handleSubmit(async (data) => {
        try {
            const body = data;
            console.log("currentUser?.id : ", currentUser?.id);
            if (selfAccount) {
                // if (data.new_password == data.current_password) {
                //     enqueueSnackbar(t('old_current_password'), { variant: 'error' });
                //     return;
                // }
                const res = await changeUserPassword({ old_password: data.current_password, new_password: data.new_password, new_password_confirmation: data?.confirm_password });
            } else {
                const res = await changeUserPasswordByAdmin({ user_id: currentUser?.id, password: body?.new_password, password_confirmation: body?.confirm_password })
            }
            reset();
            enqueueSnackbar(t("operation_success"));
            onClose()
            // v9W6FPLF hamed
        } catch (error) {
            console.error(error);
            showError(error);
        }
    });

    return (
        <>
            <FormProvider methods={methods} onSubmit={onPasswordSubmit}>
                <Grid container spacing={3}>
                    <Grid xs={12} md={16} my={2}>
                        <Box
                            rowGap={3}
                            columnGap={2}
                            display="grid"
                            gridTemplateColumns={{
                                xs: 'repeat(1, 1fr)',
                                sm: 'repeat(1, 1fr)',
                            }}
                        >
                            {
                                selfAccount && (
                                    <RHFTextField
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
                                    />
                                )
                            }
                            <RHFTextField
                                name="new_password"
                                label={t('new_password')}
                                type={password2.value ? 'text' : 'password'}
                                error={
                                    !values?.new_password ? false : values?.new_password == values?.current_password
                                }
                                helperText={
                                    !values?.new_password
                                        ? null
                                        : values?.new_password == values?.current_password
                                            ? t('old_current_password')
                                            : ''
                                }
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
                                error={
                                    !values?.confirm_password ? false : values?.new_password != values?.confirm_password
                                }
                                helperText={
                                    !values?.confirm_password
                                        ? null
                                        : values?.new_password !== values?.confirm_password
                                            ? t('passwords_must_match')
                                            : ''
                                }
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

                        </Box>
                        <Stack alignItems="flex-end" sx={{ mt: 3 }}>
                            <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
                                {!currentUser ? t('create') : t('saveChange')}
                            </LoadingButton>
                        </Stack>
                    </Grid>
                </Grid>
            </FormProvider>
        </>
    );
}

ChangePasswordView.propTypes = {
    currentUser: PropTypes.object,
};

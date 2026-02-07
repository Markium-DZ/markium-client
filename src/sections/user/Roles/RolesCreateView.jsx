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
import FormProvider, { RHFTextField, RHFSelect } from 'src/components/hook-form';

import { useLocales, useTranslate } from 'src/locales';

import { useValues } from 'src/api/utils';
import { createRole, editRole, usePermissions } from 'src/api/users';
import { CardContent, CardHeader, Tab, Tabs, Typography } from '@mui/material';
import PermissionsGroupCard from './PermissionsGroupCard';
import PermissionsGroupCard2 from './PermissionsGroupCard2';
import { Container } from 'postcss';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { useSettingsContext } from 'src/components/settings';
import showError from 'src/utils/show_error';
import Iconify from 'src/components/iconify';
import SvgColor from 'src/components/svg-color';

// ----------------------------------------------------------------------

export default function RolesCreateView({ currentRole }) {
    console.log("currentRole : ", currentRole);
    const router = useRouter();
    const { enqueueSnackbar } = useSnackbar();
    const { t } = useTranslate();
    const { permissions } = usePermissions()
    const { currentLang } = useLocales()


    // const extractModelName = (table) => {
    //     const parts = table.split('\\');
    //     return parts[parts.length - 1];
    // };

    function extractModelName(tablePath) {
        const parts = tablePath.split('\\'); // handles "App\\Models\\Car"
        return parts[parts.length - 1].toLowerCase(); // "Car" -> "car"
    }


    const groups = [
        { id: "system_settings", models: ["system_setting"], read_tags: ["country", "color", "state", "neighborhood", "payment_method"], label: t("system_settings"),icon:"solar:settings-bold-duotone" },
        { id: "users", models: ["user", "role"], read_tags: ["user", "role"], label: t("users") ,icon:"garden:security-26"},
    ]


    function groupPermissionsByTags(permissions) {
        const result = {};

        groups.forEach((group) => {
            result[group.id] = {
                label: group.label,
                actions: [],
                columns: [],
            };
        });

        permissions.forEach((perm) => {
            const parts = perm.key.split('.');
            const action = parts[0]?.toLowerCase();  // e.g., 'read'
            const modelTag = parts[1]?.toLowerCase();  // e.g., 'car'

            if (!action || !modelTag) return;

            // Find the matching group
            const group = groups.find(g => g.read_tags.includes(modelTag));

            if (!group) return; // No matching group

            const target = result[group.id];

            if (action == 'read' || (parts?.length == 2 && group.models.find(g => g == modelTag))) {
                target.actions.push(perm);
            } else {
                target.columns.push(perm);
            }
        });

        return result;
    }




    const grouped = groupPermissionsByTags(permissions);
    console.log("grouped : ", grouped);

    const [selectedPermissions, setSelectedPermissions] = useState([]);

    const togglePermission = (item) => {
        setSelectedPermissions((prev) =>
            prev?.includes(item?.id)
                ? prev?.filter(i => i != item?.id)
                : [...(prev?.length > 0 ? prev : []), item?.id]
        );
    };

    const toggleGroupPermissions = (groupTitle) => {
        const group = grouped[groupTitle];
        if (!group) return selectedPermissions;

        const allGroupIds = [
            ...(group.actions || []),
            ...(group.columns || [])
        ].map(p => p.id);

        const allIncluded = allGroupIds.every(id => selectedPermissions?.includes(id));
        console.log("allIncluded : ", allIncluded);

        if (allIncluded) {
            setSelectedPermissions(selectedPermissions.filter(id => !allGroupIds.includes(id)));
        } else {
            const newSet = new Set([
                ...(selectedPermissions?.length > 0 ? selectedPermissions : []),
                ...allGroupIds
            ]);

            setSelectedPermissions(Array.from(newSet));
        }
    };

    const validationSchema = Yup.object({

    });

    const defaultValues = useMemo(
        () => ({

        }),

        [currentRole]
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
    console.log("currentRole : ",currentRole)
    useEffect(() => {
        if (currentRole?.id) {
            // setValue('nameEn', currentRole?.translations?.find(i => i?.lang_id == 2 )?.name);
            setValue('nameAr', currentRole?.translations?.find(i => i?.lang_id == 1)?.name || currentRole?.key);
            setSelectedPermissions(currentRole?.permissions.map(p => p.id) || []);
        }
    }, [currentRole, setValue]);



    const onSubmit = handleSubmit(async (data) => {
        try {
            if(selectedPermissions?.length < 1 ){
                enqueueSnackbar(t("at_least_one_permission"),{variant:"error"});
                return ;
            }
            let body = { permissions: selectedPermissions, nameAr: data?.nameAr, nameEn: data?.nameAr }
            const res = currentRole?.id ? await editRole(currentRole?.id, body) : await createRole(body)
            console.log("res : ", res);
            // reset();
            enqueueSnackbar(t("operation_success"));
            router.push(paths.dashboard.user.roles);
        } catch (error) {
            console.error("error : ", error);
            showError(error)

        }
    });


    const [section, setSection] = useState(0);

    const handleTabChange = (event, newValue) => {
        setSection(newValue);
    };




    return (


        <FormProvider methods={methods} onSubmit={onSubmit}>
            <Grid container spacing={3}>
                <Grid xs={12} md={16} >
                    <Box
                        rowGap={3}
                        columnGap={2}
                        display="grid"
                        gridTemplateColumns={{
                            xs: 'repeat(1, 1fr)',
                            sm: 'repeat(2, 1fr)',
                        }}
                    >
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
                                <RHFTextField required name="nameAr" label={t('name_ar')} />
                                {/* <RHFTextField name="nameEn" label={t('name_en')} /> */}
                            </Box>
                        </Card>
                    </Box>
                    <Card sx={{ p: 1, mt: 8 }}>
                        <Tabs
                            value={section}
                            onChange={handleTabChange}
                            aria-label="icon position tabs example"
                            textColor="primary"
                        >
                            {
                                Object.keys(grouped)?.map((card, index) => (
                                    <Tab key={index} icon={<Iconify icon={groups[index]?.icon} />} width="50px" height="50px" iconPosition="start" label={t(card.toLowerCase())} />
                                ))
                            }
                        </Tabs>
                    </Card>
                    <Box
                        rowGap={3}
                        columnGap={2}
                        sx={{ mt: 4 }}
                        display="grid"
                        gridTemplateColumns={{
                            xs: 'repeat(1, 1fr)',
                            sm: 'repeat(1, 1fr)',
                        }}
                    >

                       

                        <PermissionsGroupCard2
                            model={Object.keys(grouped)[section].toLowerCase()}
                            perms={grouped[Object.keys(grouped)[section]]}
                            // key={index}
                            selectedPermissions={selectedPermissions}
                            toggleGroupPermissions={toggleGroupPermissions}
                            togglePermission={togglePermission}
                        />


                    </Box>
                    {/* <Box
                        rowGap={3}
                        columnGap={2}
                        sx={{ mt: 8 }}
                        display="grid"
                        gridTemplateColumns={{
                            xs: 'repeat(1, 1fr)',
                            sm: 'repeat(2, 1fr)',
                        }}
                    >

                        {
                            Object.keys(grouped)?.map((card, index) => (
                                <PermissionsGroupCard2
                                    model={card.toLowerCase()}
                                    perms={grouped[card]}
                                    key={index}
                                    selectedPermissions={selectedPermissions}
                                    toggleGroupPermissions={toggleGroupPermissions}
                                    togglePermission={togglePermission}
                                />
                            ))
                        }
                    </Box> */}
                    <Stack alignItems="flex-end" sx={{ mt: 3 }}>
                        <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
                            {!currentRole ? t('create') : t('saveChange')}
                        </LoadingButton>
                    </Stack>
                </Grid>
            </Grid>
        </FormProvider>
    );
}

RolesCreateView.propTypes = {
    currentRole: PropTypes.object,
};

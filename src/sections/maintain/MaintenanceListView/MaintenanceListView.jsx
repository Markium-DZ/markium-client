import { Box, Button, Card, FormControlLabel, FormGroup, Grid, IconButton, MenuItem, Stack, Switch, Tooltip, Typography } from '@mui/material';
import { t } from 'i18next';
import { set } from 'lodash'; // [keep for later use]
import { enqueueSnackbar, useSnackbar } from 'notistack';
import { useCallback, useEffect, useState } from 'react';
import { AddCarToMentainance, deleteCar, markCarAsAvailable, useGetCar } from 'src/api/car';
import { useGetClauses } from 'src/api/claim';
import { useGetClients } from 'src/api/client';
import { useGetContracts } from 'src/api/contract';
import { deleteMaintenance, markMaintenanceAsCompeleted, useGetMaintenance } from 'src/api/maintainance';
import { changeItemVisibilityInSettings, useGetMainSpecs } from 'src/api/settings'; // [keep for later use]
import { createUser, deleteUser, useRoles, useUsers } from 'src/api/users';
import { useValues } from 'src/api/utils';
import PermissionsContext from 'src/auth/context/permissions/permissions-context';
import { ConfirmDialog } from 'src/components/custom-dialog';
import ContentDialog from 'src/components/custom-dialog/content-dialog';
import CustomPopover, { usePopover } from 'src/components/custom-popover';
import { fileData } from 'src/components/file-thumbnail'; // [keep for later use]
import Iconify from 'src/components/iconify';
import { useBoolean } from 'src/hooks/use-boolean';
import { useTranslate } from 'src/locales';
import { RouterLink } from 'src/routes/components';
import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';
import ZaityListView from 'src/sections/ZaityTables/zaity-list-view';
import ZaityHeadContainer from 'src/sections/ZaityTables/ZaityHeadContainer';
import ZaityTableFilters from 'src/sections/ZaityTables/ZaityTableFilters';
import ZaityTableTabs from 'src/sections/ZaityTables/ZaityTableTabs'; // [keep for later use]
import { fDate } from 'src/utils/format-time';
import showError from 'src/utils/show_error';
import * as Yup from 'yup';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import FormProvider, { RHFUpload } from 'src/components/hook-form';
import { LoadingButton } from '@mui/lab';
import { LoadingScreen } from 'src/components/loading-screen';
import { MarkAsCompletedForm } from './MarkAsCompletedForm';




// ----------------------------------------------------------------------


export default function MaintenanceListView({ }) {
    const { maintenance, mutate, maintenanceLoading } = useGetMaintenance();
    const { car } = useGetCar();
    const { data: vData } = useValues();
    const { contracts } = useGetContracts()
    const { clients } = useGetClients()

    const [tableData, setTableData] = useState([]);
    const [dataFiltered, setDataFiltered] = useState([]);

    function padWithZeros(str) {
        return str.toString().padStart(5, '0');
    }


    let TABLE_HEAD = [
        // { id: 'plat_number', label: t('plateNumber'), type: "text", width: 120 },
        { id: 'id', label: t('maintenance'), type: "two-lines-link", first: (row) => row?.idf, second: (row) => { }, link: (row) => { return paths.dashboard.maintenance.details(row?.id) }, width: 40 },
        { id: 'model', label: t('plateNumber'), type: "two-lines-link", first: (row) => row?.car?.model?.translations?.name, second: (row) => row?.car?.plat_number, link: (row) => { return paths.dashboard.vehicle.details(row?.id) }, width: 220 },
        { id: 'work_site', label: t('workSite'), type: "text", width: 100 },
        { id: 'remaining_dais', label: t('remainingDate'), type: "text", width: 100 },
        // { id: 'c_driver', label: t('driver'), type: "long_text", length: 3, width: 200 },
        { id: 'condition', label: t('maintainStatus'), type: "label", width: 140 },
        { id: 'createdat', label: t('created_at'), type: "text", width: 140 },
        { id: 'entrydate', label: t('entry_date'), type: "text", width: 140 },
        { id: 'exitdate', label: t('exit_date'), type: "text", width: 140 },
        { id: 'type', label: t('type'), type: "text", width: 100 },
        { id: 'actions', label: t('actions'), type: "threeDots", component: (item) => <ElementActions item={item} setTableData={setDataFiltered} />, width: 200, align: "right" },
    ]



    const filters = [
        {
            key: 'plat_number', label: t('plat_number'), match: (item, value) =>
                item?.idf?.toLowerCase().includes(value?.toLowerCase()) ||
                item?.car?.plat_number?.toLowerCase().includes(value?.toLowerCase()) ||
                item?.model?.translations?.name?.toLowerCase().includes(value?.toLowerCase()) ||
                item?.work_site?.toLowerCase().includes(value?.toLowerCase()) ||
                item?.createdat?.toLowerCase().includes(value?.toLowerCase()) ||
                item?.entrydate?.toLowerCase().includes(value?.toLowerCase()) ||
                item?.type?.toLowerCase().includes(value?.toLowerCase()) ||
                item?.exitdate?.toLowerCase().includes(value?.toLowerCase()),

        },
    ];

    const defaultFilters = {
        plat_number: '',
    };

    const items = [
        { key: 'all', label: t('all'), match: () => true },
        { key: 'completed', label: t('completed'), match: (item) => item?.status?.key === "completed", color: 'primary' },
        { key: 'pending', label: t('pending'), match: (item) => item?.status?.key === "pending", color: 'warning' },
        // { key: 'under_preparation', label: t('under_preparation'), match: (item) => item?.status?.key == "under_preparation", color: 'secondary' },
        // { key: 'rented', label: t('rented'), match: (item) => item?.status?.key == "rented", color: 'warning' },
    ];
    const filterFunction = (data, filters) => {
        const activeTab = filters.tabKey;
        const item = tableData.find(i => i?.key === activeTab);
        if (item?.match) return data.filter((d) => item.match(d, filters));
        return data;
    }

    const RformulateTable = (data) => {
        return data?.map((item) => {
            let color = "default";
            
            // Apply status conditions: deployed, processing, draft, failed
            if (item?.status === "deployed") {
                color = "success";
            } else if (item?.status === "processing") {
                color = "warning";
            } else if (item?.status === "draft") {
                color = "default";
            } else if (item?.status === "failed") {
                color = "error";
            } else if (item?.status?.key == "pending") {
                color = "warning";
            } else if (item?.status?.key == "completed") {
                color = "success";
            }

            return {
                ...item,
                idf: padWithZeros(item?.id.toString()),
                car: car?.find(i => i.id == item?.car_id),
                // work_site: vData?.states?.find(i => i?.id == item?.state_id)?.translations[0]?.name,
                work_site: item?.state?.translations[0]?.name,
                remaining_dais: item?.remaining_days + " " + (item?.remaining_days > 2 && item?.remaining_days < 10 ? t("days") : t("day")),
                condition: item?.status?.translations[0]?.name,
                color,
                entrydate: fDate(item?.entry_date),
                exitdate: fDate(item?.exit_date),
                createdat: fDate(item?.created_at),
                type: t(item?.maintainance_type),
            };
        }) || [];
    };


    useEffect(() => {
        setDataFiltered(RformulateTable(maintenance));
    }, [maintenance,car]);
    useEffect(() => {
        setTableData(RformulateTable(maintenance));
    }, [maintenance,car]);

    return (
        <>
            <ZaityHeadContainer
                heading={t("maintenances")}
                action={
                    <PermissionsContext action={"create.maintenance"} >
                        <Button
                            component={RouterLink}
                            href={paths.dashboard.maintenance.new}
                            variant="contained"
                            startIcon={<Iconify icon="mingcute:add-line" />}
                        >
                            {t("addMaintain")}
                        </Button>
                    </PermissionsContext>
                }
                links={[
                    { name: t('dashboard'), href: paths.dashboard.root },
                    { name: t("maintenances"), href: paths.dashboard.maintenance.root },
                    { name: t('maintainList') },
                ]}
            >
                <Card>
                    <ZaityTableTabs filterKey='condition' data={tableData} items={items} defaultFilters={defaultFilters} setTableDate={setDataFiltered} filterFunction={filterFunction}>
                        {/* <ZaityTableFilters data={dataFiltered} setTableDate={setDataFiltered} items={filters} defaultFilters={defaultFilters} dataFiltered={tableData} searchText={t("search_by") + " " + t("plateNumber") + " ..."} > */}
                        <ZaityTableFilters data={dataFiltered} tableData={tableData} setTableDate={setDataFiltered} items={filters} defaultFilters={defaultFilters} dataFiltered={tableData} searchText={t("search_by") + " " + t("plateNumber") + " " + t("or_any_value") + " ..."} >
                            {
                                maintenanceLoading ?
                                    <LoadingScreen sx={{ my: 8 }} color='primary' />
                                    :
                                    <ZaityListView TABLE_HEAD={[...TABLE_HEAD]} dense="medium" zaityTableDate={dataFiltered || []} onSelectedRows={({ data, setTableData }) => { return <onSelectedRowsComponent configurable_type={"roles"} setTableData={setTableData} data={car} /> }} />
                            }
                        </ZaityTableFilters>
                        {/* </ZaityTableFilters> */}
                    </ZaityTableTabs>
                </Card>
            </ZaityHeadContainer>
        </>
    );
}

// ----------------------------------------------------------------------



const ElementActions = ({ item, setTableData }) => {
    const popover = usePopover();
    const confirm = useBoolean();
    const ban = useBoolean();
    const completed = useBoolean();
    const router = useRouter();

    const [postloader, setPostloader] = useState(false)


    const onEditRow = useCallback(
        (id) => {
            router.push(paths.dashboard.maintenance.edit(id));
        },
        [router]
    );


    const onDeleteRow = useCallback(
        async (id) => {
            setPostloader(true)
            console.log("id : ", id);
            try {
                const res = await deleteMaintenance(id);
                setTableData(prev => prev?.filter(i => i.id != id))
                enqueueSnackbar(t("operation_success"));
                confirm.onFalse();
                setPostloader(false)
            } catch (error) {
                console.log("error : ", error);
                setPostloader(false)
                showError(error)
            }
        }
    );







    return (
        <Box display={"flex"} rowGap={"10px"} sx={{ gap: '10px' }} >

            <IconButton color={popover.open ? 'inherit' : 'default'} onClick={popover.onOpen}>
                <Iconify icon="eva:more-vertical-fill" />
            </IconButton>

            <CustomPopover
                open={popover.open}
                onClose={popover.onClose}
                arrow="right-top"
                sx={{ width: 200 }}
            >
                {/* <PermissionsContext action={'delete.maintenance'}>
                    <MenuItem
                        onClick={() => {
                            confirm.onTrue();
                            popover.onClose();
                        }}
                        sx={{ color: 'error.main' }}
                    >
                        <Iconify icon="solar:trash-bin-trash-bold" />
                        {t('delete')}
                    </MenuItem>
                </PermissionsContext> */}
                <PermissionsContext action={'update.maintenance'}>
                    <MenuItem
                        onClick={() => {
                            onEditRow(item?.id);
                            popover.onClose();
                        }}
                    >
                        <Iconify icon="solar:pen-bold" />
                        {t('edit')}
                    </MenuItem>
                </PermissionsContext>
                <PermissionsContext action={'read.maintenance'}>
                    <MenuItem
                        onClick={() => {
                            router.push(paths.dashboard.maintenance.details(item?.id));
                            popover.onClose();
                        }}
                    >
                        <Iconify icon="solar:eye-bold" />
                        {t('overview')}
                    </MenuItem>
                </PermissionsContext>
                {item?.status?.key === 'pending' ?
                    <MenuItem
                        onClick={() => {
                            completed.onTrue();
                            popover.onClose();
                        }}
                    >
                        <Iconify icon="duo-icons:folder-open" />
                        {t("mark_as_completed")}
                    </MenuItem>
                    :
                    null}
                {/* 
                <MenuItem
                    onClick={() => {
                        onViewRow(item?.id);
                        popover.onClose();
                    }}
                >
                    <Iconify icon="solar:eye-bold" />
                    {t('view')}
                </MenuItem> */}



            </CustomPopover>

            <ContentDialog
                open={completed.value}
                onClose={completed.onFalse}
                title={t("complete_maintenance")}
                content={
                    <MarkAsCompletedForm setTableData={setTableData} maintenanceId={item?.id} close={() => completed?.onFalse()} />
                }
            />
            <ConfirmDialog
                open={confirm.value}
                onClose={confirm.onFalse}
                isSubmitting={postloader}
                loading={postloader}
                title={t("delete")}
                content={t("are_you_sure_want_to_delete")}
                action={
                    <Button
                        variant="contained"
                        color="error"
                        onClick={() => {
                            onDeleteRow(item?.id);
                            confirm.onFalse();
                        }}
                    >
                        {t("delete")}
                    </Button>
                }
            />
        </Box>
    );
};







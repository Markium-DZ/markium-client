import { Box, Button, Card, FormControlLabel, FormGroup, Grid, IconButton, MenuItem, Stack, Switch, Tooltip, Typography } from '@mui/material';
import { t } from 'i18next';
import { set } from 'lodash'; // [keep for later use]
import { enqueueSnackbar, useSnackbar } from 'notistack';
import { useCallback, useEffect, useState } from 'react';
import { AddCarToMentainance, deleteCar, markCarAsAvailable, useGetCar } from 'src/api/car';
import { useGetClauses } from 'src/api/claim';
import { useGetClients } from 'src/api/client';
import { deleteContractClause, useGetContracts } from 'src/api/contract';
import { markMaintenanceAsCompeleted, useGetMaintenance } from 'src/api/maintainance';
import { changeItemVisibilityInSettings, useGetMainSpecs, useGetSystemVisibleItem } from 'src/api/settings'; // [keep for later use]
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
import { deleteDocument, useGetDocuments } from 'src/api/document';
import { deleteDriver, useGetDrivers } from 'src/api/drivers';
import { secondary } from 'src/theme/palette';
import { color } from 'framer-motion';
import { LoadingScreen } from 'src/components/loading-screen';




// ----------------------------------------------------------------------


export default function DriverListView({ }) {

    const { data: vData } = useValues();
    const { car } = useGetCar()
    const { drivers, driversLoading } = useGetDrivers()
    const { documents, mutate } = useGetDocuments()
    const { clients } = useGetClients();
    const { items: carModels } = useGetSystemVisibleItem("car_model");


    const [tableData, setTableData] = useState([]);
    const [dataFiltered, setDataFiltered] = useState([]);

    let TABLE_HEAD = [
        { id: 'name', label: t('name'), type: "two-lines-link", first: (row) => { return row?.name }, second: (row) => { return row?.phone_number }, link: (row) => { return paths.dashboard.drivers.details(row.id) }, width: 180 },
        // { id: 'phone_number', label: t('phone_number'), type: "text", width: 140 },
        { id: 'residence_permit_number', label: t('residence_permit_number'), type: "text", width: 140 },
        // { id: 'birth_date', label: t('birth_date'), type: "text", width: 140 },
        { id: 'gender', label: t('gender'), type: "text", width: 140 },
        { id: 'd_nationality', label: t('nationality'), type: "text", width: 100 },
        { id: 'd_state', label: t('state'), type: "text", width: 100 },
        { id: 'attached_to', label: t('car'), type: "two-lines-link", first: (row) => { return row?.car?.model?.translations?.name || "--" }, second: (row) => { return row?.car?.plat_number }, link: (row) => { return row?.car?.id ? paths.dashboard.vehicle.details(row?.car?.id) : "#" }, width: 140 },
        // { id: 'c_driver', label: t('driver'), type: "long_text", length: 3, width: 200 },
        { id: 'status', label: t('status'), type: "label", width: 140 },
        { id: 'c_contract', label: t('contract'), type: "two-lines-link", first: (row) => { return row?.contract?.ref || "--" }, second: (row) => { }, link: (row) => { return row?.contract?.id ? paths.dashboard.clients.contractsDetails(row?.contract?.id) : "#" }, width: 180 },
        { id: 'c_client', label: t('client'), type: "two-lines-link", first: (row) => { return row?.client?.name || "--" }, second: (row) => { }, link: (row) => { return row?.contract?.id ? paths.dashboard.clients.details(row?.client?.id) : "#" }, width: 180 },
        { id: 'actions', label: t('actions'), type: "threeDots", component: (item) => <ElementActions item={item} setTableData={setTableData} />, width: 200, align: "right" },
    ]


    const RformulateTable = (data) => {
        return data?.map((item) => {
            let color = "default";
            let status = "";
            
            // Apply status conditions: deployed, processing, draft, failed
            if (item?.status === "deployed") {
                color = "success";
                status = t("deployed");
            } else if (item?.status === "processing") {
                color = "warning";
                status = t("processing");
            } else if (item?.status === "draft") {
                color = "default";
                status = t("draft");
            } else if (item?.status === "failed") {
                color = "error";
                status = t("failed");
            } else if (item?.contract?.id) {
                color = "warning";
                status = t("bussy");
            } else {
                color = "success";
                status = t("available");
            }

            return {
                ...item,
                phonenumber: item?.phone_number != "N/A" ? "--" : item?.phone_number,
                gender: item?.isMale ? t("male") : t("female"),
                d_nationality: item?.nationality?.translations?.name,
                d_state: item?.state?.translations?.name,
                status,
                color,
                // car_model: vData?.car_companies?.flatMap(i => i.models)?.find(i => i.id == item?.car?.car_model_id)?.translations[0]?.name,

            };
        }) || [];
    };


    const filters = [
        {
            key: 'name', label: t('name'), match: (item, value) =>
                item?.name?.toLowerCase().includes(value?.toLowerCase()) ||
                item?.phonenumber?.toLowerCase().includes(value?.toLowerCase()) ||
                item?.gender?.toLowerCase().includes(value?.toLowerCase()) ||
                item?.residence_permit_number?.toLowerCase().includes(value?.toLowerCase()) ||
                item?.d_nationality?.toLowerCase().includes(value?.toLowerCase()) ||
                item?.car?.plat_number?.toLowerCase().includes(value?.toLowerCase()) ||
                item?.car_model?.toLowerCase().includes(value?.toLowerCase()) ||
                item?.contract?.ref?.toLowerCase().includes(value?.toLowerCase()) ||
                item?.d_state?.toLowerCase().includes(value?.toLowerCase()),
        },
    ];

    const defaultFilters = {
        name: '',
    };

    const items = [
        { key: 'all', label: t('all'), match: () => true },
        { key: 'available', label: t('available'), match: (item) => !item?.is_rented, color: 'success' },
        { key: 'is_rented', label: t('bussy'), match: (item) => item?.is_rented, color: 'warning' },
    ];

    const filterFunction = (data, filters) => {
        const activeTab = filters.tabKey;
        const item = tableData.find(i => i?.key === activeTab);
        if (item?.match) return data.filter((d) => item.match(d, filters));
        return data;
    }




    useEffect(() => {
        setDataFiltered(RformulateTable(drivers));
    }, [drivers, vData, carModels]);
    useEffect(() => {
        setTableData(RformulateTable(drivers));
    }, [drivers, vData, carModels]);

    return (
        <>
            <ZaityHeadContainer
                heading={t("driversList")}
                action={
                    <PermissionsContext action={"create.driver"} >
                        <Button
                            component={RouterLink}
                            href={paths.dashboard.drivers.new}
                            variant="contained"
                            startIcon={<Iconify icon="mingcute:add-line" />}
                        >
                            {t("addNewDriver")}
                        </Button>
                    </PermissionsContext>
                }
                links={[
                    { name: t('dashboard'), href: paths.dashboard.root },
                    { name: t("driversList"), href: paths.dashboard.drivers.root },
                    { name: t('list') },
                ]}
            >
                <Card>
                    <ZaityTableTabs filterKey='condition' data={tableData} items={items} defaultFilters={defaultFilters} setTableDate={setDataFiltered} filterFunction={filterFunction}>
                        {/* <ZaityTableTabs filterKey='attachable_type' data={tableData} items={items2} defaultFilters={defaultFilters} setTableDate={setDataFiltered} filterFunction={filterFunction}> */}
                        <ZaityTableFilters data={dataFiltered} tableData={tableData} setTableDate={setDataFiltered} items={filters} defaultFilters={defaultFilters} dataFiltered={tableData} searchText={t("search_by") + " " + t("name") + " " + t("or_any_value") + " ..."}  >
                            {
                                driversLoading ?
                                    <LoadingScreen sx={{ my: 8 }} color='primary' />
                                    :
                                    <ZaityListView TABLE_HEAD={[...TABLE_HEAD]} dense="medium" zaityTableDate={dataFiltered || []} onSelectedRows={({ data, setTableData }) => { return <onSelectedRowsComponent configurable_type={"roles"} setTableData={setTableData} data={car} /> }} />
                            }
                        </ZaityTableFilters>
                        {/* </ZaityTableTabs> */}
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
    const loading = useBoolean();
    const router = useRouter();

    const [postloader, setPostloader] = useState(false)




    const onEditRow = useCallback(
        (id) => {
            router.push(paths.dashboard.drivers.edit(id));
        },
        [router]
    );

    const onDeleteRow = useCallback(
        async (id) => {
            setPostloader(true)
            console.log("id : ", id);
            try {
                loading.onTrue()
                const res = await deleteDriver(id);
                console.log("res : ", res);
                setTableData(prev => prev?.filter(i => i.id != id))
                enqueueSnackbar(t("operation_success"));
                confirm.onFalse();
                loading.onFalse()
                setPostloader(false)
            } catch (error) {
                console.log("error : ", error);
                setPostloader(false)
                loading.onFalse()
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
                {
                    !item?.contract?.id &&  !item?.car?.id ?
                        <PermissionsContext action={'delete.maintenance'}>
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
                        </PermissionsContext>
                        :
                        null
                }
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
                            router.push(paths.dashboard.drivers.details(item?.id));
                            popover.onClose();
                        }}
                    >
                        <Iconify icon="solar:eye-bold" />
                        {t('overview')}
                    </MenuItem>
                </PermissionsContext>
            </CustomPopover>

            <ConfirmDialog
                open={confirm.value}
                onClose={confirm.onFalse}
                title={t("delete")}
                content={t('are_u_sure_to_delete',{item:t("driver"),item2:item?.name})}
                action={
                    <LoadingButton
                        isSubmitting={postloader}
                        loading={postloader}
                        variant="contained"
                        color="error"
                        onClick={() => {
                            onDeleteRow(item?.id);
                        }}
                    >
                        {t("delete")}
                    </LoadingButton>
                }
            />
        </Box>
    );
};





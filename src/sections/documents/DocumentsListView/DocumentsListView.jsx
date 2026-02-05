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
import { deleteDocument, useGetDocuments } from 'src/api/document';
import { useGetDrivers } from 'src/api/drivers';
import { secondary } from 'src/theme/palette';
import { color } from 'framer-motion';
import { LoadingScreen } from 'src/components/loading-screen';




// ----------------------------------------------------------------------


export default function DocumentsListView({ }) {

    const { data: vData } = useValues();
    const { car } = useGetCar()
    const { drivers } = useGetDrivers()
    const { documents, mutate, documentsLoading } = useGetDocuments()
    const { clients } = useGetClients()

    const [tableData, setTableData] = useState([]);
    const [dataFiltered, setDataFiltered] = useState([]);

    let TABLE_HEAD = [
        { id: 'attachable', label: t('attachable'), type: "two-lines-link", first: (row) => { return row?.attachable?.first }, second: (row) => { return row?.attachable?.second }, link: (row) => { return row?.attachable?.link }, width: 140 },
        // { id: 'model', label: t('plateNumber'), type: "two-lines-link", first: (row) => row?.car?.model?.translations?.name, second: (row) => row?.car?.plat_number, link: (row) => { return paths.dashboard.vehicle.details(row?.id) }, width: 220 },
        // { id: 'attachment_type', label: t('attachment_type'), type: "text", width: 100 },
        { id: 'type', label: t('type'), type: "text", width: 100 },
        { id: 'attachment_name', label: t('attachment_name'), type: "text", width: 100 },
        { id: 'releasedate', label: t('release_date'), type: "text", width: 100 },
        { id: 'expirydate', label: t('expiry_date'), type: "text", width: 100 },
        // { id: 'c_driver', label: t('driver'), type: "long_text", length: 3, width: 200 },
        { id: 'gstatus', label: t('status'), type: "label", width: 140 },
        { id: 'actions', label: t('actions'), type: "threeDots", component: (item) => <ElementActions item={item} setTableData={setDataFiltered} />, width: 200, align: "right" },
    ]



    const filters = [
        {
            key: 'name', label: t('name'), match: (item, value) =>
                item?.attachable?.first?.toLowerCase().includes(value?.toLowerCase()) ||
                item?.attachment_type?.toLowerCase().includes(value?.toLowerCase()) ||
                item?.attachment_name?.toLowerCase().includes(value?.toLowerCase()) ||
                item?.releasedate?.toLowerCase().includes(value?.toLowerCase()) ||
                item?.expirydate?.toLowerCase().includes(value?.toLowerCase()),
        },
    ];

    const defaultFilters = {
        name: '',
    };

    const items = [
        { key: 'All', label: t('all'), match: () => true },
        { key: 'not_yet_attachment', label: t('not_yet_attachment'), match: (item) => item?.status?.key === "not_yet_attachment", color: 'secondary' },
        { key: 'soon_attachment', label: t('soon_attachment'), match: (item) => item?.status?.key === "soon_attachment", color: 'warning' },
        { key: 'late_attachment', label: t('late_attachment'), match: (item) => item?.status?.key === "late_attachment", color: 'error' },
        { key: 'too_late_attachment', label: t('too_late_attachment'), match: (item) => item?.status?.key === "too_late_attachment", color: 'error' },
        { key: 'car', label: t('car'), match: (item) => item?.attachable_type === "car", color: 'secondary' },
        { key: 'driver', label: t('driver'), match: (item) => item?.attachable_type === "driver", color: 'primary' },
        { key: 'client', label: t('client'), match: (item) => item?.attachable_type === "client", color: 'success' },
        { key: 'other', label: t('other'), match: (item) => item?.attachable_type === "other", color: 'warning' },
    ];
    // const items2 = [
    //     { key: 'all', label: t('all'), match: () => true },
    //     { key: 'car', label: t('car'), match: (item) => item?.attachable_type == "car", color: 'secondary' },
    //     { key: 'driver', label: t('driver'), match: (item) => item?.attachable_type == "driver", color: 'primary' },
    //     { key: 'client', label: t('client'), match: (item) => item?.attachable_type == "client", color: 'success' },
    //     { key: 'other', label: t('other'), match: (item) => item?.attachable_type == "other", color: 'warning' },
    // ];
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
            } else if (item?.status?.key == "not_yet_attachment") {
                color = "default";
            } else if (item?.status?.key == "soon_attachment") {
                color = "warning";
            } else {
                color = "error";
            }

            return {
                ...item,
                attachable: {
                    first: item?.attachable_type == "car" ? car?.find(i => i.id == item?.attachable_id)?.model?.translations?.name :
                        item?.attachable_type == "driver" ? drivers?.find(i => i.id == item?.attachable_id)?.name :
                            item?.attachable_type == "client" ? clients?.find(i => i.id == item?.attachable_id)?.name : t("other"),
                    second: item?.attachable_type == "car" ? car?.find(i => i.id == item?.attachable_id)?.plat_number :
                        item?.attachable_type == "driver" ? drivers?.find(i => i.id == item?.attachable_id)?.phone_number :
                            item?.attachable_type == "client" ? "" : t("other"),
                    link: item?.attachable_type == "car" ? paths.dashboard.vehicle.details(item?.id) :
                        item?.attachable_type == "driver" ? paths.dashboard.drivers.details(item?.id) :
                            item?.attachable_type == "client" ? paths.dashboard.clients.details(item?.id) : "#",
                },
                releasedate: fDate(item?.release_date),
                expirydate: fDate(item?.expiry_date),
                attachment_name: vData?.attachmenat_names?.find(i => i.id == item?.attachment_name_id).translations[0]?.name,
                attachment_type: vData?.attachment_types?.find(i => i.id == item?.attachment_type_id).translations[0]?.name,
                // gstatus: vData?.attachemnt_notification_statuses?.find(i => i.id == item?.status?.id).translations[0]?.name,
                gstatus:item?.status?.translations[0]?.name,
                color,
                type:t(item?.attachable_type),


            };
        }) || [];
    };


    useEffect(() => {
        setDataFiltered(RformulateTable(documents));
    }, [vData,documents, car, drivers, clients]);
    useEffect(() => {
        setTableData(RformulateTable(documents));
    }, [vData,documents, car, drivers, clients]);

    return (
        <>
            <ZaityHeadContainer
                heading={t("documentsList")}
                action={
                    <PermissionsContext action={"create.attachment"} >
                        <Button
                            component={RouterLink}
                            href={paths.dashboard.documents.new}
                            variant="contained"
                            startIcon={<Iconify icon="mingcute:add-line" />}
                        >
                            {t("addNewDocument")}
                        </Button>
                    </PermissionsContext>
                }
                links={[
                    { name: t('dashboard'), href: paths.dashboard.root },
                    { name: t("documentsList"), href: paths.dashboard.documents.root },
                    { name: t('list') },
                ]}
            >
                <Card>
                    <ZaityTableTabs filterKey='condition' data={tableData} items={items} defaultFilters={defaultFilters} setTableDate={setDataFiltered} filterFunction={filterFunction}>
                        {/* <ZaityTableTabs filterKey='attachable_type' data={tableData} items={items2} defaultFilters={defaultFilters} setTableDate={setDataFiltered} filterFunction={filterFunction}> */}
                        <ZaityTableFilters data={dataFiltered} tableData={tableData} setTableDate={setDataFiltered} items={filters} defaultFilters={defaultFilters} dataFiltered={tableData} searchText={t("search_by") + " " + t("model") + ", " + " " + t("name") + ", " + t("plateNumber") + ", " + t("or_any_value") + " ..."} >
                            {
                                documentsLoading ?
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

    const [postloader, setPostloader] = useState(false);




    const onEditRow = useCallback(
        (id) => {
            router.push(paths.dashboard.documents.edit(id));
        },
        [router]
    );

    const onDeleteRow = useCallback(
        async (id) => {
            try {
                loading.onTrue()
                setPostloader(true);
                await deleteDocument(id);
                setTableData(prev => prev?.filter(i => i.id != id))
                enqueueSnackbar(t("operation_success"));
                confirm.onFalse();
                setPostloader(false);
            } catch (error) {
                loading.onFalse()
                showError(error)
                setPostloader(false);
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
                <PermissionsContext action={'delete.attachment'}>
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
                <PermissionsContext action={'update.attachment'}>
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
                {/* <PermissionsContext action={'read.attachment'}>
                    <MenuItem
                        onClick={() => {
                            router.push(paths.dashboard.documents.details(item?.id));
                            popover.onClose();
                        }}
                    >
                        <Iconify icon="solar:eye-bold" />
                        {t('overview')}
                    </MenuItem>
                </PermissionsContext> */}
                {
                    item?.attachment_path ?
                        <PermissionsContext action={'read.attachment'}>
                            <MenuItem
                                onClick={() => {
                                    router.push(paths.dashboard.documents.preview + `?url=/${item?.attachment_path}`);
                                    popover.onClose();
                                }}
                            >
                                <Iconify icon="solar:folder-with-files-bold-duotone" />
                                {t('nav_attachment')}
                            </MenuItem>
                        </PermissionsContext>
                        :
                        null
                }
                {
                    item?.invoice_path ?
                        <PermissionsContext action={'read.attachment'}>
                            <MenuItem
                                onClick={() => {
                                    router.push(paths.dashboard.documents.preview + `?url=/${item?.invoice_path}`);
                                    popover.onClose();
                                }}
                            >
                                <Iconify icon="solar:bill-check-bold-duotone" />
                                {t('nav_invoice')}
                            </MenuItem>
                        </PermissionsContext>
                        :
                        null
                }

            </CustomPopover>

            <ConfirmDialog
                open={confirm.value}
                onClose={confirm.onFalse}
                title={t("delete")}
                content={t('are_u_sure_to_delete',{item:t("the_attachment"),item2:item?.attachment_name})}
                action={
                    <LoadingButton
                        loading={postloader}
                        isSubmitting={postloader}
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



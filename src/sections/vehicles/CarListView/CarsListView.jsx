import { LoadingButton } from '@mui/lab';
import { Box, Button, Card, FormControlLabel, FormGroup, IconButton, MenuItem, Switch, Tooltip, Typography } from '@mui/material';
import { t } from 'i18next';
import { set } from 'lodash'; // [keep for later use]
import { enqueueSnackbar } from 'notistack';
import { useCallback, useEffect, useState } from 'react';
import { AddCarToMentainance, deleteCar, markCarAsAvailable, useGetCar } from 'src/api/car';
import { useGetClauses } from 'src/api/claim';
import { useGetClients } from 'src/api/client';
import { useGetContracts } from 'src/api/contract';
import { changeItemVisibilityInSettings, useGetMainSpecs } from 'src/api/settings'; // [keep for later use]
import { createUser, deleteUser, useRoles, useUsers } from 'src/api/users';
import { useValues } from 'src/api/utils';
import PermissionsContext from 'src/auth/context/permissions/permissions-context';
import { ConfirmDialog } from 'src/components/custom-dialog';
import ContentDialog from 'src/components/custom-dialog/content-dialog';
import CustomPopover, { usePopover } from 'src/components/custom-popover';
import { fileData } from 'src/components/file-thumbnail'; // [keep for later use]
import Iconify from 'src/components/iconify';
import { LoadingScreen } from 'src/components/loading-screen';
import { useBoolean } from 'src/hooks/use-boolean';
import { RouterLink } from 'src/routes/components';
import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';
import ZaityListView from 'src/sections/ZaityTables/zaity-list-view';
import ZaityHeadContainer from 'src/sections/ZaityTables/ZaityHeadContainer';
import ZaityTableFilters from 'src/sections/ZaityTables/ZaityTableFilters';
import ZaityTableTabs from 'src/sections/ZaityTables/ZaityTableTabs'; // [keep for later use]
import showError from 'src/utils/show_error';

// ----------------------------------------------------------------------


export default function CarsListView({ }) {
    const { car, carLoading } = useGetCar();
    const { contracts } = useGetContracts()
    const { clients } = useGetClients()

    const [tableData, setTableData] = useState([]);
    const [dataFiltered, setDataFiltered] = useState([]);

    let TABLE_HEAD = [
        // { id: 'plat_number', label: t('plateNumber'), type: "text", width: 120 },
        { id: 'plat_number', label: t('plateNumber'), type: "two-lines-link", first: (row) => row?.plat_number, second: (row) => { }, link: (row) => { return paths.dashboard.vehicle.details(row?.id) }, width: 160 },
        { id: 'model', label: t('model'), type: "two-lines-link", first: (row) => row?.model?.translations?.name, second: (row) => row?.model?.company?.translations?.name, link: (row) => { return paths.dashboard.vehicle.details(row?.id) }, width: 140 },
        { id: 'production_year', label: t('manufacturingYear'), type: "text", width: 100 },
        { id: 'driver', label: t('driver'), type: "two-lines-link", first: (row) => row?.driver?.name || "--", second: (row) => { }, link: (row) => { return row?.driver?.id ?  paths.dashboard.drivers.details(row?.driver?.id) : "#"}, width: 180 },
        // { id: 'c_driver', label: t('driver'), type: "long_text", length: 3, width: 200 },
        // { id: 'driver', label: t('driver'), type: "text", width: 140 },
        { id: 'condition', label: t('status'), type: "label", width: 140 },
        { id: 'client', label: t('client'), type: "two-lines-link", first: (row) => row?.client?.name || "--", second: (row) => { }, link: (row) => { return row?.client?.id ?  paths.dashboard.clients.details(row?.id) : "#" }, width: 180 },
        { id: 'contract', label: t('contract'), type: "two-lines-link", first: (row) => row?.contract?.ref || "--", second: (row) => { }, link: (row) => { return  row?.contract?.id ? paths.dashboard.clients.contractsDetails(row?.contract?.id) : "#" }, width: 180 },
        // { id: 'ref', label: t('contract'), type: "text", width: 100 },
        { id: 'actions', label: t('actions'), type: "threeDots", component: (item) => <ElementActions item={item} RformulateTable={RformulateTable} setTableData={setDataFiltered} />, width: 400, align: "right" },
    ]



    const items = [
        { key: 'all', label: t('all'), match: () => true },
        { key: 'available', label: t('available'), match: (item) => item?.status?.key === "available", color: 'primary' },
        { key: 'under_maintenance', label: t('under_maintenance'), match: (item) => item?.status?.key === "under_maintenance", color: 'error' },
        { key: 'under_preparation', label: t('under_preparation'), match: (item) => item?.status?.key === "under_preparation", color: 'secondary' },
        { key: 'rented', label: t('rented'), match: (item) => item?.status?.key === "rented", color: 'warning' },
    ];
    const filters = [
        {
            key: 'plat_number', label: t('plat_number'), match: (item, value) =>
                item?.plat_number?.toLowerCase()?.includes(value?.toLowerCase()) ||
                item?.model?.translations?.name?.toLowerCase()?.includes(value?.toLowerCase()) ||
                item?.model?.company?.translations?.name?.toLowerCase()?.includes(value?.toLowerCase()) ||
                item?.production_year?.toLowerCase()?.includes(value?.toLowerCase()) ||
                item?.condition?.toLowerCase()?.includes(value?.toLowerCase()),
        },
    ];

    const defaultFilters = {
        plat_number: '',
    };



    const filterFunction = (data, filters) => {
        const activeTab = filters.tabKey;
        const item = tableData.find(i => i?.key === activeTab);
        if (item?.match) return data.filter((d) => item.match(d, filters));
        return data;
    }

    const RformulateTable = (data) => {
        return data?.map((item) => {
            const statusKey = item?.status?.key;
            const statusName = item?.status?.translations?.name || "--";
            const contract = contracts.find((contract) => contract?.client_id === item?.client?.id);
            console.log('contracts.find : ', contracts);
            const company = clients?.find((c) => c.id === contract?.company_id);
            console.log('company.find : ', company);
            let condition;
            let color = "default";
            
            // Apply status conditions: deployed, processing, draft, failed
            if (item?.status === "deployed") {
                color = "success";
                condition = t("deployed");
            } else if (item?.status === "processing") {
                color = "warning";
                condition = t("processing");
            } else if (item?.status === "draft") {
                color = "default";
                condition = t("draft");
            } else if (item?.status === "failed") {
                color = "error";
                condition = t("failed");
            } else if (statusKey === "available" || statusKey === "under_preparation") {
                condition = statusName;
                color = statusKey === "available" ? "success" : "secondary";
            } else if (statusKey == "under_maintenance") {
                condition = t("under_maintenance") + (item?.is_rented ? "/" + t("rented") : "");
                color = "error";
            } else {
                condition = statusName;
                color = "warning";
            }
            
            return {
                ...item,
                color,
                condition,
                c_driver: item?.driver?.id ? item.driver.name : "--",
                contract: contract || "--",
                ref: contract?.ref || "--",
                company: company?.name || "--",
            };
        }) || [];
    };


    useEffect(() => {
        setDataFiltered(RformulateTable(car));
    }, [car,clients,contracts]);
    useEffect(() => {
        setTableData(RformulateTable(car));
    }, [car,clients,contracts]);

    return (
        <>
            <ZaityHeadContainer
                heading={t("vehiclesList")}
                action={
                    <Box display={"flex"} columnGap={2} >
                        {/* <Button
                            onClick={() => { setDataFiltered(RformulateTable(car)), setTableData(RformulateTable(car)) }}
                            variant="contained"
                            startIcon={<Iconify icon="solar:refresh-circle-line-duotone" />}
                        >
                            {t("refresh")}
                        </Button> */}
                        <PermissionsContext action={"create.car"} >
                            <Button
                                component={RouterLink}
                                href={paths.dashboard.vehicle.new}
                                variant="contained"
                                startIcon={<Iconify icon="mingcute:add-line" />}
                            >
                                {t("addVehicle")}
                            </Button>
                        </PermissionsContext>
                    </Box>
                }
                links={[
                    { name: t('dashboard'), href: paths.dashboard.root },
                    { name: t("vehicles"), href: paths.dashboard.vehicle.new },
                    { name: t('list') },
                ]}
            >
                <Card>
                    <ZaityTableTabs filterKey='condition' data={tableData} items={items} defaultFilters={defaultFilters} setTableDate={setDataFiltered} filterFunction={filterFunction}>
                        <ZaityTableFilters data={dataFiltered} tableData={tableData} setTableDate={setDataFiltered} items={filters} defaultFilters={defaultFilters} dataFiltered={tableData} searchText={t("search_by") + " " + t("plateNumber") + " " + t("or_any_value") + " ..."} >
                            {
                                carLoading ?
                                    <LoadingScreen sx={{ my: 8 }} color='primary' />
                                    :
                                    <ZaityListView TABLE_HEAD={[...TABLE_HEAD]} dense="medium" zaityTableDate={dataFiltered || []} onSelectedRows={({ data, setTableData }) => { return <onSelectedRowsComponent configurable_type={"roles"} setTableData={setTableData} data={car} /> }} />
                            }
                        </ZaityTableFilters>
                    </ZaityTableTabs>
                </Card>
            </ZaityHeadContainer>
        </>
    );
}

// ----------------------------------------------------------------------



const ElementActions = ({ item, RformulateTable, setTableData }) => {
    const popover = usePopover();
    const confirm = useBoolean();
    const remove = useBoolean();
    const ban = useBoolean();
    const completed = useBoolean();
    const router = useRouter();

    const [loading, setLoading] = useState(false)



    const onViewRow = useCallback(
        (id) => {
            router.push(paths.dashboard.vehicle.details(id));
        },
        [router]
    );
    const handleViewDriverRow = useCallback(
        (id) => {
            router.push(paths.dashboard.drivers.details(id));
        },
        [router]
    );
    const handleViewContractRow = useCallback(
        (id) => {
            router.push(paths.dashboard.clients.contractsDetails(id));
        },
        [router]
    );

    const handleViewCompanyRow = useCallback(
        (id) => {
            router.push(paths.dashboard.clients.details(id));
        },
        [router]
    );

    const onEditRow = useCallback(
        (id) => {
            router.push(paths.dashboard.vehicle.edit(id));
        },
        [router]
    );


    const onAddCarToMentainance = useCallback(
        async (id) => {
            setLoading(true)
            const result = await AddCarToMentainance(id)
                .then(() => {
                    // router.reload()
                    setTableData(prev =>
                        RformulateTable(
                            prev?.map(i => {
                                if (i.id == item?.id) {
                                    return {
                                        ...i,
                                        // condition: t("under_maintenance"),
                                        // color: "warning",
                                        status: {
                                            key: 'under_maintenance',
                                            translations: { name: t("under_maintenance") }
                                        }
                                    }
                                }
                                return i
                            }))
                    );
                    enqueueSnackbar(t('operation_success'));
                    setLoading(false)
                })
                .catch((err) => {
                    showError(err)
                });
        },
        [enqueueSnackbar]
    );

    const onMarkCarAsAvailable = useCallback(
        async (id) => {
            try {
                const result = await markCarAsAvailable(id)
                    .then(() => {
                        // router.reload()
                        setTableData(prev =>
                            RformulateTable(
                                prev?.map(i => {
                                    if (i.id == item?.id) {
                                        return {
                                            ...i,
                                            // condition:t("available"),
                                            // color:"success",
                                            status: {
                                                key: 'available',
                                                translations: { name: t("available") }
                                            }
                                        }
                                    }
                                    return i
                                }))
                        );

                        enqueueSnackbar(t('operation_success'));
                    })
            } catch (err) {
                showError(err)
            }
        },
        [enqueueSnackbar] // Add t to the dependency array
    );


    const onDeleteItem = useCallback(
        async (id) => {
            const result = await deleteCar(id)
                .then(() => {
                    setTableData(prev => prev?.filter(item => item.id != id))
                    enqueueSnackbar(t('operation_success'));
                    //   mutate();
                })
                .catch((err) => {
                    showError(err)
                });
        },
        [enqueueSnackbar]
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
                {item?.status.key != "under_maintenance" && !item.is_rented ?
                    <PermissionsContext action={'delete.car'}>
                        <MenuItem
                            onClick={() => {
                                remove.onTrue();
                                popover.onClose();
                            }}
                            sx={{ color: 'error.main' }}
                        >
                            <Iconify icon="solar:trash-bin-trash-bold" />
                            {t('delete')}
                        </MenuItem>
                    </PermissionsContext>
                    :
                    null}
                <PermissionsContext action={'update.car'}>
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

                <MenuItem
                    onClick={() => {
                        onViewRow(item?.id);
                        popover.onClose();
                    }}
                >
                    <Iconify icon="solar:eye-bold" />
                    {t('view')}
                </MenuItem>

                {item?.status.key != "under_maintenance" ?
                    <MenuItem
                        onClick={() => {
                            // onAddCarToMentainance(item?.id);
                            confirm.onTrue()
                            popover.onClose();
                        }}
                    >
                        <Iconify icon="map:car-repair" />
                        {t('addToMaintenance')}
                    </MenuItem>
                    :
                    null
                }
                {item?.status.key == "under_preparation" ?
                    <MenuItem
                        onClick={() => {
                            onMarkCarAsAvailable(item?.id);
                            popover.onClose();
                        }}
                    // disabled={status?.key !== 'under_preparation'}
                    >
                        <Iconify icon="solar:clipboard-check-bold-duotone" />
                        {t('markAsAvailable')}
                    </MenuItem>
                    :
                    null
                }
            </CustomPopover>

            <ConfirmDialog
                open={remove.value}
                onClose={remove.onFalse}
                title={t('delete')}
                content={t('are_u_sure_to_delete',{item:t("vehicle"),item2:item?.plat_number})}
                action={
                    <Button
                        variant="contained"
                        color="error"
                        onClick={() => {
                            onDeleteItem(item?.id);
                            confirm.onFalse();
                        }}
                    >
                        {t('delete')}
                    </Button>
                }
            />
            <ConfirmDialog
                open={confirm.value}
                onClose={confirm.onFalse}
                title={t('addToMaintenance')}
                content={t('are_you_sure')}
                action={
                    <LoadingButton
                        loading={loading}
                        variant="contained"
                        color="warning"
                        onClick={() => {
                            onAddCarToMentainance(item?.id);
                            confirm.onFalse();
                        }}
                    >
                        {t('submit')}
                    </LoadingButton>
                }
            />
        </Box>
    );
};



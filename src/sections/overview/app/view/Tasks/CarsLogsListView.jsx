import { LoadingButton } from '@mui/lab';
import { Box, Button, Card, FormControlLabel, FormGroup, IconButton, MenuItem, Switch, Tooltip, Typography } from '@mui/material';
import { Container } from '@mui/system';
import { t } from 'i18next';
import { set } from 'lodash'; // [keep for later use]
import { enqueueSnackbar } from 'notistack';
import { useCallback, useEffect, useState } from 'react';
import { AddCarToMentainance, deleteCar, markCarAsAvailable, useGetCar } from 'src/api/car';
import { useGetClauses } from 'src/api/claim';
import { useGetClients } from 'src/api/client';
import { useGetContracts } from 'src/api/contract';
import { useGetMaintenance, useGetMaintenanceLogs } from 'src/api/maintainance';
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
import { useSettingsContext } from 'src/components/settings';
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


export default function CarsLogsListView({ }) {
    const { car, carLoading } = useGetCar();
    const { maintenance } = useGetMaintenance()
    const { contracts } = useGetContracts()
    const { clients } = useGetClients()
    const settings = useSettingsContext();
    const { data: vData } = useValues()

    const { logs } = useGetMaintenanceLogs()


    console.log("getLateCars(car,maintenance) ", maintenance)


    function getLateCars(cars, maintenances) {
        const today = new Date();

        // Group maintenances by car_id to check the latest one
        const carMaintMap = maintenances.reduce((map, m) => {
            if (!map[m.car_id]) map[m.car_id] = [];
            map[m.car_id].push(m);
            return map;
        }, {});

        // Filter cars that exist in maintenances and are late
        return cars.filter(car => {
            const carMaints = carMaintMap[car.id];
            if (!carMaints) return false; // car has no maintenance

            // get last maintenance by exit_date
            const lastMaint = carMaints.reduce((latest, m) => {
                return new Date(m.exit_date) > new Date(latest.exit_date) ? m : latest;
            });

            return new Date(lastMaint.exit_date) < today; // late if exit_date already passed
        })
        // ?.filter(car => car?.status?.key == "under_maintenance");
    }

    console.log("maintenance : ", maintenance)

    const [tableData, setTableData] = useState([]);
    const [dataFiltered, setDataFiltered] = useState([]);

    let TABLE_HEAD = [
        // { id: 'plat_number', label: t('plateNumber'), type: "text", width: 120 },
        { id: 'plat_number', label: t('plateNumber'), type: "two-lines-link", first: (row) => car?.find(c => c.id == row?.data?.car_id)?.plat_number, second: (row) => { }, link: (row) => { return paths.dashboard.vehicle.details(row?.data?.car_id) }, width: 20 },
        { id: 'model', label: t('model'), type: "two-lines-link", first: (row) => car?.find(c => c.id == row?.data?.car_id)?.model?.translations?.name, second: (row) => car?.find(c => c.id == row?.data?.car_id)?.model?.company?.translations?.name, link: (row) => { return paths.dashboard.vehicle.details(row?.data?.car_id) }, width: 60 },
        // { id: 'production_year', label: t('manufacturingYear'), type: "text", width: 100 },
        // { id: 'driver', label: t('driver'), type: "two-lines-link", first: (row) => row?.driver?.name || "--", second: (row) => { }, link: (row) => { return row?.driver?.id ? paths.dashboard.drivers.details(row?.driver?.id) : "#" }, width: 180 },
        // { id: 'c_driver', label: t('driver'), type: "long_text", length: 3, width: 200 },
        // { id: 'driver', label: t('driver'), type: "text", width: 140 },
        { id: 'c_status', label: t('status'), type: "label", width: 60 },
        // { id: 'client', label: t('client'), type: "two-lines-link", first: (row) => row?.client?.name || "--", second: (row) => { }, link: (row) => { return row?.client?.id ? paths.dashboard.clients.details(row?.id) : "#" }, width: 180 },
        // { id: 'contract', label: t('contract'), type: "two-lines-link", first: (row) => row?.contract?.ref || "--", second: (row) => { }, link: (row) => { return row?.contract?.id ? paths.dashboard.clients.contractsDetails(row?.contract?.id) : "#" }, width: 180 },
        // { id: 'ref', label: t('contract'), type: "text", width: 100 },
        { id: 'actions', label: t('actions'), type: "threeDots", component: (item) => <ElementActions item={item} RformulateTable={RformulateTable} setTableData={setDataFiltered} />, width: 200,align: "right" },
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
        return data?.map((item) => ({
            ...item,
            c_status: vData?.maintenance_log_action_enum?.find(i => i?.key == item?.action)?.translations[0]?.name,
            color: "warning"

        })) || [];
    };


    useEffect(() => {
        setDataFiltered(RformulateTable(logs.filter(item => item?.action == 'action_required' && item?.enabled)));
    }, [logs,vData]);
    useEffect(() => {
        setTableData(RformulateTable(logs.filter(item => item?.action == 'action_required' && item?.enabled)));
    }, [logs,vData]);

    return (
        <>

            <Container maxWidth={settings.themeStretch ? false : 'lg'}>
                <Card sx={{ width: 700 }}>
                    {
                        carLoading ?
                            <LoadingScreen sx={{ my: 8 }} color='primary' />
                            :
                            <ZaityListView  TABLE_HEAD={[...TABLE_HEAD]}  zaityTableDate={dataFiltered || []} onSelectedRows={({ data, setTableData }) => { return <onSelectedRowsComponent configurable_type={"roles"} setTableData={setTableData} data={car} /> }} rowsPerPage={4} dense={"small"} height={400}  />
                    }
                </Card>
            </Container>
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


    const handleEditRow = useCallback(
        (id) => {
          router.push(paths.dashboard.maintenance.new + "?car_id=" + id);
        },
        [router]
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
                <PermissionsContext action={"create.maintenance"} >
                    <MenuItem
                        onClick={() => {
                            handleEditRow(item?.data?.car_id);
                            popover.onClose();
                        }}
                        disabled={item?.action !== 'action_required' || !item?.enabled}
                    >
                        <Iconify icon="duo-icons:add-circle" />
                        {t("create_maintenance")}
                    </MenuItem>
                </PermissionsContext>
            </CustomPopover>

           
           
        </Box>
    );
};



import { Box, Button, Card, FormControlLabel, FormGroup, Grid, IconButton, MenuItem, Stack, Switch, Tooltip, Typography } from '@mui/material';
import { t } from 'i18next';
import { set } from 'lodash'; // [keep for later use]
import { enqueueSnackbar, useSnackbar } from 'notistack';
import { useCallback, useEffect, useState } from 'react';
import { AddCarToMentainance, deleteCar, markCarAsAvailable, useGetCar } from 'src/api/car';
import { useGetClauses } from 'src/api/claim';
import { useGetClients } from 'src/api/client';
import { deleteContract, deleteContractClause, useGetContracts } from 'src/api/contract';
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
import { useLocales, useTranslate } from 'src/locales';
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
import { Container } from '@mui/system';
import { useSettingsContext } from 'src/components/settings';




// ----------------------------------------------------------------------


export default function ContractsListView({ }) {

    const { contracts, contractsLoading } = useGetContracts()
    const { clients } = useGetClients()
    const payment_methodes = [{ name: "deferred", lable: { ar: "دفعات", en: "deferred" } }, { name: "cash", lable: { ar: "نقدا", en: "cash" } }]
    const { currentLang } = useLocales();
    const settings = useSettingsContext();

    const [tableData, setTableData] = useState([]);
    const [dataFiltered, setDataFiltered] = useState([]);

    let TABLE_HEAD = [
        { id: 'ref', label: t('ref'), type: "two-lines-link", first: (row) => { return row?.ref }, second: (row) => { }, link: (row) => { return paths.dashboard.clients?.contractsDetails(row.id) }, width: 180 },
        { id: 'client', label: t('client'), type: "two-lines-link", first: (row) => { return row?.client?.name }, second: (row) => { }, link: (row) => { return paths.dashboard.clients?.details(row.client_id) }, width: 180 },
        // { id: 'contractDate', label: t('contractDate'), type: "text", width: 140 },
        { id: 'contractEndDate', label: t('end_date'), type: "text", width: 140 },
        { id: 'c_payment_method', label: t('payment_method'), type: "text", width: 140 },
        // { id: 'birth_date', label: t('birth_date'), type: "text", width: 140 },
        // { id: 'gender', label: t('gender'), type: "text", width: 140 },
        // { id: 'd_nationality', label: t('nationality'), type: "text", width: 100 },
        // { id: 'd_state', label: t('state'), type: "text", width: 100 },
        // { id: 'attached_to', label: t('car'), type: "two-lines-link", first: (row) => { return row?.car?.model?.translations[0]?.name || "--" }, second: (row) => { return row?.car?.plat_number }, link: (row) => { return paths.dashboard.vehicle.details(row?.car?.id) }, width: 140 },
        // { id: 'c_driver', label: t('driver'), type: "long_text", length: 3, width: 200 },
        // { id: 'status', label: t('status'), type: "label", width: 140 },
        // { id: 'actions', label: t('actions'), type: "threeDots", component: (item) => <ElementActions item={item} setTableData={setTableData} />, width: 200, align: "right" },
    ]


    function getContractsFinishingThisMonth(contracts) {
        const now = new Date();
        const currentMonth = now.getMonth(); // 0-11
        const currentYear = now.getFullYear();
      
        return contracts.filter(contract =>
          contract.periods?.some(period => {
            const end = new Date(period.end_date);
            return (
              end.getMonth() === currentMonth &&
              end.getFullYear() === currentYear
            );
          })
        );
      }

      

    const RformulateTable = (data) => {
        return data?.map((item) => {

            return {
                ...item,

                color: item?.is_rented ? "warning" : "success",
                client: clients?.find(i => i.id == item?.client_id),
                contractDate: fDate(item?.periods[0]?.start_date, "yyyy-MM-dd"),
                contractEndDate: fDate(item?.periods[0]?.end_date, "yyyy-MM-dd"),
                c_payment_method: t(item?.payment_method?.name),

            };
        }) || [];
    };


    const filters = [
        {
            key: 'name', label: t('name'), match: (item, value) =>
                item?.ref?.toLowerCase().includes(value?.toLowerCase()) ||
                item?.contractDate?.toLowerCase().includes(value?.toLowerCase()) ||
                item?.c_payment_method?.toLowerCase().includes(value?.toLowerCase()) ||
                item?.client?.name?.toLowerCase().includes(value?.toLowerCase())
        },
    ];

    const defaultFilters = {
        name: '',
    };

    const items = [
        { key: 'all', label: t('all'), match: () => true },
        { key: 'cash', label: t('cash'), match: (item) => !item?.is_rented, color: 'success' },
        { key: 'deferred', label: t('deferred'), match: (item) => item?.is_rented, color: 'warning' },
    ];

    const filterFunction = (data, filters) => {
        const activeTab = filters.tabKey;
        const item = tableData.find(i => i?.key === activeTab);
        if (item?.match) return data.filter((d) => item.match(d, filters));
        return data;
    }




    useEffect(() => {
        setDataFiltered(RformulateTable(getContractsFinishingThisMonth(contracts)));
    }, [contracts, clients]);
    useEffect(() => {
        setTableData(RformulateTable(getContractsFinishingThisMonth(contracts)));
    }, [contracts, clients]);

    return (
        <>

            <Container maxWidth={settings.themeStretch ? false : 'lg'}>
                <Card sx={{ width: 700 }} >
                    {/* <ZaityTableTabs filterKey='condition' data={tableData} items={items} defaultFilters={defaultFilters} setTableDate={setDataFiltered} filterFunction={filterFunction}> */}
                    {/* <ZaityTableTabs filterKey='attachable_type' data={tableData} items={items2} defaultFilters={defaultFilters} setTableDate={setDataFiltered} filterFunction={filterFunction}> */}
                    {/* <ZaityTableFilters data={dataFiltered} tableData={tableData} setTableDate={setDataFiltered} items={filters} defaultFilters={defaultFilters} dataFiltered={tableData} searchText={t("search_by") + " " + t("name") + " " + t("or_any_value") + " ..."}  > */}
                    {
                        contractsLoading ?
                            <LoadingScreen sx={{ my: 8 }} color='primary' />
                            :
                            <ZaityListView  minHeight={400} maxHeight={400} TABLE_HEAD={[...TABLE_HEAD]}  zaityTableDate={dataFiltered || []} height={400} onSelectedRows={({ data, setTableData }) => { return <onSelectedRowsComponent configurable_type={"roles"} setTableData={setTableData} data={contracts}  /> }} rowsPerPage={4} dense={"small"}  />
                    }
                    {/* </ZaityTableFilters> */}
                    {/* </ZaityTableTabs> */}
                    {/* </ZaityTableTabs> */}
                </Card>
            </Container>

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




    const onEditRow = useCallback(
        (id) => {
            router.push(paths.dashboard.drivers.edit(id));
        },
        [router]
    );

    const onDeleteRow = useCallback(
        async (id) => {
            try {
                loading.onTrue()
                await deleteContract(id);
                setTableData(prev => prev?.filter(i => i.id != id))
                enqueueSnackbar(t("operation_success"));
                confirm.onFalse();
            } catch (error) {
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
                <PermissionsContext action={'delete.contract'}>
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
                {/* <PermissionsContext action={'update.maintenance'}>
                    <MenuItem
                        onClick={() => {
                            onEditRow(item?.id);
                            popover.onClose();
                        }}
                    >
                        <Iconify icon="solar:pen-bold" />
                        {t('edit')}
                    </MenuItem>
                </PermissionsContext> */}
                {/* <PermissionsContext action={'read.maintenance'}>
                    <MenuItem
                        onClick={() => {
                            router.push(paths.dashboard.drivers.details(item?.id));
                            popover.onClose();
                        }}
                    >
                        <Iconify icon="solar:eye-bold" />
                        {t('overview')}
                    </MenuItem>
                </PermissionsContext> */}
            </CustomPopover>

            <ConfirmDialog
                open={confirm.value}
                onClose={confirm.onFalse}
                title={t("delete")}
                content={t("are_you_sure_want_to_delete")}
                action={
                    <LoadingButton
                        isSubmitting={loading}
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





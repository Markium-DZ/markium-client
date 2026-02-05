import { LoadingButton } from '@mui/lab';
import { Box, Button, Card, FormControlLabel, FormGroup, IconButton, MenuItem, Switch, Tooltip, Typography } from '@mui/material';
import { t } from 'i18next';
import { set } from 'lodash'; // [keep for later use]
import { enqueueSnackbar } from 'notistack';
import { useCallback, useEffect, useState } from 'react';
import { AddCarToMentainance, deleteCar, markCarAsAvailable, useGetCar, useGetCarCostIput } from 'src/api/car';
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
import { useLocales } from 'src/locales';
import { RouterLink } from 'src/routes/components';
import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';
import ZaityListView from 'src/sections/ZaityTables/zaity-list-view';
import ZaityHeadContainer from 'src/sections/ZaityTables/ZaityHeadContainer';
import ZaityTableFilters from 'src/sections/ZaityTables/ZaityTableFilters';
import ZaityTableTabs from 'src/sections/ZaityTables/ZaityTableTabs'; // [keep for later use]
import { fDate } from 'src/utils/format-time';
import showError from 'src/utils/show_error';

// ----------------------------------------------------------------------


export default function CostInputs({ }) {
    const { car, carLoading } = useGetCar();
    const { contracts } = useGetContracts()
    const { cost_input, cost_inputLoading } = useGetCarCostIput()
    const { currentLang } = useLocales()

    const [tableData, setTableData] = useState([]);
    const [dataFiltered, setDataFiltered] = useState([]);

    let TABLE_HEAD = [
        // { id: 'plat_number', label: t('plateNumber'), type: "text", width: 120 },
        { id: 'vehicle', label: t('vehicle'), type: "two-lines-link", first: (row) => row?.car?.plat_number, second: (row) => row?.car?.model?.translations?.name, link: (row) => { return paths.dashboard.vehicle.details(row?.car?.id) }, width: 160 },
        // { id: 'model', label: t('model'), type: "two-lines-link", first: (row) => row?.model?.translations?.name, second: (row) => row?.model?.company?.translations?.name, link: (row) => { return paths.dashboard.vehicle.details(row?.id) }, width: 140 },
        // { id: 'production_year', label: t('manufacturingYear'), type: "text", width: 100 },
        // { id: 'driver', label: t('driver'), type: "two-lines-link", first: (row) => row?.driver?.name || "--", second: (row) => { }, link: (row) => { return row?.driver?.id ?  paths.dashboard.drivers.details(row?.driver?.id) : "#"}, width: 180 },
        // { id: 'c_driver', label: t('driver'), type: "long_text", length: 3, width: 200 },
        // { id: 'driver', label: t('driver'), type: "text", width: 140 },
        { id: 'c_operation', label: t('operation'), type: "label", width: 140 },
        { id: 'c_date', label: t('date'), type: "text", width: 140 },
        { id: 'amount', label: t('amount'), type: "text", width: 140 },
        // { id: 'client', label: t('client'), type: "two-lines-link", first: (row) => row?.client?.name || "--", second: (row) => { }, link: (row) => { return row?.client?.id ?  paths.dashboard.clients.details(row?.id) : "#" }, width: 180 },
        // { id: 'contract', label: t('contract'), type: "two-lines-link", first: (row) => row?.contract?.ref || "--", second: (row) => { }, link: (row) => { return  row?.contract?.id ? paths.dashboard.clients.contractsDetails(row?.contract?.id) : "#" }, width: 180 },
        // { id: 'ref', label: t('contract'), type: "text", width: 100 },
        { id: 'contract', label: t('note'), type: "threeDots", component: (item) => <ElementActions item={item} RformulateTable={RformulateTable} currentLang={currentLang.value} contracts={contracts} />, width: 140, align: "center" },
    ]



    const items = [
        { key: 'all', label: t('all'), match: () => true },
        { key: 'debit', label: t('debit'), match: (item) => item?.operation === "debit", color: 'error' },
        { key: 'credit', label: t('credit'), match: (item) => item?.operation === "credit", color: 'primary' },
        // { key: 'under_preparation', label: t('under_preparation'), match: (item) => item?.status?.key == "under_preparation", color: 'secondary' },
        // { key: 'rented', label: t('rented'), match: (item) => item?.is_rented, color: 'warning' },
    ];
    const filters = [
        {
            key: 'plat_number', label: t('plat_number'), match: (item, value) =>
                item?.car?.plat_number?.toLowerCase()?.includes(value?.toLowerCase()) ||
                item?.car?.model?.translations?.name?.toLowerCase()?.includes(value?.toLowerCase()) ||
                item?.model?.company?.translations?.name?.toLowerCase()?.includes(value?.toLowerCase()) ||
                item?.c_date?.toLowerCase()?.includes(value?.toLowerCase()) ||
                item?.amount?.toLowerCase()?.includes(value?.toLowerCase()) ||
                item?.note_en?.toLowerCase()?.includes(value?.toLowerCase()) ||
                item?.note_ar?.toLowerCase()?.includes(value?.toLowerCase()),
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
            return {
                ...item,
                car: car?.find(i => i?.id == item?.car_id),
                c_operation: t(item?.operation),
                color: item?.operation == "credit" ? "success" : "error",
                c_date: fDate(item.created_at, "yyy-MM-dd"),
            };
        }) || [];
    };


    useEffect(() => {
        setDataFiltered(RformulateTable(cost_input));
    }, [car, contracts, cost_input]);
    useEffect(() => {
        setTableData(RformulateTable(cost_input));
    }, [car, contracts, cost_input]);

    return (
        <>
            <ZaityHeadContainer
                heading={t("vehiclesList")}
                action={
                    <Box display={"flex"} columnGap={2} >
                    </Box>
                }
                links={[
                    { name: t('dashboard'), href: paths.dashboard.root },
                    { name: t("vehicles"), href: paths.dashboard.vehicle.new },
                    { name: t('costAndInput') },
                ]}
            >
                <Card>
                    <ZaityTableTabs filterKey='condition' data={tableData} items={items} defaultFilters={defaultFilters} setTableDate={setDataFiltered} filterFunction={filterFunction}>
                        <ZaityTableFilters data={dataFiltered} tableData={tableData} setTableDate={setDataFiltered} items={filters} defaultFilters={defaultFilters} dataFiltered={tableData} searchText={t("search_by") + " " + t("plateNumber") + " " + t("or_any_value") + " ..."} >
                            {
                                cost_inputLoading ?
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



const ElementActions = ({ item, currentLang, contracts }) => {
    const note = item[`note_${currentLang}`] ?? "";

    const parsedNote = note.replace(/#(\w+)/g, (match, ref) => {
        if (item?.operation === "debit") {
            return `<a href="/dashboard/maintenance/${ref}" style="color: #00A76F; text-decoration: underline;">${ref}</a>`;
        } else {
            const contractId = contracts?.find(i => i.ref == ref)?.id;
            if (contractId) {
                return `<a href="/dashboard/clients/contracts/${contractId}" style="color: #00A76F; text-decoration: underline;">${ref}</a>`;
            } else {
                return `#${ref}`; // fallback if contract not found
            }
        }
    });

    return (
        <Box display={"flex"} rowGap={"10px"} sx={{ gap: '10px' }} >
            <span dangerouslySetInnerHTML={{ __html: parsedNote }}></span>
        </Box>
    );
};



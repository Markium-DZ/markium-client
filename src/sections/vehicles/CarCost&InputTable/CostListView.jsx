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
import showError from 'src/utils/show_error';

// ----------------------------------------------------------------------


export default function CostListView({ id }) {
    const { contracts } = useGetContracts()
    const { cost_input , cost_inputLoading } = useGetCarCostIput();
    const [tableData, setTableData] = useState([]);
    const [dataFiltered, setDataFiltered] = useState([]);
    const { currentLang } = useLocales()


    const renderNote = (row) => {
        const note = row[`note_${currentLang?.value}`] ?? "";

        return note.replace(/#(\w+)/g, (match, ref) => {
            if (row?.operation === "debit") {
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
    }

    let TABLE_HEAD = [
        { id: 'c_operation', label: t('operation'), type: "label", width: 100 },
        { id: 'amount', label: t('amount'), type: "text", width: 100 },
        { id: 'note_en', label: t('note'), type: "render", render: (item) =>  <span dangerouslySetInnerHTML={{ __html: renderNote(item) }}></span>, width: 400 },
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
            key: 'plat_number', label: t('amount'), match: (item, value) =>
                item?.amount?.toLowerCase()?.includes(value?.toLowerCase()) ||
                item?.note_ar?.toLowerCase()?.includes(value?.toLowerCase()) ||
                // item?.model?.translations?.name?.toLowerCase()?.includes(value?.toLowerCase()) ||
                // item?.model?.company?.translations?.name?.toLowerCase()?.includes(value?.toLowerCase()) ||
                // item?.production_year?.toLowerCase()?.includes(value?.toLowerCase()) ||
                item?.note_en?.toLowerCase()?.includes(value?.toLowerCase()),
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
                c_operation :t(item?.operation),
                color:item?.operation == "debit" ? "error" : "success"
                
            };
        }) || [];
    };


    useEffect(() => {
        setDataFiltered(RformulateTable(cost_input?.filter(i => i.car_id == id)));
    }, [cost_input]);
    useEffect(() => {
        setTableData(RformulateTable(cost_input?.filter(i => i.car_id == id)));
    }, [cost_input]);

    return (
        <>
            <Card>
                <ZaityTableTabs filterKey='condition' data={tableData} items={items} defaultFilters={defaultFilters} setTableDate={setDataFiltered} filterFunction={filterFunction}>
                    <ZaityTableFilters data={dataFiltered} tableData={tableData} setTableDate={setDataFiltered} items={filters} defaultFilters={defaultFilters} dataFiltered={tableData} searchText={t("search_by") + " " + t("amount") + " " + t("or_any_value") + " ..."} >
                        {
                            cost_inputLoading ?
                                <LoadingScreen sx={{ my: 8 }} color='primary' />
                                :
                                <ZaityListView TABLE_HEAD={[...TABLE_HEAD]} dense="medium" zaityTableDate={dataFiltered || []} onSelectedRows={({ data, setTableData }) => { return <onSelectedRowsComponent configurable_type={"roles"} setTableData={setTableData} data={cost_input} /> }} />
                        }
                    </ZaityTableFilters>
                </ZaityTableTabs>
            </Card>

        </>
    );
}

// ----------------------------------------------------------------------




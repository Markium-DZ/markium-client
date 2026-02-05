import { Container, Grid } from '@mui/material';
import { t } from 'i18next';
import { Helmet } from 'react-helmet-async';
import { useGetAllClaim } from 'src/api/claim';
import { useGetClients } from 'src/api/client';
import { useGetContracts } from 'src/api/contract';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { useSettingsContext } from 'src/components/settings';
import ContractClaimsListView from 'src/sections/clients/ContractClaimsTable/ContractClaimsListView';




import { Box, Button, Card, FormControlLabel, FormGroup, IconButton, MenuItem, Stack, Switch, Tooltip, Typography } from '@mui/material';
import { set } from 'lodash'; // [keep for later use]
import { enqueueSnackbar } from 'notistack';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { RouterLink } from 'src/routes/components';
import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';
import ZaityListView from 'src/sections/ZaityTables/zaity-list-view';
import ZaityHeadContainer from 'src/sections/ZaityTables/ZaityHeadContainer';
import ZaityTableFilters from 'src/sections/ZaityTables/ZaityTableFilters';
import ZaityTableTabs from 'src/sections/ZaityTables/ZaityTableTabs'; // [keep for later use]
import { CloseClaim } from 'src/sections/clients/ContractClaimsTable/CloseClaim';
import { ViewClaim } from 'src/sections/clients/ContractClaimsTable/ViewClaim'; 
import { EditClaim } from 'src/sections/clients/ContractClaimsTable/EditClaim';
import { LoadingScreen } from 'src/components/loading-screen';
import { deleteContractClaim, deleteContractClause } from 'src/api/contract';
import showError from 'src/utils/show_error';





import { ClaimsListView } from 'src/sections/clients/view';
import { fDate } from 'src/utils/format-time';

// ----------------------------------------------------------------------

export default function ClaimsStat() {
    const settings = useSettingsContext();
    const { claims, claimsLoading } = useGetAllClaim()
    const { clients } = useGetClients()
    const { contracts } = useGetContracts()
    console.log("clients : ", clients?.find(item => item?.id == 1));
    console.log("contracts : ", contracts?.find(item => item?.id == 1));


    const formulateClaims = (list) => {
        return list.map((item) => {
            const contract = contracts?.find((c) => c.id === item?.contract_id);
            const client = clients?.find((cl) => cl.id === contract?.client_id);

            return {
                ...item,
                payment_date: fDate(new Date(item?.paiment_date)),
                date: fDate(new Date(item?.created_at)),
                gstatus: item?.status?.translations?.[0]?.name,
                contract: contract?.ref,
                client: client?.name,
                client_id: client?.id,
            };
        });
    };



    const [data, setDate] = useState(formulateClaims(claims));
    useEffect(() => {
        setDate(formulateClaims(claims))
    }, [claims, clients, contracts])

    const [tableData, setTableData] = useState([]);
    const [dataFiltered, setDataFiltered] = useState([]);
    const with_contracts = true

    const TABLE_HEAD = useMemo(() => {
        if (with_contracts) {
            return [
                {
                    id: 'ref',
                    label: t('ref'),
                    type: 'two-lines-link',
                    first: (row) => row?.contract,
                    second: () => { },
                    link: (row) => paths.dashboard.clients.contractsDetails(row.contract_id),
                    width: 50,
                },
                {
                    id: 'client',
                    label: t('client'),
                    type: 'two-lines-link',
                    first: (row) => row?.client,
                    second: () => { },
                    link: (row) => paths.dashboard.clients.details(row.client_id),
                    width: 120,
                },
                { id: 'amount', label: t('amount'), type: 'text', width: 60 },
                // { id: 'date', label: t('date'), type: 'text', width: 140 },
                { id: 'payment_date', label: t('paiment_date'), type: 'text', width: 60 },
                { id: 'gstatus', label: t('status'), type: 'label', color: 'error', width: 60 },
                {
                    id: 'actions',
                    label: t('actions'),
                    type: 'threeDots',
                    component: (item) => <ElementActions item={item} setTableData={setDataFiltered} />,
                    width: 60,
                    align: 'right',
                },
            ];
        } else {
            return [
                { id: 'amount', label: t('amount'), type: 'text', width: 140 },
                { id: 'date', label: t('date'), type: 'text', width: 140 },
                { id: 'payment_date', label: t('paiment_date'), type: 'text', width: 140 },
                { id: 'gstatus', label: t('status'), type: 'label', color: 'error', width: 140 },
                {
                    id: 'actions',
                    label: t('actions'),
                    type: 'threeDots',
                    component: (item) => <ElementActions item={item} setTableData={setDataFiltered} />,
                    width: 400,
                    align: 'right',
                },
            ];
        }
    }, [with_contracts, setDataFiltered]);


    const defaultFilters = { status: 'all', name: "" };
    const items = [
        { key: 'all', label: t('all'), match: () => true },
        { key: 'paid_claim', label: t('paid_claim'), match: (item) => item?.status?.key === "paid_claim", color: 'primary' },
        { key: 'not_yet_claim', label: t('not_yet_claim'), match: (item) => item?.status?.key === "not_yet_claim", color: 'secondary' },
        { key: 'due_claim', label: t('due_claim'), match: (item) => item?.status?.key === "due_claim", color: 'warning' },
        { key: 'overdue_claim', label: t('overdue_claim'), match: (item) => item?.status?.key === "overdue_claim", color: 'error' },
        { key: 'severely_overdue_claim', label: t('severely_overdue_claim'), match: (item) => item?.status?.key === "severely_overdue_claim", color: 'error' },
    ];
    const filterFunction = (data, filters) => {
        const activeTab = filters.tabKey;
        const item = tableData.find(i => i?.key === activeTab);
        if (item?.match) return data.filter((d) => item.match(d, filters));
        return data;
    }

    const RformulateTable = (data = []) => {
        return data?.map(item => {
            // let gstatus = "under_rent";
            // let statusLabel = t("under_rent");
            let color = "secondary";

            if (item?.status?.key == "paid_claim") {
                color = "success";
            } else if (item?.status?.key == "due_claim") {
                color = "warning";
            }

            return {
                ...item,
                // gstatus,
                // status: statusLabel,
                color,
            };
        });
    };

    useEffect(() => {
        setDataFiltered(RformulateTable(data));
    }, [data]);
    useEffect(() => {
        setTableData(RformulateTable(data));
    }, [data]);

    return (
        <>
            {/* <AddClause contract_id={data?.length >0 ? data[0]?.contract_id : 0} setTableData={setDataFiltered} /> */}
            <Card  >
                {/* <ZaityTableTabs data={tableData} items={items} defaultFilters={{ gstatus: 'all' }} setTableDate={setDataFiltered} filterFunction={filterFunction}> */}
                    {
                        claimsLoading ?
                            <LoadingScreen sx={{ my: 8 }} color='primary' />
                            :
                            <ZaityListView TABLE_HEAD={[...TABLE_HEAD]} dense="medium" zaityTableDate={dataFiltered || []} onSelectedRows={({ data, setTableData }) => { return <onSelectedRowsComponent configurable_type={"roles"} setTableData={setTableData} data={data} /> }} />
                    }
                {/* </ZaityTableTabs> */}
            </Card>
        </>
    );
}






const ElementActions = ({ item, setTableData }) => {
    const popover = usePopover();
    const confirm = useBoolean();
    const edit = useBoolean();
    const view = useBoolean();
    const replace = useBoolean();
    const cancle = useBoolean();
    const router = useRouter();



     const [postloader, setPostloader] = useState(false)


    const onViewRow = useCallback(
        (id) => {
            // router.push(paths.dashboard.user.edit(id));
        },
        [router]
    );
    const onDeleteRow = useCallback(
        async (id) => {
            setPostloader(true)
            console.log("id : ", id);
            try {
                const res = await deleteContractClaim(id);
                console.log("res : ", res);
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
    const onBanRow = useCallback(
        async (id) => {
            await deleteContractClause(id);
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

                <PermissionsContext action={"read.claim"} >
                    <MenuItem onClick={() => { view.onTrue(); popover.onClose() }}>
                        <Iconify icon="lets-icons:eye-fill" />
                        {t('view')}
                    </MenuItem>
                </PermissionsContext>
                <PermissionsContext action={"update.claim"} >
                    <MenuItem onClick={() => { edit.onTrue(); popover.onClose() }}>
                        <Iconify icon="solar:clapperboard-edit-bold-duotone" />
                        {t('edit')}
                    </MenuItem>
                </PermissionsContext>
                {/* <PermissionsContext action={"update.claim"} >
                    <MenuItem onClick={() => { edit.onTrue(); popover.onClose() }}>
                        <Iconify icon="solar:pen-bold" />
                        {t('edit')}
                    </MenuItem>
                </PermissionsContext> */}
                {
                    item?.status?.key != "paid_claim" ?
                        <PermissionsContext action={"update.claim"} >
                            <MenuItem disabled={item?.status?.key == "paid_claim"} onClick={() => { replace.onTrue(); popover.onClose() }} >
                                <Iconify icon="duo-icons:folder-open" />
                                {t('close_claim')}
                            </MenuItem>
                        </PermissionsContext>
                        :
                        null
                }
                <PermissionsContext action={"delete.claim"} >
                    <MenuItem onClick={() => { confirm.onTrue(); popover.onClose() }} sx={{ color: 'error.main' }} >
                        <Iconify icon="solar:trash-bin-trash-bold" />
                        {t('delete')}
                    </MenuItem>
                </PermissionsContext>

            </CustomPopover>


            <ContentDialog
                open={edit.value}
                onClose={edit.onFalse}
                title={t("edit") + " " + t("claim")}
                content={
                    <>
                        <EditClaim claim_id={item?.id} item={item} setTableData={setTableData} close={() => { edit.onFalse() }} />
                    </>
                }
            />

            <ContentDialog
                open={view.value}
                maxWidth={"sm"}
                onClose={view.onFalse}
                title={t("")}
                content={
                    <ViewClaim claim={item} />
                }
            />
            <ContentDialog
                open={replace.value}
                onClose={replace.onFalse}
                title={t("")}
                content={
                    <CloseClaim claim_id={item?.id} setTableData={setTableData} close={() => { replace?.onFalse() }} />
                }
            />


            {/* <ContentDialog
                maxWidth={"md"}
                open={replace.value}
                onClose={replace.onFalse}
                title={t("replace_clause")}
                content={
                    <>
                        <ReplaceClause item={item} id={item?.id} close={() => { replace.onFalse() }} />
                    </>
                }
            /> */}

            <ConfirmDialog
                open={confirm.value}
                onClose={confirm.onFalse}
                title={t("delete")}
                content={t("are_you_sure_want_to_delete")}
                action={
                    <Button variant="contained"  loading={postloader} isSubmitting={postloader} color="error" onClick={() => onDeleteRow(item?.id)}>
                        {t("delete")}
                    </Button>
                }
            />

        </Box>
    );
};

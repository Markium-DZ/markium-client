import { LoadingButton } from '@mui/lab';
import { Box, Button, Card, FormControlLabel, FormGroup, IconButton, MenuItem, Switch, Tooltip, Typography } from '@mui/material';
import { t } from 'i18next';
import { set } from 'lodash'; // [keep for later use]
import { enqueueSnackbar } from 'notistack';
import { useCallback, useEffect, useState } from 'react';
import { changeItemVisibilityInSettings, useGetMainSpecs } from 'src/api/settings'; // [keep for later use]
import { deleteEmptyRole, deleteRole, useRoles } from 'src/api/users';
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
import showError from 'src/utils/show_error';
import { DeleteCurrentRole } from './DeleteCurrentRole';

// ----------------------------------------------------------------------


export default function RolesListView({ }) {
    const { roles } = useRoles();
    const [tableData, setTableData] = useState([]);
    const [dataFiltered, setDataFiltered] = useState([]);

    let TABLE_HEAD = [
        { id: 'name', label: t('role'), type: "text", width: 140 },
        { id: 'users_count', label: t('nb_users'), type: "number", width: 140 },
        { id: 'actions', label: t('actions'), type: "threeDots", component: (item) => <ElementActions roles={roles} item={item} setTableData={setDataFiltered} />, width: 400, align: "right" },
    ]


    const defaultFilters = { status: 'all', name: "" };
    const items = [
        { key: 'all', label: t('all'), match: () => true },
        { key: 'selected', label: t('selected'), match: (item) => item?.status === "selected", color: 'primary' },
        { key: 'not_selected', label: t('not_selected'), match: (item) => item?.status === "not_selected", color: 'warning' },
    ];
    const filterFunction = (data, filters) => {
        const activeTab = filters.tabKey;
        const item = tableData.find(i => i?.key === activeTab);
        if (item?.match) return data.filter((d) => item.match(d, filters));
        return data;
    }

    const RformulateTable = (data) => {
        return data?.map(item => ({
            ...item,
            name: item?.translations?.find(i => i.lang_id == 1)?.name || item?.translations?.find(i => i.lang_id == 2)?.name || item?.key
        })) || [];
    }

    useEffect(() => {
        setDataFiltered(RformulateTable(roles));
    }, [roles]);
    useEffect(() => {
        setTableData(RformulateTable(roles));
    }, [roles]);

    return (
        <>
            <ZaityHeadContainer
                heading={t("roles_list")}
                action={
                    <PermissionsContext action={"create.role"} >
                        <Button
                            component={RouterLink}
                            href={paths.dashboard.user.rolesNew}
                            variant="contained"
                            startIcon={<Iconify icon="mingcute:add-line" />}
                        >
                            {t("roles_add")}
                        </Button>
                    </PermissionsContext>
                }
                links={[
                    { name: t('dashboard'), href: paths.dashboard.root },
                    { name: t("roles_list"), href: paths.dashboard.user.rolesNew },
                    { name: t('list') },
                ]}
            >
                <Card>
                    {/* <ZaityTableTabs data={tableData} items={items} defaultFilters={{ status: 'all' }} setTableDate={setDataFiltered} filterFunction={filterFunction}> */}
                    {/* <ZaityTableFilters defaultFilters={defaultFilters} dataFiltered={tableData}> */}
                    <ZaityListView TABLE_HEAD={[...TABLE_HEAD]} dense="medium" zaityTableDate={dataFiltered || []} onSelectedRows={({ data, setTableData }) => { return <onSelectedRowsComponent configurable_type={"roles"} setTableData={setTableData} data={roles} /> }} />
                    {/* </ZaityTableFilters> */}
                    {/* </ZaityTableTabs> */}
                </Card>
            </ZaityHeadContainer>
        </>
    );
}

// ----------------------------------------------------------------------


const EnableDisableItem = ({ item, configurable_type, setTableData, data }) => {
    const handleChange = async (event) => {
        const ischkd = event.target.checked
        let status = ischkd ? "selected" : "not_selected";
        let enabled = ischkd ? t("enabled") : t("not_enabled");
        let color = ischkd ? "success" : "error";
        console.log("status : ", status);
        await changeItemVisibilityInSettings({ configurable_type, configurable_id: item.id, is_selected: event.target.checked, is_private: false })
        setTableData(prev =>
            prev?.map(i => {
                if (i.key == item.key) {
                    const updated = { ...i, enable: status, enabled, color, system_settings: { is_selected: event.target.checked } };
                    console.log("Updated item: ", updated);
                    return updated;
                }
                return i;
            })
        );
        setIsChecked(status == "selected")
        enqueueSnackbar(t("operation_success"), { variant: 'success' });
    };
    const [isChecked, setIsChecked] = useState(item?.enable == "selected")

    return (
        <FormGroup sx={{ display: "flex", flexDirection: "row", alignItems: "center", rowGap: "10px" }}>
            <FormControlLabel
                control={<Switch checked={isChecked} onChange={handleChange} />}
                label=""
            />
        </FormGroup>
    );
};
const onSelectedRowsComponent = ({ configurable_type, setTableData, data }) => {
    const handleChange = async (event) => {
        let status = event.target.checked ? "selected" : "not_selected";
        console.log("status : ", status);
        for (element in data) {
            setTableData(prev =>
                prev?.map(i => {
                    if (i.key == element.key) {
                        const updated = { ...i, enable: status, system_settings: { is_selected: event.target.checked }, enabled: event.target.checked ? t("yes") : t("no") };
                        console.log("Updated item: ", updated);
                        return updated;
                    }
                    return i;
                })
            );
            await changeItemVisibilityInSettings({ configurable_type, configurable_id: item.id, is_selected: event.target.checked, is_private: false })
        }
        setIsChecked(event.target.checked)
        enqueueSnackbar(t("operation_success"), { variant: 'success' });
    };
    const [isChecked, setIsChecked] = useState(false)

    return (
        <>
            {/* <FormGroup sx={{ display: "flex", flexDirection: "row", alignItems: "center", rowGap: "10px" }}>
                <FormControlLabel
                    control={<Switch checked={isChecked} onChange={handleChange} />}
                    label=""
                />
            </FormGroup> */}
            <Tooltip title="Delete">
                <IconButton color="primary" onClick={() => { }}>
                    <Iconify icon="solar:trash-bin-trash-bold" />
                </IconButton>
            </Tooltip>
        </>
    );
};


const ElementActions = ({ item, setTableData, roles }) => {
    const popover = usePopover();
    const confirm = useBoolean();
    const del = useBoolean();
    const router = useRouter();
    const [postloader, setPostloader] = useState(false)
    const onViewRow = useCallback(
        (id) => {
            router.push(paths.dashboard.user.rolesEdit(id));
        },
        [router]
    );

    const onDeleteRow = useCallback(
        async (id) => {
            setPostloader(true)
            console.log("id : ", id);
            try {
                // const res = await deleteRole(id, { replacement_role_id: 2 });
                const res = await deleteEmptyRole(id);
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
    return (
        <Box display={"flex"} rowGap={"10px"} sx={{ gap: '10px' }} >
            <PermissionsContext action={"delete.role"} >
                <Button
                    // disabled={item?.users_count && item?.users_count > 0}
                    onClick={() => {
                        confirm.onTrue();
                        popover.onClose();
                    }}
                    variant="outlined" color="error" startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}>
                    {t("delete")}
                </Button>
            </PermissionsContext>
            <PermissionsContext action={"update.role"} >
                <Button onClick={() => { onViewRow(item?.id) }} variant="outlined" startIcon={<Iconify icon="solar:pen-bold" />}>
                    {t("edit")}
                </Button>
            </PermissionsContext>
            {/* <IconButton color={popover.open ? 'inherit' : 'default'} onClick={popover.onOpen}>
                <Iconify icon="eva:more-vertical-fill" />
            </IconButton>

            <CustomPopover
                open={popover.open}
                onClose={popover.onClose}
                arrow="right-top"
                sx={{ width: 200 }}
            >
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

                <MenuItem
                    onClick={() => {
                        onViewRow(item?.id);
                        popover.onClose();
                    }}
                >
                    <Iconify icon="solar:pen-bold" />
                    {t('edit')}
                </MenuItem>
            </CustomPopover> */}

            <ContentDialog
                open={del.value}
                onClose={del.onFalse}
                title={t("delete")}
                content={
                    <DeleteCurrentRole roles={roles?.filter(i => i?.id != item?.id)?.map(i => ({ id: i?.id, name: i.translations?.find(ii => ii.lang_id == 1)?.name || i.translations?.find(ii => ii.lang_id == 2)?.name || i.key }))} role={item} id={item?.id} close={() => del?.onFalse()} />
                }
            />


            <ConfirmDialog
                open={confirm.value}
                onClose={confirm.onFalse}
                title={t("delete")}
                content={item?.users_count && item?.users_count > 0 ? t('unable_to_delete_role',{item:item?.name}) : t('are_u_sure_to_delete',{item:t("role"),item2:item?.translations?.find(i => i.lang_id == 1)?.name || item?.translations?.find(i => i.lang_id == 2)?.name || item?.key})}
                action={
                    <LoadingButton
                        disabled={item?.users_count && item?.users_count > 0}
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



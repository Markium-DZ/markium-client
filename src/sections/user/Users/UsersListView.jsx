import { Box, Button, Card, FormControlLabel, FormGroup, IconButton, MenuItem, Switch, Tooltip, Typography } from '@mui/material';
import { t } from 'i18next';
import { set } from 'lodash'; // [keep for later use]
import { enqueueSnackbar } from 'notistack';
import { useCallback, useEffect, useState } from 'react';
import { changeItemVisibilityInSettings, useGetMainSpecs } from 'src/api/settings'; // [keep for later use]
import { activateUser, banUser, createUser, deleteUser, useRoles, useUsers } from 'src/api/users';
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

// ----------------------------------------------------------------------


export default function UsersListView({ }) {
    const { users } = useUsers();
    const {roles} = useRoles()
    const {currentLang} = useLocales()
    // const users = [
    //     { id: 1, name: "zaki", username: "zak-info", email: "zaki@gmail.com", phone_number: "075912431", role: "super admin" }
    // ]
    const [tableData, setTableData] = useState([]);
    const [dataFiltered, setDataFiltered] = useState([]);



    function translateSelectedRoles(selectedRoles, roles, locale) {
        if (!Array.isArray(selectedRoles) || !roles?.length) return "";
      
        const translated = selectedRoles.map(sel => {
          const role = roles.find(r => r.key === sel.key);
          if (!role) return sel.key; // fallback
      
          if (locale === "ar") {
            return role.translations.find(t => t.lang_id === 1)?.name || sel.key;
          } else {
            return role.translations.find(t => t.lang_id === 2)?.name || sel.key;
          }
        });
      
        return locale === "ar"
          ? translated.join(" و ")
          : translated.join(" and ");
      }
      

      

    let TABLE_HEAD = [
        { id: 'name', label: t('name'), type: "text", width: 140 },
        { id: 'username', label: t('username'), type: "text", width: 180 },
        { id: 'email', label: t('email'), type: "text", width: 140 },
        { id: 'phone_number', label: t('phone_number'), type: "text", width: 140 },
        { id: 'status', label: t('status'), type: "label", width: 140 },
        { id: 'roles', label: t('roles'), type: "text", width: 400 },
        { id: 'actions', label: t('actions'), type: "threeDots", component: (item) => <ElementActions item={item} setTableData={setDataFiltered} />, width: 200, align: "right" },
    ]



    const filters = [
        {
            key: 'name', label: t('name'), match: (item, value) =>
                item?.name?.toLowerCase().includes(value?.toLowerCase()) ||
                item?.username?.toLowerCase().includes(value?.toLowerCase()) ||
                item?.phone_number?.toLowerCase().includes(value?.toLowerCase()) ||
                item?.roles?.toLowerCase().includes(value?.toLowerCase()) ||
                item?.email?.toLowerCase().includes(value?.toLowerCase()),
        },
    ];

    const defaultFilters = {
        name: '',
    };

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

    function arrayToSentence(arr) {
        if (arr.length === 0) return "";
        if (arr.length === 1) return arr[0];
        if (arr.length === 2) return `${arr[0]} and ${arr[1]}`;
        return `${arr.slice(0, -1).join(", ")}, and ${arr[arr.length - 1]}`;
    }

    // arrayToSentence(["apples", "bananas", "oranges"]);
    // Output: "apples, bananas, and oranges"

    const RformulateTable = (data) => {
        return data?.map(item => {
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
            } else if (item?.is_banned) {
                color = "error";
                status = t("banned");
            } else {
                color = "success";
                status = t("active");
            }
            
            return {
                ...item,
                roles: translateSelectedRoles(item.roles, roles, currentLang?.value),
                status,
                color
            };
        }) || [];
    }

    useEffect(() => {
        setDataFiltered(RformulateTable(users));
    }, [users]);
    useEffect(() => {
        setTableData(RformulateTable(users));
    }, [users]);

    return (
        <>
            <ZaityHeadContainer
                heading={t("users_list")}
                action={
                    <PermissionsContext action={"create.user"} >
                        <Button
                            component={RouterLink}
                            href={paths.dashboard.user.new}
                            variant="contained"
                            startIcon={<Iconify icon="mingcute:add-line" />}
                        >
                            {t("add_user")}
                        </Button>
                    </PermissionsContext>
                }
                links={[
                    { name: t('dashboard'), href: paths.dashboard.root },
                    { name: t("users_list"), href: paths.dashboard.user.new },
                    { name: t('list') },
                ]}
            >
                <Card>
                    {/* <ZaityTableTabs data={tableData} items={items} defaultFilters={{ status: 'all' }} setTableDate={setDataFiltered} filterFunction={filterFunction}> */}
                    <ZaityTableFilters data={dataFiltered} tableData={tableData} setTableDate={setDataFiltered} items={filters} defaultFilters={defaultFilters} dataFiltered={tableData} searchText={t("search_by") + " " + t("name") + ", " + t("username") + ", " + t("email") + ", " + t("phone") + " ..."} >
                        <ZaityListView TABLE_HEAD={[...TABLE_HEAD]} dense="medium" zaityTableDate={dataFiltered || []} onSelectedRows={({ data, setTableData }) => { return <onSelectedRowsComponent configurable_type={"roles"} setTableData={setTableData} data={users} /> }} />
                    </ZaityTableFilters>
                    {/* </ZaityTableTabs> */}
                </Card>
            </ZaityHeadContainer>
        </>
    );
}

// ----------------------------------------------------------------------


import ChangePasswordView from 'src/sections/user/Users/changePasswordView';
import showError from 'src/utils/show_error';
import { LoadingButton } from '@mui/lab';
import { useLocales } from 'src/locales';


const ElementActions = ({ item, setTableData }) => {
    const popover = usePopover();
    const confirm = useBoolean();
    const ban = useBoolean();
    const activate = useBoolean();
    const completed = useBoolean();
    const router = useRouter();
    const [postloader, setPostloader] = useState(false)
    const onViewRow = useCallback(
        (id) => {
            router.push(paths.dashboard.user.edit(id));
        },
        [router]
    );

    const onDeleteRow = useCallback(
        async (id) => {
            setPostloader(true)
            try {
                const res = await deleteUser(id);
                console.log("res : ", res);
                // if(res.status == 200){
                // setTableData(prev => prev?.map(i => ({...i,is_banned : i.id != id ? !i.is_banned : i?.is_banned }) ))
                setTableData(prev => prev?.filter(i => i.id != id))
                enqueueSnackbar(t("operation_success"));
                confirm.onFalse();
                // }
                setPostloader(false)
            } catch (error) {
                console.log("error res res  : ", error);
                setPostloader(false)
                showError(error)
            }
        }
    );
    const onBanRow = useCallback(
        async (id) => {
            setPostloader(true)
            // try {
            console.log(" lets ban htis :", id);
            const res = await banUser(id);
            console.log("res : ", res);
            if (res.status == 200) {
                setTableData(prev => prev?.map(i => ({ ...i, is_banned: i.id == id ? !i.is_banned : i?.is_banned, status: i.id == id ? t("banned") : i.status, color: i.id == id ? "error" : i.color })))
                enqueueSnackbar(t("operation_success"));
                ban.onFalse();
            }
            setPostloader(false)
            // } catch (error) {
            //     console.log("error : ", error);
            //     setPostloader(false)
            //     showError(error)
            // }
        }
    );

    const onActivateRow = useCallback(
        async (id) => {
            setPostloader(true)
            // try {
            console.log(" lets activate this :", id);
            const res = await activateUser(id);
            console.log("res : ", res.status);
            if (res.status == 200) {
                // setTableData(prev => prev?.map(i => ({ ...i, is_banned: i.id != id ? !i.is_banned : i?.is_banned })))
                setTableData(prev => prev?.map(i => ({ ...i, is_banned: i.id == id ? !i.is_banned : i?.is_banned, status: i.id == id ? t("active") : i.status, color: i.id == id ? "success" : i.color })))
                enqueueSnackbar(t("operation_success"));
                activate.onFalse();
            }
            setPostloader(false)
            // } catch (error) {
            //     console.log("error : ", error);
            //     setPostloader(false)
            //     showError(error)
            // }
        }
    );

    return (
        <Box display={"flex"} rowGap={"10px"} sx={{ gap: '10px' }} >
            {/* <PermissionsContext action={"update.user"} >
                <Button onClick={() => { onViewRow(item?.id) }} variant="outlined" startIcon={<Iconify icon="solar:pen-bold" />}>
                    {t("edit")}
                </Button>
            </PermissionsContext> */}
            {/* <PermissionsContext action={"update.user"} >
                <Button onClick={() => { ban.onTrue() }} variant="outlined" color="warning" startIcon={<Iconify icon="material-symbols-light:shield-locked-rounded" />}>
                    {t("ban")}
                </Button>
            </PermissionsContext> */}
            {/* <PermissionsContext action={"delete.user"} >
                <Button onClick={() => { confirm.onTrue() }} variant="outlined" color="error" startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}>
                    {t("delete")}
                </Button>
            </PermissionsContext> */}

            <IconButton color={popover.open ? 'inherit' : 'default'} onClick={popover.onOpen}>
                <Iconify icon="eva:more-vertical-fill" />
            </IconButton>

            <CustomPopover
                open={popover.open}
                onClose={popover.onClose}
                arrow="right-top"
                sx={{ width: 200 }}
            >
                <PermissionsContext action={"put.user.password"} >
                    <MenuItem
                        onClick={() => {
                            // onViewRow(item?.id);
                            completed.onTrue();
                            popover.onClose();
                        }}
                    >
                        <Iconify icon="material-symbols-light:shield-locked-rounded" />
                        {t('edit_password')}
                    </MenuItem>
                </PermissionsContext>
                <PermissionsContext action={"update.user"} >
                    <MenuItem
                        onClick={() => {
                            onViewRow(item?.id);
                            popover.onClose();
                        }}
                    >
                        <Iconify icon="solar:pen-bold" />
                        {t('edit')}
                    </MenuItem>
                </PermissionsContext>
                <PermissionsContext action={"delete.user"} >
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
                {
                    item?.is_banned ?
                        <PermissionsContext action={"update.user"} >
                            <MenuItem
                                onClick={() => {
                                    activate.onTrue();
                                    popover.onClose();
                                }}
                                sx={{ color: 'success.main' }}
                            >
                                <Iconify icon="material-symbols-light:shield-locked-rounded" />
                                {t('activate')}
                            </MenuItem>
                        </PermissionsContext>
                        :
                        <PermissionsContext action={"update.user"} >
                            <MenuItem
                                onClick={() => {
                                    ban.onTrue();
                                    popover.onClose();
                                }}
                                sx={{ color: 'warning.main' }}
                            >
                                <Iconify icon="material-symbols-light:shield-locked-rounded" />
                                {t('ban')}
                            </MenuItem>
                        </PermissionsContext>

                }


            </CustomPopover>

            <ContentDialog

                open={completed.value}
                onClose={completed.onFalse}
                title={t("edit_password")}
                content={
                    <ChangePasswordView currentUser={item} onClose={() => { completed.onFalse() }} />
                }
            />
            {/* 9ugpv2h2 */}

            <ConfirmDialog
                open={confirm.value}
                onClose={confirm.onFalse}
                title={t("delete")}
                content={t('are_u_sure_to_delete',{item:t("user"),item2:item?.name})}
                action={
                    <LoadingButton
                        isSubmitting={postloader}
                        loading={postloader}
                        variant="contained" color="error" onClick={() => onDeleteRow(item?.id)}>
                        {t("delete")}
                    </LoadingButton>
                }
            />
            <ConfirmDialog
                open={ban.value}
                onClose={ban.onFalse}
                title={t("ban")}
                content={t("are_you_sure_want_to_ban")}
                action={
                    <LoadingButton isSubmitting={postloader}
                        loading={postloader}
                        variant="contained" color="error" onClick={() => onBanRow(item?.id)}>
                        {t("ban")}
                    </LoadingButton>
                }
            />
            <ConfirmDialog
                open={activate.value}
                onClose={activate.onFalse}
                title={t("activate")}
                content={t("are_you_sure_want_to_activate")}
                action={
                    <LoadingButton isSubmitting={postloader}
                        loading={postloader}
                        variant="contained" color="success" onClick={() => onActivateRow(item?.id)}>
                        {t("activate")}
                    </LoadingButton>
                }
            />
        </Box>
    );
};



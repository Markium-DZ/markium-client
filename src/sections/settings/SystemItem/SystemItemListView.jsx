import { Button, Card, FormControlLabel, FormGroup, IconButton, MenuItem, Switch, Tooltip, Typography } from '@mui/material';
import { Box, display } from '@mui/system';
import { t } from 'i18next';
import { set } from 'lodash'; // [keep for later use]
import { enqueueSnackbar } from 'notistack';
import { useEffect, useState, useCallback } from 'react';
import { changeCategoryVisibility, changeItemVisibilityInSettings, useGetMainSpecs, useGetSystemCategories, useGetSystemVisibleItem } from 'src/api/settings'; // [keep for later use]
import { useValues } from 'src/api/utils';
import PermissionsContext from 'src/auth/context/permissions/permissions-context';
import { fileData } from 'src/components/file-thumbnail'; // [keep for later use]
import Iconify from 'src/components/iconify';
import { LoadingScreen } from 'src/components/loading-screen';
import { RouterLink } from 'src/routes/components';
import { paths } from 'src/routes/paths';
import ZaityListView from 'src/sections/ZaityTables/zaity-list-view';
import ZaityHeadContainer from 'src/sections/ZaityTables/ZaityHeadContainer';
import ZaityTableFilters from 'src/sections/ZaityTables/ZaityTableFilters';
import ZaityTableTabs from 'src/sections/ZaityTables/ZaityTableTabs'; // [keep for later use]

// ----------------------------------------------------------------------

const types = {

    categories: {
        item_settings_lable: "categories_settings",
        add_new_item_lable: "add_new_category",
        keyInValues: "categories",
        TABLE_HEAD: [
            { id: 'name', label: t('category'), type: "text", width: 290, align: 'left' },
            // { id: 'actions', label: t('actions'), type: "threeDots", width: 88, align: "right" },
        ],
        href: paths.dashboard.settings.categoriesNew,
        tableElements: (data) => {
            return data
                ? data?.map((item) => ({
                    ...item,
                    // name: item?.translations?.[0]?.name,
                    // actions: (actionMethod) => <ElementActions actionMethod={actionMethod} />,
                }))
                : [];
        },
    },

};

export default function SystemItemListView({ collection }) {



    const [tableData, setTableData] = useState([]);
    const [dataFiltered, setDataFiltered] = useState([]);

    const currentType = collection?.type;




    const { items: gVisibleItems, itemsLoading } = useGetSystemCategories();
    const [visibleItems, setVisibleItems] = useState(gVisibleItems);
    useEffect(() => {
        setVisibleItems(gVisibleItems)
    }, [gVisibleItems])


    const currentSystemItem = types[currentType];
    const currentKeyInValue = currentSystemItem?.keyInValues;
    const defaultFilters = { status: 'all', name: "" };
    const items = [
        { key: 'all', label: t('all'), match: () => true },
        { key: 'selected', label: t('selected'), match: (item) => item?.visibility === "visible", color: 'success' },
        { key: 'not_selected', label: t('not_selected'), match: (item) => item?.visibility === "hidden", color: 'warning' },
    ];

    const filters = [
        {
            key: 'name', label: t('name'), match: (item, value) =>
                item?.name?.toLowerCase().includes(value?.toLowerCase()),
        },
    ];


    const filterFunction = (data, filters) => {
        const activeTab = filters.tabKey;
        const item = tableData.find(i => i?.key === activeTab);
        if (item?.match) return data.filter((d) => item.match(d, filters));
        return data;
    }


    const checkVisibility = useCallback(
        (item) => {
            return item?.is_active
        },
        [visibleItems]
    );


    useEffect(() => {
        const filteredItems = types[currentType]?.tableElements(visibleItems)?.map(item => {
            const isVisible = checkVisibility(item);
            return {
                ...item,
                visibility: isVisible ? "visible" : "hidden",
                color: isVisible ? "success" : "error"
            };
        }) || [];
        setDataFiltered(filteredItems?.map(item => ({
            ...item,
            component: <EnableDisableItem visibleItems={visibleItems} setVisibleItems={setVisibleItems} configurable_type={collection?.type} item={item} setTableData={setDataFiltered} data={dataFiltered} key={item.id || item.key} />
        }))?.reverse());
    }, [visibleItems]);

    useEffect(() => {
        const tableItems = types[currentType]?.tableElements(visibleItems)?.map(item => {
            const isVisible = checkVisibility(item);
            return {
                ...item,
                visibilitys: isVisible ? t("visible") : t("hidden"),
                visibility: isVisible ? "visible" : "hidden",
                color: isVisible ? "success" : "error"
            };
        }) || [];
        setTableData(tableItems?.map(item => ({
            ...item,
            component: <EnableDisableItem visibleItems={visibleItems} setVisibleItems={setVisibleItems} configurable_type={collection?.type} item={item} setTableData={setDataFiltered} data={dataFiltered} key={item.id || item.key} />
        }))?.reverse());
    }, [visibleItems]);

    return (
        <>
            <ZaityHeadContainer
                heading={t(currentSystemItem?.item_settings_lable)}
                action={
                    <PermissionsContext action={"create." + collection?.type} >
                        <Button
                            component={RouterLink}
                            href={currentSystemItem?.href}
                            variant="contained"
                            startIcon={<Iconify icon="mingcute:add-line" />}
                        >
                            {t(currentSystemItem?.add_new_item_lable)}
                        </Button>
                    </PermissionsContext>
                }
                links={[
                    { name: t('dashboard'), href: paths.dashboard.root },
                    { name: t(currentSystemItem?.item_settings_lable), href: paths.dashboard.settings.root },
                    { name: t('list') },
                ]}
            >
                <Card>
                    <ZaityTableTabs data={tableData} items={items} defaultFilters={{ status: 'all' }} setTableDate={setDataFiltered} filterFunction={filterFunction}>
                        <ZaityTableFilters data={dataFiltered} tableData={tableData} items={filters} setTableDate={setDataFiltered} defaultFilters={defaultFilters} dataFiltered={tableData}>
                            {
                                itemsLoading ?
                                    <LoadingScreen sx={{ my: 8 }} color='primary' />
                                    :
                                    <ZaityListView TABLE_HEAD={[...currentSystemItem?.TABLE_HEAD, { id: 'visibilitys', label: t('selected'), type: "label", width: 350 }, { id: 'enable', label: t('enable'), type: "component", width: 40, align: "center" }]} dense="small" zaityTableDate={dataFiltered || []} onSelectedRows={({ data, setTableData }) => { return <onSelectedRowsComponent configurable_type={collection?.type} setTableData={setTableData} data={data} /> }} />
                            }
                        </ZaityTableFilters>
                    </ZaityTableTabs>
                </Card>
            </ZaityHeadContainer>
        </>
    );
}

// ----------------------------------------------------------------------


const EnableDisableItem = ({ item, configurable_type, setTableData }) => {
    const [isChecked, setIsChecked] = useState(item.visibility === "visible");
    const [loading, setLoading] = useState(false);
    // Unified update logic for visibleItems and tableData
    const updateVisibility = (checked) => {
        let visibilitys = checked ? t("visible") : t("hidden");
        let visibility = checked ? "visible" : "hidden";
        let color = checked ? "success" : "error";
        setTableData(prev => prev?.map(i => {
            if (i.id === item.id) {
                return { ...i, visibilitys, visibility, color, system_settings: { is_selected: checked } };
            }
            return i;
        }));

    };
    const handleChange = async (event) => {
        // if (item?.is_verified == 0) {
        //     enqueueSnackbar(t("item_not_verified"), { variant: 'error' });
        // } else {
        setLoading(true);
        const checked = event.target.checked;
        // Optimistically update UI
        updateVisibility(checked);
        setIsChecked(checked);
        try {
            await changeCategoryVisibility(item?.id, { is_active: checked });
            enqueueSnackbar(t("operation_success"), { variant: 'success' });
        } catch (error) {
            // Rollback UI on error
            updateVisibility(!checked);
            setIsChecked(!checked);
            enqueueSnackbar(t("operation_failed"), { variant: 'error' });
        } finally {
            setLoading(false);
        }
        // }
    };
    return (
        <FormGroup sx={{ display: "flex", flexDirection: "row", alignItems: "center", rowGap: "10px" }}>
            {
                loading ?
                    <Box sx={{ display: "flex", justifyContent: "center" }}  >
                        <Iconify icon="line-md:uploading-loop" color="primary" />
                    </Box>
                    :
                    null
            }
            <FormControlLabel
                control={
                    <Switch
                        color='success'
                        checked={isChecked}
                        onChange={handleChange}
                        disabled={loading}
                    />
                }
            />
        </FormGroup>
    );
};

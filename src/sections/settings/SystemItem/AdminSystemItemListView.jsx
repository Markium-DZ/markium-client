import { Button, Card, FormControlLabel, FormGroup, IconButton, MenuItem, Switch, Tooltip, Typography } from '@mui/material';
import { t } from 'i18next';
import { set } from 'lodash'; // [keep for later use]
import { enqueueSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import { changeItemVisibilityInSettings, useGetMainSpecs, useGetSystemVisibleItem } from 'src/api/settings'; // [keep for later use]
import { useValues } from 'src/api/utils';
import PermissionsContext from 'src/auth/context/permissions/permissions-context';
import { fileData } from 'src/components/file-thumbnail'; // [keep for later use]
import Iconify from 'src/components/iconify';
import { RouterLink } from 'src/routes/components';
import { paths } from 'src/routes/paths';
import ZaityListView from 'src/sections/ZaityTables/zaity-list-view';
import ZaityHeadContainer from 'src/sections/ZaityTables/ZaityHeadContainer';
import ZaityTableFilters from 'src/sections/ZaityTables/ZaityTableFilters';
import ZaityTableTabs from 'src/sections/ZaityTables/ZaityTableTabs'; // [keep for later use]

// ----------------------------------------------------------------------

const types = {
    payment_method: {
        item_settings_lable: "payment_methods_settings",
        add_new_item_lable: "add_new_payment_methods",
        keyInValues: "payment_methods",
        TABLE_HEAD: [
            { id: 'name', label: t('name'), type: "text", width: 140 },
            // { id: 'actions', label: t('actions'), type: "threeDots", width: 88, align: "right" },
        ],
        href: paths.dashboard.settings.payment_methodsNew,
        tableElements: (data, keyInValues) => {
            return data?.[keyInValues]
                ? data?.[keyInValues]?.map((item) => ({
                    ...item,
                    // name: item?.translations?.[0]?.name,
                    // actions: (actionMethod) => <ElementActions actionMethod={actionMethod} />,
                }))
                : [];
        },
    },
    country: {
        item_settings_lable: "countries_settings",
        add_new_item_lable: "add_new_country",
        keyInValues: "countries",
        TABLE_HEAD: [
            { id: 'name', label: t('country'), type: "text", width: 140 },
            // { id: 'actions', label: t('actions'), type: "threeDots", width: 88, align: "right" },
        ],
        href: paths.dashboard.settings.countriesNew,
        tableElements: (data, keyInValues) => {
            return data?.[keyInValues]
                ? data?.[keyInValues]?.map((item) => ({
                    ...item,
                    name: item?.translations?.[0]?.name,
                    // actions: (actionMethod) => <ElementActions actionMethod={actionMethod} />,
                }))
                : [];
        },
    },
    state: {
        item_settings_lable: "states_settings",
        add_new_item_lable: "add_new_state",
        keyInValues: "states",
        TABLE_HEAD: [
            { id: 'name', label: t('state'), type: "text", width: 140 },
            // { id: 'country',  label: t('country'), type: "text", width: 140 },
            // { id: 'actions', label: t('actions'), type: "threeDots", width: 88, align: "right" },
        ],
        href: paths.dashboard.settings.statesNew,
        tableElements: (data, keyInValues) => {
            return data?.[keyInValues]
                ? data?.[keyInValues]?.map((item) => ({
                    ...item,
                    name: item?.translations?.[0]?.name,
                    // country: data?.countries?.find(i => i.id == item.country_id)?.translations[0]?.name,
                    // actions: (actionMethod) => <ElementActions actionMethod={actionMethod} />,
                }))
                : [];
        },
    },
    neighborhood: {
        item_settings_lable: "neighborhood_settings",
        add_new_item_lable: "add_new_neighborhood",
        keyInValues: "neighborhoods",
        TABLE_HEAD: [
            { id: 'name', label: t('neighborhood'), type: "text", width: 140 },
            { id: 'state', label: t('state'), type: "text", width: 140 },
            // { id: 'actions', label: t('actions'), type: "threeDots", width: 88, align: "right" },
        ],
        href: paths.dashboard.settings.neighborhoodsNew,
        tableElements: (data, keyInValues) => {
            return data?.[keyInValues]
                ? data?.[keyInValues]?.map((item) => ({
                    ...item,
                    name: item?.translations?.[0]?.name,
                    state: data?.states?.find(i => i.id == item.state_id)?.translations[0]?.name,
                    // actions: (actionMethod) => <ElementActions actionMethod={actionMethod} />,
                }))
                : [];
        },
    },
    color: {
        item_settings_lable: "colors_settings",
        add_new_item_lable: "add_new_color",
        keyInValues: "colors",
        TABLE_HEAD: [
            { id: 'name', label: t('color'), type: "text", width: 290, align: 'left' },
            // { id: 'actions', label: t('actions'), type: "threeDots", width: 88, align: "right" },
        ],
        href: paths.dashboard.settings.colorsNew,
        tableElements: (data, keyInValues) => {
            return data?.[keyInValues]
                ? data?.[keyInValues]?.map((item) => ({
                    ...item,
                    name: item?.translations?.[0]?.name,
                    // actions: (actionMethod) => <ElementActions actionMethod={actionMethod} />,
                }))
                : [];
        },
    },
};

export default function AdminSystemItemListView({ collection }) {
    const { data } = useValues();
    const [tableData, setTableData] = useState([]);
    const [dataFiltered, setDataFiltered] = useState([]);

    const currentType = collection?.type;


    const { items: gVisibleItems } = useGetSystemVisibleItem(currentType);
    console.log("gVisibleItems : ", gVisibleItems)
    const [visibleItems, setVisibleItems] = useState(gVisibleItems);
    useEffect(() => {
        setVisibleItems(gVisibleItems)
    }, [gVisibleItems])


    const currentSystemItem = types[currentType];
    const currentKeyInValue = currentSystemItem?.keyInValues;
    const defaultFilters = { status: 'all', name: "" };
    const items = [
        { key: 'all', label: t('all'), match: () => true },
        { key: 'selected', label: t('selected'), match: (item) => item?.status === "selected", color: 'primary' },
        { key: 'not_selected', label: t('not_selected'), match: (item) => item?.status === "not_selected", color: 'warning' },
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

    const checkVisibility = (item) => {
        const rt = visibleItems.some(i => i?.id == item?.id)
        console.log(" visibleItems : ", visibleItems)
        console.log(" rt : ", rt)
        return rt
    }

    useEffect(() => {
        const items = types[currentType]?.tableElements(data, currentKeyInValue)?.map(item => ({ ...item, status: checkVisibility(item) ? "selected" : "not_selected", enable: checkVisibility(item) ? "selected" : "not_selected", enabled: checkVisibility(item) ? t("enabled") : t("not_enabled"), color: checkVisibility(item) ? "success" : "error" })) || [];
        setDataFiltered(items?.map(item => ({ ...item, component: <EnableDisableItem visibleItems={visibleItems} setVisibleItems={setVisibleItems} configurable_type={collection?.type} item={item} setTableData={setDataFiltered} data={tableData} /> }))?.reverse());
    }, [data, collection, visibleItems]);
    useEffect(() => {
        const items = types[currentType]?.tableElements(data, currentKeyInValue).map(item => ({ ...item, status: checkVisibility(item) ? "selected" : "not_selected", enable: checkVisibility(item) ? "selected" : "not_selected", enabled: checkVisibility(item) ? t("enabled") : t("not_enabled"), color: checkVisibility(item) ? "success" : "error" })) || [];
        setTableData(items?.map(item => ({ ...item, component: <EnableDisableItem visibleItems={visibleItems} setVisibleItems={setVisibleItems} configurable_type={collection?.type} item={item} setTableData={setDataFiltered} data={tableData} /> }))?.reverse());
    }, [data, currentType, currentKeyInValue, collection, visibleItems]);

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
                            <ZaityListView TABLE_HEAD={[...currentSystemItem?.TABLE_HEAD, { id: 'enabled', label: t('selected'), type: "label", width: 350 }, { id: 'enable', label: t('enable'), type: "component", width: 40, align: "center" }]} dense="small" zaityTableDate={dataFiltered || []} onSelectedRows={({ data, setTableData }) => { return <onSelectedRowsComponent configurable_type={collection?.type} setTableData={setTableData} data={data} /> }} />
                        </ZaityTableFilters>
                    </ZaityTableTabs>
                </Card>
            </ZaityHeadContainer>
        </>
    );
}

// ----------------------------------------------------------------------


const EnableDisableItem = ({ visibleItems, setVisibleItems, item, configurable_type, setTableData, data }) => {
    const handleChange = async (event) => {
        if (item?.is_verified === 1) {
            const ischkd = event.target.checked
            let status = ischkd ? "selected" : "not_selected";
            let enabled = ischkd ? t("enabled") : t("not_enabled");
            let color = ischkd ? "success" : "error";
            const res = await changeItemVisibilityInSettings({ configurable_type, configurable_id: item.id, is_selected: event.target.checked, is_private: false })
            if (configurable_type == "payment_method") {
                setTableData(prev =>
                    prev?.map(i => {
                        if (i.id == item.id) {
                            const updated = { ...i, enable: status, enabled, color, system_settings: { is_selected: event.target.checked } };
                            return updated;
                        }
                        return i;
                    })
                );
                if (ischkd) {
                    setVisibleItems(prev => [...(prev.length > 0 ? prev : []), { id: item?.id, key: item?.key }]);
                } else {
                    setVisibleItems(prev => prev.filter(i => i.id !== item.id));
                }
            } else {
                setTableData(prev =>
                    prev?.map(i => {
                        if (i.key == item.key) {
                            const updated = { ...i, enable: status, enabled, color, system_settings: { is_selected: event.target.checked } };
                            return updated;
                        }
                        return i;
                    })
                );
                if (ischkd) {
                    setVisibleItems(prev => [...(prev.length > 0 ? prev : []), { key: item?.key, id: item?.id }]);
                } else {
                    setVisibleItems(prev => prev.filter(i => i.key !== item.key));
                }
            }
            setIsChecked(status == "selected")
            enqueueSnackbar(t("operation_success"), { variant: 'success' });
        }else{
            enqueueSnackbar(t("item_not_verified"), { variant: 'error' });
        }
    };
    const [isChecked, setIsChecked] = useState(item.enable == "selected")
    return (
        <>
            <FormGroup sx={{ display: "flex", flexDirection: "row", alignItems: "center", rowGap: "10px" }}>
                <FormControlLabel
                    control={
                        <Switch
                            checked={isChecked}
                            onChange={handleChange}
                        // disabled={item?.is_verified === 1}
                        />
                    }
                    label=""
                />
            </FormGroup>

        </>
    );
};

import { Box, Button, Card, FormControlLabel, FormGroup, Grid, IconButton, MenuItem, Stack, Switch, Tooltip, Typography, Avatar, Chip, Dialog, DialogTitle, DialogContent, Divider } from '@mui/material';
import { t } from 'i18next';
import { set } from 'lodash'; // [keep for later use]
import { enqueueSnackbar, useSnackbar } from 'notistack';
import { useCallback, useEffect, useState } from 'react';
import { AddCarToMentainance, deleteCar, markCarAsAvailable, useGetCar } from 'src/api/car';
import { useGetClauses } from 'src/api/claim';
import { useGetClients } from 'src/api/client';
import { deleteContractClause, useGetContracts } from 'src/api/contract';
import { markMaintenanceAsCompeleted, useGetMaintenance } from 'src/api/maintainance';
import { changeItemVisibilityInSettings, useGetMainSpecs, useGetSystemVisibleItem } from 'src/api/settings'; // [keep for later use]
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
import { useGetProducts } from 'src/api/product';
import { updateOrder, useGetOrders, useGetOrdersByProduct } from 'src/api/orders';
import ExportOrdersButton from './ExportOrdersButton';
import { HOST_API } from 'src/config-global';




// ----------------------------------------------------------------------

// Order Item Details Dialog Component
function OrderItemDetailsDialog({ open, onClose, item }) {
    if (!item) return null;

    const mediaUrl = item.variant?.media?.full_url || item.variant?.media?.url || null;
    const variantOptions = item.variant?.options || [];

    const content = (
        <Stack spacing={2}>
            {/* Product Image */}
            {mediaUrl && (
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        p: 2,
                        bgcolor: (theme) => theme.palette.grey[50],
                        borderRadius: 2,
                    }}
                >
                    <Avatar
                        src={mediaUrl}
                        variant="rounded"
                        sx={{
                            width: '100%',
                            height: 220,
                            maxWidth: 300,
                            boxShadow: 3,
                        }}
                    />
                </Box>
            )}

            {/* Product Name */}
            <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    {t('product')}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.4 }}>
                    {item.product?.name}
                </Typography>
            </Box>

            {/* Variant Options */}
            {variantOptions.length > 0 && (
                <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 1, display: 'block' }}>
                        {t('variant_options')}
                    </Typography>
                    <Stack spacing={1}>
                        {variantOptions.map((opt, idx) => (
                            <Box
                                key={idx}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                    p: 1,
                                    bgcolor: (theme) => theme.palette.grey[100],
                                    borderRadius: 1,
                                }}
                            >
                                <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 70 }}>
                                    {opt.definition_name}:
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {opt.color_hex && (
                                        <Box
                                            sx={{
                                                width: 20,
                                                height: 20,
                                                borderRadius: '50%',
                                                bgcolor: opt.color_hex,
                                                border: (theme) => `2px solid ${theme.palette.divider}`,
                                            }}
                                        />
                                    )}
                                    <Typography variant="body2">
                                        {opt.value}
                                    </Typography>
                                </Box>
                            </Box>
                        ))}
                    </Stack>
                </Box>
            )}

            <Divider />

            {/* Quantity */}
            <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 0.5, display: 'block' }}>
                    {t('quantity')}
                </Typography>
                <Chip
                    label={`×${item.quantity}`}
                    color="error"
                    size="medium"
                    sx={{ fontWeight: 700, height: 28 }}
                />
            </Box>

            <Divider />

            {/* Pricing */}
            <Box
                sx={{
                    p: 2,
                    bgcolor: (theme) => theme.palette.primary.lighter,
                    borderRadius: 1.5,
                    borderLeft: (theme) => `4px solid ${theme.palette.primary.main}`,
                }}
            >
                <Typography variant="caption" color="primary.main" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                    {t('price')}
                </Typography>
                <Stack direction="row" spacing={1.5} alignItems="baseline" flexWrap="wrap" sx={{ mt: 0.5 }}>
                    <Typography variant="h5" color="primary.main" sx={{ fontWeight: 700 }}>
                        {item.unit_price ? `${item.unit_price.toFixed(2)} DA` : '-'}
                    </Typography>
                    {item.quantity > 1 && (
                        <Typography variant="body2" color="text.secondary">
                            {t('total')}: <Box component="span" sx={{ fontWeight: 700, color: 'primary.dark' }}>
                                {item.total_price ? `${item.total_price.toFixed(2)} DA` :
                                (item.unit_price ? `${(item.unit_price * item.quantity).toFixed(2)} DA` : '-')}
                            </Box>
                        </Typography>
                    )}
                </Stack>
            </Box>
        </Stack>
    );

    return (
        <ContentDialog
            open={open}
            onClose={onClose}
            title={t('product_details')}
            maxWidth="sm"
            content={content}
        />
    );
}

// Product Items Display Component
function OrderItemsCell({ items, order }) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    const handleItemClick = (item) => {
        setSelectedItem(item);
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setSelectedItem(null);
    };

    // Handle missing items
    if (!items || items.length === 0) {
        return <Typography variant="caption" color="text.disabled">-</Typography>;
    }

    // If single item, show full details with quantity badge
    if (items.length === 1) {
        const item = items[0];
        const mediaUrl = item.variant?.media?.full_url || item.variant?.media?.url || null;

        // Extract variant options - handle both old and new formats
        const variantText = item.variant?.options
            ?.map(opt => opt.value || opt)
            .filter(Boolean)
            .join(' / ') || '';

        return (
            <>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {mediaUrl && (
                        <Box
                            sx={{
                                position: 'relative',
                                cursor: 'pointer',
                                '&:hover': {
                                    transform: 'scale(1.05)',
                                    zIndex: 1,
                                },
                                transition: 'transform 0.2s'
                            }}
                            onClick={() => handleItemClick(item)}
                        >
                            <Avatar
                                src={mediaUrl}
                                variant="rounded"
                                sx={{ width: 48, height: 48 }}
                            />
                            {/* Quantity Badge */}
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: -4,
                                    right: -4,
                                    minWidth: 20,
                                    height: 20,
                                    borderRadius: '50%',
                                    bgcolor: 'error.main',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    px: 0.5,
                                    border: (theme) => `2px solid ${theme.palette.background.paper}`,
                                    boxShadow: 1,
                                }}
                            >
                                {item.quantity}
                            </Box>
                        </Box>
                    )}
                </Box>
                <OrderItemDetailsDialog open={dialogOpen} onClose={handleCloseDialog} item={selectedItem} />
            </>
        );
    }

    // If multiple items, show images horizontally with quantity badges
    return (
        <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {items.slice(0, 3).map((item, idx) => {
                    const mediaUrl = item.variant?.media?.full_url || item.variant?.media?.url || null;

                    return (
                        <Tooltip
                            key={idx}
                            title={
                                <Typography variant="caption" sx={{ fontWeight: 500 }}>
                                    {item.product?.name}
                                </Typography>
                            }
                            arrow
                        >
                            <Box
                                sx={{
                                    position: 'relative',
                                    cursor: 'pointer',
                                    '&:hover': {
                                        transform: 'scale(1.05)',
                                        zIndex: 1,
                                    },
                                    transition: 'transform 0.2s'
                                }}
                                onClick={() => handleItemClick(item)}
                            >
                                <Avatar
                                    src={mediaUrl}
                                    variant="rounded"
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        border: (theme) => `2px solid ${theme.palette.background.paper}`,
                                    }}
                                >
                                    {!mediaUrl && item.product?.name?.charAt(0)}
                                </Avatar>
                                {/* Quantity Badge */}
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: -4,
                                        right: -4,
                                        minWidth: 18,
                                        height: 18,
                                        borderRadius: '50%',
                                        bgcolor: 'error.main',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.65rem',
                                        fontWeight: 700,
                                        px: 0.5,
                                        border: (theme) => `2px solid ${theme.palette.background.paper}`,
                                        boxShadow: 1,
                                    }}
                                >
                                    {item.quantity}
                                </Box>
                            </Box>
                        </Tooltip>
                    );
                })}
                {items.length > 3 && (
                    <Tooltip
                        title={
                            <Stack spacing={0.5} sx={{ p: 0.5 }}>
                                {items.slice(3).map((item, idx) => (
                                    <Typography key={idx} variant="caption" sx={{ fontWeight: 500 }}>
                                        {item.quantity}× {item.product?.name}
                                    </Typography>
                                ))}
                            </Stack>
                        }
                        arrow
                    >
                        <Avatar
                            variant="rounded"
                            sx={{
                                width: 40,
                                height: 40,
                                bgcolor: 'primary.main',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                border: (theme) => `2px solid ${theme.palette.background.paper}`,
                            }}
                        >
                            +{items.length - 3}
                        </Avatar>
                    </Tooltip>
                )}
            </Box>
            <OrderItemDetailsDialog open={dialogOpen} onClose={handleCloseDialog} item={selectedItem} />
        </>
    );

// ----------------------------------------------------------------------
export default function OrdersListView({ product_id }) {
    // Call hooks unconditionally at the top level
    const { orders: ordersByProduct, ordersLoading: loadingByProduct } = useGetOrdersByProduct(product_id);
    const { orders: allOrders, ordersLoading: loadingAll } = useGetOrders();

    // Use the appropriate data based on product_id
    const orders = product_id ? ordersByProduct : allOrders;
    const ordersLoading = product_id ? loadingByProduct : loadingAll;

    const { currentLang } = useLocales()

    const [tableData, setTableData] = useState([]);
    const [dataFiltered, setDataFiltered] = useState([]);

    let TABLE_HEAD = [
        // { id: 'ref', label: t('order_ref'), type: "text", width: 140 },
        { id: 'product_items', label: t('product'), type: "render", render: (item) => <OrderItemsCell items={item.items} order={item} />, width: 150 },
        { id: 'name', label: t('customer'), type: "text", width: 180 },
        { id: 'phone', label: t('phone'), type: "text", width: 140 },
        { id: 'total', label: t('total'), type: "text", width: 120 },
        { id: 'c_status', label: t('status'), type: "label", width: 100 },
        { id: 'full_address', label: t('address'), type: "long_text", length: 2, width: 200 },
        { id: 'actions', label: t('actions'), type: "threeDots", component: (item) => <ElementActions item={item} setTableData={setTableData} />, width: 60, align: "right" },
    ]


    const RformulateTable = (data) => {
        return data?.map((item) => {
            let color = "default";
            let translatedStatus = "";

            // Apply status conditions: pending, confirmed, shipped, delivered, cancelled
            if (item?.status === "delivered") {
                color = "success";
                translatedStatus = t("delivered");
            } else if (item?.status === "shipped") {
                color = "info";
                translatedStatus = t("shipped");
            } else if (item?.status === "confirmed") {
                color = "secondary";
                translatedStatus = t("confirmed");
            } else if (item?.status === "pending") {
                color = "warning";
                translatedStatus = t("pending");
            } else if (item?.status === "cancelled") {
                color = "error";
                translatedStatus = t("cancelled");
            }

            // Handle multiple items - show summary
            const itemsSummary = item?.items?.length === 1
                ? item.items[0].product?.name
                : item?.items?.length > 1
                    ? t('multiple_items', { count: item?.items?.length })
                    : '-';

            return {
                ...item,
                ref: item?.ref || `#${item?.id}`,
                name: item?.customer?.full_name,
                phone: item?.customer?.phone,
                total_items: item?.total_items || item?.items?.length || 0,
                total: item?.total_price ? `${item.total_price.toFixed(2)} DA` : item?.total ? `${item.total.toFixed(2)} DA` : '-',
                products_summary: itemsSummary,
                c_status: translatedStatus,
                full_address: currentLang?.value === "ar"
                    ? `${item?.address?.wilaya?.name_ar || ''}, ${item?.address?.commune?.name_ar || ''} ${item?.address?.street_address || ''}`
                    : `${item?.address?.wilaya?.name || ''}, ${item?.address?.commune?.name || ''} ${item?.address?.street_address || ''}`,
                color,
            };
        }) || [];
    };


    const filters = [
        {
            key: 'search', label: t('search'), match: (item, value) => {
                const lowerValue = value?.toLowerCase();

                // Search in customer fields
                const customerMatch =
                    item?.customer?.full_name?.toLowerCase().includes(lowerValue) ||
                    item?.customer?.first_name?.toLowerCase().includes(lowerValue) ||
                    item?.customer?.last_name?.toLowerCase().includes(lowerValue) ||
                    item?.customer?.phone?.toLowerCase().includes(lowerValue) ||
                    item?.customer?.email?.toLowerCase().includes(lowerValue);

                // Search in all items' product names and SKUs
                const productsMatch = item?.items?.some(orderItem =>
                    orderItem?.product?.name?.toLowerCase().includes(lowerValue) ||
                    orderItem?.product?.ref?.toLowerCase().includes(lowerValue) ||
                    orderItem?.variant?.sku?.toLowerCase().includes(lowerValue)
                );

                // Search in address fields
                const addressMatch =
                    item?.address?.street_address?.toLowerCase().includes(lowerValue) ||
                    item?.address?.commune?.name?.toLowerCase().includes(lowerValue) ||
                    item?.address?.commune?.name_ar?.toLowerCase().includes(lowerValue) ||
                    item?.address?.wilaya?.name?.toLowerCase().includes(lowerValue) ||
                    item?.address?.wilaya?.name_ar?.toLowerCase().includes(lowerValue) ||
                    item?.address?.full_address?.toLowerCase().includes(lowerValue);

                // Search in other fields
                const otherMatch =
                    item?.ref?.toLowerCase().includes(lowerValue) ||
                    item?.id?.toString().includes(value) ||
                    item?.store?.name?.toLowerCase().includes(lowerValue) ||
                    item?.notes?.toLowerCase().includes(lowerValue);

                return customerMatch || productsMatch || addressMatch || otherMatch;
            },
        },
    ];

    const defaultFilters = {
        search: '',
    };

    // Filter by status (pending, confirmed, shipped, delivered, cancelled)
    const items = [
        { key: 'all', label: t('all'), match: () => true },
        { key: 'pending', label: t('pending'), match: (item) => item?.status === 'pending', color: 'warning' },
        { key: 'confirmed', label: t('confirmed'), match: (item) => item?.status === 'confirmed', color: 'secondary' },
        { key: 'shipped', label: t('shipped'), match: (item) => item?.status === 'shipped', color: 'info' },
        { key: 'delivered', label: t('delivered'), match: (item) => item?.status === 'delivered', color: 'success' },
        { key: 'cancelled', label: t('cancelled'), match: (item) => item?.status === 'cancelled', color: 'error' },
    ];

    const filterFunction = (data, filters) => {
        const activeTab = filters.tabKey;
        const item = tableData.find(i => i?.key === activeTab);
        if (item?.match) return data.filter((d) => item.match(d, filters));
        return data;
    }




    useEffect(() => {
        setDataFiltered(RformulateTable(orders));
    }, [orders]);
    useEffect(() => {
        setTableData(RformulateTable(orders));
    }, [orders]);

    return (
        <>
            <ZaityHeadContainer
                heading={t("ordersList")}
                action={<ExportOrdersButton orders={orders} />}
                links={[
                    { name: t('dashboard'), href: paths.dashboard.root },
                    { name: t("ordersList"), href: paths.dashboard.order.root },
                    { name: t('list') },
                ]}
            >
                <Card>
                    <ZaityTableTabs key='condition' data={tableData} items={items} defaultFilters={defaultFilters} setTableDate={setDataFiltered} filterFunction={filterFunction}>
                        {/* <ZaityTableTabs key='attachable_type' data={tableData} items={items2} defaultFilters={defaultFilters} setTableDate={setDataFiltered} filterFunction={filterFunction}> */}
                        <ZaityTableFilters data={dataFiltered} tableData={tableData} setTableDate={setDataFiltered} items={filters} defaultFilters={defaultFilters} dataFiltered={tableData} searchText={t("search_by") + " " + t("name") + " " + t("or_any_value") + " ..."}  >
                            {
                                ordersLoading ?
                                    <LoadingScreen sx={{ my: 8 }} color='primary' />
                                    :
                                    <ZaityListView TABLE_HEAD={[...TABLE_HEAD]} dense="medium" zaityTableDate={dataFiltered || []} onSelectedRows={({ data, setTableData }) => { return <onSelectedRowsComponent configurable_type={"roles"} setTableData={setTableData} data={orders} /> }} />
                            }
                        </ZaityTableFilters>
                        {/* </ZaityTableTabs> */}
                    </ZaityTableTabs>
                </Card>
            </ZaityHeadContainer>
        </>
    );
}

// ----------------------------------------------------------------------



const ElementActions = ({ item, setTableData }) => {
    const popover = usePopover();
    const confirm = useBoolean();
    const loading = useBoolean();

    const [postloader, setPostloader] = useState(false)
    const [selectedStatus, setSelectedStatus] = useState(null)

    // Define all possible statuses with their colors and icons
    const statuses = [
        { key: 'pending', label: t('pending'), color: 'warning', icon: 'solar:clock-circle-bold' },
        { key: 'confirmed', label: t('confirmed'), color: 'secondary', icon: 'solar:check-circle-bold' },
        { key: 'shipped', label: t('shipped'), color: 'info', icon: 'solar:box-bold' },
        { key: 'delivered', label: t('delivered'), color: 'success', icon: 'solar:verified-check-bold' },
        { key: 'cancelled', label: t('cancelled'), color: 'error', icon: 'solar:close-circle-bold' },
    ];

    const handleStatusClick = (status) => {
        setSelectedStatus(status);
        popover.onClose();
        confirm.onTrue();
    };

    const onChangeStatus = useCallback(
        async () => {
            if (!selectedStatus) return;

            setPostloader(true)
            try {
                loading.onTrue()
                // Update order status - use first item's product_id if backend requires it
                const productId = item.items?.[0]?.product?.id || item.product_id;
                console.log("item : ", item)
                await updateOrder(item.id, { status: selectedStatus.key })
                console.log("Changing order status:", { orderId: item?.id, newStatus: selectedStatus.key });

                // Update table data optimistically
                setTableData(prev => prev?.map(order =>
                    order.id == item?.id ? { ...order, status: selectedStatus.key, color: selectedStatus?.color, c_status: t(selectedStatus.key) } : order
                ))

                enqueueSnackbar(t("operation_success"));
                confirm.onFalse();
                loading.onFalse()
                setPostloader(false)
                setSelectedStatus(null)
            } catch (error) {
                console.log("ersetSelectedStatus setSelectedStatus setSelectedStatus ror : ", error);
                setPostloader(false)
                loading.onFalse()
                showError(error.error)
            }
        },
        [loading, confirm, setTableData, selectedStatus, item?.id]
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
                sx={{ width: 220 }}
            >
                {statuses
                    .filter(status => status.key !== item?.status) // Don't show current status
                    .map((status) => (
                        <MenuItem
                            key={status.key}
                            onClick={() => handleStatusClick(status)}
                            disabled={postloader}
                            sx={{
                                color: `${status.color}.main`,
                                '&:hover': {
                                    backgroundColor: `${status.color}.lighter`,
                                }
                            }}
                        >
                            <Iconify icon={status.icon} sx={{ mr: 1 }} />
                            {t('change_to')} {status.label}
                        </MenuItem>
                    ))}
            </CustomPopover>

            <ConfirmDialog
                open={confirm.value}
                onClose={confirm.onFalse}
                title={t("change_status")}
                content={t('confirm_status_change', {
                    order: `#${item?.id}`,
                    status: selectedStatus?.label || ''
                })}
                action={
                    <LoadingButton
                        loading={postloader}
                        variant="contained"
                        color={selectedStatus?.color || 'primary'}
                        onClick={onChangeStatus}
                    >
                        {t("confirm")}
                    </LoadingButton>
                }
            />
        </Box>
    );
};





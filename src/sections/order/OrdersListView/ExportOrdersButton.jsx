import { useState } from 'react';
import { MenuItem, Checkbox, Box, Divider, Stack } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { t } from 'i18next';
import { enqueueSnackbar } from 'notistack';
import CustomPopover, { usePopover } from 'src/components/custom-popover';
import Iconify from 'src/components/iconify';
import VerificationGate from 'src/components/verification-gate/verification-gate';
import showError from 'src/utils/show_error';

// ----------------------------------------------------------------------

export default function ExportOrdersButton({ orders }) {
    const [exporting, setExporting] = useState(false);
    const exportPopover = usePopover();
    const [selectedStatuses, setSelectedStatuses] = useState(['all']);

    // Define export options
    const exportOptions = [
        { key: 'all', label: t('all'), color: 'default', icon: 'solar:download-bold' },
        { key: 'pending', label: t('pending'), color: 'warning', icon: 'solar:clock-circle-bold' },
        { key: 'confirmed', label: t('confirmed'), color: 'secondary', icon: 'solar:check-circle-bold' },
        { key: 'shipped', label: t('shipped'), color: 'info', icon: 'solar:box-bold' },
        { key: 'delivered', label: t('delivered'), color: 'success', icon: 'solar:verified-check-bold' },
        { key: 'cancelled', label: t('cancelled'), color: 'error', icon: 'solar:close-circle-bold' },
    ];

    // Handle checkbox toggle
    const handleToggleStatus = (statusKey) => {
        if (statusKey === 'all') {
            // If "All" is selected, select only "all"
            setSelectedStatuses(['all']);
        } else {
            setSelectedStatuses(prev => {
                // Remove "all" if it was selected
                const withoutAll = prev.filter(key => key !== 'all');

                // Toggle the clicked status
                if (withoutAll.includes(statusKey)) {
                    const newSelection = withoutAll.filter(key => key !== statusKey);
                    // If nothing selected, select "all"
                    return newSelection.length === 0 ? ['all'] : newSelection;
                } else {
                    return [...withoutAll, statusKey];
                }
            });
        }
    };

    // Get status with emoji/symbol for visual representation in CSV
    const getStatusWithSymbol = (status) => {
        const statusMap = {
            'pending': '⏳ Pending',
            'confirmed': '✅ Confirmed',
            'shipped': '📦 Shipped',
            'delivered': '✔️ Delivered',
            'cancelled': '❌ Cancelled'
        };
        return statusMap[status] || status;
    };

    // Export orders to Excel/CSV
    const handleExportOrders = () => {
        setExporting(true);
        exportPopover.onClose();

        try {
            // Filter orders based on selected statuses
            let ordersToExport = orders || [];

            if (!selectedStatuses.includes('all')) {
                ordersToExport = orders?.filter(order =>
                    selectedStatuses.includes(order.status?.key || order.status)
                ) || [];
            }

            // Prepare data for export
            const exportData = ordersToExport?.map((order, index) => ({
                '#': index + 1,
                'Order ID': order.id,
                'Customer Name': order.customer?.full_name || '',
                'Customer Phone': order.customer?.phone || '',
                'Product Name': order.product?.name || '',
                'Quantity': order.quantity,
                'Price': order.product?.sale_price || '',
                'Total': (parseFloat(order.product?.sale_price || 0) * order.quantity).toFixed(2),
                'Status': getStatusWithSymbol(order.status?.key || order.status),
                'Street Address': order.address?.street_address || '',
                'Commune': order.address?.commune?.name_ar || order.address?.commune?.name || '',
                'Wilaya': order.address?.wilaya?.name_ar || order.address?.wilaya?.name || '',
                'Full Address': order.address?.full_address || '',
                'Notes': order.notes || '',
                'Created At': new Date(order.created_at).toLocaleString(),
                'Updated At': new Date(order.updated_at).toLocaleString(),
            })) || [];

            // Convert to CSV
            if (exportData.length === 0) {
                enqueueSnackbar(t('no_data'), { variant: 'warning' });
                setExporting(false);
                return;
            }

            const headers = Object.keys(exportData[0]);
            const csvContent = [
                headers.join(','),
                ...exportData.map(row =>
                    headers.map(header => {
                        const value = row[header]?.toString() || '';
                        // Escape commas and quotes
                        return `"${value.replace(/"/g, '""')}"`;
                    }).join(',')
                )
            ].join('\n');

            // Create download link
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);

            // Create filename based on selected statuses
            const statusSuffix = selectedStatuses.includes('all')
                ? 'all'
                : selectedStatuses.join('_');

            link.setAttribute('href', url);
            link.setAttribute('download', `orders_${statusSuffix}_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            enqueueSnackbar(t('export_success'), { variant: 'success' });
        } catch (error) {
            console.error('Export error:', error);
            showError(error);
        } finally {
            setExporting(false);
        }
    };

    return (
        <>
            <VerificationGate>
                <LoadingButton
                    variant="contained"
                    loading={exporting}
                    onClick={exportPopover.onOpen}
                    startIcon={<Iconify icon="solar:download-bold" />}
                    endIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}
                >
                    {t("export_orders")}
                </LoadingButton>
            </VerificationGate>

            <CustomPopover
                open={exportPopover.open}
                onClose={exportPopover.onClose}
                arrow="right-top"
                sx={{ width: 240 }}
            >
                <Box sx={{ py: 1 }}>
                    {exportOptions.map((option) => (
                        <MenuItem
                            key={option.key}
                            onClick={() => handleToggleStatus(option.key)}
                            sx={{
                                px: 1,
                                py: 0.75,
                            }}
                        >
                            <Checkbox
                                size="small"
                                checked={selectedStatuses.includes(option.key)}
                                sx={{ mr: 1 }}
                            />
                            <Iconify
                                icon={option.icon}
                                sx={{
                                    mr: 1,
                                    color: `${option.color}.main`
                                }}
                            />
                            <Box sx={{ flexGrow: 1 }}>
                                {option.label}
                            </Box>
                        </MenuItem>
                    ))}
                </Box>

                <Divider sx={{ borderStyle: 'dashed' }} />

                <Stack spacing={1} sx={{ p: 1.5 }}>
                    <LoadingButton
                        fullWidth
                        variant="contained"
                        color="primary"
                        size="small"
                        loading={exporting}
                        disabled={selectedStatuses.length === 0}
                        onClick={handleExportOrders}
                        startIcon={<Iconify icon="solar:download-bold" />}
                    >
                        {t('export_selected')} ({selectedStatuses.includes('all') ? orders?.length || 0 : orders?.filter(o => selectedStatuses.includes(o.status?.key || o.status)).length || 0})
                    </LoadingButton>
                </Stack>
            </CustomPopover>
        </>
    );
}

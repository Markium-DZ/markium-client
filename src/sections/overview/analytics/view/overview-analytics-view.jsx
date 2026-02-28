import { useState } from 'react';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import CircularProgress from '@mui/material/CircularProgress';

import { useSettingsContext } from 'src/components/settings';
import Iconify from 'src/components/iconify';
import { useTranslate } from 'src/locales';

import {
  useGetAnalyticsCapabilities,
  downloadAnalyticsExport,
} from 'src/api/analytics';

import AnalyticsTabOverview from './analytics-tab-overview';
import AnalyticsTabTraffic from './analytics-tab-traffic';
import AnalyticsTabProducts from './analytics-tab-products';
import AnalyticsTabOrders from './analytics-tab-orders';
import AnalyticsTabCustomers from './analytics-tab-customers';

// ----------------------------------------------------------------------

const DATE_RANGE_LABELS = {
  '-1d': 'analytics_date_last_1_day',
  '-7d': 'analytics_date_last_7_days',
  '-14d': 'analytics_date_last_14_days',
  '-30d': 'analytics_date_last_30_days',
  '-90d': 'analytics_date_last_90_days',
};

const TABS = [
  { value: 'overview', labelKey: 'analytics_group_overview', icon: 'solar:chart-square-bold-duotone' },
  { value: 'traffic', labelKey: 'analytics_group_traffic', icon: 'solar:users-group-rounded-bold-duotone' },
  { value: 'products', labelKey: 'analytics_group_products', icon: 'solar:bag-4-bold-duotone' },
  { value: 'orders', labelKey: 'analytics_group_orders', icon: 'solar:delivery-bold-duotone' },
  { value: 'customers', labelKey: 'analytics_group_customers', icon: 'solar:user-heart-bold-duotone' },
];

// ----------------------------------------------------------------------

export default function OverviewAnalyticsView() {
  const settings = useSettingsContext();
  const { t } = useTranslate();

  const {
    allowedDateRanges,
    exportEnabled,
    capabilitiesLoading,
    sections,
  } = useGetAnalyticsCapabilities();

  const [dateFrom, setDateFrom] = useState(
    allowedDateRanges[allowedDateRanges.length - 1] || '-7d'
  );

  const [currentTab, setCurrentTab] = useState('overview');

  const handleExport = async () => {
    await downloadAnalyticsExport(dateFrom);
  };

  if (capabilitiesLoading) {
    return (
      <Container maxWidth={settings.themeStretch ? false : 'xl'}>
        <Stack alignItems="center" justifyContent="center" sx={{ py: 10 }}>
          <CircularProgress />
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'}>
      {/* Sticky header */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          bgcolor: 'background.default',
          pb: 2,
        }}
      >
        {/* Title + controls */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 2, pt: 1 }}
        >
          <Typography variant="h4">{t('analytics_title')}</Typography>

          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              select
              size="small"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              sx={{ minWidth: 160 }}
            >
              {allowedDateRanges.map((range) => (
                <MenuItem key={range} value={range}>
                  {t(DATE_RANGE_LABELS[range] || range)}
                </MenuItem>
              ))}
            </TextField>

            {exportEnabled && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<Iconify icon="solar:export-bold" />}
                onClick={handleExport}
              >
                {t('analytics_export_csv')}
              </Button>
            )}
          </Stack>
        </Stack>

        {/* Tabs */}
        <Tabs
          value={currentTab}
          onChange={(_, newValue) => setCurrentTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          {TABS.map((tab) => (
            <Tab
              key={tab.value}
              value={tab.value}
              label={t(tab.labelKey)}
              icon={<Iconify icon={tab.icon} width={20} />}
              iconPosition="start"
              sx={{ minHeight: 48 }}
            />
          ))}
        </Tabs>
      </Box>

      {/* Tab content — only active tab renders (lazy data loading) */}
      <Box sx={{ pt: 3 }}>
        {currentTab === 'overview' && (
          <AnalyticsTabOverview dateFrom={dateFrom} />
        )}
        {currentTab === 'traffic' && (
          <AnalyticsTabTraffic dateFrom={dateFrom} sections={sections} />
        )}
        {currentTab === 'products' && (
          <AnalyticsTabProducts dateFrom={dateFrom} sections={sections} />
        )}
        {currentTab === 'orders' && (
          <AnalyticsTabOrders dateFrom={dateFrom} sections={sections} />
        )}
        {currentTab === 'customers' && (
          <AnalyticsTabCustomers dateFrom={dateFrom} sections={sections} />
        )}
      </Box>
    </Container>
  );
}

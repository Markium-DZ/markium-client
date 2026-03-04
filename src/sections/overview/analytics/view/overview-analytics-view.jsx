import { useState, useCallback } from 'react';

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
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { AnimatePresence, m } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { useSettingsContext } from 'src/components/settings';
import Iconify from 'src/components/iconify';
import { useTranslate } from 'src/locales';

import {
  useGetAnalyticsCapabilities,
  downloadAnalyticsExport,
  DATE_RANGE_OPTIONS,
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

const tabContentVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 150 : -150,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] },
  },
  exit: (direction) => ({
    x: direction > 0 ? -150 : 150,
    opacity: 0,
    transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] },
  }),
};

// ----------------------------------------------------------------------

export default function OverviewAnalyticsView() {
  const settings = useSettingsContext();
  const { t } = useTranslate();
  const theme = useTheme();
  const { i18n } = useTranslation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isRtl = i18n.dir() === 'rtl';

  const {
    exportEnabled,
    capabilitiesLoading,
    sections,
  } = useGetAnalyticsCapabilities();

  const [dateFrom, setDateFrom] = useState('-30d');
  const [currentTab, setCurrentTab] = useState('overview');
  const [swipeDirection, setSwipeDirection] = useState(0);

  const tabIndex = TABS.findIndex((tab) => tab.value === currentTab);

  const goToTab = useCallback((index, direction) => {
    if (index >= 0 && index < TABS.length) {
      setSwipeDirection(direction);
      setCurrentTab(TABS[index].value);
    }
  }, []);

  const handleTabChange = useCallback((_, newValue) => {
    const newIndex = TABS.findIndex((tab) => tab.value === newValue);
    setSwipeDirection(newIndex > tabIndex ? 1 : -1);
    setCurrentTab(newValue);
    if (navigator.vibrate) navigator.vibrate(10);
  }, [tabIndex]);

  const handleDragEnd = useCallback((event, info) => {
    const SWIPE_THRESHOLD = 50;
    const VELOCITY_THRESHOLD = 200;
    const { offset, velocity } = info;

    if (
      Math.abs(offset.x) > SWIPE_THRESHOLD ||
      Math.abs(velocity.x) > VELOCITY_THRESHOLD
    ) {
      // Physical swipe right (positive offset.x)
      // In RTL: goes to next tab (higher index, visually to the left)
      // In LTR: goes to previous tab (lower index, visually to the left)
      if (offset.x > 0) {
        if (isRtl) {
          goToTab(tabIndex + 1, 1);
        } else {
          goToTab(tabIndex - 1, -1);
        }
      } else {
        // Physical swipe left (negative offset.x)
        if (isRtl) {
          goToTab(tabIndex - 1, -1);
        } else {
          goToTab(tabIndex + 1, 1);
        }
      }
    }
  }, [tabIndex, isRtl, goToTab]);

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

  const renderTabContent = () => {
    switch (currentTab) {
      case 'overview':
        return <AnalyticsTabOverview dateFrom={dateFrom} />;
      case 'traffic':
        return <AnalyticsTabTraffic dateFrom={dateFrom} sections={sections} />;
      case 'products':
        return <AnalyticsTabProducts dateFrom={dateFrom} sections={sections} />;
      case 'orders':
        return <AnalyticsTabOrders dateFrom={dateFrom} sections={sections} />;
      case 'customers':
        return <AnalyticsTabCustomers dateFrom={dateFrom} sections={sections} />;
      default:
        return null;
    }
  };

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'}>
      {/* Sticky header */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          bgcolor: 'background.default',
          pb: isMobile ? 1 : 2,
        }}
      >
        {/* Title + controls */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: isMobile ? 1 : 2, pt: 1 }}
        >
          <Typography variant={isMobile ? 'h5' : 'h4'}>{t('analytics_title')}</Typography>

          <Stack direction="row" spacing={isMobile ? 1 : 2} alignItems="center">
            <TextField
              select
              size="small"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              sx={{ minWidth: isMobile ? 120 : 160 }}
            >
              {DATE_RANGE_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {t(DATE_RANGE_LABELS[opt.value] || opt.value)}
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
          onChange={handleTabChange}
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
              icon={isMobile ? undefined : <Iconify icon={tab.icon} width={20} />}
              iconPosition="start"
              sx={{
                minHeight: isMobile ? 40 : 48,
                fontSize: isMobile ? '0.8rem' : undefined,
                px: isMobile ? 1.5 : 2,
              }}
            />
          ))}
        </Tabs>
      </Box>

      {/* Tab content with swipe support on mobile */}
      <Box sx={{ pt: isMobile ? 2 : 3, overflow: 'hidden' }}>
        <AnimatePresence mode="wait" custom={swipeDirection * (isRtl ? -1 : 1)} initial={false}>
          <m.div
            key={currentTab}
            custom={swipeDirection * (isRtl ? -1 : 1)}
            variants={tabContentVariants}
            initial="enter"
            animate="center"
            exit="exit"
            {...(isMobile && {
              drag: 'x',
              dragConstraints: { left: 0, right: 0 },
              dragElastic: 0.15,
              dragDirectionLock: true,
              onDragEnd: handleDragEnd,
            })}
            style={{ touchAction: 'pan-y' }}
          >
            {renderTabContent()}
          </m.div>
        </AnimatePresence>
      </Box>
    </Container>
  );
}

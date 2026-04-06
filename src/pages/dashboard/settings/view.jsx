import { useMemo, useState, useCallback, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Container from '@mui/material/Container';
import { alpha, useTheme } from '@mui/material/styles';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';

import { RoleBasedGuard } from 'src/auth/guard';

import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

const TABS = [
  {
    value: 'store',
    labelKey: 'store_settings',
    icon: 'solar:shop-bold-duotone',
    items: [
      {
        key: 'general',
        titleKey: 'general_settings',
        icon: 'solar:settings-bold-duotone',
        href: paths?.dashboard.settings.general,
      },
      {
        key: 'contacts',
        titleKey: 'contacts_social_media',
        icon: 'solar:chat-round-dots-bold-duotone',
        href: paths?.dashboard.settings.contacts_social,
      },
      {
        key: 'appearance',
        titleKey: 'appearance',
        icon: 'solar:palette-round-bold-duotone',
        href: paths?.dashboard.settings.appearance,
      },
      {
        key: 'categories',
        titleKey: 'categories',
        icon: 'solar:widget-5-bold-duotone',
        href: paths?.dashboard.settings.categories,
      },
    ],
  },
  {
    value: 'marketing',
    labelKey: 'marketing_settings',
    icon: 'solar:chart-2-bold-duotone',
    items: [
      {
        key: 'pixels',
        titleKey: 'social_media_pixels',
        icon: 'solar:target-bold-duotone',
        href: paths?.dashboard.settings.marketing_pixels,
      },
      {
        key: 'session_replay',
        titleKey: 'session_replay',
        icon: 'solar:videocamera-record-bold-duotone',
        href: paths?.dashboard.settings.session_replay,
      },
    ],
  },
  {
    value: 'shipping',
    labelKey: 'delivery_settings',
    icon: 'solar:box-bold-duotone',
    items: [
      {
        key: 'delivery',
        titleKey: 'delivery_companies',
        icon: 'solar:delivery-bold-duotone',
        href: paths?.dashboard.settings.delivery_companies,
      },
    ],
  },
  {
    value: 'cod',
    labelKey: 'cod_settings',
    icon: 'solar:cash-out-bold-duotone',
    items: [
      {
        key: 'cod',
        titleKey: 'cod_settings',
        icon: 'solar:cash-out-bold-duotone',
        href: paths?.dashboard.settings.cod,
      },
    ],
  },
  {
    value: 'notifications',
    labelKey: 'notification_settings',
    icon: 'solar:bell-bold-duotone',
    items: [
      {
        key: 'notifications',
        titleKey: 'notification_preferences',
        icon: 'solar:bell-bold-duotone',
        href: paths?.dashboard.settings.notifications,
      },
    ],
  },
];

// Build a flat map: href → { tabValue, titleKey }
const ALL_ITEMS = TABS.flatMap((tab) =>
  tab.items.map((item) => ({ ...item, tabValue: tab.value }))
);

// ----------------------------------------------------------------------

export default function SettingsView() {
  const appSettings = useSettingsContext();
  const { t } = useTranslate();
  const theme = useTheme();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Determine active item from the current URL
  const activeItem = useMemo(
    () => ALL_ITEMS.find((item) => pathname.includes(item.href)) || ALL_ITEMS[0],
    [pathname]
  );

  const [currentTab, setCurrentTab] = useState(activeItem.tabValue);

  // Sync tab when URL changes (e.g. browser back/forward)
  useEffect(() => {
    if (activeItem.tabValue !== currentTab) {
      setCurrentTab(activeItem.tabValue);
    }
  }, [activeItem.tabValue]);

  const activeTab = TABS.find((tab) => tab.value === currentTab) || TABS[0];

  const handleChangeTab = useCallback(
    (event, newValue) => {
      setCurrentTab(newValue);
      // Navigate to first item in the new tab
      const firstItem = TABS.find((tab) => tab.value === newValue)?.items[0];
      if (firstItem) {
        navigate(firstItem.href);
      }
    },
    [navigate]
  );

  const handleSidebarClick = useCallback(
    (href) => {
      navigate(href);
    },
    [navigate]
  );

  // Check if we're on the settings index (no sub-route)
  const isIndex = pathname === paths.dashboard.settings.root || pathname === `${paths.dashboard.settings.root}/`;

  // Redirect index to first item
  useEffect(() => {
    if (isIndex) {
      navigate(ALL_ITEMS[0].href, { replace: true });
    }
  }, [isIndex, navigate]);

  // Breadcrumb: Dashboard > Settings > Active Item
  const breadcrumbLinks = [
    { name: t('dashboard'), href: paths.dashboard.root },
    { name: t('system_settings'), href: paths.dashboard.settings.root },
    ...(activeItem ? [{ name: t(activeItem.titleKey) }] : []),
  ];

  return (
    <Container maxWidth={false}>
      <CustomBreadcrumbs
        heading={t('system_settings')}
        links={breadcrumbLinks}
        sx={{ mb: { xs: 3, md: 4 } }}
      />

      <RoleBasedGuard hasContent roles={['admin', 'manager']} sx={{ py: 10 }}>
        {/* Tabs */}
        <Tabs
          value={currentTab}
          onChange={handleChangeTab}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            mb: 3,
            borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
            '& .MuiTab-root': {
              minHeight: 48,
              fontWeight: 600,
              gap: 1,
            },
          }}
        >
          {TABS.map((tab) => (
            <Tab
              key={tab.value}
              value={tab.value}
              icon={<Iconify icon={tab.icon} width={22} />}
              iconPosition="start"
              label={t(tab.labelKey)}
            />
          ))}
        </Tabs>

        {/* Sidebar + Content */}
        <Box
          sx={{
            display: 'flex',
            gap: { xs: 0, md: 3 },
            flexDirection: { xs: 'column', md: 'row' },
          }}
        >
          {/* Secondary Sidebar */}
          <Box
            sx={{
              width: { xs: '100%', md: 260 },
              flexShrink: 0,
              mb: { xs: 2, md: 0 },
            }}
          >
            <List disablePadding>
              {activeTab.items.map((item) => {
                const isActive = activeItem?.key === item.key;

                return (
                  <ListItemButton
                    key={item.key}
                    onClick={() => handleSidebarClick(item.href)}
                    sx={{
                      px: 2,
                      py: 1.25,
                      mb: 0.5,
                      borderRadius: 1,
                      ...(isActive && {
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                        color: 'primary.main',
                        fontWeight: 700,
                        borderLeft: `3px solid ${theme.palette.primary.main}`,
                        '[dir=rtl] &': {
                          borderLeft: 'none',
                          borderRight: `3px solid ${theme.palette.primary.main}`,
                        },
                      }),
                      ...(!isActive && {
                        color: 'text.secondary',
                        '&:hover': {
                          bgcolor: 'action.hover',
                          color: 'text.primary',
                        },
                      }),
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 36,
                        color: isActive ? 'primary.main' : 'text.disabled',
                      }}
                    >
                      <Iconify icon={item.icon} width={22} />
                    </ListItemIcon>

                    <ListItemText
                      primary={t(item.titleKey)}
                      primaryTypographyProps={{
                        variant: 'body2',
                        fontWeight: isActive ? 700 : 500,
                        noWrap: true,
                      }}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          </Box>

          {/* Content Area */}
          <Box sx={{ flexGrow: 1, minWidth: 0, maxWidth: 1100 }}>
            <Outlet />
          </Box>
        </Box>
      </RoleBasedGuard>
    </Container>
  );
}

import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Iconify from 'src/components/iconify';
import { paths } from 'src/routes/paths';

const NAV_HEIGHT = 56;

const PRIMARY_TABS = [
  { label: 'nav.dashboard', icon: 'solar:widget-5-bold-duotone', path: paths.dashboard.root },
  { label: 'nav.orders', icon: 'solar:bag-check-bold-duotone', path: paths.dashboard.order.root },
  { label: 'nav.products', icon: 'solar:box-bold-duotone', path: paths.dashboard.product.root },
  { label: 'nav.analytics', icon: 'solar:chart-bold-duotone', path: paths.dashboard.general.analytics },
];

const MORE_ITEMS = [
  { label: 'nav.inventory', icon: 'solar:archive-bold-duotone', path: paths.dashboard.inventory.root },
  { label: 'nav.settings', icon: 'solar:settings-bold-duotone', path: paths.dashboard.settings.root },
];

function getActiveTab(pathname) {
  const idx = PRIMARY_TABS.findIndex((tab) => pathname.startsWith(tab.path));
  return idx >= 0 ? idx : -1;
}

export default function BottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [moreOpen, setMoreOpen] = useState(false);

  const activeTab = getActiveTab(pathname);

  const handleChange = (_event, newValue) => {
    if (newValue === 4) {
      setMoreOpen(true);
      return;
    }
    const tab = PRIMARY_TABS[newValue];
    if (tab) {
      navigate(tab.path);
      if (navigator.vibrate) navigator.vibrate(10);
    }
  };

  const handleMoreNav = (path) => {
    setMoreOpen(false);
    navigate(path);
  };

  return (
    <>
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: (theme) => theme.zIndex.appBar,
          pb: 'env(safe-area-inset-bottom)',
          bgcolor: 'background.paper',
          borderTop: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <BottomNavigation
          value={activeTab >= 0 ? activeTab : false}
          onChange={handleChange}
          showLabels
          sx={{ height: NAV_HEIGHT }}
        >
          {PRIMARY_TABS.map((tab) => (
            <BottomNavigationAction
              key={tab.path}
              label={t(tab.label)}
              icon={<Iconify icon={tab.icon} width={24} />}
              sx={{
                '&.Mui-selected': { color: 'primary.main' },
                minWidth: 0,
                py: 1,
              }}
            />
          ))}
          <BottomNavigationAction
            label={t('nav.more', 'More')}
            icon={<Iconify icon="solar:hamburger-menu-bold-duotone" width={24} />}
            sx={{ '&.Mui-selected': { color: 'primary.main' }, minWidth: 0, py: 1 }}
          />
        </BottomNavigation>
      </Box>

      {/* More drawer */}
      <Drawer
        anchor="bottom"
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            pb: 'env(safe-area-inset-bottom)',
          },
        }}
      >
        <Box sx={{ p: 1, textAlign: 'center' }}>
          <Box sx={{ width: 40, height: 4, bgcolor: 'grey.300', borderRadius: 2, mx: 'auto', mb: 1 }} />
        </Box>
        <List>
          {MORE_ITEMS.map((item) => (
            <ListItemButton key={item.path} onClick={() => handleMoreNav(item.path)}>
              <ListItemIcon>
                <Iconify icon={item.icon} width={24} />
              </ListItemIcon>
              <ListItemText primary={t(item.label)} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      {/* Spacer to prevent content from being hidden behind bottom nav */}
      <Box sx={{ height: `calc(${NAV_HEIGHT}px + env(safe-area-inset-bottom))` }} />
    </>
  );
}

export { NAV_HEIGHT };

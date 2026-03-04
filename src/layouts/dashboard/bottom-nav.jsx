import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import { alpha, useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Iconify from 'src/components/iconify';
import { paths } from 'src/routes/paths';

const NAV_HEIGHT = 50;

const PRIMARY_TABS = [
  { label: 'nav.dashboard', icon: 'solar:widget-5-bold-duotone', path: paths.dashboard.root },
  { label: 'nav.orders', icon: 'solar:bag-check-bold-duotone', path: paths.dashboard.order.root },
  { label: 'nav.products', icon: 'solar:box-bold-duotone', path: paths.dashboard.product.root },
  { label: 'nav.analytics', icon: 'solar:chart-bold-duotone', path: paths.dashboard.general.analytics },
];

function getActiveTab(pathname) {
  // Match most specific path first (longest match wins) to avoid
  // dashboard root matching all sub-paths like /dashboard/order
  let bestIdx = -1;
  let bestLen = 0;
  PRIMARY_TABS.forEach((tab, index) => {
    if (tab.path && pathname.startsWith(tab.path) && tab.path.length > bestLen) {
      bestIdx = index;
      bestLen = tab.path.length;
    }
  });
  return bestIdx;
}

export default function BottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const theme = useTheme();

  const activeTab = getActiveTab(pathname);

  const handleTabPress = (index) => {
    const tab = PRIMARY_TABS[index];
    if (tab?.path) {
      navigate(tab.path);
      if (navigator.vibrate) navigator.vibrate(10);
    }
  };

  return (
    <>
      {/* Tab bar */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: theme.zIndex.appBar + 1,
          bgcolor: alpha(theme.palette.background.paper, 0.85),
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: `0.5px solid ${alpha(theme.palette.divider, 0.3)}`,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            height: NAV_HEIGHT,
            alignItems: 'stretch',
          }}
        >
          {PRIMARY_TABS.map((tab, index) => {
            const isActive = index === activeTab;
            return (
              <ButtonBase
                key={tab.label}
                onClick={() => handleTabPress(index)}
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '2px',
                  pt: '6px',
                  pb: '2px',
                  transition: 'none',
                  WebkitTapHighlightColor: 'transparent',
                  color: isActive
                    ? theme.palette.primary.main
                    : theme.palette.text.disabled,
                }}
              >
                <Iconify
                  icon={tab.icon}
                  width={isActive ? 25 : 23}
                  sx={{
                    transition: 'none',
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '10px',
                    fontWeight: isActive ? 600 : 400,
                    lineHeight: 1.2,
                    letterSpacing: 0,
                  }}
                >
                  {t(tab.label)}
                </Typography>
              </ButtonBase>
            );
          })}
        </Box>
        {/* Safe area spacer */}
        <Box sx={{ height: 'env(safe-area-inset-bottom)', bgcolor: 'transparent' }} />
      </Box>

      {/* Spacer to prevent content from being hidden behind bottom nav */}
      <Box sx={{ height: `calc(${NAV_HEIGHT}px + env(safe-area-inset-bottom))` }} />
    </>
  );
}

export { NAV_HEIGHT };

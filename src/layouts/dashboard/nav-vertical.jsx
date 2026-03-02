import { useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

import { usePathname } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';
import { paths } from 'src/routes/paths';

import { useResponsive } from 'src/hooks/use-responsive';

import Logo from 'src/components/logo';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { NavSectionVertical } from 'src/components/nav-section';

import { useAuthContext } from 'src/auth/hooks';
import { useGetProducts } from 'src/api/product';
import { useGetCurrentSubscription } from 'src/api/subscriptions';
import { useTranslate } from 'src/locales';

import { NAV } from '../config-layout';
import NavUserProfile from '../common/nav-user-profile';
import { useNavData } from './config-navigation';
import NavToggleButton from '../common/nav-toggle-button';

// ----------------------------------------------------------------------

const FREE_SLUGS = ['payg', 'free-trial'];

function getPlanTier(slug) {
  if (!slug || FREE_SLUGS.includes(slug)) return 'free';
  if (slug.startsWith('business')) return 'business';
  return 'pro';
}

export default function NavVertical({ openNav, onCloseNav }) {
  const theme = useTheme();
  const { user } = useAuthContext();
  const { t } = useTranslate();
  const { subscription } = useGetCurrentSubscription();

  const planTier = getPlanTier(subscription?.package?.slug);

  const pathname = usePathname();

  const lgUp = useResponsive('up', 'lg');

  const navData = useNavData();
  const { products } = useGetProducts();
  const isNewUser = (products?.length || 0) === 0;

  // Dim irrelevant nav items for Grade A (new users with 0 products)
  const DIMMED_PATHS = [paths.dashboard.order.root, paths.dashboard.inventory.root];

  const adjustedNavData = useMemo(() => {
    if (!isNewUser) return navData;
    return navData.map((group) => ({
      ...group,
      items: group.items.map((item) => ({
        ...item,
        dimmed: DIMMED_PATHS.includes(item.path),
        dimmedReason: DIMMED_PATHS.includes(item.path) ? t('nav_dimmed_create_product_first') : undefined,
      })),
    }));
  }, [navData, isNewUser]);

  useEffect(() => {
    if (openNav) {
      onCloseNav();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const renderContent = (
    <Stack sx={{ height: 1 }}>
      <Scrollbar
        sx={{
          flexGrow: 1,
          '& .simplebar-content': {
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <Box
          component={RouterLink}
          href={paths.dashboard.root}
          sx={{
            px: 2.5,
            pt: 3,
            pb: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          <Logo disabledLink sx={{ width: 36, height: 36 }} />
          <Typography
            variant="subtitle1"
            noWrap
            sx={{
              fontWeight: 700,
              ...(planTier === 'pro' && {
                color: theme.palette.primary.main,
              }),
              ...(planTier === 'business' && {
                background: `linear-gradient(135deg, ${theme.palette.warning.main}, ${theme.palette.warning.dark})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }),
            }}
          >
            {t('markium')}
          </Typography>
          {planTier === 'business' && (
            <Iconify
              icon="solar:crown-bold"
              width={18}
              sx={{ color: 'warning.main', ml: -0.5 }}
            />
          )}
        </Box>

        <Divider sx={{ borderStyle: 'dashed', mx: 2.5, mb: 2 }} />

        <NavSectionVertical
          data={adjustedNavData}
          slotProps={{
            currentRole: user?.role,
          }}
          aria-label={t('main_navigation')}
        />
      </Scrollbar>

      <NavUserProfile />
    </Stack>
  );

  return (
    <Box
      sx={{
        flexShrink: { lg: 0 },
        width: { lg: NAV.W_VERTICAL },
      }}
    >
      <NavToggleButton />

      {lgUp ? (
        <Stack
          sx={{
            height: 1,
            position: 'fixed',
            width: NAV.W_VERTICAL,
            borderRight: (theme) => `dashed 1px ${theme.palette.divider}`,
          }}
        >
          {renderContent}
        </Stack>
      ) : (
        <Drawer
          open={openNav}
          onClose={onCloseNav}
          PaperProps={{
            sx: {
              width: NAV.W_VERTICAL,
            },
          }}
        >
          {renderContent}
        </Drawer>
      )}
    </Box>
  );
}

NavVertical.propTypes = {
  openNav: PropTypes.bool,
  onCloseNav: PropTypes.func,
};

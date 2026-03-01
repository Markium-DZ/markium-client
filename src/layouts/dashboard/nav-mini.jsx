import { useContext, useState, useRef } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import ButtonBase from '@mui/material/ButtonBase';
import { alpha, useTheme } from '@mui/material/styles';

import { useMockedUser } from 'src/hooks/use-mocked-user';
import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';

import { hideScroll } from 'src/theme/css';

import Logo from 'src/components/logo';
import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';
import { useTranslate } from 'src/locales';
import { NavSectionMini } from 'src/components/nav-section';

import { AuthContext } from 'src/auth/context/jwt';
import { useGetCurrentSubscription } from 'src/api/subscriptions';

import { NAV } from '../config-layout';
import { useNavData } from './config-navigation';
import NavToggleButton from '../common/nav-toggle-button';

// ----------------------------------------------------------------------

const FREE_SLUGS = ['payg', 'free-trial'];

export default function NavMini() {
  const { user: mockedUser } = useMockedUser();
  const { user } = useContext(AuthContext);
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslate();
  const { enqueueSnackbar } = useSnackbar();
  const { subscription } = useGetCurrentSubscription();

  const navData = useNavData();

  const packageSlug = subscription?.package?.slug;
  const planTier = (!packageSlug || FREE_SLUGS.includes(packageSlug)) ? 'free' : 'pro';
  const isFreePlan = planTier === 'free';

  const storeName = user?.store?.name;
  const storeLogo = user?.store?.logo_url;
  const storeSlug = user?.store?.slug;
  const storeInitials = storeName?.substring(0, 2).toUpperCase();
  const storeUrl = storeSlug ? `https://${storeSlug}.markium.online` : '';

  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const upgradeRef = useRef(null);

  const handleCopyUrl = () => {
    navigator.clipboard
      .writeText(storeUrl)
      .then(() => enqueueSnackbar(t('store_url_copied'), { variant: 'success' }))
      .catch(() => enqueueSnackbar(t('failed_to_copy'), { variant: 'error' }));
  };

  return (
    <Box
      sx={{
        flexShrink: { lg: 0 },
        width: { lg: NAV.W_MINI },
      }}
    >
      <NavToggleButton
        sx={{
          top: 22,
          left: NAV.W_MINI - 12,
        }}
      />

      <Stack
        sx={{
          pb: 2,
          height: 1,
          position: 'fixed',
          width: NAV.W_MINI,
          borderInlineEnd: (th) => `dashed 1px ${th.palette.divider}`,
          ...hideScroll.x,
        }}
      >
        <Logo sx={{ mx: 'auto', my: 2 }} />

        <NavSectionMini
          data={navData}
          slotProps={{
            currentRole: mockedUser?.role,
          }}
        />

        <Box sx={{ flexGrow: 1 }} />

        {/* Bottom section */}
        <Stack alignItems="center" spacing={1.5} sx={{ pb: 1 }}>
          {isFreePlan && (
            <>
              <IconButton
                ref={upgradeRef}
                onMouseEnter={() => setUpgradeOpen(true)}
                onMouseLeave={() => setUpgradeOpen(false)}
                onClick={() => router.push(paths.dashboard.subscription.root)}
                sx={{
                  width: 40,
                  height: 40,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                  color: 'common.white',
                  '&:hover': {
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.darker})`,
                  },
                }}
              >
                <Iconify icon="solar:stars-bold-duotone" width={20} />
              </IconButton>

              <Popover
                open={upgradeOpen}
                anchorEl={upgradeRef.current}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                slotProps={{
                  paper: {
                    onMouseEnter: () => setUpgradeOpen(true),
                    onMouseLeave: () => setUpgradeOpen(false),
                    sx: {
                      p: 0,
                      ml: 1,
                      width: 220,
                      overflow: 'hidden',
                      borderRadius: 2.5,
                      boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.2)}`,
                    },
                  },
                }}
                sx={{ pointerEvents: 'none' }}
                disableRestoreFocus
              >
                <Box
                  sx={{
                    pointerEvents: 'auto',
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 50%, ${theme.palette.primary.darker} 100%)`,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Decorative circles */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -16,
                      right: -16,
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      background: alpha('#fff', 0.08),
                      pointerEvents: 'none',
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: -20,
                      left: -10,
                      width: 45,
                      height: 45,
                      borderRadius: '50%',
                      background: alpha('#fff', 0.05),
                      pointerEvents: 'none',
                    }}
                  />

                  <Box sx={{ position: 'relative', px: 2, pt: 1.5, pb: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{ color: 'common.white', fontWeight: 800, flexGrow: 1 }}
                      >
                        {t('upgrade_to_pro')}
                      </Typography>
                      <Iconify
                        icon="solar:stars-bold-duotone"
                        width={18}
                        sx={{ color: alpha('#fff', 0.7) }}
                      />
                    </Stack>

                    <Typography
                      variant="caption"
                      sx={{ color: alpha('#fff', 0.85), display: 'block', mb: 1.5, lineHeight: 1.4 }}
                    >
                      {t('upgrade_to_pro_description')}
                    </Typography>

                    <ButtonBase
                      onClick={() => router.push(paths.dashboard.subscription.root)}
                      sx={{
                        width: '100%',
                        py: 0.75,
                        px: 2,
                        borderRadius: 1.5,
                        fontFamily: 'inherit',
                        fontWeight: 700,
                        fontSize: 12,
                        color: theme.palette.primary.darker,
                        background: `linear-gradient(135deg, ${alpha('#fff', 0.95)}, ${alpha('#fff', 0.8)})`,
                        backdropFilter: 'blur(8px)',
                        transition: 'all 0.2s',
                        '&:hover': {
                          background: `linear-gradient(135deg, #fff, ${alpha('#fff', 0.9)})`,
                          transform: 'translateY(-1px)',
                          boxShadow: `0 4px 12px ${alpha('#000', 0.15)}`,
                        },
                      }}
                    >
                      {t('upgrade_now')}
                    </ButtonBase>
                  </Box>
                </Box>
              </Popover>
            </>
          )}

          <Tooltip title={storeName || ''} placement="right">
            <Avatar
              src={storeLogo}
              alt={storeName}
              sx={{
                width: 36,
                height: 36,
                bgcolor: 'grey.800',
                color: 'common.white',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
              }}
              onClick={handleCopyUrl}
            >
              {storeInitials}
            </Avatar>
          </Tooltip>
        </Stack>
      </Stack>
    </Box>
  );
}

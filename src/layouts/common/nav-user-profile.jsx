import { useContext } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';

import { AuthContext } from 'src/auth/context/jwt';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';
import { useTranslate } from 'src/locales';

import { useGetCurrentSubscription } from 'src/api/subscriptions';
import { getStorefrontUrl } from 'src/config-global';

// ----------------------------------------------------------------------

const FREE_SLUGS = ['payg', 'free-trial'];

function getPlanTier(slug) {
  if (!slug || FREE_SLUGS.includes(slug)) return 'free';
  if (slug.startsWith('business')) return 'business';
  return 'pro';
}

export default function NavUserProfile() {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const { t } = useTranslate();
  const { enqueueSnackbar } = useSnackbar();
  const { subscription } = useGetCurrentSubscription();

  const packageSlug = subscription?.package?.slug;
  const packageName = subscription?.package?.name;
  const packageTranslationKey = packageSlug ? `package_${packageSlug}` : '';
  const translatedPackageName = packageTranslationKey ? t(packageTranslationKey) : '';
  const displayPackageName =
    translatedPackageName && translatedPackageName !== packageTranslationKey
      ? translatedPackageName
      : packageName;

  const planTier = getPlanTier(packageSlug);
  const isFreePlan = planTier === 'free';
  const daysLeft = subscription?.days_until_expiry;
  const hasDaysLeft = typeof daysLeft === 'number' && daysLeft >= 0;

  const storeName = user?.store?.name;
  const storeLogo = user?.store?.logo_url;
  const storeSlug = user?.store?.slug;
  const storeInitials = storeName?.substring(0, 2).toUpperCase();
  const storeUrl = storeSlug ? getStorefrontUrl(storeSlug) : '';

  const handleCopyUrl = () => {
    navigator.clipboard
      .writeText(storeUrl)
      .then(() => enqueueSnackbar(t('store_url_copied'), { variant: 'success' }))
      .catch(() => enqueueSnackbar(t('failed_to_copy'), { variant: 'error' }));
  };


  return (
    <Box sx={{ px: 2, pb: 2 }}>
      {/* Subscription card */}
      {isFreePlan ? (
        <Box
          sx={{
            mb: 1.5,
            borderRadius: 2.5,
            overflow: 'hidden',
            position: 'relative',
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 50%, ${theme.palette.primary.darker} 100%)`,
            boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
          }}
        >
          {/* Decorative glow circles */}
          <Box
            sx={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: alpha('#fff', 0.08),
              pointerEvents: 'none',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: -30,
              left: -15,
              width: 60,
              height: 60,
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
                width={20}
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
      ) : null}

      {/* Store tile */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{
          p: 1,
          borderRadius: 2,
          bgcolor: (th) => alpha(th.palette.grey[500], 0.08),
        }}
      >
        <Avatar
          src={storeLogo}
          alt={storeName}
          sx={{
            width: 36,
            height: 36,
            bgcolor: 'grey.800',
            color: 'common.white',
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {storeInitials}
        </Avatar>

        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Typography variant="subtitle2" noWrap sx={{ lineHeight: 1.3 }}>
            {storeName}
          </Typography>
          {displayPackageName && (
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
              <Label
                color={isFreePlan ? 'default' : 'success'}
                variant="soft"
                startIcon={
                  isFreePlan
                    ? <Iconify icon="solar:tag-bold" width={12} />
                    : <Iconify icon="solar:crown-bold" width={12} />
                }
                sx={{ height: 22, fontSize: 11 }}
              >
                {displayPackageName}
              </Label>
              {hasDaysLeft && (
                <Label
                  color={daysLeft <= 3 ? 'error' : daysLeft <= 7 ? 'warning' : 'default'}
                  variant="soft"
                  startIcon={<Iconify icon="solar:clock-circle-bold" width={12} />}
                  sx={{ height: 22, fontSize: 11 }}
                >
                  {daysLeft === 0
                    ? t('subscription_expires_today')
                    : t('subscription_days_remaining', { count: daysLeft })}
                </Label>
              )}
            </Stack>
          )}
        </Box>

        <Tooltip title={t('copy_store_url')}>
          <IconButton size="small" onClick={handleCopyUrl} sx={{ color: 'text.secondary' }}>
            <Iconify icon="solar:copy-bold-duotone" width={18} />
          </IconButton>
        </Tooltip>
      </Stack>
    </Box>
  );
}

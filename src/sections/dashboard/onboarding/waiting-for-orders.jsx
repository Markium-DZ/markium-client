import { useState, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { alpha, useTheme } from '@mui/material/styles';

import { useRouter } from 'src/routes/hooks';

import Iconify from 'src/components/iconify';

import QuickActionsPanel from './quick-actions-panel';

// ----------------------------------------------------------------------

export default function WaitingForOrders({ storeSlug, sx, ...other }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();

  const strategies = useMemo(() => [
    {
      id: 'share_link',
      icon: 'solar:share-bold',
      title: t('strategy_share_link_title'),
      description: t('strategy_share_link_desc'),
      color: theme.palette.primary.main,
      hasAction: true,
    },
    {
      id: 'social_media',
      icon: 'solar:camera-bold',
      title: t('strategy_social_media_title'),
      description: t('strategy_social_media_desc'),
      color: theme.palette.info.main,
      hasAction: false,
    },
    {
      id: 'ask_friends',
      icon: 'solar:users-group-rounded-bold',
      title: t('strategy_ask_friends_title'),
      description: t('strategy_ask_friends_desc'),
      color: theme.palette.warning.main,
      hasAction: false,
    },
    {
      id: 'product_descriptions',
      icon: 'solar:document-text-bold',
      title: t('strategy_descriptions_title'),
      description: t('strategy_descriptions_desc'),
      color: theme.palette.success.main,
      hasAction: false,
    },
    {
      id: 'competitive_pricing',
      icon: 'solar:tag-price-bold',
      title: t('strategy_pricing_title'),
      description: t('strategy_pricing_desc'),
      color: theme.palette.error.main,
      hasAction: false,
    },
    {
      id: 'facebook_groups',
      icon: 'solar:chat-round-dots-bold',
      title: t('strategy_facebook_groups_title'),
      description: t('strategy_facebook_groups_desc'),
      color: '#1877F2',
      hasAction: false,
    },
  ], [t, theme]);

  // Rotate strategy of the day based on the current date
  const todayStrategyIndex = new Date().getDate() % strategies.length;
  const [currentStrategy, setCurrentStrategy] = useState(todayStrategyIndex);

  const handleNextStrategy = useCallback(() => {
    setCurrentStrategy((prev) => (prev + 1) % strategies.length);
  }, [strategies.length]);

  const handlePrevStrategy = useCallback(() => {
    setCurrentStrategy((prev) => (prev - 1 + strategies.length) % strategies.length);
  }, [strategies.length]);

  const handleCopyLink = useCallback(() => {
    if (storeSlug) {
      const storeUrl = `${window.location.origin}/store/${storeSlug}`;
      navigator.clipboard.writeText(storeUrl);
    }
  }, [storeSlug]);

  const strategy = strategies[currentStrategy];

  return (
    <Stack spacing={3} sx={sx} {...other}>
      <Card
        sx={{
          p: 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.success.light, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)`,
          border: `1px solid ${alpha(theme.palette.success.main, 0.15)}`,
        }}
      >
        <Stack spacing={3}>
          {/* Congratulations Header */}
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(theme.palette.success.main, 0.12),
                color: 'success.main',
              }}
            >
              <Iconify icon="solar:cup-star-bold" width={32} />
            </Box>
            <Stack spacing={0.5} sx={{ flexGrow: 1 }}>
              <Typography variant="h6">
                {t('waiting_orders_congrats_title')}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {t('waiting_orders_congrats_desc')}
              </Typography>
            </Stack>
          </Stack>

          {/* Strategy of the Day Card */}
          <Card
            sx={{
              p: 2.5,
              bgcolor: alpha(strategy.color, 0.08),
              border: `1px solid ${alpha(strategy.color, 0.2)}`,
            }}
          >
            <Stack spacing={2}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="overline" sx={{ color: strategy.color }}>
                  {t('waiting_orders_strategy_label')}
                </Typography>
                <Stack direction="row" spacing={0.5}>
                  <IconButton size="small" onClick={handlePrevStrategy}>
                    <Iconify icon="eva:arrow-ios-back-fill" width={16} />
                  </IconButton>
                  <IconButton size="small" onClick={handleNextStrategy}>
                    <Iconify icon="eva:arrow-ios-forward-fill" width={16} />
                  </IconButton>
                </Stack>
              </Stack>

              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: alpha(strategy.color, 0.16),
                    color: strategy.color,
                    flexShrink: 0,
                  }}
                >
                  <Iconify icon={strategy.icon} width={24} />
                </Box>
                <Stack spacing={0.25} sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle2">
                    {strategy.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {strategy.description}
                  </Typography>
                </Stack>
              </Stack>

              {strategy.hasAction && storeSlug && (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<Iconify icon="solar:copy-bold" />}
                  onClick={handleCopyLink}
                  sx={{
                    alignSelf: 'flex-start',
                    bgcolor: strategy.color,
                    '&:hover': { bgcolor: alpha(strategy.color, 0.85) },
                  }}
                >
                  {t('waiting_orders_copy_store_link')}
                </Button>
              )}
            </Stack>
          </Card>

          {/* Encouragement */}
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{
              p: 1.5,
              borderRadius: 1,
              bgcolor: alpha(theme.palette.info.main, 0.08),
            }}
          >
            <Iconify icon="solar:star-bold" sx={{ color: 'info.main', fontSize: 18 }} />
            <Typography variant="caption" sx={{ color: 'info.dark' }}>
              {t('waiting_orders_encouragement')}
            </Typography>
          </Stack>
        </Stack>
      </Card>

      {/* Quick Actions Panel */}
      <QuickActionsPanel />
    </Stack>
  );
}

WaitingForOrders.propTypes = {
  storeSlug: PropTypes.string,
  sx: PropTypes.object,
};

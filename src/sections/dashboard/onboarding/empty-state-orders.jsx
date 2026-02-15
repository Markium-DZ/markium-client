import PropTypes from 'prop-types';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';
import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';

// ── Tip config ────────────────────────────────────────────────────

const TIPS = [
  { icon: 'solar:share-circle-bold', color: '#2563EB' },
  { icon: 'solar:users-group-rounded-bold', color: '#7C3AED' },
  { icon: 'solar:tag-price-bold', color: '#059669' },
];

// ----------------------------------------------------------------------

export default function EmptyStateOrders({ hasProducts = false, compact = false, sx, ...other }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuthContext();
  const { enqueueSnackbar } = useSnackbar();

  const handleCopyStoreLink = useCallback(async () => {
    const slug = user?.store?.slug;
    if (!slug) {
      enqueueSnackbar(t('store_url_not_available'), { variant: 'warning' });
      return;
    }
    const storeUrl = `https://${slug}.markium.online/?store=${slug}`;
    try {
      await navigator.clipboard.writeText(storeUrl);
      enqueueSnackbar(t('store_url_copied'), { variant: 'success' });
    } catch {
      enqueueSnackbar(t('failed_to_copy'), { variant: 'error' });
    }
  }, [user?.store?.slug, enqueueSnackbar, t]);

  const handleGrowthGuide = useCallback(() => {
    router.push(paths.dashboard.settings.contact_support || paths.dashboard.settings.root);
  }, [router]);

  const tips = TIPS.map((cfg, i) => ({
    ...cfg,
    step: `0${i + 1}`,
    title: t(`empty_orders_tip${i + 1}_title`),
    text: t(`empty_orders_tip${i + 1}`),
  }));

  // ── Tip card ────────────────────────────────────────────────────

  const isDark = theme.palette.mode === 'dark';

  const renderTipCard = (tip, index) => (
    <Box
      key={index}
      sx={{
        position: 'relative',
        p: compact ? 2 : 2.5,
        borderRadius: 1.5,
        overflow: 'hidden',
        bgcolor: alpha(tip.color, isDark ? 0.12 : 0.03),
        border: `1px solid ${alpha(tip.color, isDark ? 0.24 : 0.08)}`,
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          bgcolor: alpha(tip.color, isDark ? 0.18 : 0.06),
          transform: 'translateY(-2px)',
          boxShadow: `0 4px 16px ${alpha(tip.color, isDark ? 0.2 : 0.12)}`,
          borderColor: alpha(tip.color, isDark ? 0.36 : 0.16),
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${tip.color}, ${alpha(tip.color, isDark ? 0.4 : 0.3)})`,
        },
      }}
    >
      {/* Step number watermark */}
      <Typography
        sx={{
          position: 'absolute',
          bottom: compact ? 4 : 8,
          right: compact ? 8 : 12,
          fontSize: compact ? '2.5rem' : '3.5rem',
          fontWeight: 900,
          lineHeight: 1,
          color: alpha(tip.color, isDark ? 0.12 : 0.06),
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      >
        {tip.step}
      </Typography>

      {/* Icon + title */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: compact ? 0.75 : 1.5 }}>
        <Box
          sx={{
            width: compact ? 28 : 36,
            height: compact ? 28 : 36,
            borderRadius: compact ? 0.75 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(tip.color, isDark ? 0.16 : 0.1),
            color: tip.color,
            flexShrink: 0,
          }}
        >
          <Iconify icon={tip.icon} width={compact ? 16 : 20} />
        </Box>
        <Typography
          variant={compact ? 'caption' : 'subtitle2'}
          sx={{
            fontWeight: 800,
            color: tip.color,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            lineHeight: 1.2,
          }}
        >
          {tip.title}
        </Typography>
      </Stack>

      {/* Tip text */}
      <Typography
        variant={compact ? 'caption' : 'body2'}
        sx={{
          color: 'text.secondary',
          lineHeight: 1.6,
          display: 'block',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {tip.text}
      </Typography>
    </Box>
  );

  // ── Encouragement footer ────────────────────────────────────────

  const renderEncouragement = () => (
    <Stack
      direction="row"
      spacing={0.75}
      alignItems="center"
      sx={{
        px: compact ? 2 : 2.5,
        py: compact ? 1 : 1.25,
        borderTop: `1px dashed ${theme.palette.divider}`,
        flexShrink: 0,
        bgcolor: alpha(theme.palette.success.main, 0.03),
      }}
    >
      <Box
        sx={{
          width: 18,
          height: 18,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: alpha(theme.palette.success.main, 0.1),
        }}
      >
        <Iconify icon="solar:star-bold" sx={{ color: 'success.main', fontSize: 10 }} />
      </Box>
      <Typography variant="caption" sx={{ color: 'success.dark', fontWeight: 500 }}>
        {t('empty_orders_encouragement')}
      </Typography>
    </Stack>
  );

  // ── Compact: dashboard-embedded layout ──────────────────────────

  if (compact) {
    return (
      <Card
        sx={{
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          ...sx,
        }}
        {...other}
      >
        {/* Header */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            px: 2.5,
            py: 1.5,
            borderBottom: `1px dashed ${theme.palette.divider}`,
            flexShrink: 0,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(theme.palette.warning.main, 0.1),
                color: 'warning.dark',
                flexShrink: 0,
              }}
            >
              <Iconify icon="solar:bag-check-bold" width={18} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, lineHeight: 1.2 }} noWrap>
                {t('empty_orders_title')}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: 'text.disabled', lineHeight: 1.3, display: { xs: 'none', lg: 'block' } }}
                noWrap
              >
                {hasProducts
                  ? t('empty_orders_description_with_products')
                  : t('empty_orders_description_no_products')}
              </Typography>
            </Box>
          </Stack>

          {hasProducts ? (
            <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
              <Button
                variant="contained"
                size="small"
                startIcon={<Iconify icon="solar:copy-bold" width={15} />}
                onClick={handleCopyStoreLink}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  px: 1.5,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                  boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.25)}`,
                  '&:hover': {
                    boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.35)}`,
                  },
                }}
              >
                {t('empty_orders_copy_link')}
              </Button>
              <Button
                variant="soft"
                size="small"
                color="inherit"
                startIcon={<Iconify icon="solar:chart-2-bold" width={15} />}
                onClick={handleGrowthGuide}
                sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.75rem', px: 1.5 }}
              >
                {t('empty_orders_marketing_tips')}
              </Button>
            </Stack>
          ) : (
            <Button
              variant="contained"
              size="small"
              startIcon={<Iconify icon="solar:box-add-bold" width={15} />}
              onClick={() => router.push(paths.dashboard.product.new)}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.75rem',
                flexShrink: 0,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              }}
            >
              {t('empty_orders_create_product')}
            </Button>
          )}
        </Stack>

        {/* Strategy cards */}
        {hasProducts && (
          <Box
            sx={{
              flexGrow: 1,
              overflow: 'auto',
              p: 2,
              display: 'grid',
              gap: 1.5,
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
              alignContent: 'center',
            }}
          >
            {tips.map(renderTipCard)}
          </Box>
        )}

        {/* Encouragement */}
        {renderEncouragement()}
      </Card>
    );
  }

  // ── Default: full-size centered layout ──────────────────────────

  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        ...sx,
      }}
      {...other}
    >
      {/* Hero header */}
      <Stack
        alignItems="center"
        sx={{
          pt: 5,
          pb: 3,
          px: 3,
          textAlign: 'center',
          background: `linear-gradient(180deg, ${alpha(theme.palette.warning.main, 0.04)} 0%, transparent 100%)`,
        }}
      >
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(theme.palette.warning.main, 0.1),
            color: 'warning.dark',
            mb: 2,
            boxShadow: `0 8px 24px ${alpha(theme.palette.warning.main, 0.12)}`,
          }}
        >
          <Iconify icon="solar:bag-check-bold" width={28} />
        </Box>

        <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
          {t('empty_orders_title')}
        </Typography>

        <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 400 }}>
          {hasProducts
            ? t('empty_orders_description_with_products')
            : t('empty_orders_description_no_products')}
        </Typography>
      </Stack>

      {/* Strategy cards */}
      {hasProducts && (
        <Box
          sx={{
            px: 3,
            pb: 1,
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
          }}
        >
          {tips.map(renderTipCard)}
        </Box>
      )}

      {/* CTA */}
      <Stack direction="row" justifyContent="center" spacing={1.5} sx={{ py: 3 }}>
        {hasProducts ? (
          <>
            <Button
              variant="contained"
              startIcon={<Iconify icon="solar:copy-bold" />}
              onClick={handleCopyStoreLink}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                px: 3,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.3)}`,
                '&:hover': {
                  boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                },
              }}
            >
              {t('empty_orders_copy_link')}
            </Button>
            <Button
              variant="soft"
              color="inherit"
              startIcon={<Iconify icon="solar:chart-2-bold" />}
              onClick={handleGrowthGuide}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              {t('empty_orders_marketing_tips')}
            </Button>
          </>
        ) : (
          <Button
            variant="contained"
            size="large"
            startIcon={<Iconify icon="solar:box-add-bold" />}
            onClick={() => router.push(paths.dashboard.product.new)}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              px: 4,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.3)}`,
            }}
          >
            {t('empty_orders_create_product')}
          </Button>
        )}
      </Stack>

      {/* Encouragement */}
      {renderEncouragement()}
    </Card>
  );
}

EmptyStateOrders.propTypes = {
  hasProducts: PropTypes.bool,
  compact: PropTypes.bool,
  sx: PropTypes.object,
};

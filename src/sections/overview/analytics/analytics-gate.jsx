import { Box, Button, Typography, Stack, alpha } from '@mui/material';
import { useCallback, useMemo, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import Iconify from 'src/components/iconify';
import { useTranslate } from 'src/locales';
import { useGetAnalyticsCapabilities } from 'src/api/analytics';
import AnalyticsUpgradeModal from './analytics-upgrade-modal';

// ----------------------------------------------------------------------

const BAR_HEIGHTS = [72, 45, 88, 56, 93, 38, 67, 51, 82, 44, 76, 59];

function FakeOverlay({ sectionKey }) {
  const theme = useTheme();

  const offset = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < (sectionKey || '').length; i += 1) {
      hash = sectionKey.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % BAR_HEIGHTS.length;
  }, [sectionKey]);

  const bars = useMemo(
    () => BAR_HEIGHTS.map((_, i) => BAR_HEIGHTS[(i + offset) % BAR_HEIGHTS.length]),
    [offset]
  );

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        p: 3,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Stack direction="row" spacing={0.5} alignItems="flex-end" sx={{ flex: 1, minHeight: 0 }}>
        {bars.map((h, i) => (
          <Box
            key={i}
            sx={{
              flex: 1,
              height: `${h}%`,
              borderRadius: 0.5,
              bgcolor: alpha(theme.palette.primary.main, 0.12 + (i % 3) * 0.06),
            }}
          />
        ))}
      </Stack>
    </Box>
  );
}

// ----------------------------------------------------------------------

export default function AnalyticsGate({ sectionKey, children }) {
  const { t } = useTranslate();
  const { sections, capabilitiesLoading } = useGetAnalyticsCapabilities();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const sectionInfo = sections[sectionKey];
  const accessible = sectionInfo?.accessible ?? false;

  const handleOpenUpgrade = useCallback(() => {
    setUpgradeOpen(true);
  }, []);

  const handleCloseUpgrade = useCallback(() => {
    setUpgradeOpen(false);
  }, []);

  if (capabilitiesLoading) {
    return children;
  }

  if (accessible) {
    return children;
  }

  return (
    <>
      <Box sx={{ position: 'relative', overflow: 'hidden', borderRadius: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Children define the minimum layout size, flex fills remaining */}
        <Box
          sx={{
            filter: 'blur(8px)',
            pointerEvents: 'none',
            userSelect: 'none',
            position: 'relative',
            flex: 1,
          }}
        >
          {/* Invisible children — only used for sizing */}
          <Box sx={{ visibility: 'hidden' }}>{children}</Box>

          {/* Fake chart data fills the same space */}
          <FakeOverlay sectionKey={sectionKey} />
        </Box>

        {/* Overlay CTA */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: (theme) => alpha(theme.palette.background.default, 0.35),
            zIndex: 1,
          }}
        >
          <Iconify icon="solar:lock-bold" width={32} sx={{ mb: 1, opacity: 0.6 }} />
          <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
            {t('analytics_upgrade_to_unlock')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('analytics_upgrade_cta')}
          </Typography>
          <Button variant="contained" size="small" onClick={handleOpenUpgrade}>
            {t('analytics_upgrade_to_unlock')}
          </Button>
        </Box>
      </Box>

      <AnalyticsUpgradeModal
        open={upgradeOpen}
        onClose={handleCloseUpgrade}
        requiredFeature={sectionInfo?.required_feature}
      />
    </>
  );
}

import PropTypes from 'prop-types';
import { useCallback, useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { fShortenNumber } from 'src/utils/format-number';
import { useTranslate } from 'src/locales';

import { bgGradient } from 'src/theme/css';
import { useGetAnalyticsCapabilities } from 'src/api/analytics';
import Iconify from 'src/components/iconify';
import AnalyticsUpgradeModal from './analytics-upgrade-modal';

// ----------------------------------------------------------------------

export default function AnalyticsWidgetSummary({
  title,
  total,
  icon,
  color = 'primary',
  formatter,
  caption,
  sectionKey,
  sx,
  ...other
}) {
  const theme = useTheme();
  const { t } = useTranslate();
  const { sections, capabilitiesLoading } = useGetAnalyticsCapabilities();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const sectionInfo = sectionKey ? sections[sectionKey] : null;
  const locked = sectionKey && !capabilitiesLoading && !(sectionInfo?.accessible);

  const displayValue = formatter ? formatter(total) : (fShortenNumber(total) || '0');

  const handleOpenUpgrade = useCallback(() => setUpgradeOpen(true), []);
  const handleCloseUpgrade = useCallback(() => setUpgradeOpen(false), []);

  return (
    <>
      <Stack
        alignItems="center"
        sx={{
          ...bgGradient({
            direction: '135deg',
            startColor: alpha(theme.palette[color].light, 0.2),
            endColor: alpha(theme.palette[color].main, 0.2),
          }),
          py: 5,
          borderRadius: 2,
          textAlign: 'center',
          color: `${color}.darker`,
          backgroundColor: 'common.white',
          ...(locked && { cursor: 'pointer' }),
          ...sx,
        }}
        {...(locked && { onClick: handleOpenUpgrade })}
        {...other}
      >
        {icon && <Box sx={{ width: 64, height: 64, mb: 1 }}>{icon}</Box>}

        {locked ? (
          <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            <Typography
              variant="h3"
              sx={{ filter: 'blur(10px)', userSelect: 'none', pointerEvents: 'none' }}
            >
              1,248
            </Typography>
            <Iconify
              icon="solar:lock-bold"
              width={20}
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                opacity: 0.5,
              }}
            />
          </Box>
        ) : (
          <Typography variant="h3">{displayValue}</Typography>
        )}

        <Typography variant="subtitle2" sx={{ opacity: 0.64 }}>
          {title}
        </Typography>

        {caption && (
          <Typography variant="caption" sx={{ opacity: 0.48, mt: 0.5 }}>
            {caption}
          </Typography>
        )}
      </Stack>

      {locked && (
        <AnalyticsUpgradeModal
          open={upgradeOpen}
          onClose={handleCloseUpgrade}
          requiredTier={sectionInfo?.required_tier}
        />
      )}
    </>
  );
}

AnalyticsWidgetSummary.propTypes = {
  caption: PropTypes.string,
  color: PropTypes.string,
  formatter: PropTypes.func,
  icon: PropTypes.oneOfType([PropTypes.element, PropTypes.string]),
  sectionKey: PropTypes.string,
  sx: PropTypes.object,
  title: PropTypes.string,
  total: PropTypes.number,
};

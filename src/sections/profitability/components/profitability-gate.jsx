import PropTypes from 'prop-types';
import { Box, Button, Typography, alpha } from '@mui/material';
import Iconify from 'src/components/iconify';
import { useTranslate } from 'src/locales';
import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';

// ----------------------------------------------------------------------

export default function ProfitabilityGate({ forbidden, children }) {
  const { t } = useTranslate();
  const router = useRouter();

  if (!forbidden) return children;

  return (
    <Box sx={{ position: 'relative', overflow: 'hidden', borderRadius: 2, flex: 1 }}>
      <Box sx={{ filter: 'blur(8px)', pointerEvents: 'none', userSelect: 'none' }}>
        {children}
      </Box>
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
          {t('profitability_locked_title')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center', maxWidth: 320 }}>
          {t('profitability_locked_description')}
        </Typography>
        <Button
          variant="contained"
          size="small"
          onClick={() => router.push(paths.dashboard.subscription.checkout)}
        >
          {t('upgrade_to_unlock')}
        </Button>
      </Box>
    </Box>
  );
}

ProfitabilityGate.propTypes = {
  forbidden: PropTypes.bool,
  children: PropTypes.node.isRequired,
};

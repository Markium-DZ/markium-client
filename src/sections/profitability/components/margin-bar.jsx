import { LinearProgress, Typography, Stack } from '@mui/material';
import { alpha } from '@mui/material/styles';

import { fmtPct } from '../constants';

// ----------------------------------------------------------------------

export default function MarginBar({ value }) {
  const clamped = Math.max(0, Math.min(100, value || 0));
  const barColor = value >= 30 ? 'success' : value >= 15 ? 'warning' : 'error';

  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 120 }}>
      <LinearProgress
        variant="determinate"
        value={clamped}
        color={barColor}
        sx={{
          flex: 1,
          height: 6,
          borderRadius: 3,
          bgcolor: (theme) => alpha(theme.palette.grey[500], 0.12),
        }}
      />
      <Typography variant="caption" fontWeight={600} sx={{ minWidth: 40, textAlign: 'right' }}>
        {fmtPct(value)}
      </Typography>
    </Stack>
  );
}

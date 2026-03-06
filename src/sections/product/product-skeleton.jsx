import PropTypes from 'prop-types';

import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Grid from '@mui/material/Unstable_Grid2';

// ----------------------------------------------------------------------

export function ProductItemSkeleton({ sx, ...other }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 2,
        ...sx,
      }}
      {...other}
    >
      <Stack sx={{ p: 1 }}>
        <Skeleton sx={{ paddingTop: '100%' }} />
      </Stack>

      <Stack spacing={2} sx={{ p: 3, pt: 2 }}>
        <Skeleton sx={{ width: 0.5, height: 16 }} />
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row">
            <Skeleton variant="circular" sx={{ width: 16, height: 16 }} />
            <Skeleton variant="circular" sx={{ width: 16, height: 16 }} />
            <Skeleton variant="circular" sx={{ width: 16, height: 16 }} />
          </Stack>
          <Skeleton sx={{ width: 40, height: 16 }} />
        </Stack>
      </Stack>
    </Paper>
  );
}

ProductItemSkeleton.propTypes = {
  sx: PropTypes.object,
};

// ----------------------------------------------------------------------

export function ProductDetailsSkeleton({ ...other }) {
  return (
    <Grid container spacing={{ xs: 3, md: 4, lg: 5 }} {...other}>
      {/* Hero left — image */}
      <Grid xs={12} md={6} lg={6}>
        <Skeleton sx={{ paddingTop: '100%', borderRadius: 2 }} />
      </Grid>

      {/* Hero right — product info */}
      <Grid xs={12} md={6} lg={6}>
        <Stack spacing={2.5}>
          <Skeleton sx={{ height: 14, width: 80, borderRadius: 1 }} />
          <Skeleton sx={{ height: 28, width: '70%', borderRadius: 1 }} />
          <Skeleton sx={{ height: 20, width: 100, borderRadius: 1 }} />
          <Skeleton sx={{ height: 14, width: '90%', borderRadius: 1 }} />
          <Skeleton sx={{ height: 14, width: '75%', borderRadius: 1 }} />
          <Stack direction="row" spacing={1} sx={{ pt: 1 }}>
            <Skeleton sx={{ height: 32, width: 80, borderRadius: 1 }} />
            <Skeleton sx={{ height: 32, width: 80, borderRadius: 1 }} />
          </Stack>
        </Stack>
      </Grid>

      {/* Tab card */}
      <Grid xs={12}>
        <Paper variant="outlined" sx={{ borderRadius: 2 }}>
          {/* Tab headers */}
          <Stack direction="row" spacing={2} sx={{ px: 3, pt: 2, pb: 0 }}>
            <Skeleton sx={{ height: 44, width: 120, borderRadius: 1 }} />
            <Skeleton sx={{ height: 44, width: 100, borderRadius: 1 }} />
            <Skeleton sx={{ height: 44, width: 130, borderRadius: 1 }} />
          </Stack>
          <Skeleton sx={{ height: 2, width: '100%' }} />
          {/* Row skeletons */}
          <Stack spacing={2} sx={{ p: 3 }}>
            {[...Array(2)].map((_, i) => (
              <Paper key={i} variant="outlined" sx={{ p: 2, borderRadius: 1.5 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Skeleton sx={{ width: 80, height: 80, borderRadius: 1.5, flexShrink: 0 }} />
                  <Stack spacing={1} sx={{ flexGrow: 1 }}>
                    <Skeleton sx={{ height: 16, width: '40%' }} />
                    <Skeleton sx={{ height: 14, width: '60%' }} />
                    <Stack direction="row" spacing={2}>
                      <Skeleton sx={{ height: 14, width: 60 }} />
                      <Skeleton sx={{ height: 14, width: 60 }} />
                      <Skeleton sx={{ height: 14, width: 60 }} />
                    </Stack>
                  </Stack>
                </Stack>
              </Paper>
            ))}
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );
}

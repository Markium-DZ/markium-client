import Box from '@mui/material/Box';
import Grid from '@mui/material/Unstable_Grid2';
import Skeleton from '@mui/material/Skeleton';
import Container from '@mui/material/Container';

// ----------------------------------------------------------------------

export default function DashboardSkeleton({ themeStretch }) {
  return (
    <Container maxWidth={themeStretch ? false : 'xl'}>
      <Grid container spacing={3}>
        {/* Welcome Banner skeleton */}
        <Grid xs={12} md={8}>
          <Skeleton variant="rounded" height={200} />
        </Grid>

        {/* Calendar skeleton */}
        <Grid xs={12} md={4}>
          <Skeleton variant="rounded" height={200} />
        </Grid>

        {/* Content area skeleton */}
        <Grid xs={12}>
          <Skeleton variant="rounded" height={300} />
        </Grid>
      </Grid>
    </Container>
  );
}

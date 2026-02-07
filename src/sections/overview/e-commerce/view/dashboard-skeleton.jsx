import Grid from '@mui/material/Unstable_Grid2';
import Skeleton from '@mui/material/Skeleton';
import Container from '@mui/material/Container';

// ----------------------------------------------------------------------

export default function DashboardSkeleton({ themeStretch }) {
  return (
    <Container maxWidth={themeStretch ? false : 'xl'}>
      <Grid container spacing={3}>
        {/* Row 1: Metrics (md=3) + Chart (md=5) + Calendar (md=4) */}
        <Grid xs={12} md={3}>
          <Skeleton variant="rounded" height={340} />
        </Grid>
        <Grid xs={12} md={5}>
          <Skeleton variant="rounded" height={340} />
        </Grid>
        <Grid xs={12} md={4}>
          <Skeleton variant="rounded" height={340} />
        </Grid>

        {/* Row 2: Action Center (md=4) + Data Table (md=5) + Funnel (md=3) */}
        <Grid xs={12} md={4}>
          <Skeleton variant="rounded" height={460} />
        </Grid>
        <Grid xs={12} md={5}>
          <Skeleton variant="rounded" height={460} />
        </Grid>
        <Grid xs={12} md={3}>
          <Skeleton variant="rounded" height={460} />
        </Grid>
      </Grid>
    </Container>
  );
}

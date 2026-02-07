import Grid from '@mui/material/Unstable_Grid2';
import Skeleton from '@mui/material/Skeleton';
import Container from '@mui/material/Container';

// ----------------------------------------------------------------------

export default function DashboardSkeleton({ themeStretch }) {
  return (
    <Container maxWidth={themeStretch ? false : 'xl'}>
      <Grid container spacing={3}>
        {/* Row 1: Metrics 2x2 (md=3) + Placeholder (md=3) + Calendar (md=6) */}
        <Grid xs={12} md={3}>
          <Skeleton variant="rounded" height={240} />
        </Grid>
        <Grid xs={12} md={3}>
          <Skeleton variant="rounded" height={240} />
        </Grid>
        <Grid xs={12} md={6}>
          <Skeleton variant="rounded" height={240} />
        </Grid>

        {/* Row 2: Action Center (md=4) + Data Table (md=8) */}
        <Grid xs={12} md={4}>
          <Skeleton variant="rounded" height={460} />
        </Grid>
        <Grid xs={12} md={8}>
          <Skeleton variant="rounded" height={460} />
        </Grid>
      </Grid>
    </Container>
  );
}

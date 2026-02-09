import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import Skeleton from '@mui/material/Skeleton';
import Grid from '@mui/material/Unstable_Grid2';

// ----------------------------------------------------------------------

export default function OrderDetailsSkeleton() {
  return (
    <>
      {/* Toolbar skeleton */}
      <Stack
        spacing={3}
        direction={{ xs: 'column', md: 'row' }}
        sx={{ mb: { xs: 3, md: 5 } }}
      >
        <Stack spacing={1} direction="row" alignItems="flex-start">
          <Skeleton variant="circular" width={40} height={40} />
          <Stack spacing={0.75}>
            <Stack spacing={1} direction="row" alignItems="center">
              <Skeleton variant="text" width={180} height={32} />
              <Skeleton variant="rounded" width={72} height={24} sx={{ borderRadius: 1 }} />
            </Stack>
            <Skeleton variant="text" width={140} height={16} />
          </Stack>
        </Stack>

        <Stack flexGrow={1} spacing={1.5} direction="row" alignItems="center" justifyContent="flex-end">
          <Skeleton variant="rounded" width={110} height={36} sx={{ borderRadius: 1 }} />
          <Skeleton variant="rounded" width={90} height={36} sx={{ borderRadius: 1 }} />
        </Stack>
      </Stack>

      {/* Stepper skeleton */}
      <Card sx={{ mb: 3, p: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          {[0, 1, 2, 3].map((i) => (
            <Stack key={i} alignItems="center" spacing={1} sx={{ flex: 1 }}>
              <Skeleton variant="circular" width={42} height={42} />
              <Skeleton variant="text" width={60} height={14} />
            </Stack>
          ))}
        </Stack>
      </Card>

      {/* Main content skeleton */}
      <Grid container spacing={3}>
        {/* Left: Items */}
        <Grid xs={12} md={8}>
          <Card sx={{ p: 3 }}>
            <Skeleton variant="text" width={100} height={24} sx={{ mb: 2 }} />
            {[0, 1, 2].map((i) => (
              <Stack
                key={i}
                direction="row"
                alignItems="center"
                spacing={2}
                sx={{ py: 2.5, borderBottom: '1px dashed', borderColor: 'divider' }}
              >
                <Skeleton variant="rounded" width={48} height={48} />
                <Stack spacing={0.5} sx={{ flexGrow: 1 }}>
                  <Skeleton variant="text" width="60%" height={16} />
                  <Skeleton variant="text" width="30%" height={12} />
                </Stack>
                <Skeleton variant="text" width={30} height={16} />
                <Skeleton variant="text" width={60} height={16} />
              </Stack>
            ))}

            {/* Totals */}
            <Stack spacing={1.5} alignItems="flex-end" sx={{ mt: 3 }}>
              <Skeleton variant="text" width={200} height={16} />
              <Skeleton variant="text" width={200} height={16} />
              <Skeleton variant="text" width={200} height={16} />
              <Skeleton variant="text" width={200} height={20} />
            </Stack>
          </Card>
        </Grid>

        {/* Right: Customer + Timeline */}
        <Grid xs={12} md={4}>
          <Stack spacing={3}>
            {/* Customer info */}
            <Card sx={{ p: 3 }}>
              <Skeleton variant="text" width={120} height={22} sx={{ mb: 2 }} />
              <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                <Skeleton variant="circular" width={48} height={48} />
                <Stack spacing={0.5} sx={{ flexGrow: 1 }}>
                  <Skeleton variant="text" width="70%" height={16} />
                  <Skeleton variant="text" width="50%" height={14} />
                </Stack>
              </Stack>
              <Stack spacing={1}>
                <Skeleton variant="text" width="80%" height={14} />
                <Skeleton variant="text" width="60%" height={14} />
              </Stack>

              <Skeleton variant="text" width={140} height={22} sx={{ mt: 3, mb: 2 }} />
              <Stack spacing={1}>
                <Skeleton variant="text" width="90%" height={14} />
                <Skeleton variant="text" width="70%" height={14} />
                <Skeleton variant="rounded" width="100%" height={50} sx={{ mt: 1 }} />
              </Stack>
            </Card>

            {/* Timeline */}
            <Card sx={{ p: 3 }}>
              <Skeleton variant="text" width={110} height={22} sx={{ mb: 2 }} />
              {[0, 1, 2].map((i) => (
                <Stack key={i} direction="row" spacing={2} sx={{ mb: 2 }}>
                  <Skeleton variant="circular" width={32} height={32} />
                  <Stack spacing={0.5} sx={{ flexGrow: 1 }}>
                    <Skeleton variant="text" width="60%" height={16} />
                    <Skeleton variant="text" width="40%" height={12} />
                  </Stack>
                </Stack>
              ))}
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </>
  );
}
